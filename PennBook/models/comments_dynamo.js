
/*
This file defines the schema for the comments table. The hash key is a concat of the poster and timestamp of the orginial post.
This is unique since a given person can only post once at a given time. Our sort key is the timestamp of the comment
*/

var dynamo = require('dynamodb');
var Joi = require('joi');
dynamo.AWS.config.loadFromPath('./config.json');

var comments = dynamo.define('comments', {
	hashKey: 'threadID',

	timestamps: true,
	rangeKey: 'createdAt',

	schema: {
		threadID: Joi.string(),
		message: Joi.string(),
		posterID: Joi.string(),
		time: Joi.string()
	}
});

var initialize = function(callback) {
	console.log("initializing comments database table");
	dynamo.createTables({
		'comments': {readCapacity: 5, writeCapacity: 10}
	}, function(err) {
		if (err) {
			console.log('Error creating comments tables: '+err);
		} else {
			console.log('Comments tables have been created');
		}
	});
};

var createEntry = function(threadID_input, message_input, poster_input, time_input, callback) {
	comments.create({
		threadID: threadID_input,
		message: message_input,
		posterID: poster_input,
		time: time_input
	});
	callback(null, 'Success');
};

var getByID = function(threadID, callback) {
	comments.query(threadID).exec(function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};

var db_stuff = {
	init: initialize,
	put: createEntry,
	get_comments: getByID
};

module.exports = db_stuff;