var mongodb=require('./db');

function Post(name,qq,title,post){
    this.name=name;
    this.title=title;
    this.qq=qq;
    this.post=post;
}

module.exports=Post;

Post.prototype.save=function(callback){
    var date=new Date(),
        time=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10?'0'+
           date.getMinutes():date.getMinutes()) +':'+ date.getSeconds();
    var post={
        name:this.name,
        title:this.title,
        post:this.post,
        qq:this.qq,
        time:time,
        comments:[],
        pv:0,
        pz:0
    };
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.insert(post,{
                safe: true
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};

Post.get=function(name,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            var query={};
            if(name){
                query.name=name;
            }
            collection.find(query).sort({
                time:1
            }).toArray(function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
};

Post.getOne=function(name,time,title,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "time":time,
                "title":title
            },function(err,docs){
                if(docs){
                    collection.update({
                        "name":name,
                        "time":time,
                        "title":title
                    },{$inc:{pv:1}})
                }
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);

            });
        });
    });
};

Post.remove=function(name,time,title,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.remove({
                "name":name,
                "time":time,
                "title":title
            },function(err,docs){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            });
        });
    });
};

Post.update=function(name,time,title,post,callback){

    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name":name,
                "time":time,
                "title":title
            },{$set:{post:post}},function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};


Post.comments=function(name,time,title,comment,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name":name,
                "time":time,
                "title":title
            },{$push:{"comments":comment}},function(err){
                mongodb.close();
                if(err){
                    return callback(err)
                }
                callback(null)
            })
        })
    })
};

Post.reprint=function(name,toname,time,title,qq,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "time":time,
                "title":title
            },function(err,doc){

                if(err){
                    return callback(err);
                }
                if(doc){
                    collection.update({
                        "name":name,
                        "time":time,
                        "title":title
                    },{$inc:{pz:1}})
                }
                /*mongodb.close();*/
                var date=new Date(),
                    time1=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+
                        date.getSeconds();
                var post={
                    name:toname,
                    title:"[转自"+name+"]"+doc.title,
                    post:doc.post,
                    yz:name,
                    qq:qq,
                    time:time1,
                    comments:[],
                    pv:0
                };
                collection.insert(post,{safe:true},function(err){
                    mongodb.close();
                    if(err){
                        return callback(err)
                    }
                    callback(null);
                })

            });
        })
    })
};

Post.removec=(function(name,title,name1,time,callback){
    mongodb.open(function(err,db){
        if(err){
            return callback(err)
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callback(err);
            }
            collection.update({
                "name":name,
                "title":title
            },{
                $pull:{"comments":{"name":name1,"time":time}}
            },function(err){
                mongodb.close();
                if(err){
                    return callback(err);
                }
                return callback(null);
            })
        })
    })
})