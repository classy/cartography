var _ = require('lodash');
var updateOperationsForRelationship = require('./relationship');



module.exports = function updateOperationsForAdjustment(
  doc,
  callback
){
  var adjustment = doc;
  var adjusted = doc.adjusted;

  var update_ops = [];

  if (adjusted.doc.type == 'relationship'){
    updateOperationsForRelationship(
      adjusted.doc,
      function(ops_error, operations){
        if (ops_error){ return callback(ops_error, null) }
        update_ops.push(operations);
        return callback(null, _.flatten(update_ops));
      }
    );
  }
}
