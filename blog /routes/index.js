var crypto=require('crypto');
var User=require('../models/user.js');
var Post=require('../models/post.js');
var re=/<[^<>]+>|herf|http:|update|remove|insert/g;

module.exports=function(app){
  app.get('/',function(req,res){
    Post.get(null,function(err,posts){
      if(err){
        posts=[];
      }
    res.render('index', {
      title: '主页',
      user: req.session.user,
      posts: posts,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
    });
  });
  app.get('/reg',checkNotLogin);
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
    if(name==""){
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
    var newUser=new User({
      name:req.body.user,
      password:password,
      qq:req.body.qq
    });
    User.get(newUser.name,function(err,user){
      if(user){
        req.flash('error','该账号已存在!');
        return res.redirect('/reg');
      }
      newUser.save(function(err,user){
        if(err){
          req.flash('error',err);
          return res.redirect('/reg');
        }
        req.session.user=newUser;
        req.flash('success','注册成功!');
        res.redirect('/');
      });
    });
  });
  app.get('/rereg',checkNotLogin);
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
    User.get(name,function(err,user){
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
    if(passwordY!=repassword){
      req.flash('error','两次输入密码不一致！');
      return res.redirect('back');
    }
    if(passwordY.length<8){
      req.flash('error',"密码太短");
      return res.redirect('back')
    }
    User.update(current.name,repassword,function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('back')
      }
      req.flash('success','修改成功');
      req.session.reuser=null;
      res.redirect('/login')
    })
  });
  app.get('/user',checkLogin);
  app.get('/user',function(req,res){
    res.render('user',{
      title:'账户设置',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  })
  app.get('/passedit',checkLogin);
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
        current=req.session.user;
    if(current.password!=password){
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
    User.update(current.name,newpass,function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('back')
      }
      req.flash('success','密码修改成功！')
      res.redirect('/')
    })
  })
  app.get('/login',checkNotLogin);
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
    User.get(req.body.user,function(err,user){
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
    var currentUser=req.session.user,
        post=new Post(currentUser.name,currentUser.qq,req.body.title.replace(re,""),req.body.post.replace(re,""));
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
  app.get('/u/:name',function(req,res){
    User.get(req.params.name,function(err,user){
      if(!user){
        req.flash('error','用户不存在!');
        return res.redirect('/');
      }
      Post.get(req.params.name,function(err,posts){
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

  app.get('/u/:name/:time/:title',function(req,res){
    Post.getOne(req.params.name,req.params.time,req.params.title,function(err,post){
      if(err){
        req.flash('error',err);
        return res.redirect('/')
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
  app.post('/u/:name/:time/:title',function(req,res){
    var date=new Date(),
        time=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10?'0'+
        date.getMinutes():date.getMinutes())+':'+date.getSeconds();
    var url="/u/"+req.params.name+'/'+req.params.time+'/'+req.params.title;
    var comments={
      name:req.session.user.name,
      connect:req.body.connect.replace(re,""),
      time:time
    }
    if(comments.connect==""){
      req.flash('error','留言不能为空!');
      return res.redirect(url);
    }
    Post.comments(req.params.name,req.params.time,req.params.title,comments,function(err){
      if(err){
        req.flash('error',err);
        return res.redirect(url);
      }
      req.flash('success','留言成功!');
      res.redirect(url);
    })
  });
  app.get('/edit/:name/:time/:title',checkLogin);
  app.get('/edit/:name/:time/:title',function(req,res){
    var current=req.session.user
  Post.getOne(current.name,req.params.time,req.params.title,function(err,post){
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
  app.get('/remove/:name/:time/:title',checkLogin);
  app.get('/remove/:name/:time/:title',function(req,res){
    var current=req.session.user,
        url='/u/'+req.params.name;
    Post.remove(current.name,req.params.time,req.params.title,function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('/u/:name/:time/:title')
      }
      res.redirect(url)
    })
  });
  app.post('/edit/:name/:time/:title',function(req,res){
    var url='/u/'+req.params.name+'/'+req.params.time+'/'+req.params.title;
    if(req.body.post==""){
      req.flash('error','内容不能为空!');
      return res.redirect('/edit/'+req.params.name+'/'+req.params.time+'/'+req.params.title);
    }
    Post.update(req.params.name,req.params.time,req.params.title,req.body.post.replace(re,""),function(err){
      if(err){
        req.flash('error',err);
        return res.redirect(url)
      }
      req.flash('success','修改成功!');
      res.redirect(url)
    })
  });

  app.get('/zz/:name/:time/:title',function(req,res){
    var current=req.session.user;
    var url='/u/'+req.params.name+'/'+req.params.time+'/'+req.params.title
    Post.reprint(req.params.name,current.name,req.params.time,req.params.title,current.qq,function(err){
      if(err){
        req.flash('error',err);
        return res.redirect(url);
      }
      req.flash('success','转载成功!');
      res.redirect('/')
    })
  });

  app.get('/reco/:name/:title/:cname/:time',checkLogin)
  app.get('/reco/:name/:title/:cname/:time',function(req,res){
    var current=req.session.user
    Post.removec(current.name,req.params.title,req.params.cname,req.params.time,function(err){
      if(err){
        req.flash('error',err);
        return res.redirect('back')
      }
      req.flash('success','删除留言成功')
      res.redirect('back')
    })
  })

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