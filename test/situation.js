var should = require('should');

var cartography = require('../');
var Situation = cartography.models.Situation;

cartography.config.set({
  couchdb: cartography.config.get('couchdb_test')
});

var nano = require('../models/db').nano();
var database_name = cartography.config.get('couchdb').database;



suite('A Situation', function(){
  setup(function(done){
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

  teardown(function(done){
    nano.db.destroy(database_name, function(destroy_error, destroy_result){
      if (destroy_error){
        if (destroy_error.error != 'not_found') { throw destroy_error }
      }
      return done();
    })
  });

  suite('instantiated without an id', function(){
    var situation = new Situation();

    test('should return an instance of `Situation`', function(){
      situation.should.be.an.instanceOf(Situation);
    });

    test('should be of type "situation"', function(){
      situation.should.have.property('type', 'situation');
    });
  });

  suite('instantiated with an id', function(){
    var situation = new Situation('1234');

    test('should return an instance of `Situation`', function(){
      situation.should.be.an.instanceOf(Situation);
    });

    test('should should return an object with an `id`', function(){
      situation.should.have.property('id');
    });

    test('should be of type `situation`', function(){
      situation.should.have.property('type', 'situation');
    });
  });

  suite('when created', function(){
    var situation = new Situation();

    setup(function(done){
      situation.create(done);
    });

    teardown(function(done){
      situation.delete(done);
    });

    test('can be read', function(done){
      situation.read(done);
    });

    suite('and read', function(){
      var situation_body;

      setup(function(done){
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
      suite('title is changed', function(){
        var title_result;

        setup(function(done){
          situation.title('test', function(err, res){
            if (err) return done(err);
            title_result = res;
            return done();
          });
        });

        test('the `_id` of the change is returned', function(){
          title_result.should.be.an.instanceOf(Object);
          title_result.should.have.property('ok', true);
          title_result.should.have.property('id');
        });

        suite('and the situation is read', function(){
          var situation_body;

          setup(function(done){
            situation.read(function(err, res){
              if (err) return done(err);
              situation_body = res;
              return done();
            });
          });

          test('the change is reflected in the document body', function(){
            situation_body.should.have.property('title', 'test');
          });
        });
      });

      suite('description is changed', function(){
        var description_result;

        setup(function(done){
          situation.description('test', function(err, res){
            if (err) return done(err);
            description_result = res;
            return done();
          });
        });

        test('the `_id` of the change is returned', function(){
          description_result.should.be.an.instanceOf(Object);
          description_result.should.have.property('ok', true);
          description_result.should.have.property('id');
        });

        suite('and the situation is read', function(){
          var situation_body;

          setup(function(done){
            situation.read(function(err, res){
              if (err) return done(err);
              situation_body = res;
              return done();
            });
          });

          test('the change is reflected in the document body', function(){
            situation_body.should.have.property('description', 'test');
          });
        });
      });

      suite('period is changed', function(){
        var period_result;

        setup(function(done){
          situation.period('test', function(err, res){
            if (err) return done(err);
            period_result = res;
            return done();
          });
        });

        test('the `_id` of the change is returned', function(){
          period_result.should.be.an.instanceOf(Object);
          period_result.should.have.property('ok', true);
          period_result.should.have.property('id');
        });

        suite('and the situation is read', function(){
          var situation_body;

          setup(function(done){
            situation.read(function(err, res){
              if (err) return done(err);
              situation_body = res;
              return done();
            });
          });

          test('the change is reflected in the document body', function(){
            situation_body.should.have.property('period', 'test');
          });
        });
      });

      suite('location is changed', function(){
        var location_result;

        setup(function(done){
          situation.location('test', function(err, res){
            if (err) return done(err);
            location_result = res;
            return done();
          });
        });

        test('the `_id` of the change is returned', function(){
          location_result.should.be.an.instanceOf(Object);
          location_result.should.have.property('ok', true);
          location_result.should.have.property('id');
        });

        suite('and the situation is read', function(){
          var situation_body;

          setup(function(done){
            situation.read(function(err, res){
              if (err) return done(err);
              situation_body = res;
              return done();
            });
          });

          test('the change is reflected in the document body', function(){
            situation_body.should.have.property('location', 'test');
          });
        });
      });
    });

    suite('and it\'s', function(){
      suite('marked', function(){
        var mark_result;

        setup(function(done){
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

          setup(function(done){
            situation.read(function(err, res){
              if (err) return done(err);
              situation_body = res;
              return done();
            });
          });

          test('the change is reflected in the document body', function(){
            situation_body.should.have.property('marked');
            situation_body.marked.should.have.property('stupid');
          });

          suite('and unmarked', function(){
            var change_result;

            setup(function(done){
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
    
              setup(function(done){
                situation.read(function(err, res){
                  if (err) return done(err);
                  situation_body = res;
                  return done();
                });
              });
    
              test('the change is reflected in the document body', function(){
                situation_body.marked.should.be.empty;
              });
            });
          });
        });
      });

      suite('tagged', function(){
        var tag_result;

        setup(function(done){
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

          setup(function(done){
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

            setup(function(done){
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

              setup(function(done){
                situation.read(function(err, res){
                  if (err) return done(err);
                  situation_body = res;
                  return done();
                });
              });

              test('the change is reflected in the document body', function(){
                situation_body.tags.should.be.empty;
              });
            });

          });
        });
      });
    });
  });
});
