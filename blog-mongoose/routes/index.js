var crypto=require('crypto');
var Canvas = require('canvas');
var email=require('../module/email.js')
var mongoose=require('mongoose');
var db = mongoose.createConnection('localhost','blog');

var commentssc=new mongoose.Schema({//创建留言内容结构
      name:String,     //留言的用户
      time:String,     //留言时间
      connect:String   //留言内容
})

var postmodle=db.model('post',{//创建文章模型
  name:String,           //文章发表的用户
  title:String,         //文章标题
  qq:String,             //用户的邮箱
  post:String,           //文章内容
  time:String,          //发表文章的事件
  comments:[commentssc],     //留言的集合
  pv:Number,               //浏览次数统计
  pz:Number                 //转载次数统计
});

var usermodle=db.model('user',{//创建用户模型
  name:String,              //用户名
  password:String,           //密码
  qq:String                  //邮箱
});

var date=new Date();
var time1=date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+(date.getMinutes()<10?'0'+
        date.getMinutes():date.getMinutes()) +':'+ date.getSeconds();        //获取当前时间
var re=/<[^<>]+>|herf|http:|update|remove|insert/g;            //对内容进行过滤的正则

module.exports=function(app){
  app.get('/',function(req,res){
    postmodle.find({},function(err,posts){                    //查询加载所有的文章
      if(err){
        posts=[];
      }
    res.render('index', {                                   //主页内容
       title:'主页',
      user:req.session.user,                             //设置user，主页根据有无user来确定用户状态
      posts:posts,                                   //设置数据库查询的文章集合，主页用forEach来辨析
      success:req.flash('success').toString(),    //处理请求成功的消息
      error:req.flash('error').toString()         //处理请求失败的消息
    });
    });
  });
  app.get('/reg',checkNotLogin);             //用户注册页面
  app.get('/reg',function(req,res){
    res.render('reg',{
      title:'注册',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/yzreg',function(req,res){    //验证账号是否可用
    usermodle.findOne({name:req.body.name},function(err,doc){
      if(doc){
        res.end('cz')
      }else{
        res.end('bcz')
      }
      if(/[\u4e00-\u9fa5]/.test(req.body.name)){
        res.end('yzw')
      }
    })
  })

  app.post('/reg',checkNotLogin);
  app.post('/reg',function(req,res){
    var name=req.body.user.replace(re,""),           //获取页面发来的用户名，并进行特殊符号过滤
        password=req.body.password,                 //获取页面发来的密码
        repassword=req.body.repassword;
    if(/[\u4e00-\u9fa5]/.test(name)){                //检查是否包含中文
      req.flash('error','用户名中有中文')
      return res.redirect('/reg')
    }
    if(name==""){                                     //验证用户名时否位空
      req.flash('error','用户名不能为空!');
      return res.redirect('/reg');                       //验证失败返回到注册页面
    }
    if(password.length<8){                                 //如果密码长度小于8位则不能通过
      req.flash('error','密码太短!');
      return res.redirect('/reg');                         //验证失败返回到注册页面
    }
    if(password!=repassword){                               //验证两次输入密码是否相同
      req.flash('error','两次密码不一致!');
      return res.redirect('/reg');
    }
    var md5=crypto.createHash('md5'),                          //调取MD5模块来对密码进行加密处理
        password=md5.update(req.body.password).digest('hex');

    usermodle.findOne({'name':req.body.user},function(err,doc){              //通过用户名来查看数据库中是否已有该用户名
      if(doc){
        console.log(doc)
        req.flash('error','该账号已存在!');
        return res.redirect('/reg');
      }
      var userentity=new usermodle({               //将用户信息存入数据库
        name:name,
        password:password,
        qq:req.body.qq
      })
      userentity.save(function(err,user){
        if(err){
          req.flash('error',err);
          return res.redirect('/reg');
        }
        req.session.user=userentity;               //设置user为用户注册的信息，不用登陆
        req.flash('success','注册成功!');
        res.redirect('/');                        //注册成功返回主页
      });
    });
  });
  app.get('/rereg',checkNotLogin);                 //忘记密码通过邮箱发送验证码来进行重设
  app.get('/rereg',function(req,res){
    res.render('rereg',{
      title:'请输入账号信息',
      reuser:req.session.reuser,
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/rereg',checkNotLogin)
  app.post('/rereg',function(req,res){
    var name=req.body.user.replace(re,""),                         //获取前端发来的用户账号
        qq=req.body.qq.replace(re,"");                        //获取前端发来的邮箱
    usermodle.findOne({name:name},function(err,user){               //在数据库中查找该用户的信息，以便进行比对
      if(!user){                                             //验证是否存在该用户账号
        req.flash('error','账号不存在');
        return res.redirect('/rereg');              //验证失败返回到信息输入页面
      }
      if(user.qq!=qq){                                      //验证用户输入的邮箱和注册时的邮箱是否相同
        req.flash('error','输入信息有误！');
        return res.redirect('/rereg')
      }
      var s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';                //产生一个4位的随机验证码
      var code = '';
      for (var i = 0; i < 4; i++) {
        code += s.substr(parseInt(Math.random() * 36), 1);
      };
      req.session.yzm=code.toLowerCase()                //将该验证码同一为小写存入session中
      email.sent(qq,code,function(err){                //调取邮件发送模块将该验证码发送到用户邮箱
        if(err){
          req.flash('error','验证邮件发送失败！');
          return res.redirect('/rereg');
        }
      })
      req.flash('success','验证码已发送至您的邮箱！');
      req.session.reuser=user;                           //将该用户信息存入session中
      res.redirect('/forget');                          //邮件发送成功，跳入验证码输入页面
    })
  });
  app.get('/forget',function(req,res){               //验证码输入页面
    res.render('forget',{
      title:'请输入验证码',
      user:req.session.user,
      reuser:req.session.reuser,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/forget',function(req,res){
    var yzm=req.body.yzm.toLowerCase();               //获取用户输入的验证码，并转位小写
    if(yzm!=req.session.yzm){                        //比对用户输入的验证码与session中存的是否一致
      req.flash('error','验证码错误！')
      return res.redirect('/forget')             //验证失败，返回验证码输入页面
    }else{
      req.flash('success','验证成功')
       return res.redirect('/repass')                //验证成功，跳入密码重置页面
    }
  });
  app.get('/repass',function(req,res){                //密码重置页面
    res.render('re',{
      title:'修改',
      user:req.session.user,
      reuser:req.session.reuser,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  });
  app.post('/repass',function(req,res){
    var current=req.session.reuser,                 //读取存入session中用户信息
        passwordY=req.body.password,                //获取用户输入的密码
        repassword=req.body.repassword;
    if(passwordY!=repassword){
      req.flash('error','两次输入密码不一致！');               //检查两次密码时否一致
      return res.redirect('back');
    }
    if(passwordY.length<8){                          //检查密码长度是否满足8位
      req.flash('error',"密码太短");
      return res.redirect('back')
    }
    var md5=crypto.createHash('md5'),                           //调取MD5模块对密码进行加密
        password=md5.update(req.body.password).digest('hex');
    usermodle.update({'name':current.name},
        {'password':password},function(err){               //将新密码存入数据库
      if(err){
        req.flash('error',err);
        return res.redirect('back')
      }
      req.flash('success','修改成功');
      req.session.reuser=null;                 //清空session中的用户信息
      res.redirect('/login')                 //返回登陆页面
    })
  });
  app.get('/user',checkLogin);               // 用户页面，可进行相关设置
  app.get('/user',function(req,res){
    res.render('user',{
      title:'账户设置',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  })
  app.get('/passedit',checkLogin);                   //密码修改页面，在登陆情况下进行密码修改
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
    var newpass=req.body.pass,                                  //获取用户输入的新密码
        renewpass=req.body.repass,
        md5=crypto.createHash('md5'),                          //调用MD5模块对用户输入的原密码进行加密
        password=md5.update(req.body.password).digest('hex'),
        md51=crypto.createHash('md5'),                           //调用MD5模块对新密码进行加密
        newpassword=md51.update(newpass).digest('hex')
        current=req.session.user;                             //读取存入session中的用户信息
    if(current.password!=password){                            //比对用户输入的旧密码和用户信息中的是否相同
      req.flash('error','输入的原密码有错！');
      return res.redirect('back')
    }
    if(newpass<8){
      req.flash('error','密码太短！');
      return res.redirect('back');
    }
    if(newpass!=renewpass){                 //验证输入两次新密码是否相同
      req.flash('error','两次输入的密码不一致！');
      return res.redirect('back');
    }
    usermodle.update({name:current.name},{password:newpassword},function(err){              //将新密码存入数据库
      if(err){
        req.flash('error',err);
        return res.redirect('back')
      }
      req.flash('success','密码修改成功！')
      res.redirect('/')                          //修改成功返回主页
    })
  })
  app.get('/login',checkNotLogin);               //用户登陆页面
  app.get('/login',function(req,res){
    var getRandom = function(start,end){              //产生验证码
      return start+Math.random()*(end-start);
    };
    var canvas = new Canvas(50,20);                //设置验证码图片大小
    var ctx = canvas.getContext('2d');
    var s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';               //验证码中出现的字符
    var code = '';
    for(var i=0;i<4;i++){                                  //设置生成的验证码位数
      code+= s.substr(parseInt(Math.random()*36),1);
    }
    var font= 'bold {FONTSIZE}px Impact';
    var start = 3;
    var colors = ["rgb(255,165,0)","rgb(16,78,139)","rgb(0,139,0)","rgb(255,0,0)"];
    var trans = {c:[-0.108,0.108],b:[-0.05,0.05]};
    var fontsizes = [11,12,13,14,15,16,17,18];
    for(var i in code) {
      ctx.font = font.replace('{FONTSIZE}', fontsizes[Math.round(Math.random() * 10) % 6]);
      ctx.fillStyle = colors[Math.round(Math.random() * 10) % 4];
      ctx.fillText(code[i], start, 15, 50);
      ctx.fillRect();
      var c = getRandom(trans['c'][0], trans['c'][1]);
      var b = getRandom(trans['b'][0], trans['b'][1]);
      start += 11;
    }
    var buf=canvas.toDataURL()               //将生成的验证码图片转换位url地址存入
    req.session.login=code.toLowerCase();              //将生成的验证码文字存入session中
    res.render('login',{
      title:'登陆',
      user:req.session.user,
      img:buf,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    })
  })
  app.get('/cava',checkNotLogin);
  app.get('/cava',function(req,res) {               //刷新验证码模块
    var getRandom = function (start, end) {
      return start + Math.random() * (end - start);
    };
    var canvas = new Canvas(50, 20);
    var ctx = canvas.getContext('2d');
    var s = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var code = '';
    for (var i = 0; i < 4; i++) {
      code += s.substr(parseInt(Math.random() * 36), 1);
    }
    var font = 'bold {FONTSIZE}px Impact';
    var start = 3;
    var colors = ["rgb(255,165,0)", "rgb(16,78,139)", "rgb(0,139,0)", "rgb(255,0,0)"];
    var trans = {c: [-0.108, 0.108], b: [-0.05, 0.05]};
    var fontsizes = [11, 12, 13, 14, 15, 16, 17, 18];
    for (var i in code) {
      ctx.font = font.replace('{FONTSIZE}', fontsizes[Math.round(Math.random() * 10) % 6]);
      ctx.fillStyle = colors[Math.round(Math.random() * 10) % 4];
      ctx.fillText(code[i], start, 15, 50);
      ctx.fillRect();
      var c = getRandom(trans['c'][0], trans['c'][1]);
      var b = getRandom(trans['b'][0], trans['b'][1]);
      start += 11;
    }
    var buf = canvas.toDataURL()
    req.session.login = code.toLowerCase();
    res.end(buf);
  })
  app.post('/login',checkNotLogin);
  app.post('/login',function(req,res){
    var md5=crypto.createHash('md5'),              //调用MD5模块对用户输入密码进行加密
        password=md5.update(req.body.password).digest('hex');
    usermodle.findOne({'name':req.body.user},function(err,user){              //根据用户名在数据库中查找用户信息
      if(!user){                          //验证用户是否存在
        req.flash('error','账号不存在!');
        return res.redirect('/login');
      }
      if(user.password!=password){               //验证密码时否正确
        req.flash('error','密码错误!');
        return res.redirect('/login')
      }
      if(req.body.cap.toLowerCase()!=req.session.login){               //验证用户输入的验证码是否正确
        req.flash('error','验证码错误!');
        return res.redirect('/login')
      }
      req.session.user=user;
      req.flash('success','登陆成功');
      var url="/u/"+user.name;               //生成用户文章主页url
      res.redirect(url);               //转入用户文章主页
    });
  });
  app.get('/post',checkLogin);                            //文章发表页面
  app.get('/post',function(req,res){
    res.render('post',{title:'发表文章',
      user:req.session.user,
      success:req.flash('success').toString(),
      error:req.flash('error').toString()
    });
  });
  app.post('/post',checkLogin);
  app.post('/post',function(req,res){
    var currentUser=req.session.user,                 //读取存入session中的用户信息
        post=new postmodle({                 //获取用户在前端输入的相关信息
          name:currentUser.name,
          qq:currentUser.qq,
          title:req.body.title.replace(re,""),              //对用户输入的标题进行关键子过滤
          post:req.body.post.replace(re,""),                //对用户输入文章内容进行过滤
          time:time1,
          pv:0,     //设置查看统计
          pz:0,    //设置转载统计
          comments:[]   //设置文章评论集合
        });
    if(post.post==""||post.title==""){               //验证文章标题和内容是否为空
      req.flash('error','标题或内容不能为空!');
      return res.redirect('/post');                //验证失败转入文章发表页面
    }
    post.save(function(err){                    //将文章存入数据库中
      if(err){
        req.flash('error',err);
        return res.redirect('/post');
      }
      req.flash('success','发布成功!');
      res.redirect('/');
    })
  });
  app.get('/logout',checkLogin);
  app.get('/logout',function(req,res){               //用户登出页面
    req.session.user=null;               //将session清空
    req.flash('success','登出成功');
    res.redirect('/');
  });
  app.get('/u/:name',function(req,res){                      //获取某个用户的所有文章
    usermodle.findOne({name:req.params.name},function(err,user){              //验证用户是否存在
      if(!user){
        req.flash('error','用户不存在!');
        return res.redirect('/');
      }
      postmodle.find({name:req.params.name},function(err,posts){               //根据用户名来查找文章
        if(err){
          req.flash('error',err);
          return res.redirect('/');
        }
        res.render('index',{              //调用主页模块来进行渲染
          title:user.name,
          posts:posts,
          user:req.session.user,
          error:req.flash('error').toString(),
          success:req.flash('success').toString()
        })
      })
    })
  });
  app.get('/u/:name/:time/:title',checkLogin);
  app.get('/u/:name/:time/:title',function(req,res){                      //查看某一篇文章
    postmodle.findOne({name:req.params.name,time:req.params.time,title:req.params.title},              //根据用户名，发表事件，文章名字进行查找
        function(err,post){
      if(err){
        req.flash('error',err);
        return res.redirect('/')
      }
      if(post){              //如果存在文章对文章的阅读次数进行+1
        postmodle.update({
          name:req.params.name,
          time:req.params.time,
          title:req.params.title},
            {$inc:{pv:1}},function(err){
          if(err){
            req.flash('error',err);
          }
        })
      }
      res.render('article',{              //调用单个文章页面进行渲染
        title:req.params.title,
        post:post,
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      })
    })
  });
  app.post('/u/:name/:time/:title',checkLogin);
  app.post('/u/:name/:time/:title',function(req,res){                       //对文章进行留言
    var url="/u/"+req.params.name+'/'+req.params.time+'/'+req.params.title;               //生成该文章url

    if(req.body.connect==""){                                           //验证留言是否为空
      req.flash('error','留言不能为空!');
      return res.redirect(url);
    }
    postmodle.findOne({             //查找该文章
      name:req.params.name,
      time:req.params.time,
      title:req.params.title}, function(err,doc)
    {
      if (err) {
        req.flash('error', err);
        return res.redirect(url);
      }
      if(doc){
        doc.comments.push({                    //给该文章插入留言信息
          name:req.session.user.name,              //调取session中的用户名
          time:time1,
          connect:req.body.connect.replace(re,"")               //获取留言内容，并进行过滤
        });
        doc.save();               //将新的文章存入数据库
        req.flash('success', '留言成功!');
        res.redirect(url);         //返回这篇文章的页面
      }
    });
  });
  app.get('/edit/:name/:time/:title',checkLogin);             //编辑文章
  app.get('/edit/:name/:time/:title',function(req,res){
    var current=req.session.user               //获取session中的用户信息
    postmodle.findOne({                                 //根据用户名，发表时间和文章标题查找该文章
      name:current.name,
      time:req.params.time,
      title:req.params.title},function(err,post){
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
  app.post('/edit/:name/:time/:title',function(req,res){
    var url='/u/'+req.params.name+'/'+req.params.time+'/'+req.params.title;   //生成该文章的url
    if(req.body.post==""){                                   //验证修改后的内容是否为空
      req.flash('error','内容不能为空!');
      return res.redirect('/edit/'+req.params.name+'/'+req.params.time+'/'+req.params.title);
    }
    postmodle.update({                            //将新的内容更新到数据库
          name:req.params.name,
          time:req.params.time,
          title:req.params.title},
        {$set:{post:req.body.post.replace(re,"")}},  //对用户输入的新内容进行过滤
        function(err){
          if(err){
            req.flash('error',err);
            return res.redirect(url)
          }
          req.flash('success','修改成功!');
          res.redirect(url)                              //返回到这篇文章
        })
  });
  app.get('/remove/:name/:time/:title',checkLogin);     //删除文章
  app.get('/remove/:name/:time/:title',function(req,res){
    var current=req.session.user,
        url='/u/'+req.params.name;                               //生成用户文章列表页面url
    postmodle.remove({name:current.name,
      time:req.params.time,
      title:req.params.title}, function(err){
      if(err){                                           //根据用户名发表事件文章标题来删除文章
        req.flash('error',err);
        return res.redirect('/u/:name/:time/:title')
      }
      res.redirect(url)                                     //返回到用户文章列表页面
    })
  });

  app.get('/zz/:name/:time/:title',checkLogin);
  app.get('/zz/:name/:time/:title',function(req,res){     //转载某用户的文章
    var current=req.session.user;
    var url='/u/'+req.params.name+'/'+req.params.time+'/'+req.params.title       //生成该文章页面url
    postmodle.findOne({                                          //根据用户名，发表事件和文章标题来查找文章
      name:req.params.name,
      time:req.params.time,
      title:req.params.title
    },function(err,doc){
      if(err){
        req.flash('error',err);
        return res.redirect(url);
      }
      if(doc){                                               //如果存在该文章，将该文章的转载统计+1
        postmodle.update({
          name:req.params.name,
          time:req.params.time,
          title:req.params.title
        },{$inc:{pz:1}})
      }
      var zzpost=new postmodle({                    //建立一个新的文章entiy
        name:current.name,
        title:"[转自"+req.params.name+"]"+doc.title,
        post:doc.post,                               //内容为doc的内容
        qq:current.qq,
        time:time1,
        comments:[],
        pv:0                                     //重新设置浏览统计
      })
      zzpost.save()                              //将新的文章存入数据库
      req.flash('success','转载成功!');
      res.redirect('/')                          //返回到主页
    })
  });

  app.get('/reco/:name/:title/:id',checkLogin)    //文章所属用户对留言进行删除
  app.get('/reco/:name/:title/:id',function(req,res) {
    var current = req.session.user;
    postmodle.findOne({                    //查找出该文章
      name: current.name,
      title: req.params.title
    }, function (err, doc) {
      if (err) {
        req.flash('error', err);
        return res.redirect('back')
      }
      doc.comments.id(req.params.id).remove();    //根据用户留言的id对留言进行删除
      doc.save()                                   //保存新的文章
      req.flash('success', '删除留言成功')
      res.redirect('back')
    })
  });
  app.use(function(req,res){                    //请求失败页面
    res.render('404')
  });

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
