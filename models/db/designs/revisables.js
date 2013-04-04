


var toJSON = JSON.stringify;


module.exports = {
  _id: '_design/revisables',
  language: 'javascript',
  validate_doc_update: function(new_doc, old_doc, user_context){

    function required(be_true, message){
      if (!be_true) throw { forbidden: message };
    }
  
    function unchanged(field) {
      if (old_doc && toJSON(old_doc[field]) != toJSON(new_doc[field]))
        throw({ forbidden : "Field can't be changed: " + field });
    }

    if (new_doc.hasOwnProperty('revisable')){
      required(
        new_doc.revisable === true,
        "'revisable' may only be set to 'true'.");

      required(
        new_doc.hasOwnProperty('creation_date'),
        "Revisables must have a 'creation_date'.");
    }
  },
  views: {
    changes_by_changed: {
      map: function (doc) {
        if (doc.type == 'change'){
          emit([
            doc.changed.doc._id, 
            doc.changed.field.name, 
            doc.creation_date,
            doc._id
          ], doc.changed.field)
        }
      },
      
      reduce: function(keys, values, rereduce){
        var key = keys[0];
        var id = key[key.length -1]
        return id;
      }
    }
  }
}
