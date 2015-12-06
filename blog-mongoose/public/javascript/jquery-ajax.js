$(document).ready(function(){
    $("img").click(function(){   //获取图片元素添加点击事件
        $.get("/cava",function(data,status){   //get请求到后台页面
            if(status="success"){
                $("img").attr("src",data)
            }
        })
    })
    $("#reguser").blur(function(){    //获取用户名元素添加失去焦点事件
        $.post("/yzreg",{name:this.value},function(data,err){
            if(data=="bcz"){
                alert("账号可用！")
            }
            if(data=="cz"){
                alert("账号不可用")
            }
            if(data=='yzw'){
                alert("用户名中有中文")
            }
        })
    })
})