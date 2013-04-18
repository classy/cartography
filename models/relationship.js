var async = require('async');
var _ = require('lodash');
var db = require('./db').db;
var design = require('./db/designs/relationships');

var Doc = require('./doc');
var RevisableDoc = require('./revisable');



var Relationship = function Relationship(id){
  if (!(this instanceof Relationship)) return new Relationship(id);
  if (id) { this.id = id; }
  this.type = 'relationship';

  var self = this;
}


Relationship.prototype = new RevisableDoc();


Relationship.prototype.validate = function validateRelationship(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }

  var cause = new Doc(self.tmp.doc_body.cause._id);
  var effect = new Doc(self.tmp.doc_body.effect._id);

  function existenceVerifier(doc_instance, relation){
    return function(async_callback){
      doc_instance.read(function(read_err, related_doc_body){
        if (read_err){ return async_callback(read_err, null) }
        if (related_doc_body.type != 'situation'){
          var error = {
            error: "forbidden",
            reason: "'"+ relation +"' is not a situation."
          }

          return async_callback(error, null);
        }

        var result = {};
        result[relation] = 'exists';

        return async_callback(null, result)
      });
    }
  }

  async.parallel([
    function(async_callback){
      db().view('relationships', 'by_cause_and_effect', {
        key: [cause.id, effect.id]
      }, function(view_error, view_result){
        if (view_error){ return async_callback(view_error, null) }
        if (view_result.rows.length){
          var error = {
            error: "forbidden",
            reason: "This relationship already exists.",
            relationship: view_result.rows[0].id
          }

          return callback(error, null)
        }

        return callback(null, { does_not_exist_yet: true });
      })
    },
    existenceVerifier(cause, 'cause'),
    existenceVerifier(effect, 'effect')
  ], function(async_error, async_results){
    if (async_error){ return callback(async_error, null) }

    return callback(null, true);
  });
}


Relationship.prototype.summarize = function summarizeRelationship(callback){
  var self = this;

  self.read(function(read_err, rel_body){
    if (read_err){ return callback(read_err, null) }

    var cause = new RevisableDoc(rel_body.cause._id);
    var effect = new RevisableDoc(rel_body.effect._id);

    async.parallel([
      function(parallel_cb){
        cause.readFields([
          'title',
          'location',
          'period',
          'alias'
        ], function(read_field_err, fields){
          if (read_field_err){ return parallel_cb(read_field_err, null) }
          rel_body.cause = _.extend(rel_body.cause, fields);
          parallel_cb(null, fields);
        });
      },
      function(parallel_cb){
        effect.readFields([
          'title',
          'location',
          'period',
          'alias'
        ], function(read_field_err, fields){
          if (read_field_err){ return parallel_cb(read_field_err, null) }
          rel_body.effect = _.extend(rel_body.effect, fields);
          parallel_cb(null, fields);
        });
      }
    ], function(parallel_error, parallel_result){
      if (parallel_error){ return callback(parallel_error, null) }
      return callback(null, rel_body);
    });
  });
}


function changeRelationshipDescription(description, callback){
  return this._change('description', description, {
    summary: "Changed description"
  }, callback);
}

Relationship.prototype.description = changeRelationshipDescription;


Relationship.prototype.mark = function markRelationship(mark_name, callback){
  var self = this;
  self._set(
    'marked', 
    mark_name, 
    (new Date()).getTime(), 
    { summary: "Marked '"+ mark_name.replace('_',' ') +"'" },
    callback
  );
}


Relationship.prototype.unmark = function unmarkRelationship(mark_name, callback){
  var self = this;
  self._unset(
    'marked', 
    mark_name, 
    { summary: "Removed mark '"+ mark_name.replace('_',' ') +"'" },
    callback
  );
}



module.exports = Relationship;
