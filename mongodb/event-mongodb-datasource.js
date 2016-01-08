var events = require('events');
var util = require('util');
var MongoClient = require("mongodb").MongoClient;

var url = "mongodb://localhost:27017/edao";

var db;
var status = 0;
var fns = [];

var MongoDb = function(to, data) {
    events.EventEmitter.call(this);
    this.data = data;
    this.to = to;
};

util.inherits(MongoDb, events.EventEmitter);

MongoDb.prototype.err = function(err) {
    console.error(err);
    this.emit('err', err);
};

MongoDb.prototype.start = function() {
    var self = this;

    var exeTable = function(to, obj) {
        var data = obj[to];
        var table = db.collection(data.table);
        var callback = function(err, rs) {
            if (err)
                self.err(err);
            else {
                data.fun(rs, function(go) {
                    if (go) {
                        exeTable(go, obj);
                    } else
                        self.end();
                });
            }
        };
        var findCallback = function(err, rs) {
            rs.toArray(function(err, rs) {
                callback(err, rs);
            });
        }
        var exeString = 'table.' + data.method + '(';
        if (data.param) {
            var tempData;
            if (data.param instanceof Function) {
                tempData = data.param();
            } else {
                tempData = data.param;
            }
            if (tempData instanceof Array) {
                for (var i = 0; i < tempData.length; i++) {
                    exeString += 'tempData[' + i + '],';
                }
            } else {
                exeString += 'tempData,';
            }
        }
        if (data.method === 'find') {
            exeString += 'findCallback)';
        } else {
            exeString += 'callback)';
        }
        eval(exeString);
    };

    if (db) {
        exeTable(self.to, self.data);
    } else if (status === 1) {
        fns.push({
            start: self.to,
            data: self.data
        });
    } else {
        status = 1;
        MongoClient.connect(url, {
            server: {
                poolSize: 10,
                socketOptions: {
                    autoReconnect: true
                },
                reconnectTries: 30,
                reconnectInterval: 1000
            }
        }, function(err, database) {
            if (err) {
                self.err(err);
            } else {
                db = database;
                exeTable(self.to, self.data);
                var temp;
                while (temp = fns.shift()) {
                    exeTable(temp.start, temp.data);
                }
            }
        });
    }
};

MongoDb.prototype.end = function() {
    this.emit('end');
};

MongoDb.prototype.close = function() {
    db.close();
};

module.exports = MongoDb;