var keyvaluestore = require('../models/keyvaluestore.js');
var profiles_kvs_access = require('../models/users_kvs.js');
var posts_kvs_access = require('../models/posts_kvs.js');
var newsfeed_kvs = require('../models/newsfeed_dynamo.js');
var comments_kvs = require('../models/comments_dynamo.js');
var online_kvs_access = require('../models/online_kvs.js');
var async = require('async');

var profiles_kvs = new profiles_kvs_access('profiles');
var passwords_kvs = new keyvaluestore('passwords');
var posts_kvs = new posts_kvs_access('posts');
var online_kvs = new online_kvs_access('online');
profiles_kvs.init(function(err, data){});
passwords_kvs.init(function(err, data){});
posts_kvs.init(function(err, data){});
newsfeed_kvs.init(function(err, data){});
comments_kvs.init(function(err, data){});
online_kvs.init(function(err, data){});

var new_messages_access = require('../models/messages_dynamo.js');
new_messages_access.initialize(function(err, data) {
	console.log("INITIALIZING DYNAMO MESSAGES");
});

var addProfile = function(userName, value, callback) {
	profiles_kvs.put(userName, value, function(err, data) {
		if (err) {
			callback("Error adding entry: "+err, null);
		} else {
			callback(null, userName);
		}
	});
};

var getProfile = function(searchTerm, route_callbck){
  console.log('Looking up: ' + searchTerm);
  profiles_kvs.get(searchTerm, function (err, data) {
    if (err) {
      route_callbck("Lookup error: "+err, null);
    } else if (data == null) {
      route_callbck(null, null);
    } else {
      route_callbck(null, data[0]);
    }
  });
};

var updateProfile = function(username, obj, callback) {
	profiles_kvs.get(username, function(err, data) {
		if (err) {
      		callback("Lookup error: "+err, null);
    	} else if (data == null) {
      		callback(null, null);
    	} else {
    		var inx = data[0].inx;
    		console.log('username: '+username);
    		console.log('inx: '+ inx);
    		//data variable passed to update must be a JSON object with all the non-key and non-inx fields complete
    		profiles_kvs.update(username, inx, obj, function(err, data) {
    			if (err) {
      				callback("Lookup error: "+err, null);
    			} else if (data == null) {
      				callback(null, null);
    			} else {
    				callback(null, 'done');
    			}
    		});
    	}
	});
};

var getPassword = function(username, callback) {
	passwords_kvs.get(username, function(err, data) {
		if (err) {
			callback("Lookup error: "+ err, null);
		} else if (data == null) {
			callback(null, null);
		} else {
			callback(null, data[0].value);
		}
	});
};

var addUser = function(username, password, callback) {
	passwords_kvs.put(username, password, function(err, data) {
		if (err) {
			callback("Error adding entry: "+err, null);
		} else {
			callback(null, username);
		}
	});
};

//data must be javaScript object of form: {time: time, poster: poster, message: message} - time already converted to string
var addPost = function(wall_owner, data, callback) {
	posts_kvs.put(wall_owner, data, function(err, data) {
		if (err) {
			callback("Error adding entry: "+err, null);
		} else if (data == null) {
			callback(null, null);
		} else {
			callback(null, wall_owner);
		}
	});
};

//all inputs except the callback must be strings
var addNewsfeed = function(message, poster, time, callback) {
	profiles_kvs.get(poster, function (err, data) {
    	if (err) {
      		route_callbck("Lookup error: "+err, null);
    	} else if (data == null) {
      		route_callbck(null, null);
    	} else {
    		var friends = JSON.parse(data[0].friends);
    		async.forEach(friends, function(x, xcallback) {
    			newsfeed_kvs.put(x, message, poster, time, function(err1, data1) {
					if (err1) {
						xcallback();
					} else {
						xcallback();
					}
				});
    		}, function() {
    			callback(null, 'success');
    		});
    	}
    });
};

var getPosts = function(wall_owner, callback) {
	posts_kvs.get(wall_owner, function(err, data) {
		if (err) {
			callback("Lookup error: "+ err, null);
		} else if (data == null) {
			callback(null, null);
		} else {
			callback(null, data);
		}
	});
};

var getAllUsers = function(callback) {
	passwords_kvs.scanKeys(function(err, data) {
		if (err) {
			callback('Error adding entry: '+err, null);
		} else if (data == null) {
			callback(null, null);
		} else {
			callback(null, data);
		}
	});
};

var getNewsfeed = function(username, callback) {
	newsfeed_kvs.get_user(username, function(err, data) {
		if (err) {
			callback("Lookup error: "+ err, null);
		} else if (data == null) {
			callback(null, null);
		} else {
			callback(null, data);
		}
	});
	
};

var addComments = function(threadID, message, poster, time, callback) {
	comments_kvs.put(threadID, message, poster, time, function(err, data) {
		if (err) {
			callback('Error adding entry: '+err, null);
		} else {
			callback(null, 'Success');
		}
	});
};

var getComments = function(threadID, callback) {
	comments_kvs.get_comments(threadID, function(err, data) {
		if (err) {
			callback('Error getting comments: '+err, null);
		} else {
			callback(null, data);
		}
	});
};

var getMessages = function(id, callback) {
	new_messages_access.get_messages(id, function(err, data) {
		if (err) {
			callback('Error getting messages: '+err, data);
		} if (data == null) {
			callback(null, null);
		} else {
			callback(null, data);
		}
	});
};

var getAllUsernames = function(callback) {
	profiles_kvs.scanKeys(function(err, data) {
		if (err) {
			callback('Error scanning profile keys: '+err, null);
		} else if (data == null) {
			callback(null, null);
		} else {
			callback(null, data);
		}
	})
};

var addOnline = function(person, callback) {
	online_kvs.put(person, 'true', function(err, data) {
		if (err) {
			callback('Error adding to online DB: '+err, null);
		} if (data == null) {
			callback(null, null);
		} else {
			callback(null, person);
		}
	});
};

//value must either be 'true' or 'false'
var updateOnline = function(person, value, callback) {
	online_kvs.get(person, function(err, data) {
		if (err) {
			callback('DB error in get: '+err, null);
		} else if (data == null) {
			callback(null, null);
		} else {
			online_kvs.update(person, data[0].inx, value, function(err1, data1) {
				if (err1) {
					callback('DB error in update: '+err1, null);
				} else if (data1 == null) {
					callback(null, null);
				} else {
					callback(null, person);
				}
			});
		}
	});
};

var checkOnline = function(person, callback) {
	online_kvs.get(person, function(err, data) {
		if (err) {
			callback('There was an error: '+err, null);
		} else if (data == null) {
			callback(null, null);
		} else {
			callback(null, data[0]);
		}
	});
};

var addNewMessage = function(chatID, message_val, sender, callback) {
	new_messages_access.send_message(chatID, sender, message_val, function(err, data) {
		console.log("chatID = " + chatID);
		console.log("message_val = "+ message_val);
		console.log("In database.js.addNewMessage");
		if (err) {
			callback("Error adding message: "+err, null);
		} else {
			callback(null, chatID);
		}
	});
}

var database = {
	add_new_user: addUser,
	get_password: getPassword,
  	get_profile: getProfile,
  	add_profile: addProfile,
  	update_profile: updateProfile,
  	add_post: addPost,
  	get_posts: getPosts,
  	get_all_users: getAllUsers,
  	add_newsfeed: addNewsfeed,
  	get_newsfeed: getNewsfeed,
  	add_comments: addComments,
  	get_comments: getComments,
  	get_all_usernames: getAllUsernames,
  	add_to_online: addOnline,
  	update_online: updateOnline,
  	check_online: checkOnline,
  	add_new_message: addNewMessage,
  	get_messages: getMessages
};
                                        
module.exports = database;