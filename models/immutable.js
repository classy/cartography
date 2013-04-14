var Doc = require('./doc');
var design = require('./db/designs/immutables');



var ImmutableDoc = function ImmutableDoc(id){
  if (!(this instanceof ImmutableDoc)) return new ImmutableDoc(id);
  if (id) { this.id = id; }
  this.immutable = true;
}


ImmutableDoc.prototype = new Doc();


ImmutableDoc.prototype.validate = function validateImmutableDoc(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }

  return Doc.prototype.validate.call(self, callback);
}


ImmutableDoc.prototype.create = function createImmutableDoc(
  doc_body,
  callback
){
  doc_body.immutable = true;
  Doc.prototype.create.call(this, doc_body, callback);
}


ImmutableDoc.prototype.update = function updateImmutableDoc(
  operation, 
  callback
){
  var error = {
    error: "forbidden",
    message: "Immutable docs cannot be updated."
  }

  return callback(error, null);
}



module.exports = ImmutableDoc;
