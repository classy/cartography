


var toJSON = JSON.stringify;


module.exports = {
  _id: '_design/situations',
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

    if (type == "situation"){
    }
  },
  views: {
    aliased: {
      map: function(doc){
        if (doc.type == 'change'){
          var changed = doc.changed;

          if (
            changed.doc.type == 'situation' 
            && changed.field.name == 'alias'
          ){
            emit([changed.field.to, doc.creation_date], changed.doc._id);
          }
        }
      }
    }
  }
}
