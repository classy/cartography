#!/usr/local/bin/node

var _ = require('lodash');
var repl = require("repl");
var context = repl.start("> ").context;

carto = require('./');

context = _.extend(context, carto.models);
context.carto = carto;
