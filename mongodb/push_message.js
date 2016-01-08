var router = require('express').Router();
var properties = require('../../utilities/properties');
var Db = require('../../utilities/event-datasource');
var chatMessage = require('../../message/chat_message');
var MongoDB = require('../../utilities/event-mongodb-datasource');
var utils = require('../../utilities/utils');
var uCount = require('../../utilities/count');
var ObjectId = require('mongodb').ObjectID;
var appraise=require('../../utilities/appraise');
var format = require( 'date-format' );
/*
会诊基础资料修改
*/
router.post('/token/message/consultation/update', function(req, res, next) {
    console.log(req.body);
    if (!req.body.sessionid || !req.body.sessionid.isToken()) {
        res.send(properties.err.param);
        return;
    }

    var content = [];
    if (req.body.mobile && req.body.mobile.isMobile()) {
        content.push({
            type: 'link',
            content: req.body.mobile,
            des: 'mobile'
        });
    } else {
        res.send(properties.err.param);
        return;
    }
    if (req.body.url && req.body.time && req.body.time.isInt()) {
        content.push({
            type: 'sound',
            content: req.body.url,
            time: req.body.time,
            des: 'default'
        });
    } else if (req.body.content) {
        content.push({
            type: 'txt',
            content: req.body.content,
            des: 'default'
        });
    } else {
        res.send(properties.err.param);
        return;
    }

    if (req.body.cureURL && req.body.cureTime && req.body.cureTime.isInt()) {
        content.push({
            type: 'sound',
            content: req.body.cureURL,
            time: req.body.cureTime,
            des: 'cure'
        });
    } else if (req.body.cureContent) {
        content.push({
            type: 'txt',
            content: req.body.cureContent,
            des: 'cure'
        });
    }

    if (req.body.historyURL && req.body.historyTime && req.body.historyTime.isInt()) {
        content.push({
            type: 'sound',
            content: req.body.historyURL,
            time: req.body.historyTime,
            des: 'history'
        });
    } else if (req.body.historyContent) {
        content.push({
            type: 'txt',
            content: req.body.historyContent,
            des: 'history'
        });
    }

    if (req.body.cureImgs) {
        var imgs = req.body.cureImgs.split(',');
        for (var i in imgs) {
            content.push({
                type: 'cureImg',
                content: imgs[i]
            });
        }
    }

    if (req.body.historyImgs) {
        var imgs = req.body.historyImgs.split(',');
        for (var i in imgs) {
            content.push({
                type: 'historyImg',
                content: imgs[i]
            });
        }
    }

    if (req.body.imgs) {
        var imgs = req.body.imgs.split(',');
        for (var i in imgs) {
            content.push({
                type: 'img',
                content: imgs[i]
            });
        }
    }

    var errMessage;
    var mongoDB = new MongoDB('select', {
        select: {
            table: 'message_session',
            method: 'count',
            param: {
                sessionid: req.body.sessionid,
                sessionType: 'consultation',
                'users.uid': req.uid,
                status: 'consultation_waiting'
            },
            fun: function(rs, go) {
                if (rs === 0) {
                    errMessage = properties.err.param;
                    go();
                } else {
                    go('update')
                }
            }
        },
        update: {
            table: 'message_session',
            method: 'update',
            param: [{
                sessionid: req.body.sessionid,
                sessionType: 'consultation',
                'users.uid': req.uid,
                status: 'consultation_waiting'
            }, {
                '$set': {
                    initMessage: content
                }
            }],
            fun: function(rs, go) {
                go();
            }
        }
    });

    mongoDB.on('err', function(err) {
        res.send(properties.err.server);
    });


    mongoDB.on('end', function() {
        if (errMessage)
            res.send(errMessage)
        else
            res.send({
                code: 'SUCCESS',
                content: '成功'
            })
    });

    mongoDB.start();
});
/*
创建会话
*/
router.post('/token/message/create', function(req, res, next) {
    console.log('创建会话');
    console.log(req.body);
    if (!req.body.sessionType) {
        console.log(req.body.sessionType);
        res.send(properties.err.param);
        return;
    }
    console.log(req.body.sessionType);
    var content = [];
    switch (req.body.sessionType) {
        case 'shortcut': //快速
            if (req.body.url && req.body.time && req.body.time.isInt()) {
                content.push({
                    type: 'sound',
                    content: req.body.url,
                    time: req.body.time
                });
                break;
            } else if (req.body.content) {
                content.push({
                    type: 'txt',
                    content: req.body.content
                });
                break;
            } else {
                res.send(properties.err.param);
                return;
            }

            if (req.body.latitude && req.body.latitude.isFloat() && req.body.longitude && req.body.longitude.isFloat()) {
                break;
            } else {
                res.send(properties.err.param);
                return;
            }
        case 'proficient': // 专家
            if (req.body.url && req.body.time && req.body.time.isInt()) {
                content.push({
                    type: 'sound',
                    content: req.body.url,
                    time: req.body.time
                });
                break;
            } else if (req.body.content) {
                content.push({
                    type: 'txt',
                    content: req.body.content
                });
                break;
            } else {
                res.send(properties.err.param);
                return;
            }
        case 'chitchat': //普通聊天
            break;
        case 'consultation'://会诊
            if (req.body.mobile && req.body.mobile.isMobile()) {
                content.push({
                    type: 'link',
                    content: req.body.mobile,
                    des: 'mobile'
                });
            } else {
                res.send(properties.err.param);
                return;
            }
            if (req.body.url && req.body.time && req.body.time.isInt()) {
                content.push({
                    type: 'sound',
                    content: req.body.url,
                    time: req.body.time,
                    des: 'default'
                });
            } else if (req.body.content) {
                content.push({
                    type: 'txt',
                    content: req.body.content,
                    des: 'default'
                });
            } else {
                res.send(properties.err.param);
                return;
            }

            if (req.body.cureURL && req.body.cureTime && req.body.cureTime.isInt()) {
                content.push({
                    type: 'sound',
                    content: req.body.cureURL,
                    time: req.body.cureTime,
                    des: 'cure'
                });
            } else if (req.body.cureContent) {
                content.push({
                    type: 'txt',
                    content: req.body.cureContent,
                    des: 'cure'
                });
            }

            if (req.body.historyURL && req.body.historyTime && req.body.historyTime.isInt()) {
                content.push({
                    type: 'sound',
                    content: req.body.historyURL,
                    time: req.body.historyTime,
                    des: 'history'
                });
            } else if (req.body.historyContent) {
                content.push({
                    type: 'txt',
                    content: req.body.historyContent,
                    des: 'history'
                });
            }

            if (req.body.cureImgs) {
                var imgs = req.body.cureImgs.split(',');
                for (var i in imgs) {
                    content.push({
                        type: 'cureImg',
                        content: imgs[i]
                    });
                }
            }

            if (req.body.historyImgs) {
                var imgs = req.body.historyImgs.split(',');
                for (var i in imgs) {
                    content.push({
                        type: 'historyImg',
                        content: imgs[i]
                    });
                }
            }
            break;
        default:
            res.send(properties.err.param);
            return;
    }

    if (req.body.imgs) {
        var imgs = req.body.imgs.split(',');
        for (var i in imgs) {
            content.push({
                type: 'img',
                content: imgs[i]
            });
        }
    }
    if (req.user.role === 'patient') {//患者
            if(!req.body.familyId){
                req.body.familyId="";
            }
        
            var user = [];
            console.log(req.body.orderCode);
            var create = function(fn) {
                var session = {
                    users: user,
                    sessionType: req.body.sessionType,
                    orderCode:req.body.orderCode,
                    familyId: req.body.familyId,
                    content: content
                }

                if (req.body.longitude && req.body.latitude) {
                    session.lo = [parseFloat(req.body.longitude), parseFloat(req.body.latitude)];
                }

                chatMessage.createSession(session, function(err, rs) {
                    fn(err, rs)
                });
            }

            if (req.body.sessionType === 'proficient') {
                if (req.body.doctorId && req.body.doctorId.isToken()&&req.body.orderCode) {
                    var orderStatus = 0;
                    var db = new Db(false, 'orderCode', {
                        orderCode:{
                            sql:'select * from  order_record where out_trade_no=? and status=2',
                            data:[req.body.orderCode],
                            fun:function(rs,go){
                                if(rs.length>0){
                                    orderStatus = rs[0].status;
                                    console.log(orderStatus);
                                    go('query')
                                }else{
                                    error=properties.err.nullity
                                    go()
                                }
                            }
                        },
                        query: {
                            sql: 'select count(*) count from doctor_expand where userId = ? and authentication = 2',
                            data: [req.body.doctorId],
                            fun: function(rs, go) {
                                if (rs[0].count > 0) {
                                    user.push({
                                        uid: req.uid
                                    });
                                    user.push({
                                        uid: req.body.doctorId
                                    });
                                }
                                go();
                            }
                        }
                    });

                    db.on('err', function(err) {
                        res.send(properties.err.server);
                    });

                    db.on('end', function() {
                        uCount.dQuiz();
                        if (user.length > 0) {
                            create(function(err, rs) {
                                if (err)
                                    res.send(properties.err.param);
                                else {
                                    var content = {
                                        type: req.body.sessionType + '_talk',
                                        sessionid: rs,
                                        send: req.uid,
                                        to: req.body.doctorId,
                                        time: new Date().getTime(),
                                        getcount: 0,
                                        familyId: req.body.familyId,
                                        sessionType: req.body.sessionType,
                                        lastGetTime: new Date().getTime()
                                    };
                                    var time=format('yyyy-MM-dd hh:mm:ss', new Date());
                                    console.warn("专家医生");
                                    var db = new Db(false,'query',{
                                        query:{
                                            sql:"select count(*) count from user_appraise where sessionid= ? and status=0",
                                            data:[content.sessionid],
                                            fun:function(rs,go){
                                                var count=rs[0].count;
                                                if(count>0){
                                                    go();
                                                }else{
                                                    go('insert');
                                                }
                                            }
                                        },
                                        insert:{
                                            sql:" insert user_appraise(status,createTime,endTime,sessionid,userId,doctorId) values(?,?,?,?,?,?)",
                                            data:[0,time,time,content.sessionid,content.send,content.to],
                                            fun:function(rs,go){
                                                console.warn("zhangq");
                                                go();
                                            }
                                        },
                                    });
                                    db.on( 'err', function( err ) {
                                        var error = new Error();
                                        error.status = 500;
                                        next( error );
                                    } );
                                    db.on( 'end', function() {
                                        console.log('搞定');
                                    } );
                                    db.start();
                                    var mongodb = new MongoDB('push', {
                                        push: {
                                            table: 'message_history',
                                            method: 'insert',
                                            param: content,
                                            fun: function(rs, go) {
                                                process.send({
                                                    code: 'one_one',
                                                    content: content
                                                });
                                                go();
                                            }
                                        }
                                    });

                                    mongodb.on('err', function(err) {
                                        res.send(properties.err.server);
                                    });

                                    mongodb.on('end', function() {
                                        res.send({
                                            code: 'SUCCESS',
                                            content: rs
                                        });
                                    });

                                    mongodb.start();
                                }
                            });
                        } else {
                            res.send(properties.err.notexist);
                        }
                    });
                    db.start();

                } else {
                    res.send(properties.err.param);
                    return;
                }
            } else if (req.body.sessionType === 'consultation') {
                user.push({
                    uid: req.uid
                });
                create(function(err, rs) {
                    if (err){
                        res.send(properties.err.param);
                    }
                    else {
                        uCount.user_consultation();
                        res.send({
                            code: 'SUCCESS',
                            content: rs
                        });
                    }
                });
            } else {
                user.push({
                    uid: req.uid
                });
                
                create(function(err, rs) {
                    if (err){
                        res.send(properties.err.param);
                    }
                    else{
                        
                        uCount.dQuiz();
                        
                                    res.send({
                                        code: 'SUCCESS',
                                        content: rs
                                    });
                                }
                            });
            }
        
    } else {//医生
        if (req.body.patientId && req.body.patientId.isToken()) {
            var err = false;
            var errMessage;
            var result;
            var db = new Db(false, 'exist', {
                exist: {
                    sql: 'select * from user_relation where doctorId = ? and patientId = ? and status = 1',
                    data: [req.uid, req.body.patientId],
                    fun: function(rs, go) {
                        if (rs.length == 0) {
                            err = true;
                            errMessage = properties.err.param;
                        } else {
                            result = rs[0]
                        }
                        go();
                    }
                }
            });

            db.on('err', function(err) {
                res.send(properties.err.server);
            });

            db.on('end', function() {

                if (err) {
                    res.send(errMessage);
                } else {
                    
                    var mongodb = new MongoDB('find', {
                        find: {
                            table: 'message_session',
                            method: 'findOne',
                            param: {
                                users: {
                                    '$all': [{
                                        uid: req.body.patientId
                                    }, {
                                        uid: req.uid
                                    }]
                                },
                                sessionType: 'chitchat',
                            },
                            fun: function(rs, go) {
                                if (!rs) {
                                    chatMessage.createSession({
                                        users: [{
                                            uid: req.uid
                                        }, {
                                            uid: result.patientId
                                        }],
                                        sessionType: 'chitchat'
                                    }, function(err, sessionid) {
                                        if (err)
                                            res.send(properties.err.server);
                                        else
                                            res.send({
                                                code: 'SUCCESS',
                                                content: sessionid
                                            });
                                        res.end();
                                    });
                                } else {
                                    res.send({
                                        code: 'SUCCESS',
                                        content: rs.sessionid
                                    });
                                    res.end();
                                }
                            }
                        }
                    });

                    mongodb.on('err', function(err) {
                        res.send(properties.err.server);
                    });


                    mongodb.on('end', function() {

                    });

                    mongodb.start();
                }
                
            });

            db.start();
        } else {
            res.send(properties.err.param);
        }
    }
});


/**
 *  create message_session Index
 *  db.message_session.ensureIndex({sessionType:1})
 *  db.message_session.ensureIndex({status:1})
 *  db.message_session.ensureIndex({lo:'2dsphere'})
 *  db.message_session.ensureIndex({users:1})
 */
 /*
周围快速问诊用户列表
 */
router.post('/token/message/shortcut/list', function(req, res, next) {
    var findDoctor = function(fn) {
        var db = new Db(false, 'find', {
            find: {
                sql: 'select authentication from doctor_expand where userId = ?',
                data: [req.uid],
                fun: function(rs, go) {
                    if (rs.length > 0 && rs[0].authentication === 2) {
                        fn();
                    } else {
                        res.send({
                            code: 'SUCCESS',
                            content: []
                        });
                    }
                }
            }
        });

        db.on('err', function(err) {
            res.send(properties.err.server);
        });


        db.on('end', function() {
            fn();
        });

        db.start();
    }

    if (req.body.latitude && req.body.latitude.isFloat() && req.body.longitude && req.body.longitude.isFloat() && req.user.role === 'doctor') {
        findDoctor(function() {
            var result;
            var mongodb = new MongoDB('remove', {
                remove: {
                    table: 'message_session',
                    method: 'find',
                    param: [{
                        sessionType: 'shortcut',
                        status: 'talking',
                        users: {
                            '$size': 1
                        },
                        lo: {
                            '$geoWithin': {
                                '$centerSphere': [
                                    [parseFloat(req.body.longitude), parseFloat(req.body.latitude)], 0.0006214 / 3963.2 * 80000
                                ]
                            }
                        }
                    }, {
                        sort: {
                            _id: 1
                        },
                        limit: 5
                    }],
                    fun: function(rs, go) {
                        result = rs;
                        go();
                    }
                }
            });

            mongodb.on('err', function(err) {
                res.send(properties.err.server);
            });

            mongodb.on('end', function() {
                res.send({
                    code: 'SUCCESS',
                    content: result
                });
            });

            mongodb.start();
        });
    } else {
        res.send(properties.err.param);
    }

});
/*周围快速问诊用户列表*/
router.post('/token/message/shortcut', function(req, res, next) {
    if (req.body.uid && req.body.sessionid && req.body.uid.isToken() && req.body.sessionid.isToken()) {
        var modified = 0;
        var content;
        var mongodb = new MongoDB('update', {
            update: {
                table: 'message_session',
                method: 'update',
                param: [{
                    sessionid: req.body.sessionid,
                    users: [{
                        uid: req.body.uid
                    }]
                }, {
                    '$inc': {
                        version: 1
                    },
                    '$addToSet': {
                        users: {
                            uid: req.uid
                        }
                    }
                }],
                fun: function(rs, go) {
                    modified = rs.result.nModified
                    if (modified > 0) {
                        go('push');
                    } else {
                        go();
                    }
                }
            },
            push: {
                table: 'message_history',
                method: 'insert',
                param: function() {
                    content = {
                        type: 'talk_open',
                        send: req.uid,
                        to: req.body.uid,
                        sessionid: req.body.sessionid
                    }
                    return content;
                },
                fun: function(rs, go) {
                    go()
                }
            }
        });

        mongodb.on('err', function(err) {
            res.send(properties.err.server);
        });

        mongodb.on('end', function() {
            if (modified > 0) {
                process.send({
                    code: 'one_one',
                    content: content
                });
                res.send({
                    code: 'SUCCESS',
                    content: '成功'
                });
            } else
                res.send(properties.err.param);
        });

        mongodb.start();
    } else {
        res.send(properties.err.param);
    }
});
/*
关闭会诊 consultation_info
>**sessionid** 会话id
>**result** 会诊结果
>**uuid** 会诊id
*/
router.post('/token/message/consultation/close', function(req, res, next) {
    if (req.body.sessionid && req.body.sessionid.isToken() && req.body.result && req.body.uuid) {
        var updateResult = function() {
            var db = new Db(false, 'update', {
                update: {
                    sql: 'update consultation_info set result = ? where uuid = ? and sessionid = ?',
                    data: [req.body.result, req.body.uuid, req.body.sessionid],
                    fun: function(rs, go) {
                        go();
                    }
                }
            });

            db.on('err', function() {
                res.send(properties.err.server)
            });

            db.on('end', function() {
                uCount.doctor_consultation();
                res.send({
                    code: 'SUCCESS',
                    content: '成功'
                });
            });

            db.start();
        }
        var result
        var pushContent = []
        var pushCount = 0;
        var mongodb = new MongoDB('find', {
            find: {
                table: 'message_session',
                method: 'findOne',
                param: {
                    sessionid: req.body.sessionid,
                    foreman: req.uid,
                    sessionType: 'consultation',
                    consultationPorject: req.body.uuid,
                    status:'consultation_talking'
                },
                fun: function(rs, go) {
                    if (rs) {
                        result = rs
                        go('update')
                    } else {
                        go()
                    }
                }
            },
            update: {
                table: 'message_session',
                method: 'update',
                param: [{
                    sessionid: req.body.sessionid,
                    foreman: req.uid,
                    sessionType: 'consultation'
                }, {
                    '$set': {
                        status: 'consultation_close'
                    }
                }],
                fun: function(rs, go) {
                    for (var i in result.users) {
                        if (result.users[i].uid !== req.uid) {
                            pushContent.push({
                                type: 'consultation_close',
                                send: req.uid,
                                to: result.users[i].uid,
                                sessionid: req.body.sessionid
                            });
                        }
                    }
                    go('push')
                }
            },
            push: {
                table: 'message_history',
                method: 'insert',
                param: function() {
                    return pushContent[pushCount];
                },
                fun: function(rs, go) {
                    process.send({
                        code: 'one_one',
                        content: pushContent[pushCount]
                    });
                    pushCount++
                    if (pushCount < pushContent.length) {
                        go('push')
                    } else
                        go();
                }
            }
        });

        mongodb.on('err', function(err) {
            res.send(properties.err.server);
        });

        mongodb.on('end', function() {
            if (result) {
                updateResult();
            } else {
                res.send(properties.err.close);
            }
        });

        mongodb.start();
    } else {
        res.send(properties.err.param);
    }
});
/*
聊天关闭 mongodb
*/
router.post('/token/message/shortcut/close', function(req, res, next) {
    if (req.user.role === 'doctor' && req.body.sessionid && req.body.sessionid.isToken()) {
        var result;
        var content;
        var mongodb = new MongoDB('find', {
            find: {
                table: 'message_session',
                method: 'findOne',
                param: {
                    sessionid: req.body.sessionid,
                    'users.uid': req.uid,
                    '$or': [{
                        sessionType: 'shortcut'
                    }, {
                        sessionType: 'proficient'
                    }]
                },
                fun: function(rs, go) {
                    if (rs) {
                        result = rs;
                        go('update')
                    } else {
                        go();
                    }
                }
            },
            update: {
                table: 'message_session',
                method: 'update',
                param: [{
                    sessionid: req.body.sessionid,
                    'users.uid': req.uid,
                    '$or': [{
                        sessionType: 'shortcut'
                    }, {
                        sessionType: 'proficient'
                    }]
                }, {
                    '$set': {
                        status: 'close'
                    }
                }],
                fun: function(rs, go) {
                    
                    go('push');
                }
            },
            push: {
                table: 'message_history',
                method: 'insert',
                param: function() {
                    for (var i in result.users) {
                        if (result.users[i].uid !== req.uid) {
                            content = {
                                type: 'talk_close',
                                send: req.uid,
                                to: result.users[i].uid,
                                sessionid: req.body.sessionid
                            }
                        }
                    }
                    return content;
                },
                fun: function(rs, go) {
                    go();
                }
            }
        });

        mongodb.on('err', function(err) {
            res.send(properties.err.server);
        });

        mongodb.on('end', function() {
            if (result) {
                for (var i in result.users) {
                    if (result.users[i].uid !== req.uid) {
                        process.send({
                            code: 'one_one',
                            content: content
                        });
                    }
                }
                var orderCode =result.orderCode ;
                var db = new Db(false,'query',{
                    query:{
                        sql:' select count(*) count from order_record where status = 2 and out_trade_no=? ',
                        data:[orderCode],
                        fun:function(rs,go){
                            if(rs[0].count>0){
                                go('update');
                            }else{
                                res.send(properties.err.close);
                            }
                        }
                    },
                    update:{
                        sql:' update order_record set status=3 where status = 2 and out_trade_no=? ',
                        data:[orderCode],
                        fun:function(rs,go){
                            go()
                        }
                    }
                });
                db.on( 'err', function( err ) {
                    var error = new Error();
                    error.status = 500;
                    next( error );
                } );
                db.on( 'end', function() {
                    res.send({
                        code: 'SUCCESS',
                        content: '成功'
                    });
                } );
                db.start();
                
            } else {
                res.send(properties.err.close);
            }
        });

        mongodb.start();
        var db = new Db(false,'query',{
            query:{
                sql:"select count(*) count from user_appraise where sessionid= ? and status !=2",
                data:[req.body.sessionid],
                fun:function(rs,go){
                    var count=rs[0].count;
                    if(count>0){
                        go('update');
                    }else{
                        go();
                    }
                }
            },
            update:{
                sql:" update user_appraise set num=?,status=?,endTime=? where sessionid= ? ",
                data:[0,2,format('yyyy-MM-dd hh:mm:ss', new Date()),req.body.sessionid],
                fun:function(rs,go){
                    go();
                }
            }
        });
        db.on( 'err', function( err ) {
            var error = new Error();
            error.status = 500;
            next( error );
        } );
        db.on( 'end', function() {
            console.log('记录添加成功');
        } );
        db.start();
    } else {
        res.send(properties.err.param);
    }
});
/*
聊天消息推送
*/
router.post('/token/message/push', function(req, res, next) {
    var err = false;
    var errMessage;
    var content;
    if (req.body.type && req.body.sessionid) {
        switch (req.body.type) {
            case 'txt':
            case 'img':
                if (!req.body.content) {
                    err = true;
                    errMessage = properties.err.param;
                } else {
                    content = {
                        type: req.body.type,
                        content: req.body.content
                    }
                }
                break;
            case 'sound':
                if (!req.body.content || !req.body.time || !req.body.time.isInt()) {
                    err = true;
                    errMessage = properties.err.param;
                } else {
                    content = {
                        type: req.body.type,
                        content: req.body.content,
                        time: req.body.time
                    }
                }
                break;
                break;
            case 'web':
                if (!req.body.content || !req.body.url) {
                    err = true;
                    errMessage = properties.err.param;
                } else {
                    content = {
                        type: req.body.type,
                        content: req.body.content,
                        img: req.body.img,
                        url: req.body.url
                    }
                }
                break;
            default:
                err = true;
                errMessage = properties.err.param;
                break;
        }
    } else {
        err = true;
        errMessage = properties.err.param;
    }

    if (err) {
        res.send(errMessage)
        return
    }
    var result = [];
    var nowContent;
    var message=[];
    var mongodb = new MongoDB('query', {
        query: {
            table: 'message_session',
            method: 'findOne',
            param: {
                sessionid: req.body.sessionid,
                'users.uid': req.uid
            },
            fun: function(rs, go) {
                if (rs && rs.status === 'talking') {
                    for (var i in rs.users) {
                        if (rs.users[i].uid !== req.uid) {
                            result.push({
                                type: rs.sessionType + '_talk',
                                sessionid: req.body.sessionid,
                                send: req.uid,
                                to: rs.users[i].uid,
                                time: new Date().getTime(),
                                content: content,
                                read: false,
                                getcount: 0,
                                sessionType: rs.sessionType,
                                lastGetTime: new Date().getTime()
                            });
                            message.push({
                                type: rs.sessionType + '_talk',
                                sessionid: req.body.sessionid,
                                send: req.uid,
                                to: rs.users[i].uid,
                                time: new Date().getTime(),
                                content: content,
                                read: false,
                                getcount: 0,
                                sessionType: rs.sessionType,
                                lastGetTime: new Date().getTime()
                            });
                        }
                    }
                    go('push');
                } else if (rs && rs.status === 'consultation_talking') {
                    if (new Date().getTime() >= rs.startTime) {
                        for (var i in rs.users) {
                            if (rs.users[i].uid !== req.uid) {
                                result.push({
                                    type: rs.sessionType + '_talk',
                                    sessionid: req.body.sessionid,
                                    send: req.uid,
                                    to: rs.users[i].uid,
                                    time: new Date().getTime(),
                                    content: content,
                                    read: false,
                                    getcount: 0,
                                    sessionType: rs.sessionType,
                                    lastGetTime: new Date().getTime()
                                });
                            }
                        }

                        go('push');
                    } else {
                        err = true;
                        errMessage = properties.err.time;
                        go();
                    }
                } else {
                    err = true;
                    errMessage = properties.err.push;
                    go();
                }
            }
        },
        push: {
            table: 'message_history',
            method: 'insert',
            param: function() {
                nowContent = result.shift();
                return nowContent;
            },
            fun: function(rs, go) {
                process.send({
                    code: 'one_one',
                    content: nowContent
                });
                if (result.length > 0)
                    go('push')
                else
                    go();
            }
        }
    });

    mongodb.on('err', function(err) {
        res.send(properties.err.server);
    });

    mongodb.on('end', function() {
        if (err) {
            res.send(errMessage)
        } else{
            var db = new Db(false, 'query', {
                query: {
                    sql: 'select role from user_info where uid = ?',
                    data: [req.uid],
                    fun: function(rs, go) {
                        if(rs[0].role=='doctor'){
                            uCount.dReply();
                        };
                    }
                }
            });

            db.on('err', function(err) {
                res.send(properties.err.server);
            });

            db.on('end', function() {
               
            });

            db.start();
             res.send({
                code: 'SUCCESS',
                content: '成功'
            });
        }
           
    });

    mongodb.start();
    var time=format('yyyy-MM-dd hh:mm:ss', new Date());
   
    var db = new Db(false,'judge',{
        judge:{
            sql:"select count(*) count from user_info where uid=? and role='doctor'",
            data:[req.uid],
            fun:function(rs,go){
                var count=rs[0].count;
                if(count>0){
                    go('query');
                }else{
                    go();
                }
            }
        },
        query:{
            sql:"select count(*) count from user_appraise  where sessionid= ?  ",
            data:[req.body.sessionid],
            fun:function(rs,go){
                var count=rs[0].count;
                if(count>0){
                    go('update');
                }else{
                    go("insert");
                }
            }
        },
        insert:{
            sql:" insert user_appraise(status,createTime,endTime,sessionid,userId,doctorId) values(?,?,?,?,?,?)  ",
            data:[1,time,time,req.body.sessionid,message.send,message.to],
            fun:function(rs,go){
                console.warn("抛单");
                go();
            }
        },
        update:{
            sql:" update user_appraise set status=?,endTime=? where sessionid= ? ",
            data:[1,time,req.body.sessionid],
            fun:function(rs,go){
                go();
            }
        }
    });
    db.on( 'err', function( err ) {
        var error = new Error();
        error.status = 500;
        next( error );
    } );
    db.on( 'end', function() {
        console.log('记录添加成功');
    } );
    db.start();
});
/*
 会话详情
*/
router.post('/token/message/session', function(req, res, next) {
    if (req.body.sessionid && req.body.sessionid.isToken()) {
        var result;
        var mongodb = new MongoDB('findOne', {
            findOne: {
                table: 'message_session',
                method: 'findOne',
                param: {
                    sessionid: req.body.sessionid
                },
                fun: function(rs, go) {
                    result = rs;
                    go();
                }
            }
        });

        mongodb.on('err', function(err) {
            res.send(properties.err.server);
        });

        mongodb.on('end', function() {
            res.send({
                code: 'SUCCESS',
                content: result
            });
        });

        mongodb.start();
    } else {
        res.send(properties.err.param);
    }
});
/*
会话历史
*/
router.post('/token/message/history', function(req, res, next) {
    if (req.body.sessionid && req.body.sessionid.isToken()) {
        var err = false;
        var errMessage;
        if (req.body.page && req.body.page.isInt()) {
            req.body.page--;
        } else {
            req.body.page = 0;
        }
        var count = 0;
        var result = [];
        var mongodb = new MongoDB('findOne', {
            findOne: {
                table: 'message_session',
                method: 'findOne',
                param: {
                    sessionid: req.body.sessionid
                },
                fun: function(rs, go) {
                    if (!rs) {
                        err = true;
                        errMessage = properties.err.param
                        go();
                    } else {
                        go('count')
                    }
                }
            },
            count: {
                table: 'message_history',
                method: 'count',
                param: {
                    sessionid: req.body.sessionid
                },
                fun: function(rs, go) {
                    count = rs;
                    if (count > 0)
                        go('history')
                    else
                        go();
                }
            },
            history: {
                table: 'message_history',
                method: 'find',
                param: [{
                    sessionid: req.body.sessionid
                }, {
                    sort: {
                        '_id': 1
                    },
                    limit: 10,
                    skip: req.body.page * 10
                }],
                fun: function(rs, go) {
                    result = rs;
                    go();
                }
            }
        });

        mongodb.on('err', function(err) {
            res.send(properties.err.server);
        });

        mongodb.on('end', function() {
            if (err) {
                res.send(errMessage)
            } else
                res.send({
                    code: 'SUCCESS',
                    content: utils.page(result, count, req.body.page, 10)
                });
        });

        mongodb.start();
    } else {
        res.send(properties.err.param);
    }
});
/*
 会话列表
*/
router.post('/token/message/session/list', function(req, res, next) {
    if (req.body.page && req.body.page.isInt()) {
        req.body.page--
    } else {
        req.body.page = 0;
    }
    var count = 0;
    var result = [];

    var appraise = function() {
        var i = 0;
        var db = new Db(false, 'query', {
            query: {
                sql: 'select num from user_appraise where sessionid = ?',
                data: [result[i].sessionid],
                fun: function(rs, go) {
                    if (rs.length > 0) {
                        result[i].num = rs[0].num===null?0:rs[0].num
                    } else {
                        result[i].num = 0;
                    }
                    i++;
                    if (i < result.length) {
                        go('query', [result[i].sessionid])
                    } else {
                        go();
                    }
                }
            }
        });

        db.on('err', function(err) {
            res.send(properties.err.server);
        });

        db.on('end', function() {
           
            res.send({
                code: 'SUCCESS',
                content: result
            });
        })

        db.start();
    }
    var mongodb = new MongoDB('find', {
        find: {
            table: 'message_session',
            method: 'find',
            param: function() {
                var param = [{
                    'users.uid': req.uid
                }, {
                    sort: {
                        '_id': -1
                    },
                    limit: 10,
                    skip: req.body.page * 10
                }];

                if (req.body.type && req.body.type === 'oneToOne') {
                    param[0]['$or'] = [{
                        sessionType: 'shortcut'
                    }, {
                        sessionType: 'proficient'
                    }]
                } else {
                    param[0].sessionType = 'consultation'
                }
                return param;
            },
            fun: function(rs, go) {
                result = rs;
                go();
            }
        }
    });

    mongodb.on('err', function(err) {
        res.send(properties.err.server);
    });

    mongodb.on('end', function() {
        if (result.length > 0) {
            appraise()
        } else
            res.send({
                code: 'SUCCESS',
                content: result
            });
    });

    mongodb.start();
});
/*
我的问诊数
*/
router.get('/token/my/session/count', function(req, res, next) {
    var count = 0;
    var mongodb = new MongoDB('count', {
        count: {
            table: 'message_session',
            method: 'count',
            param: {
                '$or': [{
                    sessionType: 'shortcut'
                }, {
                    sessionType: 'proficient'
                }],
                'users.uid': req.uid
            },
            fun: function(rs, go) {
                count = rs;
                go();
            }
        }
    });

    mongodb.on('err', function(err) {
        res.send(properties.err.server);
    });

    mongodb.on('end', function() {
        
        res.send({
            code: 'SUCCESS',
            content: count
        });
    });

    mongodb.start();
});
/*
医生问诊数
*/
router.post('/doctor/session/count', function(req, res, next) {
    if (req.body.doctorId.isToken && req.body.doctorId.isToken()) {
        var count = 0;
        var mongodb = new MongoDB('count', {
            count: {
                table: 'message_session',
                method: 'count',
                param: {
                    '$or': [{
                        sessionType: 'shortcut'
                    }, {
                        sessionType: 'proficient'
                    }],
                    'users.uid': req.uid
                },
                fun: function(rs, go) {
                    count = rs;
                    go();
                }
            }
        });

        mongodb.on('err', function(err) {
            res.send(properties.err.server);
        });

        mongodb.on('end', function() {

            res.send({
                code: 'SUCCESS',
                content: count
            });
        });

        mongodb.start();
    } else {
        res.send(properties.err.param)
    }
});
/*
最近咨询
*/
router.post('/doctor/session/newest', function(req, res, next) {
    if (req.body.doctorId && req.body.doctorId.isToken()) {
        var result
        var mongodb = new MongoDB('find', {
            find: {
                table: 'message_session',
                method: 'find',
                param: [{
                    'users.uid': req.body.doctorId,
                    '$or': [{
                        sessionType: 'shortcut'
                    }, {
                        sessionType: 'proficient'
                    }],
                    status: 'close'
                }, {
                    sort: {
                        _id: -1
                    },
                    limit: 3
                }],
                fun: function(rs, go) {
                    result = rs;
                    go();
                }
            }
        });

        mongodb.on('err', function(err) {
            res.send(properties.err.server);
        });

        mongodb.on('end', function() {
            
            res.send({
                code: 'SUCCESS',
                content: result
            });
        });

        mongodb.start();
    } else {
        res.send(properties.err.param)
    }
});
/*
会话历史
*/
router.post('/message/history', function(req, res, next) {
    if (req.body.sessionid && req.body.sessionid.isToken()) {
        var err = false;
        var errMessage;
        if (req.body.page && req.body.page.isInt()) {
            req.body.page--;
        } else {
            req.body.page = 0;
        }
        var count = 0;
        var result = [];
        var mongodb = new MongoDB('findOne', {
            findOne: {
                table: 'message_session',
                method: 'findOne',
                param: {
                    sessionid: req.body.sessionid
                },
                fun: function(rs, go) {
                    if (rs) {
                        err = true;
                        errMessage = properties.err.param
                        go();
                    } else {
                        go('count')
                    }
                }
            },
            count: {
                table: 'message_history',
                method: 'count',
                param: {
                    sessionid: req.body.sessionid
                },
                fun: function(rs, go) {
                    count = rs;
                    if (count > 0)
                        go('history')
                    else
                        go();
                }
            },
            history: {
                table: 'message_history',
                method: 'find',
                param: [{
                    sessionid: req.body.sessionid
                }, {
                    sort: {
                        '_id': -1
                    },
                    limit: 10,
                    skip: req.body.page * 10
                }],
                fun: function(rs, go) {
                    result = rs;
                    for (var i in result) {
                        if (result[i].content.type === 'img') {
                            result[i].content.content = ''
                        }
                    }
                    go();
                }
            }
        });

        mongodb.on('err', function(err) {
            res.send(properties.err.server);
        });

        mongodb.on('end', function() {
            res.send({
                code: 'SUCCESS',
                content: utils.page(result, count, req.body.page, 10)
            });
        });

        mongodb.start();
    } else {
        res.send(properties.err.param);
    }
});
/*
消息收到确认
*/
router.post('/token/message/read', function(req, res, next) {
    if (req.body.messageids) {
        var ids = req.body.messageids.split(',')
        var err = false;
        for (var t in ids) {
            if (ids[t].length != 12 && ids[t].length != 24) {
                err = true
            }
        }
        if (err) {
            res.send(properties.err.param)
            return;
        }
        var mongodb = new MongoDB('update', {
            update: {
                table: 'message_history',
                method: 'update',
                param: function() {
                    var id = [];
                    for (var i in ids) {
                        id.push(new ObjectId(ids[i]));
                    }
                    return [{
                        '_id': {
                            '$in': id
                        },
                        to: req.uid
                    }, {
                        '$set': {
                            read: true
                        }
                    }, {
                        multi: true
                    }]
                },
                fun: function(rs, go) {
                    go();
                }
            }
        });

        mongodb.on('err', function(err) {
            res.send(properties.err.server);
        });

        mongodb.on('end', function() {
            res.send({
                code: 'SUCCESS',
                content: '成功'
            });
        });

        mongodb.start();
    } else {
        res.send(properties.err.param);
    }
});
/*
多人推送 
>**uids** `,`分割
>**type** `txt` `img` `sound` `web`
>**content** `txt` `img` `sound` `web` 必传
>**url** `web` 必传
>**img** `web` 图片地址，选传
>**time** `sound` 必传
*/
router.post('/token/message/push/all', function(req, res, next) {
    if (req.user.role === 'doctor') {
        if (req.body.uids && req.body.type) {

            var err = false;
            var errMessage;
            switch (req.body.type) {
                case 'txt':
                case 'img':
                    if (!req.body.content) {
                        err = true;
                        errMessage = properties.err.param;
                    } else {
                        content = {
                            type: req.body.type,
                            content: req.body.content
                        }
                    }
                    break;
                case 'sound':
                    if (!req.body.content || !req.body.time || !req.body.time.isInt()) {
                        err = true;
                        errMessage = properties.err.param;
                    } else {
                        content = {
                            type: req.body.type,
                            content: req.body.content,
                            time: req.body.time
                        }
                    }
                    break;
                case 'web':
                    if (!req.body.content || !req.body.url) {
                        err = true;
                        errMessage = properties.err.param;
                    } else {
                        content = {
                            type: req.body.type,
                            content: req.body.content,
                            img: req.body.img,
                            url: req.body.url
                        }
                    }
                    break;
                default:
                    err = true;
                    errMessage = properties.err.param;
                    break;
            }

            if (err) {
                res.send(errMessage)
                return;
            }

            var ids = req.body.uids.split(',');
            var push = function(pu) {
                var contents = []
                var i = 0;
                var mongodb = new MongoDB('insert', {
                    insert: {
                        table: 'message_history',
                        method: 'insert',
                        param: function() {
                            contents.push({
                                type: pu[i].familyDoctor === 1 ? 'doctor_family_push' : 'doctor_push',
                                send: req.uid,
                                to: pu[i].patientId,
                                time: new Date().getTime(),
                                content: content,
                                read: false,
                                getcount: 0,
                                lastGetTime: new Date().getTime()
                            });
                            return contents[i];
                        },
                        fun: function(rs, go) {
                            process.send({
                                code: 'one_one',
                                content: contents[i]
                            });
                            i++
                            if (i < pu.length)
                                go('insert')
                            else
                                go();
                        }
                    }
                });

                mongodb.on('err', function(err) {
                    res.send(properties.err.server)
                });

                mongodb.on('end', function() {
                    res.send({
                        code: 'SUCCESS',
                        content: '成功'
                    })

                });

                mongodb.start();
            }
            var p;
            var db = new Db(false, 'query', {
                query: {
                    sql: 'select patientId,familyDoctor from user_relation where doctorId = ? and patientId in (?)',
                    data: [req.uid, ids],
                    fun: function(rs, go) {
                        if (rs.length > 0) {
                            p = rs;
                        }
                        go();
                    }
                }
            });

            db.on('err', function(err) {
                res.send(properties.err.param)
            });

            db.on('end', function() {
                if (p) {
                    push(p)
                } else {
                    res.send({
                        code: 'SUCCESS',
                        content: '成功'
                    })
                }
            })

            db.start();
        } else {
            res.send(properties.err.param)
        }
    } else {
        res.send(properties.err.account)
    }

});

module.exports = router;