#!/usr/local/bin/node

var carto = require('./');
var async = require('async');



var protests;
var law;
var protests_cause_law;
var casserole;
var law_causes_casserole;


async.series([
  function(cb){
    protests = new carto.models.Situation();
    protests.create(cb);
  },
  function(cb){
    protests.title('Québec Student Protests', cb);
  },
  function(cb){
    protests.alias('quebec-student-protests', cb);
  },
  function(cb){
    protests.location('Montréal, QC', cb);
  },
  function(cb){
    protests.period('Summer 2012', cb);
  },
  function(cb){
    protests.tag('Maple Spring', cb);
  },
  function(cb){
    protests.mark('controversial', cb);
  },
  function(cb){
    law = new carto.models.Situation();
    law.create(cb);
  },
  function(cb){
    law.title('National Assembly of Quebec Passes Bill 78', cb);
  },
  function(cb){
    law.alias('national-assembly-of-quebec-passes-bill-78', cb);
  },
  function(cb){
    law.period('May 18th, 2012', cb);
  },
  function(cb){
    law.location('Québec', cb);
  },
  function(cb){
    protests_cause_law = new carto.models.Relationship();
    protests_cause_law.create({
      cause: { _id: protests.id },
      effect: { _id: law.id }
    }, cb);
  },
  function(cb){
    protests_cause_law.strengthen(cb);
  },
  function(cb){
    protests_cause_law.description('The law restricts protest or picketing on or near university grounds. The law further requires that organizers of a protest, consisting of 50 or more people in a public venue anywhere in Quebec, submit their proposed venue and/or route to the relevant police for approval.', cb)
  },
  function(cb){
    casserole = new carto.models.Situation();
    casserole.create(cb);
  },
  function(cb){
    casserole.title('Casserole Protests', cb);
  },
  function(cb){
    casserole.alias('casserole-protests', {reason: 'catchy name'}, cb);
  },
  function(cb){
    casserole.location('Montreal, QC', cb);
  },
  function(cb){
    casserole.tag('Maple Spring', cb);
  },
  function(cb){
    casserole.description('Montreal residents banged on pots and pans in an act of defiance against the recently passed Law 78.', cb);
  },
  function(cb){
    law_causes_casserole = new carto.models.Relationship();
    law_causes_casserole.create({
      cause: {
        _id: law.id
      }, 
      effect: {
        _id: casserole.id
      }
    }, cb);
  },
  function(cb){
    law_causes_casserole.description("Casserole protests started just after the law was passed. Signs condemning law 78 could be seen.", cb);
  },
  function(cb){
    law_causes_casserole.weaken(cb);
  }
], function(async_err, async_result){
  if (async_err){ return console.error(async_err) }
  console.log('Sample data loaded.');
});
