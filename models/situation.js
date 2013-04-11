var _ = require('lodash');
var search = require('../search');
var Doc = require('./doc');
var RevisableDoc = require('./revisable');
var Relationship = require('./relationship');

var design = require('./db/designs/situations');



var Situation = function Situation(id){
  if (id) { this.id = id; }
  this.type = 'situation';
  var self = this;

  self.on('change', function(field, change_result){
    self.updateSearchIndex();

    if (
      field.name == 'title' ||
      field.name == 'location' ||
      field.name == 'period'
    ){
      self.relationships(function(search_error, search_result){
        // TODO: this really should report the problem or something if there is
        // an error conducting the search.
        if (search_error){ return }

        search_result.hits.forEach(function(hit){
          var relationship = new Relationship(hit._id);
          relationship.updateSearchIndex();
        });
      });
    }
  });

  self.on('delete', function(deletion_result){
    self.deleteFromSearchIndex();

    // delete relationships too
    self.relationships(function(search_error, search_result){
      // TODO: this really should report the problem or something if there is
      // an error conducting the search.
      if (search_error){ return }

      search_result.hits.forEach(function(hit){
        var relaitonship = new Relationship(hit._id);
        relationship.delete();
      });
    });
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

    self.readFields(['title', 'location', 'period'], function(
      read_fields_error, 
      fields
    ){
      if (read_fields_error){ return callback(read_fields_error, null) }
      _.extend(doc_body, fields);

      return callback(null, doc_body);
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


Situation.prototype.relationships = function listSituationRelationships(
  callback
){
  var self = this;
  var search_client = search.client();

  search_client.search({
    type: "relationship",
    sort: [
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


Situation.prototype.causes = function listSituationCauses(callback){
  var self = this;
  var search_client = search.client();

  search_client.search({
    type: "relationship",
    sort: [
      { creation_date: "desc" }
    ],
    filter: {
      term: { "cause._id": self.id }
    }
  }, callback);
}


Situation.prototype.effects = function listSituationEffects(callback){
  var self = this;
  var search_client = search.client();

  search_client.search({
    type: "relationship",
    sort: [
      { creation_date: "desc" }
    ],
    filter: {
      term: { "effect._id": self.id }
    }
  }, callback);
}



module.exports = Situation
