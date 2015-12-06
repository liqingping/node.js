var crypto=require('crypto');
var mongoose=require('mongoose');
var db = mongoose.createConnection('localhost','blog');

var commentssc=new mongoose.Schema({//创建留言内容结构
      name:String,
      time:String,
      connect:String
})

var postmodle=db.model('post',{//创建文章模型
  name:String,
  title:String,
  qq:Number,
  post:String,
  time:String,
  comments:[commentssc],
  pv:Number,
  pz:Number
});

var usermodle=db.model('user',{//创建用户模型
  name:String,
  password:String,
  qq:Number
});

var date=new Date();
var time1=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10?'0'+
        date.getMinutes():date.getMinutes()) +':'+ date.getSeconds();//获取当前时间
var re=/<[^<>]+>|herf|http:|update|remove|insert/g;//防止xss攻击

module.exports=function(app){
  app.get('/',function(req,res){
    postmodle.find({},function(err,posts){
      if(err){
        posts=[];
      }
    res.render('index', {//主页内容
      title: '主页',
      user: req.session.user,
      posts: posts,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
    });
  });
  app.get('/reg',checkNotLogin);//用户注册页面
  app.get('/reg',function(req,res){
    res.render('reg',{
      title:'注册',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/reg',checkNotLogin);
  app.post('/reg',function(req,res){
    var name=req.body.user.replace(re,""),
        password=req.body.password,
        repassword=req.body.repassword;
    if(name==""){                        //对用户输入信息进行校验
      req.flash('error','用户名不能为空!');
      return res.redirect('/reg');
    }
    if(password.length<8){
      req.flash('error','密码太短!');
      return res.redirect('/reg');
    }
    if(password!=repassword){
      req.flash('error','两次密码不一致!');
      return res.redirect('/reg');
    }
    var md5=crypto.createHash('md5'),
        password=md5.update(req.body.password).digest('hex');

    usermodle.findOne({'name':req.body.user},function(err,doc){
      if(doc){
        console.log(doc)
        req.flash('error','该账号已存在!');
        return res.redirect('/reg');
      }
      var userentity=new usermodle({   //将用户信息存入数据库
        name:name,
        password:password,
        qq:req.body.qq
      })
      userentity.save(function(err,user){
        if(err){
          req.flash('error',err);
          return res.redirect('/reg');
        }
        req.session.user=userentity;
        req.flash('success','注册成功!');
        res.redirect('/');
      });
    });
  });
  app.get('/rereg',checkNotLogin);     //忘记密码通过验证qq来进行重设
  app.get('/rereg',function(req,res){
    res.render('rereg',{
      title:'验证信息',
      reuser:req.session.reuser,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/rereg',checkNotLogin)
  app.post('/rereg',function(req,res){
    var name=req.body.user.replace(re,""),
        qq=req.body.qq.replace(re,"");
    usermodle.findOne({name:name},function(err,user){
      if(!user){
        req.flash('error','账号不存在');
        return res.redirect('/rereg');
      }
      if(user.qq!=qq){
        req.flash('error','输入信息有误！');
        return res.redirect('/rereg')
      }
      req.flash('success','验证通过！');
      req.session.reuser=user;
      res.redirect('/repass');
    })
  });
  app.get('/repass',function(req,res){
    res.render('re',{
      title:'修改',
      user:req.session.user,
      reuser:req.session.reuser,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/repass',function(req,res){
    var current=req.session.reuser,
        passwordY=req.body.password,
        repassword=req.body.repassword;
    if(passwordY!=repassword){                    //对输入的新密码进行校验
      req.flash('error','两次输入密码不一致！');
      return res.redirect('back');
    }
    if(passwordY.length<8){
      req.flash('error',"密码太短");
      return res.redirect('back')
    }
    var md5=crypto.createHash('md5'),
        password=md5.update(req.body.password).digest('hex');
    usermodle.update({'name':current.name},{'password':password},function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('back')
      }
      req.flash('success','修改成功');
      req.session.reuser=null;
      res.redirect('/login')
    })
  });
  app.get('/user',checkLogin);   // 用户页面，可进行相关设置
  app.get('/user',function(req,res){
    res.render('user',{
      title:'账户设置',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  })
  app.get('/passedit',checkLogin);       //在登陆情况下进行密码重设
  app.get('/passedit',function(req,res){
    res.render('passedit',{
      title:'修改密码',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/passedit',checkLogin);
  app.post('/passedit',function(req,res){
    var newpass=req.body.pass,
        renewpass=req.body.repass,
        md5=crypto.createHash('md5'),
        password=md5.update(req.body.password).digest('hex'),
        md51=crypto.createHash('md5'),
        newpassword=md51.update(newpass).digest('hex')
        current=req.session.user;
    if(current.password!=password){                //通过验证原密码来进行重设
      req.flash('error','输入的原密码有错！');
      return res.redirect('back')
    }
    if(newpass<8){
      req.flash('error','密码太短！');
      return res.redirect('back');
    }
    if(newpass!=renewpass){
      req.flash('error','两次输入的密码不一致！');
      return res.redirect('back');
    }
    usermodle.update({name:current.name},{password:newpassword},function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('back')
      }
      req.flash('success','密码修改成功！')
      res.redirect('/')
    })
  })
  app.get('/login',checkNotLogin);   //用户登陆
  app.get('/login',function(req,res){
    res.render('login',{
      title:'登陆',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  })
  app.post('/login',checkNotLogin);
  app.post('/login',function(req,res){
    var md5=crypto.createHash('md5'),
        password=md5.update(req.body.password).digest('hex');
    usermodle.findOne({'name':req.body.user},function(err,user){
      if(!user){
        req.flash('error','账号不存在!');
        return res.redirect('/login');
      }
      if(user.password!=password){
        req.flash('error','密码错误!');
        return res.redirect('/login')
      }
      req.session.user=user;
      req.flash('success','登陆成功');
      var url="/u/"+user.name;
      res.redirect(url);
    });
  });
  app.get('/post',checkLogin);                //文章发表
  app.get('/post',function(req,res){
    res.render('post',{title:'发表文章',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.post('/post',checkLogin);
  app.post('/post',function(req,res){
    var currentUser=req.session.user,
        post=new postmodle({
          name:currentUser.name,
          qq:currentUser.qq,
          title:req.body.title.replace(re,""),
          post:req.body.post.replace(re,""),
          time:time1,
          pv:0,
          pz:0,
          comments:[]
        });
    if(post.post==""||post.title==""){
      req.flash('error','标题或内容不能为空!');
      return res.redirect('/post');
    }
    post.save(function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('/post');
      }
      req.flash('success','发布成功!');
      res.redirect('/');
    })
  });
  app.get('/logout',checkLogin);
  app.get('/logout',function(req,res){
    req.session.user=null;
    req.flash('success','登出成功');
    res.redirect('/');
  });
  app.get('/u/:name',function(req,res){          //获取某个用户的所有文章
    usermodle.findOne({name:req.params.name},function(err,user){
      if(!user){
        req.flash('error','用户不存在!');
        return res.redirect('/');
      }
      postmodle.find({name:req.params.name},function(err,posts){
        if(err){
          req.flash('error',err);
          return res.redirect('/');
        }
        res.render('index',{
          title:user.name,
          posts:posts,
          user:req.session.user,
          error:req.flash('error').toString(),
          success:req.flash('success').toString()
        })
      })
    })
  });

  app.get('/u/:name/:time/:title',function(req,res){          //进入某一篇文章
    postmodle.findOne({name:req.params.name,time:req.params.time,title:req.params.title},
        function(err,post){
      if(err){
        req.flash('error',err);
        return res.redirect('/')
      }
      if(post){
        postmodle.update({name:req.params.name,time:req.params.time,title:req.params.title},{$inc:{pv:1}},function(err){
          if(err){
            req.flash('error',err);
          }
        })
      }
      res.render('article',{
        title:req.params.title,
        post:post,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      })
    })
  });
  app.post('/u/:name/:time/:title',function(req,res){           //对文章进行留言
    var date=new Date(),
        time=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10?'0'+
        date.getMinutes():date.getMinutes())+':'+date.getSeconds();
    var url="/u/"+req.params.name+'/'+req.params.time+'/'+req.params.title;

    if(req.body.connect==""){
      req.flash('error','留言不能为空!');
      return res.redirect(url);
    }
    postmodle.findOne({name:req.params.name,time:req.params.time,title:req.params.title}, function(err,doc)
    {
      if (err) {
        req.flash('error', err);
        return res.redirect(url);
      }
      if(doc){
        doc.comments.push({
          name:req.session.user.name,
          time:time,
          connect:req.body.connect.replace(re,"")
        });
        doc.save();
        req.flash('success', '留言成功!');
        res.redirect(url);
      }
    });
  });
  app.get('/edit/:name/:time/:title',checkLogin);             //编辑文章
  app.get('/edit/:name/:time/:title',function(req,res){
    var current=req.session.user
  postmodle.findOne({name:current.name,time:req.params.time,title:req.params.title},function(err,post){
    if(err){
      req.flash('error',err);
      return req.redirect('back')
    }
    res.render('edit',{
      title:'编辑',
      post:post,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  })
});
  app.get('/remove/:name/:time/:title',checkLogin);     //删除文章
  app.get('/remove/:name/:time/:title',function(req,res){
    var current=req.session.user,
        url='/u/'+req.params.name;
    postmodle.remove({name:current.name,time:req.params.time,title:req.params.title},function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('/u/:name/:time/:title')
      }
      res.redirect(url)
    })
  });
  app.post('/edit/:name/:time/:title',function(req,res){        //将编辑后的文章存入数据库
    var url='/u/'+req.params.name+'/'+req.params.time+'/'+req.params.title;
    if(req.body.post==""){
      req.flash('error','内容不能为空!');
      return res.redirect('/edit/'+req.params.name+'/'+req.params.time+'/'+req.params.title);
    }
    postmodle.update({name:req.params.name,time:req.params.time,title:req.params.title},{$set:{post:req.body.post.replace(re,"")}},function(err){
      if(err){
        req.flash('error',err);
        return res.redirect(url)
      }
      req.flash('success','修改成功!');
      res.redirect(url)
    })
  });

  app.get('/zz/:name/:time/:title',function(req,res){     //转载某用户的文章
    var current=req.session.user;
    var url='/u/'+req.params.name+'/'+req.params.time+'/'+req.params.title
    postmodle.findOne({
      name:req.params.name,
      time:req.params.time,
      title:req.params.title
    },function(err,doc){
      if(err){
        req.flash('error',err);
        return res.redirect(url);
      }
      if(doc){
        postmodle.update({
          name:req.params.name,
          time:req.params.time,
          title:req.params.title
        },{$inc:{pz:1}})
      }
      var zzpost=new postmodle({
        name:current.name,
        title:"[转自"+req.params.name+"]"+doc.title,
        post:doc.post,
        qq:current.qq,
        time:time1,
        comments:[],
        pv:0
      })
      zzpost.save()
      req.flash('success','转载成功!');
      res.redirect('/')
    })
  });

  app.get('/reco/:name/:title/:id',checkLogin)    //文章所属用户对留言进行删除
  app.get('/reco/:name/:title/:id',function(req,res) {
    var current = req.session.user;
    postmodle.findOne({
      name: current.name,
      title: req.params.title
    }, function (err, doc) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back')
      }
      doc.comments.id(req.params.id).remove();
      doc.save()
      req.flash('success', '删除留言成功')
      res.redirect('back')
    })
  })

//是否登陆进行验证
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
}