/**
 * Very simple String-based key/value store interface for
 * instructional purpose.  Supports both singleton and
 * multivalued (set) values for individual keys.
 * If multi-attribute values are used, they should be given as 
 * JSON strings.

 * NB: this interface only supports tables with columns key (string), inx (int), value (string)
 * Tables with differing schemas must be handled differently
 * 
 * @author Zack Ives, University of Pennsylvania, for NETS 212
 * @author Sudarshan Muralidhar, University of Pennsylvania, for NETS 212
 *
 */

 //Extension of the given KVS given to store user profile data. 

(function() {
  var AWS = require('aws-sdk');
  var async = require('async');
  AWS.config.loadFromPath('./config.json');

  if (!AWS.config.credentials || !AWS.config.credentials.accessKeyId)
    throw 'Need to update config.json to specify your access key!';

  var db = new AWS.DynamoDB();

  function keyvaluestore(table) {
    this.inx = -1;
  
    this.LRU = require("lru-cache");
  
    this.cache = new this.LRU({ max: 500 });
    
    this.tableName = table;
  };

  /**
   * Initialize the table
   * This *must* be called on a table before using any other methods!
   */
  keyvaluestore.prototype.init = function(callback) {
    var tableName = this.tableName;
    var initCount = this.initCount;
    var self = this;
    
    db.listTables(function(err, data) {
      if (err) 
        console.log(err, err.stack);
      else {
        console.log("Connected to AWS DynamoDB");
        
        var tables = data.TableNames.toString().split(",");
        console.log("Tables in DynamoDB: " + tables);
        if (tables.indexOf(tableName) == -1) {
          console.log("Creating new table " + tableName);

          var params = {
              AttributeDefinitions: 
                [ /* required */
                  {
                    AttributeName: 'keyword',
                    AttributeType: 'S'
                  },
                  {
                    AttributeName: 'inx', /* required */
                    AttributeType: 'N' /* required */
                  }
                ],
              KeySchema: 
                [ /* required */
                  {
                    AttributeName: 'keyword', /* required */
                    KeyType: 'HASH' /* required */
                  },
                  {
                    AttributeName: 'inx', /* required */
                    KeyType: 'RANGE' /* required */
                  }
                ],
              ProvisionedThroughput: { /* required */
                ReadCapacityUnits: 1, /* required */
                WriteCapacityUnits: 1 /* required */
              },
              TableName: tableName /* required */
          };

          db.createTable(params, function(err, data) {
            if (err) {
              console.log(err)
            }
            else {
              self.inx = 0;
              callback()
            }
          });
        } else {
          self.initCount(callback);
        }
      }
    }
    );
  }

  /**
   * Gets the count of how many rows are in the table
   * 
   */
  keyvaluestore.prototype.initCount = function(whendone) {
    var self = this;
    var params = {
        TableName: self.tableName,
        Select: 'COUNT'
    };
    
    db.scan(params, function(err, data) {
      if (err){
        console.log(err, err.stack);
      }
      else {
        self.inx = data.ScannedCount;

        console.log("Found " + self.inx + " indexed entries in " + self.tableName);
        whendone();
      }
    });

  }

  /**
   * Get result(s) by key
   * 
   * @param search
   * 
   * Callback returns a list of objects association with the key provided
   */
  keyvaluestore.prototype.get = function(search, callback) {
    var self = this;
    if (self.inx === -1){
      callback("Error using table - call init first!", null)
      return
    }
    
    if (self.cache.get(search))
      callback(null, self.cache.get(search));
    else {
      var params = {
          KeyConditions: {
            keyword: {
              ComparisonOperator: 'EQ',
              AttributeValueList: [ { S: search} ]
            }
          },
          TableName: self.tableName,
          AttributesToGet: [ 'inx', 'affiliation', 'birthday', 'email', 'firstName', 'interests', 'lastName', 'status' , 'friends']
      };

      db.query(params, function(err, data) {
        if (err || data.Items.length == 0) {
          callback(err, null);
        } else {
          var items = [];
          for (var i = 0; i < data.Items.length; i++) {
            items.push({"inx": data.Items[i].inx.N, "affiliation": data.Items[i].affiliation.S, 
              "birthday": data.Items[i].birthday.S, "email": data.Items[i].email.S, "firstName": data.Items[i].firstName.S, 
              "interests": data.Items[i].interests.S, "lastName": data.Items[i].lastName.S, "status": data.Items[i].status.S, 
              "friends": data.Items[i].friends.S});
          }
          self.cache.set(search, items);
          callback(err, items);
        }
      });
    }
  };

  /**
   * Test if search key has a match
   * 
   * @param search
   * @return
   */
  keyvaluestore.prototype.exists = function(search, callback) {
    var self = this;
    if (self.inx === -1){
      callback("Error using table - call init first!", null)
      return
    }
    
    if (self.cache.get(search))
      callback(null, self.cache.get(search));
    else
      self.get(search, function(err, data) {
        if (err)
          callback(err, null);
        else
          callback(err, (data == null) ? false : true);
      });
  };

  /**
   * Get result set by key prefix
   * @param search
   *
   * Callback returns a list of objects with keys "inx" and "value"
   */
  keyvaluestore.prototype.getPrefix = function(search, callback) {
    var self = this;
    if (self.inx === -1){
      callback("Error using table - call init first!", null)
      return
    }
    var params = {
        KeyConditions: {
          keyword: {
            ComparisonOperator: 'BEGINS_WITH',
            AttributeValueList: [ { S: search} ]
          }
        },
        TableName: self.tableName,
        AttributesToGet: [ 'value' ]
    };

    db.query(params, function(err, data) {
      if (err || data.Items.length == 0)
        callback(err, null);
      else {
        var items = [];
        for (var i = 0; i < data.Items.length; i++) {
          items.push({"inx": data.Items[i].inx.N, "value": data.Items[i].value.S});
        }
        callback(err, items);
      }
    });
  }

  /**
   * Add a key/value or key/valueset pair
   * @param keyword
   * @param value - either a value or an array of values
   * callback with inx of put
   */
  keyvaluestore.prototype.put = function(keyword, value, callback) {
    var self = this;
    if (self.inx === -1){
      callback("Error using table - call init first!", null)
      return
    }
    
    self.cache.del(keyword);

    tasks = []
    // Array?
    if (value.constructor === Array) {
      inxList = []
      for (var i = 0; i < value.length; i++) {
        var params = {
            Item: {
              "keyword": {
                S: keyword
              },
              "inx": {
                N: self.inx.toString()
              },
              value: { 
                S: value[i]
              }
            },
            TableName: self.tableName,
            ReturnValues: 'NONE'
        };

        tasks.push(function (callback){
          db.putItem(params, callback);
        })
        
        inxList.push(self.inx)
        self.inx++;
      }
      async.parallel(tasks, function(err, data){
        if (err)
          callback(err)
        else
          callback(null, inxList)
      })
    } else {
      var firstName = value.firstName;
      var lastName = value.lastName;
      var email = value.email;
      var affiliation = value.affiliation;
      var interests = value.interests;
      var birthday = value.birthday;
      var status = value.status;
      var friends = JSON.stringify(value.friends);

      var params = {
          Item: {
            "keyword": {
              S: keyword
            },
            "inx": {
              N: self.inx.toString()
            },
            'firstName': { 
              S: firstName
            },
            'lastName': {
              S: lastName
            },
            'email': {
              S: email
            },
            'affiliation': {
              S: affiliation
            },
            'interests': {
              S: interests
            },
            'birthday': {
              S: birthday
            },
            'status': {
              S: status
            },
            'friends': {
              S: friends
            }
          },
          TableName: self.tableName,
          ReturnValues: 'NONE'
      };

      db.putItem(params, function(err, data){
        if (err)
          callback(err)
        else
          callback(null, self.inx)
      });
      self.inx++;
    }   
  };

  /**
   * Delete value matching the keyword and inx
   * 
   * @param keyword
   * @param inx
   * callback with value of entry that was deleted
   */
  keyvaluestore.prototype.remove = function(keyword, inx, callback) {
    var self = this;
    if (self.inx === -1){
      callback("Error using table - call init first!", null)
      return
    }
    
    self.cache.del(keyword);
    var params = {
        "Key": {
          "keyword": {
            S: keyword
          },
          "inx": {
            N: inx
          }
        },
        TableName: self.tableName,
        ReturnValues: 'ALL_OLD'
    };

    db.deleteItem(params, function(err, data){
      if (err || !data.Attributes){
        if (!err)
          err = "No such item " + keyword + " " + inx
        callback(err, null);
      }
      else{
        callback(null, {affiliation: data.Attributes.affiliation.S, birthday: data.Attributes.birthday.S, 
          firstName: data.Attributes.firstName.S, lastName: data.Attributes.lastName.S, email: data.Attributes.email.S,
          interests: data.Attributes.interests.S, status: data.Attributes.status.S, friends: data.Attributes.friends.S});
      }
    });
  };

  /**
   * Gets all of the keys by performing a scan.
   * Keys will always be treated as strings.
   * 
   * Callback with a list of objects with keys "key", "inx"
   */
  keyvaluestore.prototype.scanKeys = function(callback) {
    var self = this;
    
    var params = {
        TableName: self.tableName,
        AttributesToGet: ['keyword', 'inx', 'affiliation', 'friends', 'interests']
    };

    db.scan(params, function(err, data) {
      var values = [];
      
      if (!err) {
        for (var i = 0; i < data.Count; i++) {
          values.push({
            "key": data.Items[i].keyword['S'],
            "inx": data.Items[i].inx['N'],
            'affiliation': data.Items[i].affiliation['S'],
            'friends': data.Items[i].friends['S'],
            'interests': data.Items[i].interests['S']
          });
        }
      }
      
      callback(err, values);
    });
  };


  /**
   * Update entry matching the keyword and inx
   * Assumes that the existing value is a JSON string! 
   *
   * @param keyword
   * @param inx
   * @param attributes - dictionary of attributes to update
   */
  keyvaluestore.prototype.update = function(keyword, inx, attributes, callback) {
    var self = this;
    if (self.inx === -1){
      callback("Error using table - call init first!", null)
      return
    }
    self.remove(keyword, inx, function(err, data){
      if (err)
        callback(err, null);
      else {
        for (var attr in attributes) {
          if (attr === 'friends') {
            data[attr] = JSON.stringify(attributes[attr]);
          } else {
            data[attr] = attributes[attr]; 
          }
        }
        var params = {
            Item: {
              "keyword": {
                S: keyword
              },
              "inx": {
                N: inx.toString()
              },
              'affiliation': { 
                S: data.affiliation
              },
              'birthday': {
                S: data.birthday
              },
              'firstName': {
                S: data.firstName
              },
              'lastName': {
                S: data.lastName
              },
              'email': {
                S: data.email
              },
              'interests': {
                S: data.interests
              },
              'status': {
                S: data.status
              },
              'friends': {
                S: data.friends
              }
            },
            TableName: self.tableName,
            ReturnValues: 'NONE'
        };

        db.putItem(params, callback);
      }
    })
  };

  module.exports = keyvaluestore;
}());