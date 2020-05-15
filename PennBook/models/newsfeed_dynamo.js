
/*
This file defines the schema for the newsfeed table. The hash key is the recipientID (i.e. the person on whom's feed we want to show
the post). We chose this design decision since we felt it was better for scalability to do less work when loading the feeds than when adding
to them since users will likely load feeds much more often. The sort key is the timestamp created at.
*/

var dynamo = require('dynamodb');
var Joi = require('joi');
dynamo.AWS.config.loadFromPath('./config.json');

var newsfeed = dynamo.define('newsfeed', {
	hashKey: 'recipientID',

	timestamps: true,
	rangeKey: 'createdAt',

	schema: {
		recipientID: Joi.string(),
		message: Joi.string(),
		posterID: Joi.string(),
		time: Joi.string()
	}
});

var initialize = function(callback) {
	console.log("initializing newsfeed database table");
	dynamo.createTables({
		'newsfeed': {readCapacity: 5, writeCapacity: 10}
	}, function(err) {
		if (err) {
			console.log('Error creating newsfeed tables: '+err);
		} else {
			console.log('Newsfeed tables have been created');
		}
	})
};

var createEntry = function(recipientID_input, message_input, poster_input, time_input, callback) {
	newsfeed.create({
		recipientID: recipientID_input,
		message: message_input,
		posterID: poster_input,
		time: time_input
	});
	callback(null, 'Success');
};

var getByUsername = function(username, callback) {
	newsfeed.query(username).exec(function(err, data) {
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
	get_user: getByUsername
};

module.exports = db_stuff;