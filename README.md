Cartography
===============================================================================

A low-level library that handles situations, their causal relationships, and
histories.

This library is a dependency of Causemap, which extends Cartography and adds
other features.



Dependencies
-------------------------------------------------------------------------------

- Access to a CouchDB
- Node.js



Installation
-------------------------------------------------------------------------------

```bash
npm install
```



Example
-------------------------------------------------------------------------------

```javascript
var cartography = require('cartography');

var Situation = cartography.models.Situation;
var Relationship = cartography.models.Relationship;

cartography.config.set({
  couchdb: {
    host: "localhost",
    database: "cartography"
  }
});



var global_warming = new Situation();

global_warming.create(console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d00599c',
//   rev: '1-e9d4bfdd8fed85f5b0f76875e5c877b8' }

global_warming.title('Global Warming', console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d005c6d',
//   rev: '1-e2daea3e47f3a04641f1c2e1d2f8b82c' }



var greenhouse_gasses = new Situation();

greenhouse_gasses.create(console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d006adb',
//   rev: '1-656653eecb0375b75dbba2c1afde00c3' }

greenhoust_gasses.title('Greenhouse Gasses in the Atmosphere', console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d006bb0',
//   rev: '1-6fc199d68bf98f4a383b7d02f77b4d50' }


greenhouse_gasses.caused(global_warming, console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d007452',
//   rev: '1-e21fb71c491a14822f96d894384adaec' }



// The `id` from the last operation is the id of the newly created
// relationship.
var greenhouse_gasses_cause_global_warming = new Relationship(
  '514d5202e601ef23aa661e605d007452'
);



greenhouse_gasses_cause_global_warming.summarize(console.log);
// > null { _id: '514d5202e601ef23aa661e605d007452',
//   _rev: '1-e21fb71c491a14822f96d894384adaec',
//   cause:
//    { _id: '514d5202e601ef23aa661e605d006adb',
//      title: 'Greenhouse Gasses in the Atmosphere',
//      location: undefined,
//      period: undefined,
//      alias: undefined },
//   effect:
//    { _id: '514d5202e601ef23aa661e605d00599c',
//      title: 'Global Warming',
//      location: undefined,
//      period: undefined,
//      alias: undefined },
//   revisable: true,
//   creation_date: 1384291766745,
//   immutable: true,
//   type: 'relationship' }

```



Purpose
-------------------------------------------------------------------------------

The purpose of this module is to provide a low-level interface for manipulating
Causemap objects; Situations, Relationships and their changes.


### Objectives

- Provide the ability to create, read, update and delete (CRUD) the following
  basic Causemap structures:
    - Situations
    - Relationships
- Keep history: keep a history of all changes to Situations and Relationships.
  This is so that changes can be reviewed and disputed if necessary. No data
  regarding Situations or Relationships should ever be truly lost unless either
  of them are explicitely deleted.



License
-------------------------------------------------------------------------------

Copyright © 2013 Classy Applications

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
