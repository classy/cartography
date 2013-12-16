var should = require('should');

var cartography = require('../');
var Situation = cartography.models.Situation;

cartography.config.set({
  couchdb: cartography.config.get('couchdb_test')
});

var nano = require('../models/db').nano();
var database_name = cartography.config.get('couchdb').database;



suite('Situations', function(){
  suiteSetup(function(done){
    nano.db.destroy(database_name, function(destroy_error, destroy_result){
      if (destroy_error){ 
        if (destroy_error.error != 'not_found'){ throw destroy_error }
      }
      return cartography.install(function(
        installation_error, 
        installation_result
      ){
        if (installation_error){ throw installation_error }
        return done()
      });
    });
  });

  suiteTeardown(function(done){
    nano.db.destroy(database_name, function(destroy_error, destroy_result){
      if (destroy_error){
        if (destroy_error.error != 'not_found') { throw destroy_error }
      }
      return done();
    })
  });

  function instantiatedOkay(situation){
    test('should return an instance of `Situation`', function(){
      situation.should.be.an.instanceOf(Situation);
    });

    test('should be of type "situation"', function(){
      situation.should.have.property('type', 'situation');
    });
  }

  suite('instantiated without an id', function(){
    var situation = new Situation();
    instantiatedOkay(situation);
  });

  suite('instantiated with an id', function(){
    var situation = new Situation('1234');
    instantiatedOkay(situation);

    test('should should return an object with an `id`', function(){
      situation.should.have.property('id');
    });
  });

  suite('when created', function(){
    var situation = new Situation();
    var situation_2 = new Situation();

    suiteSetup(function(done){
      situation.create(function(err, res){
        if (err) return done(err);
        situation_2.create(done);
      });
    });

    suiteTeardown(function(done){
      situation_2.delete(function(err, res){
        if (err) return done(err);
        situation.delete(done);
      });
    });

    test('can be read', function(done){
      situation.read(done);
    });

    suite('and read', function(){
      var situation_body;

      suiteSetup(function(done){
        situation.read(function(err, res){
          if (err) return done(err);
          situation_body = res;
          done();
        });
      });

      test('has the necessary properties', function(){
        situation_body.should.be.an.instanceOf(Object);
        situation_body.should.have.property('type', 'situation');
        situation_body.should.have.property('_id', situation.id);
        situation_body.should.have.property('_rev');
        situation_body.should.have.property('revisable', true);
        situation_body.should.have.property('immutable', true);
        situation_body.should.have.property('creation_date');
      });

      test('has a valid `cration_date`', function(){
        situation_body.creation_date.should.be.type('number').and.be.above(0);
        // TODO: test that it can be parsed as a date, and that it was at least
        // created today or something.
      });
    });

    suite('and its', function(){
      function changeField(field_name){
        suite(field_name +' is changed', function(){
          var result;

          suiteSetup(function(done){
            situation[field_name]('test', function(err, res){
              if (err) return done(err);
              result = res;
              return done();
            });
          });

          test('the `_id` of the change is returned', function(){
            result.should.be.an.instanceOf(Object);
            result.should.have.property('ok', true);
            result.should.have.property('id');
          });

          suite('and the situation is read', function(){
            var situation_body;

            suiteSetup(function(done){
              situation.read(function(err, res){
                if (err) return done(err);
                situation_body = res;
                return done();
              });
            });

            test('the change is reflected in the document body', function(){
              situation_body.should.have.property(field_name, 'test');
            });
          });
        });
      }

      var field_names = [
        'title',
        'description',
        'period',
        'location',
        'alias'
      ]

      field_names.forEach(changeField);

      suite('alias is changed', function(){
        var result;

        suiteSetup(function(done){
          situation.alias('derp', function(err, res){
            if (err) return done(err);
            result = res;
            return done();
          });
        });

        test('the `_id` of the change is returned', function(){
          result.should.be.an.instanceOf(Object);
          result.should.have.property('ok', true);
          result.should.have.property('id');
        });
        
        suite('and the situation is read', function(){
          var situation_body;

          suiteSetup(function(done){
            situation.read(function(err, res){
              if (err) return done(err);
              situation_body = res;
              return done();
            });
          });

          test('the change is reflected in the document body', function(){
            situation_body.should.have.property('alias', 'derp');
          });
        });

        suite('and the situation is identified by its alias', function(){
          var identified_situation_id;

          suiteSetup(function(done){
            Situation.identify('derp', function(err, res){
              if (err) return done(err);
              identified_situation_id = res;
              return done();
            });
          });

          test('the situation id is returned', function(){
            should.exist(identified_situation_id);
            identified_situation_id.should.be.type('string');
          });
        });

        suite('and another situation is given the same alias', function(){
          var situation_2 = new Situation();
          var aliasing_result = null;
          var aliasing_error = null;

          suiteSetup(function(done){
            situation_2.create(function(creation_err, creation_res){
              if (creation_err) return done(creation_err);

              situation_2.alias('derp', function(err, res){
                aliasing_result = res;
                aliasing_error = err;
                return done();
              });
            });
          });

          test('an error should be returned', function(){
            should(aliasing_error).be.ok;
            aliasing_error.should.be.instanceOf(Object);
          });
        });

        suite('and given another alias', function(){
          suiteSetup(function(done){
            situation.alias('derp2', done);
          });

          test('it can still be identified by the old alias', function(done){
            Situation.identify('derp', function(err, id){
              should.not.exist(err);
              should.exist(id);
              id.should.be.type('string');
              id.should.equal(situation.id);
              done();
            });
          });
        });
      });
    });

    suite('and it\'s', function(){

      suite('marked', function(){
        var mark_result;

        suiteSetup(function(done){
          situation.mark('stupid', function(err, res){
            if (err) return done(err);
            mark_result = res;
            return done();
          });
        });

        test('the `_id` of the change is returned', function(){
          mark_result.should.be.an.instanceOf(Object);
          mark_result.should.have.property('ok', true);
          mark_result.should.have.property('id');
        });

        suite('and the situation is read', function(){
          var situation_body;

          suiteSetup(function(done){
            situation.read(function(err, res){
              if (err) return done(err);
              situation_body = res;
              return done();
            });
          });

          test('`marked` should have the property with the mark name.', function(){
            situation_body.should.have.property('marked');
            situation_body.marked.should.have.property('stupid');
          });

          suite('and unmarked', function(){
            var change_result;

            suiteSetup(function(done){
              situation.unmark('stupid', function(err, res){
                if (err) return done(err);
                change_result = res;
                return done();
              });
            });

            test('the `_id` of the change is returned', function(){
              change_result.should.be.an.instanceOf(Object);
              change_result.should.have.property('ok', true);
              change_result.should.have.property('id');
            });

            suite('and the situation is read', function(){
              var situation_body;
    
              suiteSetup(function(done){
                situation.read(function(err, res){
                  if (err) return done(err);
                  situation_body = res;
                  return done();
                });
              });
    
              test('the `marked` field is empty', function(){
                situation_body.marked.should.be.empty;
                // TODO: there shouldn't be a `marked` field if there are no
                // marks
              });
            });
          });
        });
      });

      suite('tagged', function(){
        var tag_result;

        suiteSetup(function(done){
          situation.tag('stupid', function(err, res){
            if (err) return done(err);
            tag_result = res;
            return done();
          });
        });

        test('the `_id` of the change is returned', function(){
          tag_result.should.be.an.instanceOf(Object);
          tag_result.should.have.property('ok', true);
          tag_result.should.have.property('id');
        });

        suite('and the situation is read', function(){
          var situation_body;

          suiteSetup(function(done){
            situation.read(function(err, res){
              if (err) return done(err);
              situation_body = res;
              return done();
            });
          });

          test('the change is reflected in the document body', function(){
            situation_body.should.have.property('tags');
            situation_body.tags.should.be.an.instanceOf(Array);
            situation_body.tags.should.include('stupid');
          });

          suite('and untagged', function(){
            var change_result;

            suiteSetup(function(done){
              situation.untag('stupid', function(err, res){
                if (err) return done(err);
                change_result = res;
                return done();
              });
            });

            test('the `_id` of the change is returned', function(){
              tag_result.should.be.an.instanceOf(Object);
              tag_result.should.have.property('ok', true);
              tag_result.should.have.property('id');
            });

            suite('and the situation is read again', function(){
              var situation_body;

              suiteSetup(function(done){
                situation.read(function(err, res){
                  if (err) return done(err);
                  situation_body = res;
                  return done();
                });
              });

              test('the `tags` field should be empty', function(){
                situation_body.tags.should.be.empty;
                // TODO: there shouldn't be a `tags` field if there are no
                // tags.
              });
            });
          });
        });
      });
    });

    suite('and changed', function(){
      suiteSetup(function(done){
        situation.title('sample situation', function(error){
          if (error) return done(error);
          situation.location('sample location', function(error){
            if (error) return done(error);
            situation.period('sample period', done);
          })
        });
      });

      test('shows changes in summary', function(done){
        situation.summarize(function(err, summarized_situation){
          if (err) return done(err);

          should.exist(summarized_situation);
          summarized_situation.should.be.an.instanceOf(Object);
          summarized_situation.should.have.property('_id', situation.id);

          summarized_situation.should.have.property(
            'title', 
            'sample situation'
          );

          summarized_situation.should.have.property(
            'location', 
            'sample location'
          );

          summarized_situation.should.have.property(
            'period',
            'sample period'
          )

          done();
        });
      });
    });

    suite('with relationships', function(){

      test('as the cause', function(done){
        situation.caused(situation_2, done);
      });

      test('as the effect', function(done){
        situation.because(situation_2, done);
      });

      test('shows relationships', function(done){
        situation.relationships(function(err, res){
          should.not.exist(err);
          should.exist(res);
          res.should.be.an.instanceOf(Array);
          res.should.have.a.lengthOf(2);
          done();
        });
      });
    });
  });
});
