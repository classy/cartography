var async = require('async');
var db = require('./db').db;
var design = require('./db/designs/relationships');

var Doc = require('./doc');
var RevisableDoc = require('./revisable');
var Situation = require('./situation');



var Relationship = function Relationship(id){
  if (id) { this.id = id; }
  this.type = 'relationship';
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

  function existanceVerifier(doc_instance, relation){
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
    existanceVerifier(cause, 'cause'),
    existanceVerifier(effect, 'effect')
  ], function(async_error, async_results){
    if (async_error){ return callback(async_error, null) }

    return callback(null, true);
  });
}


Relationship.prototype.read = function readRelationship(callback){
  RevisableDoc.prototype.read.call(this, function(read_err, relationship_body){
    if (read_err){ return callback(read_err, null) }
    
    var cause = new Situation(relationship_body.cause._id);
    var effect = new Situation(relationship_body.effect._id);

    async.parallel([
      function readCause(parallel_cb){
        cause.read(parallel_cb);
      },
      function readEffect(parallel_cb){
        effect.read(parallel_cb);
      },
    ], function(parallel_error, parallel_results){
      if (parallel_error){ return callback(parallel_error, null) }

      parallel_results.forEach(function(situation){
        var relation = cause.id == situation._id ? 'cause' : 'effect';
        relationship_body[relation] = situation;
      });

      return callback(null, relationship_body);
    });
  });
}



module.exports = Relationship;
