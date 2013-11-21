Cartography
===============================================================================

A low-level library that handles situations, their causal relationships, and
the histories of both.

This library is a dependency of Causemap, which extends Cartography and adds
other features.



Dependencies
-------------------------------------------------------------------------------

- Access to a CouchDB
- Node.js



Installation
-------------------------------------------------------------------------------

From [source](https://github.com/classy/cartography):

```bash
npm install
```

Then install the CouchDB design documents:

```javascript
var cartography = require('cartography');
cartography.config.set({
  couchdb: {
    host: "http://username:password@localhost:5984",
    database: "cartography"
  }
});

cartography.install(console.log);
```



Testing
-------------------------------------------------------------------------------

```bash
npm test
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

global_warming.create(function(creation_error, creation_result){
  return console.log(creation_result);
});
// > { ok: true,
//   id: '514d5202e601ef23aa661e605d00599c',
//   rev: '1-e9d4bfdd8fed85f5b0f76875e5c877b8' }

global_warming.title('Global Warming', function(change_error, change_result){
  return console.log(change_result);
});
// > { ok: true,
//   id: '514d5202e601ef23aa661e605d005c6d',
//   rev: '1-e2daea3e47f3a04641f1c2e1d2f8b82c' }



var greenhouse_gasses = new Situation();

greenhouse_gasses.create(function(creation_error, creation_result){
  return console.log(creation_result);
});
// > { ok: true,
//   id: '514d5202e601ef23aa661e605d006adb',
//   rev: '1-656653eecb0375b75dbba2c1afde00c3' }

greenhoust_gasses.title('Greenhouse Gasses in the Atmosphere', function(
  change_error,
  change_result
){
  return console.log(change_result);
});
// > { ok: true,
//   id: '514d5202e601ef23aa661e605d006bb0',
//   rev: '1-6fc199d68bf98f4a383b7d02f77b4d50' }


greenhouse_gasses.caused(global_warming, function(
  relationship_error, 
  relationship_result
){
  return console.log(relationship_result);
});
// > { ok: true,
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


Tutorial
-------------------------------------------------------------------------------

Configure the [CouchDB](http://couchdb.apache.org/) host and database name for
cartography to use:

```javascript
var cartography = require('cartography');

cartography.config.set('couchdb', {
  host: 'http://username:passphrase@localhost:5984', 
  database: 'cartography'
});
```

Cartography configurations can be accessed using `cartography.config.get` from
anywhere:

```javascript
console.log(cartography.config.get('couchdb'));
// { host: 'http://username:passphrase@localhost:5984',
//   database: 'cartography' }
```

If you don't provide a key, `get` will return all configurations:

```javascript
console.log(cartography.config.get());
// { couchdb:
//   { host: 'http://jeff:sbrooden@localhost:5984',
//     database: 'derp' } }
```

Now create a new `Situation`:

```javascript
var Situation = cartography.models.Situation

var bitten_by_a_dog = new Situation();
bitten_by_a_dog.create(console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d00de52',
//   rev: '1-94825a79a389af9811646e79b7fcd92f' }
```

The new situation, `bitten_by_a_dog` has been saved to the couchdb database.
Let's read it to see what we've got:

```javascript
bitten_by_a_dog.read(console.log);
// > null { _id: '514d5202e601ef23aa661e605d00de52',
//   _rev: '1-94825a79a389af9811646e79b7fcd92f',
//   revisable: true,
//   creation_date: 1384457963498,
//   immutable: true,
//   type: 'situation' }
```

By passing `console.log` as the callback to `read`, we have all of the
variables passed to it printed to the screen. The first argument value printed
is `null`, which means that there was no error in reading the situation. Had
there been one, the first argument passed to `console.log` would have been the
error. 

The second value printed by the callback is the new situation's document body. This object is interesting for the following reasons:

- It has properties generated by the database:
    - `_id`: CouchDB will add an `_id` to any document that doesn't have one
      already. By default, the `_id` generated by CouchDB is a 
      [UUID](http://en.wikipedia.org/wiki/Universally_unique_identifier), which
      means that a new `_id` will never collide with an existing one.
    - `_rev`: a CouchDB document's revision number. This is used for keeping
      track of document versions in a distributed environment. It isn't used in
      this module, but it is essential for horizontal scaling.
- It has properties generated by Cartography:
    - `type`: All Cartography models have this field. Its value is a string
      representing indicating its type.
    - `creation_date`: Its value is the result of `(new Date()).getTime()`, or,
      the number of miliseconds since
      [EPOCH](http://en.wikipedia.org/wiki/Epoch_(reference_date)) at the time 
      the document was first committed to the database.
    - `immutable`: No direct changes to the CouchDB document may be
      made. Where present in a Cartography-generated document, its value
      should be `true` as an indication that this document should not be
      updated in CouchdB directly. The reason for this is explained later.
    - `revisable`: This Cartography document should be changed incrementally.
      `Change` documents that refer to this one should be made to alter its
      fields and values.

Cartography is designed to maintain the history of `Situation` and
`Relationship`objects. It does this by creating `Change` documents for each
individual change that's made to a `Situation` or `Relationship`. Let's change
our situation's title:

```javascript
bitten_by_a_dog.title('I Was Bitten By a Doge', console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d00f458',
//   rev: '1-40877d02f7709abdbb49d10fc9a2973c' }
```

The `id` and `rev` returned in the callback as the result are the `_id` and
`_rev` of the newly created `Change` document for our new situation's title.
Let's have a see at what the new `Change` looks like in the database:

```javascript
var Change = cartography.models.Change;

var new_title = new Change('514d5202e601ef23aa661e605d00f458');
new_title.read(console.log);
// > null { _id: '514d5202e601ef23aa661e605d00f458',
//   _rev: '1-40877d02f7709abdbb49d10fc9a2973c',
//   changed:
//    { doc: { _id: '514d5202e601ef23aa661e605d00de52', type: 'situation' },
//      field: { name: 'title', to: 'I Was Bitten by a Doge' } },
//   creation_date: 1384490982792,
//   immutable: true,
//   type: 'change' }
```

The `Change` document contains many of the same fields we saw in the
`Situation` document, though there are some differences:

- A Change document is `immutable`, but not `revisable`. This means that once
  the change is stored, it cannot be updated in CouchDB, and it cannot be
  revised by creating other `Change` documents.
- It has a field called `changed` which contains details about the revisable
  `doc` that was changed, what the `field`'s `name` is, and what its value in
  that document was changed `to`.

Let's check the situation, now that we've set its `title` with this `Change`:

```javascript
bitten_by_a_dog.read(console.log);
// > null { _id: '514d5202e601ef23aa661e605d00de52',
//   _rev: '1-94825a79a389af9811646e79b7fcd92f',
//   revisable: true,
//   creation_date: 1384457963498,
//   immutable: true,
//   type: 'situation',
//   title: 'I Was Bitten by a Doge' }
```

Great. We see the change we made with `bitten_by_a_dog.title` reflected in the
Cartography document, but there appears to be a typo: "Doge" should be "Dog".
Let's correct it:

```javascript
bitten_by_a_dog.title("I Was Bitten by a Dog", console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d00f9a1',
//   rev: '1-0c1b87fd1d9892479222c671b7f9c6f5' }

bitten_by_a_dog.read(console.log);
// > null { _id: '514d5202e601ef23aa661e605d00de52',
//   _rev: '1-94825a79a389af9811646e79b7fcd92f',
//   revisable: true,
//   creation_date: 1384457963498,
//   immutable: true,
//   type: 'situation',
//   title: 'I Was Bitten by a Dog' }
```

The title is now typo-free. Cartography uses the power of CouchDB's views to
get the latest changes to a revisable document, such as a Situation, then
builds the composite that is returned by the `read` method. Wow.

Add some details and a description:

```javascript
bitten_by_a_dog.period('Friday November 15th at 11am', console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d00fbd6',
//   rev: '1-ff3a2e8a90d90499a835d056084fb5a6' }

bitten_by_a_doc.location('Montreal, QC', console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d0107ec',
//   rev: '1-95604fdb1879edd9f787925ae388f17e' }

bitten_by_a_dog.description(
  "This stupid dog bit me.", 
  console.log
)
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d010a49',
//   rev: '1-b3cae7a25fcf99ab51fe1891c1fc42cf' }

bitten_by_a_dog.read(console.log)
// > null { _id: '514d5202e601ef23aa661e605d00de52',
//   _rev: '1-94825a79a389af9811646e79b7fcd92f',
//   revisable: true,
//   creation_date: 1384457963498,
//   immutable: true,
//   type: 'situation',
//   description: 'This stupid dog bit me.',
//   location: 'Montreal, QC',
//   period: 'Friday November 15th at 11am',
//   title: 'I Was Bitten by a Dog' }
```

But what caused this situation? The cause for the `Situation` `bitten_by_a_dog`
is of course, another situation:

```javascript
var ate_dogs_food = new Situation();

ate_dogs_food.create(console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d011860',
//   rev: '1-fa9983ebf1c6749133c00e9a1a264706' }

ate_dogs_food.title("I Ate Some Dog's Food", console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d011cb7',
//   rev: '1-450587c4b93e053b92bd5ac487ea07b5' }
```

Now that the `Situation` `ate_dogs_food` has been stored, it can be set as a
cause for `bitten_by_a_dog`:

```javascript
bitten_by_dog.because(ate_dogs_food, console.log);
// > null { ok: true,
//   id: '514d5202e601ef23aa661e605d011e0e',
//   rev: '1-ad947efac4b06b9ded8d8ac5f2aa38cc' }
```

The response from the `because` method contains the `id` and `rev` of the newly
created `Relationship` document:

```javascript
var Relationship = cartography.models.Relationship;

var bitten_by_dog_because_i_ate_its_food = new Relationship(
  '514d5202e601ef23aa661e605d011e0e'
)

bitten_by_dog_because_i_ate_its_food.read(console.log);
// > null { _id: '514d5202e601ef23aa661e605d011e0e',
//   _rev: '1-ad947efac4b06b9ded8d8ac5f2aa38cc',
//   cause: { _id: '514d5202e601ef23aa661e605d011860' },
//   effect: { _id: '514d5202e601ef23aa661e605d00de52' },
//   revisable: true,
//   creation_date: 1384546572729,
//   immutable: true,
//   type: 'relationship' }
```

This is the result of a `read` operation on a `Relationship`. Here is what's
new:

- `cause` and `effect` fields contain an object with an `_id` corresponding to
  the `Situation` documents that are the cause and effect in the relationship.

This Relationship can be seen in the results of the `bitten_by_a_dog.causes`:

```javascript
bitten_by_a_dog.causes(console.log);
// > null [ { _id: '514d5202e601ef23aa661e605d011e0e',
//     _rev: '1-ad947efac4b06b9ded8d8ac5f2aa38cc',
//     cause: { _id: '514d5202e601ef23aa661e605d011860' },
//     effect: { _id: '514d5202e601ef23aa661e605d00de52' },
//     revisable: true,
//     creation_date: 1384546572729,
//     immutable: true,
//     type: 'relationship' } ]
```

The same results can be seen with `ate_dogs_food.effects`.


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
