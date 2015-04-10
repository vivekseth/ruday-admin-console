
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes/index');
var http = require('http');
var path = require('path');
var multer  = require('multer')
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;

var app = express();

// all environments
app.set('port', 5001);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.configure(function() {
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.methodOverride());

	app.use(express.static('public'));
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.session({ secret: 'keyboard cat' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);

  app.use(express.bodyParser({uploadDir:'./uploads'}));
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/** Authentication */

// Set up login
passport.use(new LocalStrategy(function(username, password, done) {
  	if (username === 'admin' && password === 'password') {
  		done(null, {'username': 'admin'});
  	} else {
  		done(null, false, { message: 'Incorrect password.' });	
  	}
  }
));
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Detect Authentication Status
function authenticatedEndpoint(req, res, next) {
	if (req.isAuthenticated()) {
		next();
	} else {
		res.redirect('/');
	}
}
function notAuthenticatedEndpoint(req, res, next) {
	if (req.isAuthenticated()) {
		res.redirect('/console');
	} else {
		next();
	}
}

/** Routes */

// If signed in, redirect user to console.
app.get('/', notAuthenticatedEndpoint, routes.loginForm);

// Handle login
app.get('/login', routes.loginForm);
app.post('/login', passport.authenticate('local', { 
	successRedirect: '/console',
	failureRedirect: '/login',
	failureFlash: false 
}));

// Logout
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Admin Console
app.get('/console', authenticatedEndpoint, routes.index);
app.post('/push', authenticatedEndpoint, routes.pushNotification);
app.post('/programs-csv', authenticatedEndpoint, routes.acceptFileUploadRoute('programs-csv', 'programs.csv'));
app.post('/performances-csv', authenticatedEndpoint, routes.acceptFileUploadRoute('performances-csv', 'performances.csv'));
app.post('/stages-csv', authenticatedEndpoint, routes.acceptFileUploadRoute('stages-csv', 'stages.csv'));
app.post('/other-csv', authenticatedEndpoint, routes.acceptFileUploadRoute('other-csv', 'other.csv'));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
