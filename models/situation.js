var RevisableDoc = require('./revisable');

var design = require('./db/designs/situations');



var Situation = function Situation(id){
  if (id) { this.id = id; }
  this.type = 'situation';
  var self = this;

  this.on('change', function(change_result){
    self.updateSearchIndex();
  });

  this.on('delete', function(deletion_result){
    self.deleteFromSearchIndex();
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


Situation.prototype.tag = function tagSituation(tag_name, callback){
  var self = this;
  self.add(
    'tags', 
    tag_name, 
    { summary: "Tagged '"+ tag_name +"'" },
    callback
  );
}


Situation.prototype.untag = function untagSituation(tag_name, callback){
  var self = this;
  self.remove(
    'tags', 
    tag_name, 
    { summary: "Removed tag '"+ tag_name +"'" },
    callback
  );
}


Situation.prototype.mark = function markSituation(mark_name, callback){
  var self = this;
  self.set(
    'marked', 
    mark_name, 
    (new Date()).getTime(), 
    { summary: "Marked '"+ mark_name.replace('_',' ') +"'" },
    callback
  );
}


Situation.prototype.unmark = function unmarkSituation(mark_name, callback){
  var self = this;
  self.unset(
    'marked', 
    mark_name, 
    { summary: "Removed mark '"+ mark_name.replace('_',' ') +"'" },
    callback
  );
}



module.exports = Situation
