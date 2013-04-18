


var toJSON = JSON.stringify;


module.exports = {
  _id: '_design/aliases',
  language: 'javascript',
  validate_doc_update: function(new_doc, old_doc, user_context){
    function required(be_true, message){
      if (!be_true) throw { forbidden: message };
    }
  
    function unchanged(field) {
      if (old_doc && toJSON(old_doc[field]) != toJSON(new_doc[field]))
        throw({ forbidden : "Field can't be changed: " + field });
    }

    var type = new_doc.type;

    if (type == "alias"){
      required(
        new_doc.hasOwnProperty('_id'),
        "An Alias' '_id' field is required."
      );

      required(
        // 2. must have a 'target' field
        new_doc.hasOwnProperty('target'),
        "An alias must have a 'target' field."
      );

      required(
        // 3. 'doc.target' must have a 'doc' field
        new_doc.target.hasOwnProperty('doc'),
        "An alias' 'target' field must have a 'doc' field."
      );

      required(
        // 4. 'doc.target.doc' must have an '_id' field
        new_doc.target.doc.hasOwnProperty('_id'),
        "An Alias' 'target.doc' must have an '_id' field."
      );

      required(
        typeof new_doc.target.doc._id == 'string',
        "An Alias' 'target.doc._id' must be a string."
      );
    }
  },

  views: {
    by_target_id: {
      map: function(doc){
        if (doc.type == 'alias'){
          emit(doc.target.doc._id, null)
        }
      }
    }
  }
}
