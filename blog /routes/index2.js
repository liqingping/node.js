var crypto = require('crypto');
var User = require('../models/user.js');

module.exports = function(app){
  app.get('/',function(req,res){
    res.render('index',{
      title:'主页',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
    });
  app.get('/reg',checkNotLogin);
  app.get('/reg',function(req,res){
    res.render('reg',{
      title:'用户注册',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/reg',checkNotLogin);
  app.post('/reg',function(req,res){
    var name=req.body.name,
        password=req.body.password,
        password_re=req.body['password-repeat'];
    if(password!=password_re){
      req.flash('error','两次输入密码不一致!')
      return res.redirect('/reg');
    }
    if(password.length<=8){
      req.flash('error','密码太短')
      return res.redirect('/reg')
    }
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: req.body.name,
      password: password,
      email:req.body.email,
    });
    //检查用户名是否已经存在
    User.get(newUser.name, function(err, user) {
      if (user){
        req.flash('error', '用户已存在!');
        return res.redirect('/reg');
      }
      newUser.save(function(err,user){
        if(err){
          req.flash('error',err);
          return res.redirect('/reg');
        }
        req.session.user = newUser;
        req.flash('success', '注册成功');
        res.redirect('/');
      })
    })
  });
  app.get('/login',checkNotLogin);
  app.get('/login',function(req,res){
    res.render('login',{
      title:'用户登陆',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/login',checkNotLogin);
  app.post('/login',function(req,res){
    var md5 = crypto.createHash('md5');
    var password = md5.update(req.body.password).digest('hex');
    User.get(req.body.name, function(err, user) {
      if (!user) {
        req.flash('error', '用户不存在');
        return res.redirect('/login');
      }
      if (user.password != password) {
        req.flash('error', '用户密码错误');
        return res.redirect('/login');
      }
      req.session.user = user;
      req.flash('success', '登陆成功');
      res.redirect('/');
    });
  });
  app.get('/post',checkLogin);
  app.get('/post',function(req,res){
    res.render('post',{title:'发表文章',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.post('/post',checkLogin);
  app.post('/post',function(req,res){

  });
  app.get('/logout',checkLogin)
  app.get('/logout',function(req,res){
    req.session.user = null;
    req.flash('success', '登出成功');
    res.redirect('/');
  });




function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '未登陆');
    return res.redirect('/login');
  }
  next();
}
function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '已登陆');
    return res.redirect('/');
  }
  next();
}
};