var _ = require('lodash');
var async = require('async');
var config = require('../config');
var search = require('../search');
var Doc = require('./doc');
var RevisableDoc = require('./revisable');

var design = require('./db/designs/situations');
var db = require('./db').db;



var Situation = function Situation(id){
  if (!(this instanceof Situation)) return new Situation(id);
  if (id) { this.id = id; }
  this.type = 'situation';
}

module.exports = Situation;
var Relationship = require('./relationship');


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
  var summary = {};

  async.parallel([
    function(parallel_callback){
      doc.read(parallel_callback);
    },
    function(parallel_callback){
      self.readFields([
        'title',
        'location',
        'period',
        'alias'
      ], parallel_callback);
    }
  ], function(parallel_error, parallel_result){
    if(parallel_error) { return callback(parallel_error, null) }

    parallel_result.forEach(function(fields){
      summary = _.extend(summary, fields);
    });

    return callback(null, summary);
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
    key: self.id
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


Situation.prototype.relationships = function listSituationRelationships(){
  
  var callback = function(){};
  var options = {};
  var es_config = config.get('elasticsearch');

  switch(arguments.length){
    case 1 :
      var callback = arguments[0];
      break;

    case 2 :
      var options = arguments[0];
      var callback = arguments[1];
      break;
  }

  var self = this;
  var search_client = search.client();

  var self = this;
  var search_client = search.client();

  search_client.search({
    type: "relationship",
    index: es_config.indexes.main,
    size: options.limit,
    sort: [
      { strength: "desc" },
      { creation_date: "desc" }
    ],
    filter: {
      or: [
        { term: { "cause._id": self.id } },
        { term: { "effect._id": self.id } }
      ]
    }
  }, callback);
}


Situation.prototype.causes = function listSituationCauses(){
  
  var callback = function(){};
  var options = {};
  var es_config = config.get('elasticsearch');

  switch(arguments.length){
    case 1 :
      var callback = arguments[0];
      break;

    case 2 :
      var options = arguments[0];
      var callback = arguments[1];
      break;
  }

  var self = this;
  var search_client = search.client();

  search_client.search({
    type: "relationship",
    index: es_config.indexes.main,
    size: options.limit,
    sort: [
      { strength: "desc" },
      { creation_date: "desc" }
    ],
    filter: {
      term: { "effect._id": self.id }
    }
  }, callback);
}


Situation.prototype.effects = function listSituationEffects(){
  
  var callback = function(){};
  var options = {};
  var es_config = config.get('elasticsearch');

  switch(arguments.length){
    case 1 :
      var callback = arguments[0];
      break;

    case 2 :
      var options = arguments[0];
      var callback = arguments[1];
      break;
  }

  var self = this;
  var search_client = search.client();

  search_client.search({
    type: "relationship",
    index: es_config.indexes.main,
    size: options.limit,
    sort: [
      { strength: "desc" },
      { creation_date: "desc" }
    ],
    filter: {
      term: { "cause._id": self.id }
    }
  }, callback);
}


Situation.prototype.similar = function listSimilarSituations(){
  
  var callback = function(){};
  var options = {};
  var es_config = config.get('elasticsearch');

  switch(arguments.length){
    case 1 :
      var callback = arguments[0];
      break;

    case 2 :
      var options = arguments[0];
      var callback = arguments[1];
      break;
  }

  var self = this;
  var search_client = search.client();

  self.relationships(function(search_error, search_result){
    if (search_error){ return callback(search_error, null) }
    
    var ids_of_related_situations = _.uniq(
      search_result.hits.map(
        function(hit){
          var cause_id = hit._source.cause._id;
          var effect_id = hit._source.effect._id;

          return cause_id == self.id ? effect_id : cause_id;
        }
      )
    );

    ids_of_related_situations.push(self.id);

    self.readField('title', function(read_error, title){
      if (read_error){ return callback(read_error, null) }

      var more_like_this = {
        fields: ['situation.title'],
        like_text: title,
        min_term_freq: 1,
        min_doc_freq: 1
      }

      var filter = {
        not: { 
          ids: {
            type: self.type,
            values: ids_of_related_situations
          }
        }
      }

      search_client.search({
        index: es_config.indexes.main,
        type: self.type,
        size: options.limit,
        query: {
          filtered: {
            query: {
              more_like_this: more_like_this
            },
            filter: filter
          }
        }
      }, function(search_error, search_result){
        if (search_error){ return callback(search_error, null) }
        return callback(null, search_result);
      });
    });
  });
}



