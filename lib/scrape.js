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
	.then(createTempFlags)
	.then(flags => {
			filterOutOldFlags(flags)
				.then(storeFlags)
				.then(() => filterOutOldImages(flags)
											.then(storeImages));
		})
	.catch(err => {
		console.log(err);
		console.log(err.stack);
	});
	
function getFirstPage() {
	console.log('Task 1 of 6: Initializing');
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
	console.log('Task 2 of 6: Fetching basic flag meta-data');
	
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
	
	function push(startIndex) {
		return queue.add(() => requestFlagsPage(startIndex).then(progressBar.tick));
	}
}

function createTempFlags(flagPages) {
	var flagElements = flagPages.map(getFlagElements);
	flagElements = flatten(flagElements)
	console.log(`${flagElements.length} flags found`);
	return flagElements.map(createTempFlag);
}

function createTempFlag(flagElement) {
	var flagAnchor = cheerio.load(flagElement)('a.link-block');
	var href = flagAnchor.attr('href');
	var img = flagAnchor.children('div.flag-image-wrap').children('img');
	var src = img.attr('src');

	//bare minimum fields
	var flag = {
		href: href,
		meta: href.substring(href.lastIndexOf('/') + 1) + '.json',
		img: src.substring(src.lastIndexOf('/') + 1)
	};

	//title
	var title = flagAnchor.children('p').children('.flag-title').text().trim();
	if (title) flag.title = title;

	//author
	var authorName = flagAnchor.children('p').children('.flag-submitter').text().trim();
	if(authorName) flag.author = authorName;
	
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

function filterOutOldFlags(flags) {
	console.log('Task 3 of 5: Filtering out existing flags');
	
	return !fs.existsSync(metaPath)
		? flags
		: fs.readdir(metaPath)
				.then(files => flags.filter(f => files.indexOf(f.meta) == -1));
}

function storeFlags(flags) {
	console.log(util.format('Task 4 of 6: Storing meta-data for %s new flags', flags.length));
	
	var progressBar = createProgressBar(flags.length);
	var queue = new Queue(concurrencyLimit);
	return Promise.all(flags.map(push));
	
	function push(flag) {
		return queue.add(() => getFlagToStore(flag));
	}

	function getFlagToStore(flag) {
		return getFlagDetailsPage(flag.href)
			.then(addFlagDetails)
			.then(storeFlag)
			.then(progressBar.tick);
		
		function addFlagDetails(flagDetails) {
			//author place
			var place = flagDetails('.designed-by').text().trim().replace(flag.author, '');
			var indexOfFrom = place.indexOf('from');
			place = indexOfFrom > -1 ? place.substring(indexOfFrom + 4).trim() : '';
			if(place) {
				author = {place: place};
				if(flag.author) author.name = flag.author;
				flag.author = author;
			}

			//story
			var story = flagDetails('.flag-story').text().trim();
			if(story) flag.story = flagDetails('.flag-story').text().trim();

			return flag;
		}
	}
}

function filterOutOldImages(flags) {
	console.log(util.format('Task 5 of 6: Filtering out existing images', flags.length));
	
	return !fs.existsSync(imgPath)
		? flags
		: fs.readdir(imgPath)
				.then(files => flags.filter(f => files.indexOf(f.img) == -1));
}

function storeImages(flags) {
	console.log(util.format('Task 6 of 6: Storing %s new images', flags.length));
	
	var queue =  new Queue(concurrencyLimit);
	var progressBar = createProgressBar(flags.length);
	
	return Promise.all(flags.map(push));

	function push(flag) {
		return queue.add(() => storeImage(flag.img).then(progressBar.tick));
	}
}

function storeImage(filename) {
	var url = URL.resolve(baseUrl, imgSrcPath);
	url = URL.resolve(url, filename);
	var result = request(url);
	result.pipe(fs.createWriteStream(path.join(imgPath, filename)));
	return result;
}

function getFlagDetailsPage(href) {
	var url = URL.resolve(baseUrl, href);
	return request(url).then(cheerio.load)
}
	
function storeFlag(flag) {
	var filePath = path.join(metaPath, flag.meta);
	var content = JSON.stringify(flag, ['img','title','author','name','place','story','tags']);
	return fs.writeFile(filePath, content, "utf8");
}
