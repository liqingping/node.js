var mongodb=require('./db');
var crypto=require('crypto');

function User(user){
    this.name=user.name;
    this.password=user.password;
    this.qq=user.qq;
}

module.exports=User;

User.prototype.save=function(callback){
    var user={
        name:this.name,
        password:this.password,
        qq:this.qq
    }
    mongodb.open(function(err,db){
        if(err){
            return callback(err)
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.insert(user,{
                safe:true
            },function(err,user){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                callback(null,user[0]);
            });
        });
    });
};
User.get=function(name,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({name:name},function(err,user){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                callback(null,user);
            });
        });
    });
}
User.update=function(name,passwordy,callback){
    var md5=crypto.createHash('md5'),
        password=md5.update(passwordy).digest('hex');
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('users',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({name:name},{$set:{password:password}},function(err){
                if(err){
                    mongodb.close();
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}