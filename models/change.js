var design = require('./db/designs/changes');
var ImmutableDoc = require('./immutable');



var Change = function Change(id){
  if (id) { this.id = id; }
  this.type = 'change';
}


Change.prototype = new ImmutableDoc();


Change.prototype.validate = function validateChange(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }

  var changed_doc = new ImmutableDoc(self.tmp.doc_body.changed.doc._id);

  changed_doc.exists(function(existance_error, exists){
    if (!exists){
      var error = {error: 'forbidden', reason: "Changed doc doesn't exist."}
      return callback(error, null);
    }

    return callback(null, true)
  });
};


Change.prototype.create = function createChange(doc_body, callback){
  doc_body = doc_body || {};
  doc_body.creation_date = (new Date()).getTime();
  
  ImmutableDoc.prototype.create.call(this, doc_body, callback);
}



module.exports = Change
