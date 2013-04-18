var Doc = require('./doc');
var design = require('./db/designs/adjustments');



var Adjustment = function Adjustment(id){
  if (!(this instanceof Adjustment)) return new Adjustment(id);
  if (id) { this.id = id; }
  this.type = 'adjustment';
}


Adjustment.prototype = new Doc();


Adjustment.prototype.validate = function validateAdjustment(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }

  return Doc.prototype.validate.call(self, callback);
}


Adjustment.prototype.create = function createAdjustment(
  doc_body,
  callback
){
  doc_body.creation_date = (new Date()).getTime();
  Doc.prototype.create.call(this, doc_body, callback);
}



module.exports = Adjustment;
