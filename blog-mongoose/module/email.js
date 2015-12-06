var nodemailer = require("nodemailer");

function email(){}
module.exports=email
email.sent=function(email,canvas,callback){
    var smtpTransport = nodemailer.createTransport("SMTP",{
        host: "smtp.qq.com", // 主机
        secureConnection: true, // 使用 SSL
        port: 465, // SMTP 端口
        auth: {
            user: "446214030@qq.com", // 账号
            pass: "hqyatecwsuxybjhj" // 密码
        }
    });
    var mailOptions = {
        from: "Fred Foo <446214030@qq.com>", // 发件地址
        to: '"'+email+'"', // 收件列表
        subject: "验证码", // 标题
        html: '"验证码：</br>'+canvas+'</br>尊敬的博客用户，您正在进行密码找回操作[工作人员不会向你索取验证码，请勿泄露！]"' // html 内容
    }
    smtpTransport.sendMail(mailOptions, function(err, response){
        if(err){
            callback(err)
        }else{
            console.log("Message sent: " + response.message);
        }
        smtpTransport.close(); // 如果没用，关闭连接池
    })};