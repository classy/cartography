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

  this.on('create', function(){
    self.updateSearchIndex();
  });

  this.on('change', function(change_result){
    self.updateSearchIndex();
  });

  this.on('delete', function(deletion_result){
    self.deleteFromSearchIndex();
  });
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
          'period'
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
          'period'
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


function updateSearchIndexForRelationship(callback){
  var self = this;
  var source = null;
  var callback = callback || function(){};

  self.summarize(function(summarization_error, rel_summary){
    if (summarization_error){ return callback(summarization_error, null) }
    Doc.prototype.updateSearchIndex.call(self, rel_summary, callback);
  });
}

Relationship.prototype.updateSearchIndex = updateSearchIndexForRelationship;


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
