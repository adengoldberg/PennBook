var express = require('express');
var bodyParser = require('body-parser');
var db = require('../models/database.js');
var bcrypt = require('bcrypt');
var async = require('async');
const fs = require('fs');

//For database calls, we check the case where data == null even in the case where this should never happen to avoid crashing the system 
//if the data is null for any reason (possible in a scalable system)

var getMain = function(req, res) {
	if (!req.session.user) {
		res.render('main.ejs', {login_error_msg: req.query.login_error_msg});
	} else {
		//sends user directly to home page if already logged in
		res.redirect('/home');
	}
};

var getSignup = function(req, res) {
  res.render('signup.ejs', {});
};

var getHome = function(req, res) {
	if (!req.session.user) {
		res.redirect('/?login_error_msg=Please+login+first');
	} else {
		//cannot access the profile page unless already logged in
		res.render('home.ejs', {home_error_msg: req.query.home_error_msg});
	}
};

var getProfile = function(req, res) {
	if (!req.session.user) {
		res.redirect('/?login_error_msg=Please+login+first');
	} else {
		//cannot access the profile page unless already logged in
		res.render('profile.ejs', {});
	}
};

var getLogout = function(req, res) {
	var me = req.session.user;
	db.update_online(me, 'false', function(err, data) {
		if (err) {
			console.log('There was a database error');
		} else if (data == null) {
			console.log('Should not be here');
		} else {
			req.session.user = "";
			req.session.destroy();
			res.redirect("/");
		}
	});
};

var getProfileData = function(req, res) {
	db.get_profile(req.session.user, function(err, data) {
		if (err) {
			res.send('ERROR');
		} else if (data == null) {
			res.send('ERROR');
		} else {
			res.send(JSON.stringify({username: req.session.user, data: data}));
		}
	});
};

var getEditProfile = function(req, res) {
	if (!req.session.user) {
		res.redirect('/?login_error_msg=Please+login+first');
	} else {
		//cannot access the edit profile page unless already logged in
		res.render('editprofile.ejs', {});
	}
};

var postUpdateProfile = function(req, res) {
	var username = req.session.user;
	var firstName = req.body.first_name_input;
	var lastName = req.body.last_name_input;
	var email = req.body.email;
	var affiliation = req.body.affiliation;
	var interests = req.body.interests;
	var birthday = req.body.birthday;
	var status = req.body.status;
	var obj = {firstName: firstName, lastName: lastName, email: email, affiliation: affiliation, interests: interests, 
		birthday: birthday, status: status};
	db.update_profile(username, obj, function(err, data) {
		if (err) {
			console.log('There was a database error: '+ err);
		} else if (data == null) {
			console.log('There was an error');
		} else {
			res.redirect('/profile');
		}
	});
};

var postUpdateStatus = function(req, res) {
	var status_update = req.body.new_status;
	var obj = {status: status_update};
	db.update_profile(req.session.user, obj, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('Should not be here');
		} else {
			res.send('Success');
		}
	});
};

var postCreateProfile = function(req, res) {
	var username = req.body.username_input;
	var firstNameInput = req.body.first_name_input;
	var lastNameInput = req.body.last_name_input;
	var emailInput = req.body.email;
	var affiliationInput = req.body.affiliation;
	var interestsInput = req.body.interests;
	//Birthday stored in DB in format YYYY-MM-DD
	var birthdayInput = req.body.birthday;
	var statusInput = req.body.status;

	var obj = {firstName: firstNameInput, lastName: lastNameInput, email: emailInput, affiliation: affiliationInput, 
		interests: interestsInput, birthday: birthdayInput, status: statusInput, friends: []};
	db.add_profile(username, obj, function(err, data) {
		if (err) {
			console.log('There was a database error: ' + err);
		} else if (data == null) {
			console.log('There was an error');
		} else {
			db.add_to_online(username, function(err1, data1) {
				if (err1) {
					console.log('Error adding to the online database: '+err1);
				} else if (data1 == null) {
					console.log('Should not be here');
				} else {
					res.send('Success adding profile');
				}
			});
		}
	});

};

var postSearchUser = function(req, res) {
	var to_search = req.body.search_username;
	if (to_search === req.session.user) {
		res.redirect('/profile');
	} else {
		db.get_profile(to_search, function(err, data) {
			if (err) {
				console.log('There was a database error: '+err);
			} else if (data === null) {
				res.redirect('/home?home_error_msg=Username+not+found');
			} else {
				data['username'] = to_search;
				res.redirect('/otheruser?username='+to_search);
			}
		});
	}
};

var postOtherUserData = function(req, res) {
	var username = req.body.username;
	var me = req.session.user;
	db.get_profile(username, function(err, data) {
		if (err) {
			res.send('ERROR');
		} else if (data == null) {
			res.send('ERROR');
		} else {
			res.send(JSON.stringify({username: username, data: data, me: me}));
		}
	});
};

var getOtherUser = function(req,res) {
	if (req.session.user) {
		if (req.query.username) {
		var term = req.query.username;
		db.get_password(term, function(err, data) {
			if (err) {
				console.log('There was a database error: '+err);
			} else if (data == null) {
				res.redirect('home?home_error_msg=Username+does+not+exist');
			} else {
				res.render('otheruser.ejs', {username: req.query.username});
			}
		});
		} else {
			res.redirect('home?home_error_msg=Please+search+for+a+user');
		}
	} else {
		res.redirect('/?login_error_msg=Please+login+first');
	}
	
};

var postAddFriend = function(req, res) {
	var to_add = req.body.to_add;
	var me = req.session.user;
	//Add to_add to my friend's list
	db.get_profile(me, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('Should not be here');
		} else {
			var friends = JSON.parse(data.friends);
			friends.push(to_add);
			var obj = {friends: friends};
			db.update_profile(me, obj, function(err, data) {
				if (err) {
					console.log('There was a database error: '+ err);
				} else if (data == null) {
					console.log('There was an error');
				} else {
					//Add me to to_add friend's list
					db.get_profile(to_add, function(err1, data1) {
						if (err1) {
							console.log('There was a database error: '+err1);
						} else if (data1 == null) {
							console.log('There was an error');
						} else {
							var friends1 = JSON.parse(data1.friends);
							friends1.push(me);
							var obj1 = {friends: friends1};
							db.update_profile(to_add, obj1, function(err2, data2) {
								if (err2) {
									console.log('There was a database error: '+ err);
								} else if (data2 == null) {
									console.log('There was an error');
								} else {
									res.send('Success');
								}
							});
						}
					});
				}
			});
		}
	});
};

var postUnfriend = function(req, res) {
	var target = req.body.target;
	var me = req.session.user;
	//remove target from my friend's list
	db.get_profile(me, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('Should not be here');
		} else {
			var friends = JSON.parse(data.friends);
			friends.splice(friends.indexOf(target), 1);
			var obj = {friends: friends};
			db.update_profile(me, obj, function(err, data) {
				if (err) {
					console.log('There was a database error: '+err);
				} else if (data == null) {
					console.log('There was an error');
				} else {
					//remove me from target friend's list
					db.get_profile(target, function(err1, data1) {
						if (err1) {
							console.log('There was a database error: '+err1);
						} else if (data1 == null) {
							console.log('There was an error');
						} else {
							var friends1 = JSON.parse(data1.friends);
							friends1.splice(friends1.indexOf(me), 1);
							var obj1 = {friends: friends1};
							db.update_profile(target, obj1, function(err2, data2) {
								if (err2) {
									console.log('There was a database error: '+ err);
								} else if (data2 == null) {
									console.log('There was an error');
								} else {
									res.send('Success');
								}
							});
						}
					});
				}
			});
		}
	});
};

var postAddWallPost = function(req, res) {
	var time = req.body.time;
	var message = req.body.message;
	var wall_owner = req.body.wall_owner;
	var poster = req.session.user;
	var obj = {time: time, message: message, poster: poster};
	db.add_post(wall_owner, obj, function(err, data) {
		if (err) {
			console.log('There was a database error: '+ err);
		} else if (data == null) {
			console.log('There was an error');
		} else {
			res.send('Success');
		}
	});
};

var postGetPostData = function(req, res) {
	var wall_owner = req.body.wall_owner;
	db.get_posts(wall_owner, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('No items in this users newsfeed');
		} else {
			res.send(JSON.stringify(data));
		}
	});
};

var getGetWall = function(req, res) {
	var wall_owner = req.session.user;
	db.get_posts(wall_owner, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			res.send(204);
		} else {
			res.send(JSON.stringify(data));
		}
	});
};

var getVisualize = function(req, res) {
	if (!req.session.user) {
		res.redirect('/?login_error_msg=Please+login+first');
	} else {
		res.render('visualize.ejs', {});
	}
};

var getGraphData = function(req, res) {
	var me = req.session.user;
	db.get_profile(me, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('This should not be happenings');
		} else {
			var childrenList = [];
			var friendsList = JSON.parse(data.friends);
			var affiliation = data.affiliation;
			for (var i = 0; i < friendsList.length; i++) {
				var friend = friendsList[i];
				var obj = {name: friend, id: friend, data: {}, children: []};
		  		childrenList.push(obj);
			}
			var me_json = {id: me, name: me, children: childrenList, data: {}};
			res.send(JSON.stringify({json: me_json, affiliation: affiliation}));
		}
	});
};

var postSearchSuggestions = function(req, res) {
	var term = req.body.term;
	db.get_all_users(function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} if (data == null) {
			console.log('This should not be happening');
		} else {
			var response_list = [];
			for (var i = 0; i < data.length; i++) {
				var t = data[i].key;
				if (t.substring(0, term.length) == term) {
					response_list.push(t);
				}
			}
			res.send(JSON.stringify(response_list));
		}
	});
};

var postGetFriends = function(req, res) {
	var username = req.body.username;
	var affiliation = req.body.affiliation;
	db.get_profile(username, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('This should not be happenings');
		} else {
			var childrenList = [];
			var friendsList = JSON.parse(data.friends);

			async.forEach(friendsList, function(x, xcallback) {
				//x is the friend whose affiliation must be checked
				db.get_profile(x, function(err, data1) {
					if (err) {
						xcallback();
					} else {
						var aff_to_check = data1.affiliation;
						if (aff_to_check == affiliation) {
							var obj = {name: x, id: x, data: {}, children: []};
							childrenList.push(obj);
							xcallback();
						} else {
							xcallback();
						}
					}
				});
			}, function() {
				var username_json = {id: username, name: username, children: childrenList, data: {}};
				res.send(JSON.stringify(username_json));
			});
		}
	});
};

var postAddNewsFeed = function(req, res) {
	var new_status = req.body.new_status;
	var time = req.body.time;
	var username = req.session.user;
	var message = username + " changed their status to " + new_status;
	db.add_newsfeed(message, username, time, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('Should not be here');
		} else {
			res.send('Success');
		}
	});
};

var postFriendsNewsfeedUpdate = function(req, res) {
	var me = req.session.user;
	var to_add = req.body.to_add;
	var time = req.body.time;
	var message = me + ' and ' + to_add + ' are now friends!';
	db.add_newsfeed(message, me, time, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('Should not be here');
		} else {
			db.add_newsfeed(message, to_add, time, function(err, data) {
				if (err) {
					console.log('There was a database error: '+err);
				} else if (data == null) {
					console.log('Should not be here');
				} else {
					res.send('Success');
				}
			});
		}
	});

};


var getLoadNewsFeed = function(req, res) {
	var username = req.session.user;
	db.get_newsfeed(username, function(err, data) {
		if (err) {
			console.log('Error because of newsfeed');
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('Nothing to load into newsfeed');
		} else {
			res.send(JSON.stringify(data));
		}
	});
};


var getComments = function(req, res) {
	if (!req.session.user) {
		res.redirect('/?login_error_msg=Please+login+first');
	} else {
		if (req.query.id) {
			res.render('comments.ejs', {id: req.query.id});
		} else {
			res.redirect('/home');
		}
	}
};

var postAddComment = function(req, res) {
	var comment = req.body.comment;
	var poster = req.session.user;
	var threadID = req.body.threadID;
	var time = req.body.time;
	db.add_comments(threadID, comment, poster, time, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else {
			res.send('Success');
		}
	});
};

var postGetComments = function(req, res) {
	var threadID = req.body.threadID;
	db.get_comments(threadID, function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('Nothing to load into comments');
		} else {
			res.send(JSON.stringify(data));
		}
	});
};

var postProfileNewsfeed = function(req, res) {
	var time = req.body.time;
	var me = req.session.user;
	var json = req.body.data;

	var firstName = json.firstName;
    var lastName = json.lastName;
    var email = json.email;
    var affiliation = json.affiliation;
    var interests = json.interests;
    var birthday = json.birthday;
    var status = json.status;
    db.get_profile(me, function(err, data) {
    	if (err) {
    		console.log('There was a database error: '+err);
    	} else if (data == null) {
    		console.log('This should not be happening');
    	} else {
    		var firstName_curr = data.firstName;
		    var lastName_curr = data.lastName;
		    var email_curr = data.email;
		    var affiliation_curr = data.affiliation;
		    var interests_curr = data.interests;
		    var birthday_curr = data.birthday;
		    var status_curr = data.status;
    		var update = '';
    		if (firstName_curr !== firstName) {
    			update = update + me + ' updated their first name to ' + firstName + '. ';
    		} 
    		if (lastName_curr !== lastName) {
    			update = update + me + ' updated their last name to ' + lastName + '. ';
    		}
    		if (email_curr !== email) {
    			update = update + me + ' updated their email to ' + email + '. ';
    		}
    		if (affiliation_curr !== affiliation) {
    			update = update + me + ' updated their affiliation to ' + affiliation + '. ';
    		}
    		if (interests_curr !== interests) {
    			update = update + me + ' updated their interests to ' + interests + '. ';
    		}
    		if (birthday_curr !== birthday) {
    			update = update + me + ' updated their birthday to ' + birthday + '. ';
    		}
    		if (status_curr !== status) {
    			update = update + me + ' updated their status to ' + status + '. ';
    		}
    		db.add_newsfeed(update, me, time, function(err, data) {
				if (err) {
					console.log('There was a database error: '+err);
				} else if (data == null) {
					console.log('Should not be here');
				} else {
					res.send('Success');
				}
			});
    	}
    });
};

var getMapreduce = function(req, res) {
	if (req.session.user !== 'admin') {
		res.redirect('/?login_error_msg=You+must+be+logged+in+as+admin+to+access+this+page');
	} else {
		res.render('mapreduce.ejs', {});
	}
};

var getRunMapreduce = function(req, res) {
	//code to load information from dynamodb into two input files for the MapReduce: friends.txt and interests_affiliations.txt
	if (fs.existsSync('./friends.txt')) {
		fs.unlinkSync('./friends.txt');
	}
	if (fs.existsSync('./interests_affiliations.txt')) {
		fs.unlinkSync('./interests_affiliations.txt');
	}
	db.get_all_usernames(function(err, data) {
		if (err) {
			console.log('There was a database error: '+err);
		} else if (data == null) {
			console.log('No profiles to parse');
		} else {
			for (var i = 0; i < data.length; i++) {
				var friends = JSON.parse(data[i].friends);
				var person = data[i].key;
				var affiliation = data[i].affiliation;
				var interests = data[i].interests;
				var interestList = interests.split(',');

				for (var k = 0; k < interestList.length; k++) {
					var interest = interestList[k];
					var toAppend = interest + '\t' + person + '\n';
					fs.appendFile('./interests_affiliations.txt', toAppend, function(err1) {
						if (err1) {
							console.log(err1);
						}
					});
				}
				
				var affiliation_str = affiliation + '\t' + person + '\n';
				fs.appendFile('./interests_affiliations.txt', affiliation_str, function(err3) {
					if (err3) {
						console.log(err3);
					}
				});

				for (var j = 0; j < friends.length; j++) {
					var str = person + '\t' + friends[j] + '\t10';
					fs.appendFile('./friends.txt', str + '\n', function(err2) {
						if (err2) {
							console.log(err2);
						}
					});
				}
			}
			res.send('Success');
		}
	});
};

var getGetConcurrentUsers = function(req, res) {
	var me = req.session.user;
	//need to query the databse and send back list of user's friends that are online
	db.get_profile(me, function(err, data) {
		if (err) {
			console.log('There was a databse error: '+err);
		} else if (data == null) {
			console.log('Should not be here');
		} else {
			var friends = JSON.parse(data.friends);
			var online_list = '';;
			async.forEach(friends, function(x, xcallback) {
				db.check_online(x, function(err1, data1) {
					if (err1) {
						console.log('There was a database error: '+err);
						xcallback();
					} else if (data1 == null) {
						console.log('Should not be here');
						xcallback();
					} else {
						if (data1.value == 'true') {
							online_list = online_list + ' ' + x;
							xcallback();
						} else {
							xcallback();
						}
					}
				});
			}, function() {
				res.send(online_list);
			});
		}
	});
};

var getChat = function(req, res) {
	if (!req.session.user) {
		res.redirect('/?login_error_msg=Please+login+first');
	} else {
		res.render('chat.ejs', {
			chat_error_msg: req.query.chat_error_msg, 
			user: req.session.user, 
			sessionID: req.query.sessionID,
			chatID: req.query.chatID
		});
	}
};

var addToChat = function(req, res) {
	var me = req.session.user;
	var newUser = req.body.newUser;
	db.get_profile(me, function(err, data) {
		if (err) {
			console.log('THERE WAS A DATABASE ERROR: '  + err);
		} else if (data == null) {
			console.log('THERE WAS AN ERROR. DATA IS NULL');
		} else {
			var friendsList = JSON.parse(data.friends);
			if (friendsList.indexOf(newUser) === -1) {
				res.send('failure');
			} else {
				res.send('success');
			}
		}
	});
};

var getOldChatData = function(req, res) {
	var chatID = req.body.id;
	db.get_messages(chatID, function(err, data) {
		if (err) {
			console.log('Database error trying to load previous messages');
		} else if (data == null) {
			console.log('There are no past messages to display right now');
		} else {
			res.send(data);
		}
	});
};

var getUploadData = function(req, res) {
	//TODO: Did not finish rendering friend recommendations to the front-end, but we do file IO to load data from database to txt files as input for mapreduce
};

var getUsername = function(req, res) {
	//this route is only called using AJAX in pages that already only load if the user is logged in
	res.send(req.session.user);
};

var routes = {
  get_main: getMain,
  get_signup: getSignup,
  get_home: getHome,
  get_logout: getLogout,
  get_profile: getProfile,
  get_profiledata: getProfileData,
  get_editprofile: getEditProfile,
  post_updateprofile: postUpdateProfile,
  post_createprofile: postCreateProfile,
  post_searchuser: postSearchUser,
  post_otheruserdata: postOtherUserData,
  get_otheruser: getOtherUser,
  post_addfriend: postAddFriend,
  post_addwallpost: postAddWallPost,
  post_getpostdata: postGetPostData,
  get_getwall: getGetWall,
  get_visualize: getVisualize,
  post_searchsuggestions: postSearchSuggestions,
  get_graphdata: getGraphData,
  post_getfriends: postGetFriends,
  post_updatestatus: postUpdateStatus,
  post_unfriend: postUnfriend,
  post_addnewsfeed: postAddNewsFeed,
  get_loadnewsfeed: getLoadNewsFeed,
  get_comments: getComments,
  post_addcomment: postAddComment,
  post_getcomments: postGetComments,
  post_profilenewsfeed: postProfileNewsfeed,
  get_mapreduce: getMapreduce,
  get_runmapreduce: getRunMapreduce,
  post_friendsNewsfeedUpdate: postFriendsNewsfeedUpdate,
  get_chat: getChat,
  get_getconcurrentusers: getGetConcurrentUsers,
  add_to_chat: addToChat,
  get_chat: getChat,
  post_getoldchatdata: getOldChatData,
  get_uploaddata: getUploadData,
  get_username: getUsername
};

module.exports = routes;