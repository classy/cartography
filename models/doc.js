var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var db = require('./db').db;
var nano = require('./db').nano;



function getHeaders(id, callback){
  var request_options = {
    db: 'cartography',
    doc: id,
    method: 'HEAD'
  }

  nano().request(request_options, function(request_error, result, headers){
    return callback(request_error, headers);
  });
};


var Doc = function Doc(id){
  if (id) { this.id = id }
  this.tmp = {};

  EventEmitter.call(this);
}


Doc.prototype = new EventEmitter();


Doc.prototype.validate = function validateDoc(callback){
  return callback(null, true);
};


Doc.prototype.create = function createDoc(doc_body, callback){
  doc_body = doc_body || {};
  doc_body.type = this.type;

  var self = this;

  self.tmp.doc_body = doc_body;
  self.validate(function(validation_error, validation_result){
    if (validation_error){ return callback(validation_error, null) }

    return db().insert(doc_body, function(insert_error, result){
      if (insert_error){
        return callback(insert_error, null);
      }
  
      self.id = result.id;

      delete self.tmp.doc_body;
      return callback(null, result);
      this.emit('created', result);
    });
  });
}


Doc.prototype.read = function readDoc(callback){
  var self = this;
  db().get(self.id, function(get_err, doc){
    if (get_err) { return callback(get_err, null) }
    self.emit('read', doc);
    return callback(null, doc);
  });
}


Doc.prototype.exists = function(callback){
  if (!this.id){ return callback(null, false) }
  getHeaders(this.id, function(header_error, headers){
    return callback(
      header_error, headers ? headers['status-code'] === 200 : null
    );
  });
}


Doc.prototype.update = function updateDoc(operation, callback){
  var self = this;
  self.read(function(read_error, doc_body){
    if (read_error){
      return callback(read_error, null);
    }

    var updated_doc_body = operation(doc_body);

    if (!updated_doc_body._id){
      var error = { 
        error: 'invalid', 
        message: 'Operation must not remove the _id.'
      }

      return callback(error, null);
    }

    if (updated_doc_body._rev != doc_body._rev){
      var error = {
        error: 'invalid',
        message: "Operation must not alter the document's _rev."
      }

      return callback(error, null);
    }

    updated_doc_body._id = self.id;
    updated_doc_body.type = self.type;

    self.tmp.doc_body = updated_doc_body;
    self.tmp.old_doc_body = doc_body;

    self.validate(function(validation_error, validation_result){
      if (validation_error){ return callback(validation_error, null) }

      db().insert(
        updated_doc_body, 
        self.id, 
        function(insert_error, insert_result){
          if (insert_error){
            if (insert_error.error == "conflict"){
              return self.update(operation, callback);
            }
  
            return callback(insert_error, null);
          }
  
          self.emit('update', insert_result);
          return callback(null, insert_result);
      });
    });

    delete self.tmp.doc_body;
    delete self.tmp.old_doc_body;
  });
};


Doc.prototype.delete = function deleteDoc(callback){
  var self = this;

  self.read(function(read_error, doc_body){
    db().destroy(
      doc_body._id, 
      doc_body._rev, 
      function(destroy_error, destroy_result){
        if (destroy_error){ return callback(destroy_error, null) }
        self.emit('delete', destroy_result);
        return callback(null, destroy_result);
      });
  });
}


// Doc.create = function createDoc(){
//   var callback = arguments.length ? arguments[arguments.length -1] : null;
//   var properties = arguments.length >= 2 ? arguments[0] : {};
// 
//   db().insert(properties, function(insert_error, result){
//     if (insert_error){
//       return callback(insert_error, null);
//     }
// 
//     var new_doc = new Doc(result.id);
//     return callback(null, new_doc);
//   });
// }



module.exports = Doc
