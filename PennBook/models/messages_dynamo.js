
/*
This file defines the schema for the messages table. The hash key is an alphabetically ordered concat of the users in the chat.
This is unique and allows us to store persistent group chats.
*/

var dynamo = require('dynamodb');
var Joi = require('joi');
dynamo.AWS.config.loadFromPath('./config.json');

var new_messages = dynamo.define('new_messages', {
	hashKey    : 'chatID',

	timestamps : true,
	rangeKey   : 'createdAt',

	schema : {
		chatID : Joi.string(),
		sender : Joi.string(),
		message_value : Joi.string()
	}
});
var init = function(callback) {
	console.log("initializing in messages_dynamo");
	dynamo.createTables({
		'new_messages' : {readCapacity : 5, writeCapacity : 10}
	}, function(err) {
		if(err) {
			console.log("ERROR CREATING TABLES");
		} else {
			console.log("TABLES HAVE BEEN CREATED");
		}
	})
};

var createMessage = function(chatIDs, message_vals, senders, callback) {
	new_messages.create({
		chatID : chatIDs, 
		sender : senders, 
		message_value : message_vals
	})
}

var getById = function(id, callback) {
	new_messages.query(id).exec(function(err, data) {
		if (err) {
			callback(err, null);
		} else {
			callback(null, data);
		}
	});
};

var db_stuff = {
	initialize : init,
	send_message: createMessage,
	get_messages: getById
};

module.exports = db_stuff;