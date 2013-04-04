


var toJSON = JSON.stringify;


module.exports = {
  _id: '_design/changes',
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

    if (type == "change"){
      required(
        new_doc.hasOwnProperty('changed'), 
        "Must have a 'changed' field.");

      var changed = new_doc.changed;

      required(
        changed.hasOwnProperty('doc'), 
        "'changed' must have a 'doc' field.");

      required(
        changed.doc.hasOwnProperty('_id'), 
        "'changed.doc' must have a '_id' field.");

      required(
        typeof changed.doc._id == 'string', 
        "'changed.doc._id' must be a string.");

      required(
        changed.doc.hasOwnProperty('type'), 
        "'changed.doc' must have a 'type' field.");

      required(
        typeof changed.doc.type == 'string', 
        "'changed.doc.type' must be a string.");

      required(
        changed.hasOwnProperty('field'), 
        "'changed' must have a 'field' field.");

      required(
        changed.field.hasOwnProperty('name'), 
        "'changed.field' must have a 'name' field.");

      required(
        typeof changed.field.name == 'string', 
        "'changed.field.name' must be a string.");

      required(
        changed.field.hasOwnProperty('to'), 
        "'changed.field' must have a 'to' field.");


      // changes to the 'type', 'creation_date' or revisability are not allowed
      var unchangeable_field_names = [
        '_id',
        '_rev',
        'type', 
        'revisable', 
        'creation_date'
      ]


      var field_name = changed.field.name;
      var value = changed.field.to;

      required(
        unchangeable_field_names.indexOf(field_name) == -1,
        "Changes to a document's '"+ field_name +"' are not allowed.")

      // if the change is made to a situation
      if (changed.doc.type == 'situation'){
        if (field_name == 'title'){
          required(
            typeof value == 'string', 
            "A situation's title must be a string.");

          required(
            value.length <= 115,
            "A situation's title may be no more than 115 characters long.");
        }

        if (field_name == 'location'){
          required(
            typeof value == 'string',
            "A situation's location must be a string.");

          required(
            value.length <= 64,
            "A situation's location may be no more than 64 characters long.");
        }

        if (field_name == 'tags'){
          required(
            Object.prototype.toString.call(value) === '[object Array]',
            "A situation's tags field must be an array.")

          for (i in value){
            var tag = value[i];

            required(
              typeof tag == 'string',
              "A situation's 'tags' field may only contain strings");
          }
        }
      }

      if (changed.doc.type == 'relationship'){
        var unchangeable_field_names_for_relationships = [
          'cause',
          'effect'
        ]

        required(
          unchangeable_field_names_for_relationships.indexOf(field_name) == -1,
          "A relationship's '"+ field_name +"' are not allowed.")
      }
    }
  },
  views: {
    'field_summary': {
      map: function(doc){
        if (doc.type == 'change'){
          emit(doc._id, doc.changed.field);
        }
      }
    }
  }
}
