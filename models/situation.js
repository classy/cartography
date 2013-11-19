var _ = require('lodash');
var curry = require('curry');
var async = require('async');
var config = require('../config');
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


Situation.prototype.alias = function changeSituationAlias(){
  var self = this;
  var fn_args = arguments;
  var changeAlias = curry(['alias'], self._change, self);

  var alias;
  var callback = function(){};
  var additional_properties = {};

  switch(arguments.length){
    case 1 : 
      alias = arguments[0]; 
      break;
    case 2 :
      alias = arguments[0];
      callback = arguments[1];
      break;
    case 3 :
      alias = arguments[0];
      additional_properties = arguments[1];
      callback = arguments[2];
      break;
  }

  Situation.identify(alias, function(id_error, id){
    if (id_error){
      if (id_error.error == 'not_found'){
        return changeAlias.apply(self, fn_args);
      }

      return callback(id_error, null);
    }

    var situation = new Situation(id);

    situation.readField('alias', function(read_error, situation_alias){
      if (read_error){ return callback(read_error, null); }
      if (situation_alias != alias){
        return changeAlias.apply(self, fn_args);
      }

      var error = {
        error: "taken",
        message: "Already being used by another situation."
      }

      return callback(error, null);
    });
  });
}


Situation.prototype.title = function changeSituationTitle(){
  var self = this;
  var changeTitle = curry(['title'], self._change, self);

  return changeTitle.apply(self, arguments);
}


Situation.prototype.period = function changeSituationPeriod(){
  var self = this;
  var changePeriod = curry(['period'], self._change, self);

  return changePeriod.apply(self, arguments);
}


Situation.prototype.location = function changeSituationLocation(){
  var self = this;
  var changeLocation = curry(['location'], self._change, self);

  return changeLocation.apply(self, arguments);
}


Situation.prototype.description = function changeSituationDescription(){
  var self = this;
  var changeDescription = curry(['description'], self._change, self);

  return changeDescription.apply(self, arguments);
}


Situation.prototype.tag = function tagSituation(){
  var self = this;
  var addTag = curry(['tags'], self._add, self);
  var tag_name;
  var additional_properties = {};
  var callback = function(){};

  switch(arguments.length){
    case 1 : 
      tag_name = arguments[0]; 
      break;
    case 2 :
      tag_name = arguments[0];
      callback = arguments[1];
      break;
    case 3 :
      tag_name = arguments[0];
      additional_properties = arguments[1];
      callback = arguments[2];
      break;
  }

  additional_properties.summary = "Tagged '"+ tag_name +"'";
  return addTag.apply(self, [
    tag_name, 
    additional_properties,
    callback
  ]);
}


Situation.prototype.untag = function untagSituation(){
  var self = this;
  var removeTag = curry(['tags'], self._remove, self);
  var tag_name;
  var additional_properties = {};
  var callback = function(){};

  switch(arguments.length){
    case 1 : 
      tag_name = arguments[0]; 
      break;
    case 2 :
      tag_name = arguments[0];
      callback = arguments[1];
      break;
    case 3 :
      tag_name = arguments[0];
      additional_properties = arguments[1];
      callback = arguments[2];
      break;
  }

  additional_properties.summary = "Removed tag '"+ tag_name +"'";
  return removeTag.apply(self, [
    tag_name, 
    additional_properties,
    callback
  ]);
}


Situation.prototype.mark = function markSituation(){
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


Situation.prototype.unmark = function unmarkSituation(){
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


Situation.prototype.caused = function addSituationEffect(effect, callback){
  var self = this;
  var effect_id = effect.id || effect._id || effect;

  var new_relationship = new Relationship();
  new_relationship.create({
    cause: { _id: self.id },
    effect: { _id: effect_id }
  }, callback);
}


Situation.prototype.because = function addSituationCause(cause, callback){
  var self = this;
  var cause_id = cause.id || cause._id || cause;

  var new_relationship = new Relationship();
  new_relationship.create({
    cause: { _id: cause_id },
    effect: { _id: self.id }
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



