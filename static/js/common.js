$(".dn").html("").hide().removeClass("redColor");
var $username = $(".username");
var $password = $(".password");
var $repassword = $("#repassword");

var username_lock = false;
var password_lock = false;
var repassword_lock = false;

// 验证用户名
$username.focus(function() {
    $(this).next().children(".icon").attr("src","").hide().next().removeClass("redColor").html("6~18个字符，可使用字母、数字、下划线，需以字母开头");
    $(".dn").html("").hide().removeClass("redColor");
    username_lock = false;
}).blur(function() {
    var username = $(this).val();
    if(regStrategy.use("notEmpty", username) || regStrategy.use("str6_18", username)) {
        $(this).next().children(".icon").attr("src","img/error.png").show().next().addClass("redColor");
        username_lock = false;
        return false;
    }
    var param = {
        username: username,
        type: type
    }
    // 校验用户名是否存在
    $.ajax({
        url: "/checkName",
        data: param,
        type: "get",
        dataType: "json",
        success: function(data) {
            console.log(data);
            if(!data.error) {
                $username.next().children(".icon").attr("src","img/right.png").show().next().removeClass("redColor");
                username_lock = true;
                return;
            }else if(data.error == 4) {
                $username.next().children(".icon").attr("src","img/error.png").show().next().addClass("redColor").html(data.msg);
                username_lock = false;
                return false;
            } else {
                new Error(data.msg);
            }

        }
    })
})

// 验证密码
$password.focus(function() {
    $(this).next().children(".icon").attr("src","").hide().next().removeClass("redColor");
    $(".dn").html("").hide().removeClass("redColor");
    password_lock = false;
}).blur(function() {
    var password = $(this).val();
    if(regStrategy.use("notEmpty", password) || regStrategy.use("str6_16", password)) {
        $(this).next().children(".icon").attr("src","img/error.png").show().next().addClass("redColor");
        password_lock = false;
        return false;
    }
    $(this).next().children(".icon").attr("src","img/right.png").show().next().removeClass("redColor");
    password_lock = true;
    return;
})

// 确认密码
$repassword.focus(function() {
    $(this).next().children(".icon").attr("src","").hide().next().removeClass("redColor").html("请再次填写密码");
    repassword_lock = false;
}).blur(function() {
    var password = $(".password").val();
    var repassword = $(this).val();
    if(regStrategy.use("notEmpty", repassword)) {
        $(this).next().children(".icon").attr("src","img/error.png").show().next().addClass("redColor").html("密码不能为空");
        repassword_lock = false;
        return false;
    }
    if(repassword !== password) {
        $(this).next().children(".icon").attr("src","img/error.png").show().next().addClass("redColor").html("两次密码输入不一致");
        repassword_lock = false;
        return false;
    }
    $(this).next().children(".icon").attr("src","img/right.png").show().next().removeClass("redColor");
    repassword_lock = true;
    return;
})

// 点击注册发送ajax
$("#registerBtn").click(function() {
    if(username_lock && password_lock && repassword_lock) {
        $.ajax({
            url: "/register",
            data: $("#loginForm").serialize(),
            // type: "get",
            type: "post",
            dataType: "json",
            success: function(data) {
                console.log(data);
                if(!data.error){
                    location.href = "registerSuccess?username="+data.username+"&msg="+data.msg;
                }else {
                    new Error(data.msg);
                }
            }
        })
    }
})

// 点击登录发送ajax
$("#loginBtn").click(function() {
    var username = $username.val();
    var password = $password.val();
    if(username_lock && password_lock) {
        $.ajax({
            url: "/login",
            data: {username:username, password:password},
            // type: "get",
            type: "post",
            dataType: "json",
            success: function(data) {
                console.log(data);
                if(!data.error) {
                    // window.open("/loginSuccess");//跳转首页
                    location.href = "/loginSuccess";
                }else if(data.error === 4) {
                    $(".dn").html(data.msg).show().addClass("redColor");
                }else {
                    console.log(data.msg);
                }
            }
        })
    }
})

// 跳转注册页面
$("#toRegister").click(function() {
    window.open("/register.html");
})