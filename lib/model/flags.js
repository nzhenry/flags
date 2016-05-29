'use strict'

let db = require('../db');
let flags = () => db('flags');

module.exports = exports = {
  one: x => { var result = flags()
    .select('flags.id','flags.name', 'flags.filename', 'authors.name as author', 'places.name as from', 'flags.story')
    .leftJoin('authors', 'authors.id', 'flags.author')
    .leftJoin('places', 'places.id', 'authors.place')
    .where(typeof x != 'string' ? 'flags.id' : x.match(/^\d*$/) ? 'flags.id' : 'flags.filename', x)
    console.log(result.toString());
    return result.then(first);
  }
}

exports.many = function(args) {
  let query = flags()
    .select('flags.id','flags.name', 'flags.filename', 'authors.name as author_name')
    .leftJoin('authors', 'authors.id', 'flags.author')
    .leftJoin('places', 'places.id', 'authors.place')
    .leftJoin('flagsearch', 'flagsearch.flag', 'flags.id')
    .leftJoin('flagtags', 'flagtags.flag', 'flags.id')
    .leftJoin('tags', 'tags.id', 'flagtags.tag')
    .groupBy('flags.id', 'authors.id')
    .orderBy(
      args.orderby ? args.orderby : 'id',
      args.direction ? args.direction : 'asc')
    .limit(args.limit ? args.limit : 10)
    .offset(args.offset ? args.offset : 0);
  if(args.place) {
    query = query.where('places.name', args.place);
  }
  if(args.search) {
    let search = args.search.split(' ').join(' & ');
    query = query.whereRaw("flagsearch.text::tsvector @@ to_tsquery('" + search + "')");
  }
  if(args.tags) {
    query = query.havingRaw("string_agg(tags.name, ' ') @@ '" + args.tags + "'");
  }
  return query;
}

function first(x) {
  return x[0];
}
