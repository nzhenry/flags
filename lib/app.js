var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var Timespan = require('timespan');
var favicon = require('serve-favicon');

var site = require('../routes/site');
var api = require('../routes/api');
var auth = require('./auth');

module.exports = function() {

	var app = express();
		
	// view engine setup
	app.set('views', 'views');
	app.set('view engine', 'ejs');
  app.set('json spaces', 2);
	
  app.use(favicon(path.join(__dirname, '../resources/favicon.png')));
	app.use(express.static('public'));
	app.use('/dependencies', express.static('bower_components'));
	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(auth.init());
	app.use(auth.validateToken);

	app.use('/api/v1', api);
	app.use(site);

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});

	// error handlers

	// development error handler
	// will print stacktrace
	if (app.get('env') === 'development') {
		app.use(function(err, req, res, next) {
			res.status(err.status || 500);
			res.render('error', {
				message: err.message ? err.message : err.name,
				error: err
			});
		});
	}

	// production error handler
	// no stacktraces leaked to user
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message ? err.message : 'Whoops! Something went wrong.',
			error: {}
		});
	});
	
	return app;
}
