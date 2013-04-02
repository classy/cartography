var _ = require('lodash');
var async = require('async');

var db = require('./db').db;

var design = require('./db/designs/revisables');
var ImmutableDoc = require('./immutable');
var Change = require('./change');



function RevisableDoc(id){
  if(id) this.id = id;
  this.revisable = true;
}


RevisableDoc.prototype = new ImmutableDoc();


RevisableDoc.prototype.validate = function validateRevisable(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }

  return ImmutableDoc.prototype.validate.call(self, callback);
}


RevisableDoc.prototype.create = function createRevisableDoc(
  doc_body,
  callback
){
  doc_body.revisable = true;
  doc_body.creation_date = (new Date()).getTime();
  ImmutableDoc.prototype.create.call(this, doc_body, callback);
}


RevisableDoc.prototype.update = function updateRevisableDoc(
  operation, 
  callback
){
  var error = {
    error: "forbidden",
    message: "Revisable docs cannot be updated. Use 'change' instead."
  }

  return callback(error, null);
}


RevisableDoc.prototype.change = function changeRevisableDoc(
  field_name, to, callback
){
  var self = this;
  var new_change = new Change();

  self.read(function(read_err, doc_body){
    if (read_err){ return callback(read_err, null) }
    if (doc_body[field_name] == to){
      var error = {
        error: "already_is",
        message: [
          "The field '", 
          field_name,
          "'is already set to value '",
          to,
          "'"
        ].join('')
      }

      return callback(error, null);
    }

    return new_change.create({
      changed: {
        doc: { _id: self.id, type: self.type },
        field: { name: field_name, to: to }
      }
    }, callback)
  });
};


RevisableDoc.prototype.read = function readRevisableDoc(callback){
  var self = this;
  var rev_doc = {};

  async.parallel([
    function(parallel_cb){ 
      return ImmutableDoc.prototype.read.call(self, function(read_err, doc_body){
        if (read_err){ return parallel_cb(read_err, null); }
        return parallel_cb(null, doc_body);
      }); 
    },
    function(parallel_cb){

      var view_options = {
        group_level: 2,
        reduce: true,
        startkey: [self.id],
        endkey: [self.id, {}]
      };

      db().view('revisables', 'changes_by_changed', view_options, function(
        view_err, view_result
      ){
        if (view_err){ return parallel_cb(view_err, null) }
        if (!view_result.rows){ return parallel_cb(null, {}) }

        var change_ids = view_result.rows.map(function(row){
          return row.value
        });

        return db().fetch({ keys: change_ids }, function(
          fetch_err, 
          fetch_result
        ){
          if (fetch_err){ return parallel_cb(fetch_err, null) }
          var up_to_date_fields = {};

          for (i in fetch_result.rows){
            var field = fetch_result.rows[i].doc.changed.field;
            up_to_date_fields[field.name] = field.to;
          }

          return parallel_cb(null, up_to_date_fields);
        });
      });
    }
  ], function(async_error, async_results){
    if(async_error){ return callback(async_error, null) }

    for (i in async_results){
      var result = async_results[i];
      rev_doc = _.extend(rev_doc, result);
    }

    return callback(null, rev_doc);
  });
};



module.exports = RevisableDoc;
