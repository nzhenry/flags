var request = require('request-promise');
var cheerio = require('cheerio');
var fs = require('fs-promise');
var URL = require('url');
var path = require('path');
var util = require('util');
var ProgressBar = require('progress');
var Queue = require('promise-queue');

var concurrencyLimit = 10;
var baseUrl = 'https://www.govt.nz/';
var imgSrcPath = 'assets/flags-designs/';
var imgPath = 'db/pics/';
var metaPath = 'db/meta/';
																
var flagQueue = new Queue(concurrencyLimit);

var flagPageTemplatePath = 'browse/engaging-with-government/the-nz-flag-your-chance-to-decide/gallery/?sort=latest&start=%s';

fs.mkdirs(metaPath);
fs.mkdirs(imgPath);

getFirstPage()
	.then(getRemainingPages)
	.then(filterOutOldFlags)
	.then(storeFlags)
	.catch(err => {
		console.log(err);
		console.log(err.stack);
	});
	
function getFirstPage() {
	console.log('Task 1 of 5: Initializing');
	return requestFlagsPage(0);
}

function requestFlagsPage(startIndex) {
	var path = util.format(flagPageTemplatePath, startIndex);
	var url = URL.resolve(baseUrl, path);
	return request(url).then(cheerio.load);
}

function getGalleryCount($) {
	$('.gallery-count .little').remove();
	return parseInt($('.gallery-count').text().trim());
}

function getFlagElements($) {
	return $('.flag').toArray();
}

function getRemainingPages($) {
	console.log('Task 2 of 5: Fetching basic flag meta-data');
	
	var queue =  new Queue(concurrencyLimit);
	
	var galleryCount = getGalleryCount($);
	var flagsPerPage = getFlagElements($).length;
	var numberOfPages = Math.ceil(galleryCount / flagsPerPage);
	
	var progressBar = createProgressBar(numberOfPages);
	progressBar.tick();
	
	//create an array of start indices and map that to an array of requests/promises
	var startIndices = Array.apply(null, Array(numberOfPages-1)).map((_, i) => (i+1) * flagsPerPage);
	var promises = startIndices.map(push);
	
	return Promise.all(promises)
		.then(flagPages => [$].concat(flagPages))
		.then(flagPages => flagPages.map(getFlagElements))
		.then(flatten);
	
	function push(startIndex) {
		return queue.add(() => requestFlagsPage(startIndex).then(progressBar.tick));
	}
}

function flatten(arrays) {
	return [].concat.apply([], arrays);
}

function createProgressBar(total) {
	var bar = new ProgressBar(':percent, ETA: :eta seconds', { total: total });
	return {
		bar: bar,
		tick: x => { bar.tick(); return x }
	}
}

function filterOutOldFlags(flagElements) {
	console.log('Task 3 of 5: Filtering out existing flags');
	
	return !fs.existsSync(metaPath)
		? flagElements
		: fs.readdir(metaPath)
				.then(files => files.filter(f => f.endsWith('.json'))
														.map(f => f.slice(0,-5)))
				.then(ids => flagElements.filter(f => ids.indexOf(getFlagId(f)) == -1));
}

function getFlagId(flagElement) {
	var href = getFlagAnchor(flagElement).attr('href');
	return href.substring(href.lastIndexOf('/') + 1);
}

function getFlagAnchor(flagElement) {
	var $ = cheerio.load(flagElement);
	return $('a');
}

function storeFlags(flagElements) {
	console.log(util.format('Task 4 of 5: Storing meta-data for %s new flags', flagElements.length));
	
	var progressBar = createProgressBar(flagElements.length);
	var queue = new Queue(concurrencyLimit);
	return Promise.all(flagElements.map(push))
		.then(storeFlagImages);
	
	function push(flagElement) {
		return queue.add(() => getFlag(flagElement));
	}

	function getFlag(flagElement) {
		var flagAnchor = getFlagAnchor(flagElement);
		
		return getFlagDetailsPage(flagAnchor)
			.then(flagDetails => buildFlag(flagAnchor, flagDetails))
			.then(storeFlag)
			.then(progressBar.tick);
	}

	function getFlagDetailsPage(flagAnchor) {
		var url = URL.resolve(baseUrl, flagAnchor.attr('href'));
		return request(url).then(cheerio.load)
	}

	function buildFlag(flagAnchor, flagDetails) {
		var href = flagAnchor.attr('href');
		var img = flagAnchor.children('div.flag-image-wrap').children('img');
		var src = img.attr('src');
	
		//bare minimum fields
		var flag = {
			id: href.substring(href.lastIndexOf('/') + 1),
			filename: src.substring(src.lastIndexOf('/') + 1)
		};

		//title
		var title = flagAnchor.children('p').children('.flag-title').text().trim();
		if (title) flag.title = title;

		//author name
		var authorName = flagAnchor.children('p').children('.flag-submitter').text().trim();

		//author place
		var place = flagDetails('.designed-by').text().trim().replace(authorName, '');
		var indexOfFrom = place.indexOf('from');
		place = indexOfFrom > -1 ? place.substring(indexOfFrom + 4).trim() : '';

		//author
		if(authorName || place) {
			flag.author = {};
			if(authorName) flag.author.name = authorName;
			if(place) flag.author.place = place;
		}

		//story
		var story = flagDetails('.flag-story').text().trim();
		if(story) flag.story = flagDetails('.flag-story').text().trim();

		//tags
		var alt = img.attr('alt').trim();
		var tagIndex = alt.lastIndexOf('tagged with:');
		if(tagIndex > -1) {
			if(alt.endsWith('.')) alt = alt.slice(0,-1);
			flag.tags = alt.substring(tagIndex + 13).split(',').map(function(tag) {
				return tag.trim()
			});
		}

		return flag;
	}
	
	function storeFlag(flag) {
		var filePath = path.join(metaPath, flag.id + ".json");
		return fs.writeFile(filePath, JSON.stringify(flag), "utf8").then(() => flag);
	}
	
	function storeFlagImages(flags) {
		console.log(util.format('Task 5 of 5: Storing %s new flag images', flags.length));
		
		var queue =  new Queue(concurrencyLimit);
		var progressBar = createProgressBar(flags.length);
		
		return Promise.all(flags.map(push));
	
		function push(flag) {
			return queue.add(() => getImage(flag.filename).then(progressBar.tick));
		}
	}

	function getImage(filename) {
		var url = URL.resolve(baseUrl, imgSrcPath);
		url = URL.resolve(url, filename);
		var result = request(url);
		result.pipe(fs.createWriteStream(path.join(imgPath, filename)));
		return result;
	}
}
