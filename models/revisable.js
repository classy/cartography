var _ = require('lodash');
var async = require('async');

var db = require('./db').db;

var config = require('../config');
var design = require('./db/designs/revisables');
var Doc = require('./doc');
var ImmutableDoc = require('./immutable');
var Change = require('./change');



function RevisableDoc(id){
  if (!(this instanceof RevisableDoc)) return new RevisableDoc(id);
  if(id) this.id = id;
  this.revisable = true;
}


RevisableDoc.prototype = new ImmutableDoc();


RevisableDoc.prototype.validate = function validateRevisable(callback){
  var self = this;

  try {
    design.validate_doc_update(self.tmp.doc_body, self.tmp.old_doc_body);
  } catch (validation_error){
    return callback(validation_error, null);
  }

  return ImmutableDoc.prototype.validate.call(self, callback);
}


RevisableDoc.prototype.create = function createRevisableDoc(
  doc_body,
  callback
){
  doc_body.revisable = true;
  doc_body.creation_date = (new Date()).getTime();
  ImmutableDoc.prototype.create.call(this, doc_body, callback);
}


RevisableDoc.prototype.update = function updateRevisableDoc(
  operation, 
  callback
){
  var error = {
    error: "forbidden",
    message: "Revisable docs cannot be updated. Use '_change' instead."
  }

  return callback(error, null);
}


RevisableDoc.prototype._change = function changeRevisableDoc(
  field_name, to
){
  var self = this;
  var callback = function(){};
  var additional_properties = {};

  switch(arguments.length){
    case 3 : callback = arguments[2]; break;
    case 4 : {
      additional_properties = arguments[2]; 
      callback = arguments[3]; 
      break;
    }
  }

  var new_change = new Change();

  self.read(function(read_err, doc_body){
    if (read_err){ return callback(read_err, null) }
    if (doc_body[field_name] == to){
      var error = {
        error: "already_is",
        message: [
          "The field '", 
          field_name,
          "'is already set to value '",
          to,
          "'"
        ].join('')
      }

      return callback(error, null);
    }

    var new_change_body = _.extend(additional_properties, {
      changed: {
        doc: { _id: self.id, type: self.type },
        field: { name: field_name, to: to }
      }
    });

    return new_change.create(
      new_change_body, 
      function(change_err, change_result){
        if (change_err){ return callback(change_err, null) }
        self.emit('change', new_change_body.changed.field, change_result);
        return callback(change_err, change_result);
      }
    );
  });
};


RevisableDoc.prototype.delete = function deleteRevisableDoc(callback){
  var self = this;

  var view_options = {
    startkey: [self.id],
    endkey: [self.id, {}],
    include_docs: true,
    reduce: false
  }

  db().view(
    'revisables', 
    'changes_by_changed', 
    view_options, 
    function(view_error, view_result){
      if (view_error){ return callback(view_error, null) }
      
      var docs = view_result.rows.map(function(row){
        var doc = _.clone(row.doc);
        doc._deleted = true;
        return doc;
      });

      db().bulk({ docs: docs }, function(bulk_error, bulk_delete){
        if (bulk_error){ return callback(bulk_error, null) }

        docs.map(function(doc_body){
          var change = new Change(doc_body._id);
          change.emit('delete');
        });

        Doc.prototype.delete.call(self, callback)
      });
    }
  );
}


RevisableDoc.prototype._add = function addToRevisableDocField(
  field_name,
  element
){
  var self = this;
  var callback = function(){};
  var additional_properties = {};

  switch(arguments.length){
    case 3 : callback = arguments[2]; break;
    case 4 : {
      additional_properties = arguments[2]; 
      callback = arguments[3]; 
      break;
    }
  }

  return self.readField(
    field_name, 
    function(read_field_err, value){
      if (read_field_err){ return callback(read_field_err, null) }

      var value = value || [];

      if (!_.isArray(value)){
        var error = {
          error: "forbidden",
          message: "field '"+ field_name +"' is not an array.",
        }

        return callback(error, null);
      }

      if (value.indexOf(element) != -1){
        var error = {
          error: "forbidden",
          message: "Element is already in field '"+ field_name +"'."
        }

        return callback(error, null);
      }

      value.push(element);

      return self._change(field_name, value, additional_properties, callback);
    }
  );
}


RevisableDoc.prototype._remove = function removeFromRevisableDocField(
  field_name,
  element
){
  var self = this;
  var callback = function(){};
  var additional_properties = {};

  switch(arguments.length){
    case 3 : callback = arguments[2]; break;
    case 4 : {
      additional_properties = arguments[2]; 
      callback = arguments[3]; 
      break;
    }
  }


  return self.readField(
    field_name, 
    function(read_field_err, value){
      if (read_field_err){ return callback(read_field_err, null) }
      if (!_.isArray(value)){
        var error = {
          error: "forbidden",
          message: "field '"+ field_name +"' is not an array.",
        }

        return callback(error, null);
      }

      var element_index = value.indexOf(element);
      if (element_index == -1){
        var error = {
          error: "forbidden",
          message: "Element is not in field '"+ field_name +"'."
        }

        return callback(error, null);
      }

      value.splice(element_index, 1);
      value = value == [] ? undefined : value;

      return self._change(field_name, value, additional_properties, callback);
    }
  );
}


RevisableDoc.prototype._set = function setInRevisableDoc(
  field_name,
  key,
  value
){
  var self = this;
  var callback = function(){};
  var additional_properties = {};

  switch(arguments.length){
    case 4 : callback = arguments[3]; break;
    case 5 : {
      additional_properties = arguments[3]; 
      callback = arguments[4]; 
      break;
    }
  }

  self.readField(
    field_name,
    function(read_field_err, field_value){
      if (read_field_err){ return callback(read_field_err, null) }
      var field_value = field_value || {};

      if (!_.isObject(field_value)){
        var error = {
          error: "forbidden",
          message: "Field '"+ field_name +"' is not an object."
        }

        return callback(error, null);
      }

      field_value[key] = value;

      self._change(field_name, field_value, additional_properties, callback);
    }
  );
}


RevisableDoc.prototype._unset = function unsetInRevisableDoc(
  field_name,
  key
){
  var self = this;
  var callback = function(){};
  var additional_properties = {};

  switch(arguments.length){
    case 3 : callback = arguments[2]; break;
    case 4 : {
      additional_properties = arguments[2]; 
      callback = arguments[3]; 
      break;
    }
  }

  self.readField(
    field_name,
    function(read_field_err, field_value){
      if (read_field_err){ return callback(read_field_err, null) }

      if (!_.isObject(field_value)){
        var error = {
          error: "forbidden",
          message: "Field '"+ field_name +"' is not an object."
        }

        return callback(error, null);
      }

      if (!field_value[key]){
        var error = {
          error: "forbidden",
          message: "'"+ field_name +"' field '"+ key +"' is not set."
        }

        return callback(error, null);
      }

      delete field_value[key];
      field_value = field_value == {} ? undefined : field_value;

      self._change(field_name, field_value, additional_properties, callback);
    }
  );
};


RevisableDoc.prototype.read = function readRevisableDoc(callback){
  var self = this;
  var rev_doc = {};

  async.parallel([
    function(parallel_cb){ 
      return ImmutableDoc.prototype.read.call(self, function(read_err, doc_body){
        if (read_err){ return parallel_cb(read_err, null); }
        return parallel_cb(null, doc_body);
      }); 
    },
    function(parallel_cb){

      var view_options = {
        group_level: 2,
        reduce: true,
        startkey: [self.id],
        endkey: [self.id, {}]
      };

      db().view('revisables', 'changes_by_changed', view_options, function(
        view_err, view_result
      ){
        if (view_err){ return parallel_cb(view_err, null) }
        if (!view_result.rows){ return parallel_cb(null, {}) }

        var change_ids = view_result.rows.map(function(row){
          return row.value
        });

        return db().view('changes', 'field_summary', 
          { keys: change_ids },
          function(view_err, view_result){
            if (view_err){ return parallel_cb(view_err, null) }
            
            var up_to_date_fields = {};

            for (i in view_result.rows){
              var field = view_result.rows[i].value;
              up_to_date_fields[field.name] = field.to;
            }

            return parallel_cb(null, up_to_date_fields);
          }
        );
      });
    }
  ], function(async_error, async_results){
    if(async_error){ return callback(async_error, null) }

    for (i in async_results){
      var result = async_results[i];
      rev_doc = _.extend(rev_doc, result);
    }

    self.emit('read', rev_doc);
    return callback(null, rev_doc);
  });
};


RevisableDoc.prototype.readField = function readRevisableDocField(
  field_name, 
  callback
){
  var self = this;

  var field_view_options = {
    endkey: [self.id, field_name],
    startkey: [self.id, field_name, {}],
    descending: true,
    reduce: false,
    limit: 1
  }

  return db().view(
    'revisables', 
    'changes_by_changed', 
    field_view_options, 
    function(view_err, view_result){
      if (view_err){ return callback(view_err, null) }
      if (!view_result.rows.length){ return callback(null, undefined) }

      return callback(null, view_result.rows[0].value.to);
    }
  );
}


RevisableDoc.prototype.readFields = function readRevisableDocFields(
  field_names,
  callback
){
  var self = this;
  var fields = {};

  var async_ops = field_names.map(function(field_name){
    return function(async_cb){
      self.readField(field_name, function(read_field_error, field_value){
        if (read_field_error){ async_cb(read_field_error, null) }
        fields[field_name] = field_value;
        return async_cb(null, field_value);
      });
    }
  });

  async.parallel(async_ops, function(async_error, async_result){
    if (async_error){ return callback(async_error, null) }
    return callback(null, fields);
  });
}


RevisableDoc.prototype.changes = function listRevisableDocChanges(callback){
  var self = this;

  var field_view_options = {
    endkey: [self.id],
    startkey: [self.id, {}],
    descending: true,
    reduce: false,
    include_docs: true
  }

  db().view(
    'revisables',
    'changes_by_changed',
    field_view_options,
    function(view_err, view_result){
      if (view_err){ return callback(view_err, null) }
      if (!view_result.rows.length){ return callback(null, undefined) }

      return callback(null, view_result.rows.map(
        function(row){ 
          return row.doc 
        }
      ));
    }
  );
}



module.exports = RevisableDoc;
