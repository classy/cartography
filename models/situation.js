var RevisableDoc = require('./revisable');

var design = require('./db/designs/situations');



var Situation = function Situation(id){
  if (id) { this.id = id; }
  this.type = 'situation';
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


Situation.prototype.tag = function tagSituation(tag_name, callback){
  var self = this;
  self.add('tags', tag_name, callback);
}


Situation.prototype.untag = function untagSituation(tag_name, callback){
  var self = this;
  self.remove('tags', tag_name, callback);
}

module.exports = Situation
