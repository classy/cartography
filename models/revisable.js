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
    }, function(change_err, change_result){
      if (change_err){ return callback(change_err, null) }
      self.emit('change', change_result);
      return callback(change_err, change_result);
    });
  });
};


RevisableDoc.prototype.add = function addToRevisableDocField(
  field_name,
  element,
  callback
){
  var self = this;

  return self.readField(
    field_name, 
    function(read_field_err, value){
      if (read_field_err){ return callback(read_field_err, null) }

      var value = value || [];

      if (!_.isArray(value)){
        var error = {
          error: "forbidden",
          message: "field '"+ field_name +"' is not an array.",
        }

        return callback(error, null);
      }

      if (value.indexOf(element) != -1){
        var error = {
          error: "forbidden",
          message: "Element is already in field '"+ field_name +"'."
        }

        return callback(error, null);
      }

      value.push(element);

      return self.change(field_name, value, callback);
    }
  );
}


RevisableDoc.prototype.remove = function removeFromRevisableDocField(
  field_name,
  element,
  callback
){
  var self = this;

  return self.readField(
    field_name, 
    function(read_field_err, value){
      if (read_field_err){ return callback(read_field_err, null) }
      if (!_.isArray(value)){
        var error = {
          error: "forbidden",
          message: "field '"+ field_name +"' is not an array.",
        }

        return callback(error, null);
      }

      var element_index = value.indexOf(element);
      if (element_index == -1){
        var error = {
          error: "forbidden",
          message: "Element is not in field '"+ field_name +"'."
        }

        return callback(error, null);
      }

      value.splice(element_index, 1);
      value = value == [] ? undefined : value;

      return self.change(field_name, value, callback);
    }
  );
}
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

        return db().view('changes', 'field_summary', 
          { keys: change_ids },
          function(view_err, view_result){
            if (view_err){ return parallel_cb(view_err, null) }
            
            var up_to_date_fields = {};

            for (i in view_result.rows){
              var field = view_result.rows[i].value;
              up_to_date_fields[field.name] = field.to;
            }

            return parallel_cb(null, up_to_date_fields);
          }
        );
      });
    }
  ], function(async_error, async_results){
    if(async_error){ return callback(async_error, null) }

    for (i in async_results){
      var result = async_results[i];
      rev_doc = _.extend(rev_doc, result);
    }

    self.emit('read', rev_doc);
    return callback(null, rev_doc);
  });
};


RevisableDoc.prototype.readField = function readRevisableDocField(
  field_name, 
  callback
){
  var self = this;

  var field_view_options = {
    endkey: [self.id, field_name],
    startkey: [self.id, field_name, {}],
    descending: true,
    reduce: false,
    limit: 1
  }

  return db().view(
    'revisables', 
    'changes_by_changed', 
    field_view_options, 
    function(view_err, view_result){
      if (view_err){ return callback(view_err, null) }
      if (!view_result.rows.length){ return callback(null, undefined) }

      return callback(null, view_result.rows[0].value.to);
    }
  );
}



module.exports = RevisableDoc;
