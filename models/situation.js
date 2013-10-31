var _ = require('lodash');
var async = require('async');
var config = require('../config');
var Doc = require('./doc');
var RevisableDoc = require('./revisable');
var Relationship = require('./relationship');

var design = require('./db/designs/situations');
var db = require('./db').db;



var Situation = function Situation(id){
  if (!(this instanceof Situation)) return new Situation(id);
  if (id) { this.id = id; }
  this.type = 'situation';
}


Situation.identify = function identifySituation(alias, callback){
  var self = this;

  var view_options = {
    endkey: [alias],
    startkey: [alias, {}],
    descending: true,
    limit: 1
  }

  db().view('situations', 'aliased', view_options, function(
    view_error, 
    view_result
  ){
    if (view_error){ return callback(view_error, null) }
    if (!view_result.rows.length){
      var error = {
        error: "not_found",
        message: "No situation has had that alias."
      }

      return callback(error, null);
    }

    return callback(null, view_result.rows[0].value);
  });
}


Situation.prototype = new RevisableDoc();


Situation.prototype.validate = function validateSituation(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }
  
  return RevisableDoc.prototype.validate.call(self, callback);
}


Situation.prototype.create = function createSituation(callback){
  var self = this;
  return RevisableDoc.prototype.create.call(self, {}, callback);
}


Situation.prototype.summarize = function summarizeSituation(callback){
  var self = this;

  var doc = new Doc(self.id);

  doc.read(function(read_error, doc_body){
    if (read_error){ return callback(read_error, null) }

    self.readFields(['title', 'location', 'period', 'alias'], function(
      read_fields_error, 
      fields
    ){
      if (read_fields_error){ return callback(read_fields_error, null) }
      _.extend(doc_body, fields);

      return callback(null, doc_body);
    });
  });
}


Situation.prototype.alias = function changeSituationAlias(alias, callback){
  var self = this;

  Situation.identify(alias, function(id_error, id){
    if (id_error){
      if (id_error.error == 'not_found'){
        return self._change('alias', alias, callback);
      }

      return callback(id_error, null);
    }

    var situation = new Situation(id);

    situation.readField('alias', function(read_error, situation_alias){
      if (read_error){ return callback(read_error, null); }
      if (situation_alias != alias){
        return self._change('alias', alias, callback);
      }

      var error = {
        error: "taken",
        message: "Already being used by another situation."
      }

      return callback(error, null);
    });
  });
}


Situation.prototype.title = function changeSituationTitle(title, callback){
  var self = this;

  return self._change('title', title, callback);
}


Situation.prototype.period = function changeSituationPeriod(period, callback){
  var self = this;

  return self._change('period', period, callback);
}


Situation.prototype.location = function changeSituationLocation(
  location, 
  callback
){
  var self = this;

  return self._change('location', location, callback);
}


Situation.prototype.description = function changeSituationDescription(
  description, 
  callback
){
  var self = this;

  return self._change('description', description, callback);
}


Situation.prototype.tag = function tagSituation(tag_name, callback){
  var self = this;
  self._add(
    'tags', 
    tag_name, 
    { summary: "Tagged '"+ tag_name +"'" },
    callback
  );
}


Situation.prototype.untag = function untagSituation(tag_name, callback){
  var self = this;
  self._remove(
    'tags', 
    tag_name, 
    { summary: "Removed tag '"+ tag_name +"'" },
    callback
  );
}


Situation.prototype.mark = function markSituation(mark_name, callback){
  var self = this;
  self._set(
    'marked', 
    mark_name, 
    (new Date()).getTime(), 
    { summary: "Marked '"+ mark_name.replace('_',' ') +"'" },
    callback
  );
}


Situation.prototype.unmark = function unmarkSituation(mark_name, callback){
  var self = this;
  self._unset(
    'marked', 
    mark_name, 
    { summary: "Removed mark '"+ mark_name.replace('_',' ') +"'" },
    callback
  );
}


Situation.prototype.delete = function deleteSituation(callback){
  var self = this;

  var view_options = {
    startkey: [ self.id ],
    endkey: [ self.id, {} ]
  }

  db().view(
    'relationships', 
    'by_cause_or_effect', 
    view_options, 
    function(view_error, view_result){
      if (view_error){ return callback(view_error, null) }
      if (!view_result.rows.length){
        return RevisableDoc.prototype.delete.call(self, callback);
      }

      var relationship_deletion_operations = view_result.rows.map(
        function(row){
          var relationship = new Relationship(row.id);
          return function(parallel_callback){
            relationship.delete(parallel_callback);
          }
        }
      );

      return async.parallel(
        relationship_deletion_operations, 
        function(
          relationship_deletion_error, 
          relationship_deletion_result
        ){
          if (relationship_deletion_error){ return callback(
            relationship_deletion_error,
            null
          )}

          return RevisableDoc.prototype.delete.call(self, callback);
        }
      );
    }
  );
}


Situation.prototype.relationships = function listSituationRelationships(
  callback
){
  var self = this;
  var view_options = {
    startkey: [ self.id ],
    endkey: [ self.id, {} ],
    include_docs: true
  }

  db().view(
    'relationships',
    'by_cause_or_effect',
    view_options,
    function(view_error, view_result){
      if (view_error){ return callback(view_error, null) }
      return callback(
        null, 
        view_result.rows.map(function(row){ return row.doc })
      )
    }
  );
}


Situation.prototype.causes = function listSituationCauses(callback){
  var self = this;
  var view_options = {
    startkey: [ self.id, 'effect' ],
    endkey: [ self.id, 'effect', {} ],
    include_docs: true
  }

  db().view(
    'relationships',
    'by_cause_or_effect',
    view_options,
    function(view_error, view_result){
      if (view_error){ return callback(view_error, null) }
      return callback(
        null,
        view_result.rows.map(function(row){ return row.doc })
      )
    }
  )
}


Situation.prototype.effects = function listSituationEffects(callback){
  var self = this;
  var view_options = {
    startkey: [ self.id, 'cause' ],
    endkey: [ self.id, 'cause', {} ],
    include_docs: true
  }

  db().view(
    'relationships',
    'by_cause_or_effect',
    view_options,
    function(view_error, view_result){
      if (view_error){ return callback(view_error, null) }
      return callback(
        null,
        view_result.rows.map(function(row){ return row.doc })
      )
    }
  )
}



module.exports = Situation
