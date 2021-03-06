var request = require('request');
var fs = require('fs');

var messages = {
	'successPushNotification' : 'Successfully sent Push Notification: ',
	'errorPushNotification' : 'Error sending Push Notification. Details: ',
	'successFileUpload': 'Successfully uploaded file: ',
	'errorFileUpload': 'Error uploading file. Details: ',
};

var saveUploadedFile = function(targetPath, tempPath, failure, success) {
	console.log(targetPath, tempPath);
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
		console.log(req['files']);
		var size = req['files'][fileFormName]['size'];
		if (size > 0) {
			var tmp_path = req['files'][fileFormName]['path'];
			var file_name = fileServerName;
			var target_path = './public/data/' + file_name;

			saveUploadedFile(target_path, tmp_path, function(err) {
				redirectToConsole(res, messages['errorFileUpload'] + err);
			}, function(){
				redirectToConsole(res, messages['successFileUpload'] + file_name);
			});
		} else {
			redirectToConsole(res, messages['errorFileUpload'] + 'Cannot upload empty file.');
		}
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

	var ANDROID_ID = 'j6pp0B45WsQZMsLuJKWwPV3xs77g7D7AEfM5rNOb';
	var ANDROID_KEY = 'S704VvKRVZ6P52UJYYhE61TwDPWC3jCt3E8gnv5Z';

	var IOS_ID = 'L4hwGiUpzXJNOuK3560BFS4ZFYe2AcH9hYO6A9OQ';
	var IOS_KEY = 'zXT7vKWjF3DcOd4zE147zvpfRH8lBxkQCEzAF6my';

	sendPushNotification(ANDROID_ID, ANDROID_KEY, text, function(success, body) {
		if (success) {
			sendPushNotification(IOS_ID, IOS_KEY, text, function(success, body) {
				if (success) {
					redirectToConsole(res, messages['successPushNotification'] + text);
				} else {
					redirectToConsole(res, messages['errorPushNotification'] + JSON.stringify(body));
				}
			});
		} else {
			redirectToConsole(res, messages['errorPushNotification'] + JSON.stringify(body));
		}
	});
};


var sendPushNotification = function(appID, key, message, success) {
	var options = {
		url: 'https://api.parse.com/1/push',
		headers: {
			'Content-Type': 'application/json',
			'X-Parse-Application-Id': appID,
			'X-Parse-REST-API-Key': key
		},
		json: {
			"channels": ["global"], 
			"data": {
				"alert": message,
				"sound": "default",
				"title": "Rutgers Day"
			}
		}
	};

	request.post(options, function (error, response, body) {
		if (body && body['result'] && body['result'] == true) {
			if (success) {
				success(true, body);
			}
		} else {
			if (success) {
				success(false, body);
			}
		}
	});
}

/*
 * POST CSV File Upload
 */
exports.acceptFileUploadRoute = acceptFileUploadRoute;