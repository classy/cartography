var async = require('async');
var curry = require('curry');
var _ = require('lodash');
var db = require('./db').db;
var design = require('./db/designs/relationships');

var Doc = require('./doc');
var RevisableDoc = require('./revisable');


// Creating a relationship:
//
// > relationship = new Relationship()
// > relationship.create({
// ...  cause: { _id: situation1.id },
// ...  effect: { _id: situation2.id }
// ...  }, callback)


var Relationship = function Relationship(id){
  if (!(this instanceof Relationship)) return new Relationship(id);
  if (id) { this.id = id; }
  this.type = 'relationship';

  var self = this;
}

module.exports = Relationship;
var Situation = require('./situation');



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

          return async_callback(error, null)
        }

        return async_callback(null, { does_not_exist_yet: true });
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

    var cause = new Situation(rel_body.cause._id);
    var effect = new Situation(rel_body.effect._id);

    async.parallel([
      function(parallel_cb){
        cause.summarize(function(summarization_error, cause_summary){
          if (summarization_error){
            return parallel_cb(summarization_error, null)
          }

          rel_body.cause = cause_summary;
          parallel_cb(null, cause_summary);
        });
      },
      function(parallel_cb){
        effect.summarize(function(summarization_error, effect_summary){
          if (summarization_error){
            return parallel_cb(summarization_error, null)
          }

          rel_body.effect = effect_summary;
          parallel_cb(null, effect_summary);
        });
      }
    ], function(parallel_error, parallel_result){
      if (parallel_error){ return callback(parallel_error, null) }
      return callback(null, rel_body);
    });
  });
}


function changeRelationshipDescription(){
  var self = this;
  var changeDescription = curry(['description'], self._change, self);

  return changeDescription.apply(self, arguments);
}

Relationship.prototype.description = changeRelationshipDescription;


Relationship.prototype.mark = function markRelationship(){
  var self = this;
  var mark = curry(['marked'], self._set, self);
  var mark_name;
  var additional_properties = {};
  var callback = function(){};

  switch(arguments.length){
    case 1 : 
      mark_name = arguments[0]; 
      break;
    case 2 :
      mark_name = arguments[0];
      callback = arguments[1];
      break;
    case 3 :
      mark_name = arguments[0];
      additional_properties = arguments[1];
      callback = arguments[2];
      break;
  }

  additional_properties.summary = "Marked '"+ mark_name.replace('_', ' ') +"'";
  return mark.apply(self, [
    mark_name, 
    (new Date()).getTime(), 
    additional_properties,
    callback
  ]);
}


Relationship.prototype.unmark = function unmarkRelationship(){
  var self = this;
  var unmark = curry(['marked'], self._unset, self);
  var mark_name;
  var additional_properties = {};
  var callback = function(){};

  switch(arguments.length){
    case 1 : 
      mark_name = arguments[0]; 
      break;
    case 2 :
      mark_name = arguments[0];
      callback = arguments[1];
      break;
    case 3 :
      mark_name = arguments[0];
      additional_properties = arguments[1];
      callback = arguments[2];
      break;
  }

  additional_properties.summary = [
    "Removed mark '",
    mark_name.replace('_', ' '),
    "'"
  ].join('');

  return unmark.apply(self, [
    mark_name, 
    additional_properties,
    callback
  ]);
}



