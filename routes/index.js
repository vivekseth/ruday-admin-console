var request = require('request');
var fs = require('fs');

var messages = {
	'successPushNotification' : 'Successfully sent Push Notification: ',
	'errorPushNotification' : 'Error sending Push Notification. Details: ',
	'successFileUpload': 'Successfully uploaded file: ',
	'errorFileUpload': 'Error sending push notification. Details: ',
};

var saveUploadedFile = function(targetPath, tempPath, failure, success) {
	 fs.rename(tempPath, targetPath, function(err) {
        if (err) {
        	failure(err);
        } else {
        	// delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
	        fs.unlink(tempPath, function() {
	            if (err) {
	            	failure(err);
	            } else {
	            	success();
	            }
	        });
        }
    });
}

// returns Route Handler
var acceptFileUploadRoute = function(fileFormName, fileServerName) {
	return function(req, res) {
		console.log(req.user);
		var tmp_path = req['files'][fileFormName]['path'];
		var file_name = fileServerName;
		var target_path = './public/data/' + file_name;

		saveUploadedFile(target_path, tmp_path, function(err) {
			redirectToConsole(res, messages['errorFileUpload'] + err);
		}, function(){
			redirectToConsole(res, messages['successFileUpload'] + file_name);
		});
	};
}

var redirectToConsole = function(res, message) {
	res.redirect('/console?message='+encodeURIComponent(message));
}



/*
 * GET console
 */
exports.index = function(req, res){
	console.log(req.query);
	res.render('index', { title: 'Rutgers Day Admin Console', message: req.query.message });
};

/*
 * GET login form
 */
exports.loginForm = function(req, res){
	console.log(req.user);
	res.render('login');
};

/*
 * POST push notification
 */
exports.pushNotification = function(req, res){
	console.log(req.user);
	var text = req['body']['push-notification-text'];
	var options = {
		url: 'https://api.parse.com/1/push',
		headers: {
			'Content-Type': 'application/json',
			'X-Parse-Application-Id': 'L4hwGiUpzXJNOuK3560BFS4ZFYe2AcH9hYO6A9OQ',
			'X-Parse-REST-API-Key': 'zXT7vKWjF3DcOd4zE147zvpfRH8lBxkQCEzAF6my'
		},
		json: {
			"channels": ["global"], 
			"data": {
    			"alert": text,
    			"sound": "default"
    		}
    	}
	};

	request.post(options, function (error, response, body) {
		if (body['result'] && body['result'] == true) {
			redirectToConsole(res, messages['successPushNotification'] + text);
		} else {
			redirectToConsole(res, messages['errorPushNotification'] + JSON.stringify(body));
		}
	});
};

/*
 * POST CSV File Upload
 */
exports.acceptFileUploadRoute = acceptFileUploadRoute;