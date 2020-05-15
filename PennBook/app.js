var express = require('express');
var routes = require('./routes/routes.js');
var app = express();
var bodyParser = require('body-parser');
var db = require('./models/database.js');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var bcrypt = require('bcrypt');
var router = express.Router();

app.use(express.bodyParser());
app.use(express.logger("default"));
app.use(express.cookieParser());
//secret attribute of session not used, username attribute created in routes.js and set equal to username when user logs in
app.use(express.session({secret: "default"}));
app.use(express.static('public'));

app.get('/', routes.get_main);
app.get('/signup', routes.get_signup);
app.get('/home', routes.get_home);
app.get('/logout', routes.get_logout);
app.get('/profile', routes.get_profile);
app.get('/profiledata', routes.get_profiledata);
app.get('/editprofile', routes.get_editprofile);
app.post('/updateprofile', routes.post_updateprofile);
app.post('/createprofile', routes.post_createprofile);
app.post('/searchuser', routes.post_searchuser);
app.post('/otheruserdata', routes.post_otheruserdata);
app.get('/otheruser', routes.get_otheruser);
app.post('/addfriend', routes.post_addfriend);
app.post('/addwallpost', routes.post_addwallpost);
app.post('/getpostdata', routes.post_getpostdata);
app.get('/getwall', routes.get_getwall);
app.get('/visualize', routes.get_visualize);
app.post('/searchsuggestions', routes.post_searchsuggestions);
app.get('/graphdata', routes.get_graphdata);
app.post('/getfriends', routes.post_getfriends);
app.post('/updatestatus', routes.post_updatestatus);
app.post('/unfriend', routes.post_unfriend);
app.post('/addnewsfeed', routes.post_addnewsfeed);
app.get('/loadnewsfeed', routes.get_loadnewsfeed);
app.get('/comments', routes.get_comments);
app.post('/addcomment', routes.post_addcomment);
app.post('/getcomments', routes.post_getcomments);
app.post('/profilenewsfeed', routes.post_profilenewsfeed);
app.get('/mapreduce', routes.get_mapreduce);
app.get('/runmapreduce', routes.get_runmapreduce);
app.post('/friendsNewsfeedUpdate', routes.post_friendsNewsfeedUpdate);
app.get('/chat', routes.get_chat);
app.get('/getconcurrentusers', routes.get_getconcurrentusers);
app.post('/addtochat', routes.add_to_chat);
app.get('/chat', routes.get_chat);
app.post('/getoldchatdata', routes.post_getoldchatdata);
app.get('/uploaddata', routes.get_uploaddata);
app.get('/getusername', routes.get_username);

//The routes below are defined in app.js to ensure we are able to access the socket

app.post('/checklogin', function(req, res) {
	var usernameInput = req.body.username;
	var passwordInput = req.body.password;
	db.get_password(usernameInput, function(err, data) {
		if (err) {
			console.log("There was a database error");
		} else if (data) {
			var correct_hash_password = data;
			bcrypt.compare(passwordInput, correct_hash_password, function(err, check) {
				if (err) {
					console.log("There was an error comparing passwords");
				} else {
					if (check) {
						req.session.user = usernameInput;
						db.update_online(usernameInput, 'true', function(err, data) {
							if (err) {
								console.log('Error updating state of user: '+err);
							} else if (data == null) {
								console.log('Should not be here');
							} else {
								const nsp = io.of('/' + usernameInput);
								nsp.on('connection', function(socket) {
									socket.on('chat notification', function(sender, sessionID, chatID, req, res) {
										nsp.emit('chat notification', sender, sessionID, chatID);
									});
									socket.on('chat message', function(msg, sender, chatID, sessionID, req, res) {
										db.add_new_message(chatID, sender, msg, function(req, res) {
											console.log("app.js -- adding in new dynamo");
										});
										var sessionNSP = io.of('/' + sessionID);
										sessionNSP.emit('chat message', msg, sender);
									});
									socket.on('new chat ID', function(chatID, sessionID) {
										console.log('IN THE NEW CHAT SOCKET');
										var sessionNSP = io.of('/' + sessionID);
										sessionNSP.emit('new chat ID', chatID);
									});
									socket.on('disconnection', function() {
										//Being done in front end
										console.log('USER  DISCONNECTED');
									});
								});
								res.send('Success');
							}
						});
					} else {
						res.send('Incorrect Password');
					}
				}
			});
		} else {
			res.send('Username Not Found');
		}
	});
});


app.get('/startchat', function(req, res) {
	if (!req.session.user) {
		res.redirect('/?login_error_msg=Please+login+first');
	} else {
	var stamp = "" + req.session.user + new Date();
	stamp = stamp.replace(/\s/g, '');
	stamp = stamp.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
	const nsp = io.of('/' + stamp);
	res.render('chat.ejs', {chat_error_msg: req.query.chat_error_msg, 
		user: req.session.user, 
		sessionID: stamp,
		chatID: req.session.user
	});
	}
});

app.get('/joinchat', function(req, res) {
	if (!req.session.user) {
		res.redirect('/?login_error_msg=Please+login+first');
	} else {
		var sessionID = req.query.sessionID;
		var chatID = req.query.chatID;
		const nsp = io.of('/' + sessionID);
		res.render('chat.ejs', {chat_error_msg: req.query.chat_error_msg, 
			user: req.session.user, 
			sessionID: sessionID,
			chatID: chatID
		});
	}
});

app.post('/createaccount', function(req, res) {
	var usernameInput = req.body.username_input;
	var passwordInput = req.body.password_input;
	db.get_password(usernameInput, function(err, data) {
		if (err) {
			console.log('There was a database error');
		} else if (data) {
			res.send('Username Exists');
		} else {
			bcrypt.hash(passwordInput, 10, function(err, hash){
				if (err) {
					console.log("Failed to hash password");
				} else {
					var hashedPassword = hash;
					db.add_new_user(usernameInput, hashedPassword, function(err, data) {
						if (data == null) {
							console.log(err);
						} else {
							//initializes session for new user signing up here
							req.session.user = usernameInput;
							const nsp = io.of('/' + usernameInput);
								nsp.on('connection', function(socket) {
									socket.on('chat notification', function(sender, sessionID, chatID, req, res) {
										nsp.emit('chat notification', sender, sessionID, chatID);
									});
									socket.on('chat message', function(msg, sender, chatID, sessionID, req, res) {
										db.add_new_message(chatID, sender, msg, function(req, res) {
											console.log("app.js -- adding in new dynamo");
										});
										var sessionNSP = io.of('/' + sessionID);
										sessionNSP.emit('chat message', msg, sender);
									});
									socket.on('new chat ID', function(chatID, sessionID) {
										console.log('IN THE NEW CHAT SOCKET');
										var sessionNSP = io.of('/' + sessionID);
										sessionNSP.emit('new chat ID', chatID);
									});
									socket.on('disconnection', function() {
										//Being done in front end
										console.log('USER  DISCONNECTED');
									});
								});
								res.send('Success');
						}
					});
				}
			});
			
		}
	});
});

/* Run the server */

console.log('Author: Group 21 (Siddharth, JP, Aden)');
http.listen(8080);
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');