


var toJSON = JSON.stringify;


module.exports = {
  _id: '_design/relationships',
  language: 'javascript',
  validate_doc_update: function(new_doc, old_doc, user_context){

    function required(be_true, message){
      if (!be_true) throw { forbidden: message };
    }
  
    function unchanged(field) {
      if (old_doc && toJSON(old_doc[field]) != toJSON(new_doc[field]))
        throw({ forbidden : "Field can't be changed: " + field });
    }

    var type = new_doc.hasOwnProperty('type') ? new_doc.type : undefined;

    if (type == 'relationship'){
      required(
        new_doc.hasOwnProperty('cause'), 
        "Relationships must have a 'cause' field.");

      required(
        new_doc.cause.hasOwnProperty('_id'), 
        "'cause' must have an '_id' field.");

      required(
        typeof new_doc.cause._id == 'string',
        "'cause._id' must be a string.");

      required(
        new_doc.hasOwnProperty('effect'), 
        "Relationships must have a 'effect' field.");

      required(
        new_doc.effect.hasOwnProperty('_id'), 
        "'effect' must have an '_id' field.");

      required(
        typeof new_doc.effect._id == 'string',
        "'effect._id' must be a string.");
    }
  },
  views: {
    by_cause_or_effect: {
      map: function(doc){
        if (doc.type == 'relationship'){
          emit([ doc.cause._id, 'cause' ], null);
          emit([ doc.effect._id, 'effect' ], null);
        }
      }
    },
    by_cause_and_effect: {
      map: function(doc){
        if (doc.type == 'relationship'){
          emit([doc.cause._id, doc.effect._id], null);
        }
      }
    }
  }
}
