var vows = require('vows');
var assert = require('assert');



var Doc = require('../models').Doc;


vows.describe('Document Objects').addBatch({
  'Creating a Document': {
    topic: Doc,

    'without properties': {
      topic: function(Doc){
        Doc.create(this.callback);
      },

      'returns a Doc': function(err, doc){
        assert.instanceOf(doc, Doc);
      },

      'returns a Doc with an id and rev': function(err, doc){
        assert.equal(doc._id, '1234');
        assert.equal(doc._rev, '0987');
      },

      'returns a Doc with an empty properties object': function(err, doc){
        assert.equal(doc.get(), {});
      }
    },

    'with properties': {
      topic: function(Doc){
        Doc.create({
          type: "vehicle",
          color: "blue"
        }, this.callback);
      },

      'returns a Doc': function(err, doc){
        assert.instanceOf(doc, Doc);
      },

      'returns a Doc with an id and rev': function(err, doc){
        assert.equal(doc._id, '1234');
        assert.equal(doc._rev, '0987');
      },

      'returns a Doc with properties': function(err, doc){
        assert.equal(doc.read('type'), 'vehicle');
        assert.equal(doc.read('color'), 'blue');
        assert.equal(doc.read(), { type: 'vehicle', color: 'blue' });
      }
    }
  }
});
