var fs = require('fs-promise');
var path = require('path');
var util = require('util');
var ProgressBar = require('progress');
var Queue = require('promise-queue');

var concurrencyLimit = 10;
var bar;
var metaPath = 'db/meta';

var db = require('./db');

prepare()
	.then(getFlags)
	.catch(err => {
		console.log(err);
		console.log(err.stack);
	})
	.then(db.destroy);

function prepare() {
	return Promise.all([
			db('tags').then(data => tags = data),
	 		db('places').then(data => places = data)
		]);
}
	
function getFlags() {
	var queue = new Queue(concurrencyLimit);
	
	return fs.readdir(metaPath).then(function(files){
		var flags = files.filter(function(f) {
			return f.endsWith('.json')
		});
		
		bar = new ProgressBar(':percent, ETA: :eta seconds', { total: flags.length });
		
		return Promise.all(flags.map(addToQueue));
		
		function addToQueue(flag) {
			return queue.add(() => processFlag(flag));
		}
	});
}

function processFlag(filename) {
	return fs.readFile(path.join(metaPath, filename), "utf-8")
		.then(JSON.parse)
		.then(sanitize)
		.then(readFlag);
}


function readFlag(flag) {
	return storeAuthor(flag.author)
					.then(storeFlag)
					.then(storeFlagTags)
					.then(reportProgress);
	
	function storeFlag(author) {
		var fields = {
			filename: flag.filename
		};
		if(flag.title) {
			fields.name = flag.title;
		}
		if(author) {
			fields.author = author.id;
		}
		if(flag.story) {
			fields.story = flag.story;
		}
		return db.upsert('flags', 'filename', fields)
			.then(x=>x.rows[0])
			.then(merge);
	}

	function merge(data) {
		flag.id = data.id;
		return flag;
	}
}

function reportProgress() {
	bar.tick();
}

function storeFlagTags(flag) {
	return flag.tags
					? Promise.all(flag.tags.map(processTag))
					: Promise.resolve();
					
	function processTag(tag) {
		return storeTag(tag)
						.then(storeFlagTag);
	}
	
	function storeFlagTag(tag) {
		return db.upsert('flagtags',['flag','tag'],{
			flag: flag.id,
			tag: tag.id
		}).then(x=>x.rows[0]);
	}
}

function storeAuthor(author) {
	return author
		? storePlace(author.place)
				.then(place => {
					return db.upsert('authors', ['name','place'], {
						name: author.name,
						place: place.id
					});
				}).then(x=>x.rows[0])
		: Promise.resolve();
}

function storePlace(name) {
	return storeLookup(places, 'places', name);
}

function storeTag(name) {
	return storeLookup(tags, 'tags', name);
}

function storeLookup(items, tableName, name) {
	if(!name) return;
	
	var item = items.find(x => x.name == name);
	
	return item
		? Promise.resolve(item)
		: db.upsert(tableName, 'name', {name: name})
				.then(x=>x.rows[0]);
}

function sanitize(x) {
	if(Array.isArray(x)) {
		return x.map(sanitize);
	}

	if(typeof x === 'string') {
		return x.replace(/'/g, "''");
	}
		
	if(typeof x === 'object') {
		var result = {};
		for(var attr in x) {
			result[attr] = sanitize(x[attr]);
		}
		return result;
	}
	
	return x;
}
