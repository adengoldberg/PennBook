/*This script sets up required database tables. All tables will be empty upon initialization.*/

//NOTE THAT THIS LOADER DOES NOT RESET ALL OF THE REQUIRED TABLES FOR THE DATABASE

var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');

var db = new AWS.DynamoDB();
var kvs = require('./models/keyvaluestore.js');

var async = require('async');

var usersDBname = "profiles";
var friendshipsDBname = "friendships";
var passwordsDBname = 'passwords';

var i = 0;
function setup(err, data) {
  i++;
  if (err && i != 2) {
    console.log("Error: " + err); 
  } else if (i==1) {
    console.log("Deleting table "+usersDBname+" if it already exists...");
    params = {
        "TableName": usersDBname
    };
    db.deleteTable(params, function(){
      console.log("Waiting 10s for the table to be deleted...");
      setTimeout(setup,10000); // this may not be enough - increase if you're getting errors
    });
  } else if (i==2) {
    console.log("Creating table "+usersDBname+"...");
    table = new kvs(usersDBname);
    table.init(setup);
  } else if (i==3) {
    console.log("Waiting 10s for the table to become active...");
    setTimeout(setup,10000); // this may not be enough - increase if you're getting errors
  } 
}

var j = 0;
function setup_friends(err, data) {
  j++;
  if (err && j != 2) {
    console.log("Error: " + err); 
  } else if (j==1) {
    console.log("Deleting table "+friendshipsDBname+" if it already exists...");
    params = {
        "TableName": friendshipsDBname
    };
    db.deleteTable(params, function(){
      console.log("Waiting 10s for the table to be deleted...");
      setTimeout(setup_friends,10000); // this may not be enough - increase if you're getting errors
    });
  } else if (j==2) {
    console.log("Creating table "+friendshipsDBname+"...");
    table1 = new kvs(friendshipsDBname);
    table1.init(setup_friends);
  } else if (j==3) {
    console.log("Waiting 10s for the table to become active...");
    setTimeout(setup_friends,10000); // this may not be enough - increase if you're getting errors
  } 
}

var k = 0;
function setup_passwords(err, data) {
  k++;
  if (err && k != 2) {
    console.log("Error: " + err); 
  } else if (k==1) {
    console.log("Deleting table "+passwordsDBname+" if it already exists...");
    params = {
        "TableName": passwordsDBname
    };
    db.deleteTable(params, function(){
      console.log("Waiting 10s for the table to be deleted...");
      setTimeout(setup_passwords,10000); // this may not be enough - increase if you're getting errors
    });
  } else if (k==2) {
    console.log("Creating table "+passwordsDBname+"...");
    table2 = new kvs(passwordsDBname);
    table2.init(setup_passwords);
  } else if (k==3) {
    console.log("Waiting 10s for the table to become active...");
    setTimeout(setup_passwords,10000); // this may not be enough - increase if you're getting errors
  } 
}

/* The line below executes the script when we start the program. */   
setup(null,null);
setup_friends(null, null);
setup_passwords(null, null);