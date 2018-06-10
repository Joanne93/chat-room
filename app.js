var http = require("http");//原生nodejs模块。因为socket只支持原生
var fs = require("fs");
var express = require("express");//express框架
var body_parser = require("body-parser");//post提交数据
var cookie_parser = require("cookie-parser");
var session = require("express-session");

var socket = require("socket.io");// 引入socket.io

var mongodb = require("mongodb");// 引入数据库
var mongoClient = mongodb.MongoClient;
var url = "mongodb://localhost:27017/";
var mydb = "chat";

// 日志
var log4js = require('log4js');
log4js.configure({
    appenders: { cheese: { 
        type: 'file', 
        filename: 'logs/error.log' ,
        pattern : '-yyyy-MM-dd.log',
        alwaysIncludePattern : true,
        category : 'record'
    }},
    categories: { default: { 
        appenders: ['cheese'], 
        level: 'error' 
    }}
  });
  const logger = log4js.getLogger('cheese');
  logger.trace('Entering cheese testing');
  logger.debug('Got cheese.');
  logger.info('Cheese is Gouda.');
  logger.warn('Cheese is quite smelly.');
  logger.error('Cheese is too ripe!');
  logger.fatal('Cheese was breeding ground for listeria.');

// 相关配置文件
var app = express();
app.use(express.static("static"));
app.use(body_parser.urlencoded({extended: false}));
app.use(cookie_parser("aaaa",{
    // maxAge: 60 * 60 * 1000
}));
app.use(session({
    secret: "aihfoihweoifhoiwahfoieahfio",// 秘钥： 该值会决定服务器如何生成session乱码id
    resave: false,// 指每一次请求是否会重置session和cookie的过期时间 如果我们设置的过期时间是20分钟 则最终的失效时间由你最后一次操作的时间算起 20分钟后失效
    saveUninitialized: false,// 指无论有没有session cookie 每一次请求都设置一个session和cookie 默认标志为 connect.sid
    secure: false,// 应用在https
    name: "jsessionid",// 指定携带乱码id的kv对的key名称
    cookie: {//// 指定cookie的相关配置
        // 最大有效期 60分钟
        maxAge: 60 * 60 * 1000
  }
}));

// app.use(log4js.connectLogger(logger, {level: 'auto', format:':method :url'}));

/* accessLogfile = fs.createWriteStream('./logs/access.log', {flags: 'a'}), //访问日志
errorLogfile = fs.createWriteStream('./logs/error.log', { flags: 'a' }); //错误日志

app.configure('production', function () {
    app.use(express.logger({ stream: accessLogfile }));
    app.use(function (err, req, res, next) {
        var now = new Date();
        var time = now.getFullYear() + '-' + now.getMonth() + '-' + now.getDate() + ' '
            + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
        var meta = '[' + time + '] '+req.method+' ' + req.url + '\r\n';
        errorLogfile.write(meta + err.stack + '\r\n\r\n\r\n');
        next();
    });
}); */


// 根路径,如果有index.html默认直接去找index.html
app.get("/", function(req, res) {
    var username = req.session.username;
    if(username) {
        res.render("index.ejs", {username: username});
    }else {
        res.redirect("login.html");
    }
})

// 校验用户名
app.get("/checkName", function(req, res) {
    console.log("校验用户名参数如下：");
    console.log(req.query);// {}
    var username = req.query.username;// undefined
    var type = req.query.type;
    if(!username) {
        res.json({error:1, msg:"数据获取失败"});
        return;
    }
    mongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if(err) {
            res.json({error: 2, msg: "数据库连接失败"});
            return;
        }
        var dbase = db.db(mydb);
        var collection = dbase.collection("users");
        collection.findOne({username: username}, function(err, result) {
            if(err) {
                res.json({error: 3, msg: "数据查询失败"});
                db.close();
                return;
            }
            db.close();
            if(result) {
                if(type === "register") {
                    res.json({error: 4, msg: "此用户已存在"});
                }else if(type === "login") {
                    res.json({error:0, msg:"用户名可以用"});
                }
            }else {
                if(type === "register") {
                    res.json({error:0, msg:"用户名可以使用"});
                }else if(type === "login"){
                    res.json({error:4, msg:"用户名不存在"});
                }
            }
        })
    })

})

// 注册
app.get("/register", function(req, res) {
    consoel.log("注册获取参数如下：");
    console.log(req.query);
})
app.post("/register", function(req, res) {
    console.log("注册获取参数如下：");
    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    if(!username || !password) {
        res.json({error:1, msg:"数据获取失败"});
        return;
    }
    mongoClient.connect(url,{ useNewUrlParser: true }, function(err, db) {
        if(err) {
            res.json({error:2, msg:"数据库连接失败"});
            return;
        }
        var collection = db.db(mydb).collection("users");
        collection.insertOne({username: username, password: password}, function(err, result) {
            if(err) {
                res.json({error:3, msg:"数据插入失败"});
                db.close();
            }else {
                db.close();
                // res.render("success.ejs", {username: username, msg:"注册成功"});//如果是表单提交就可以直接跳转页面了
                // res.redirect("/success");
                console.log(username+" -----用户注册成功");
                res.json({error: 0, username: username, msg:"注册成功"});
            }
        })
    })
})
// 注册成功跳转成功页面
app.get("/registerSuccess", function(req, res) {
    var username = req.query.username;
    var msg = req.query.msg;
    res.render("success.ejs",{username:username, msg:msg});
})

// 登录
app.get("/login", function(req, res) {
    console.log("登录获取参数如下：");
    console.log(req.query);
})
app.post("/login", function(req, res) {
    console.log("登录获取参数如下：");
    console.log(req.body);
    var username = req.body.username;
    var password = req.body.password;
    if(!username || !password) {
        res.json({error: 1, msg: "数据获取失败"});
        return;
    }
    mongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
        if(err) {
            res.json({error: 2, msg:"数据库连接失败"});
            return;
        }
        var collection = db.db(mydb).collection("users");
        collection.findOne(req.body, function(err, result) {
            if(err) {
                res.json({error: 3, msg: "数据查询失败"});
                return;
            }
            if(!result) {
                res.json({error: 4, msg: "用户名或密码错误"});
            }else {
                // 把用户名放入session
                req.session.username = username;
                console.log(username+"-----用户登录成功");
                res.json({error: 0, msg: "登录成功"});
            }

        })
    })

})
// 登录成功跳转聊天首页
app.get("/loginSuccess", function(req, res) {
    var username = req.session.username;
    if(!username) {
        res.redirect("/login.html");
    }else {
        res.render("index.ejs", {username: username});
    }
})

// 退出
app.get("/exit", function(req, res) {
    req.session.username = null;
    res.json({error: 0, msg: "用户退出成功"});
})

// 私聊
app.get("/privateChat", function(req, res) {
    var username = req.session.username;
    if(!username) {
        res.redirect("/login.html");
    }else {
        console.log("私聊获取参数如下：");
        console.log(req.query);
        var othername = req.query.othername;
        res.render("private.ejs", {othername: othername});
    }
    
})



// socket 获取后端socket的集合对象，参数必须是原生的server
var server = http.Server(app);
var io = socket(server);
var arr = [];//装有所有登录用户的数组，用户是个对象有用户名和id，id是为了离开时删除用的

// 监听连接建立事件
io.on("connection", function(socket) {
    console.log("后台连接建立了。。。"+socket.id);//每个客户都会建立一个连接，分配一个id

    // 监听前端人上线情况，并广播所有人有人来了
    socket.on("come", function(user) {
        console.log(user.username+" 上线了");
        console.log(arr);
        // 检测该人是否和之前有重复，比如刷新页面，有的话把之前的人踢走
        for(var i=0; i<arr.length; i++) {
            if(user.username === arr[i].username) {
                console.log(user.username +"与之前用户列表有重复用户");
                var id = arr[i].id;
                io.sockets.sockets[id].emit("bye");
                // arr[i].id = socket.id;//新的id绑到原来的用户身上
                break;
            }
        }
        // if(i === arr.length) {//没有重复的才添加数组
            console.log(user.username + "与之前用户列表没有重复用户");
            socket.username = user.username;//把用户名绑到socket上,这样每个人的socket上都有自己的id和姓名
            arr.push({username: user.username, id:socket.id});
        // }
        console.log(arr);
        io.sockets.emit("someoneCome", arr);//把所有人都发过去
    })

    // 监听前端谁说话了，并广播所有人他说话了
    socket.on("speak", function(word) {
        console.log(socket.username+" 说话了");
        io.sockets.emit("someoneSpeak", {username: socket.username, word: word});
    })

    // 监听前端谁下线了，并广播所有人他走了，这个是内置事件disconnect
    socket.on("disconnect", function() {
        console.log(socket.username+" 下线了");
        console.log(arr);
        var id = socket.id;
        for(var i in arr) {
            if(id === arr[i].id) {
                arr.splice(i,1);
                break;
            }
        }
        console.log(arr);
        // io.sockets.emit("someoneLeave", arr);//把剩余的所有用户都发过去
        io.sockets.emit("someoneLeave", socket.id);//只需要把走的那个人发过去
    })

});






// 监听端口
/* app.listen(3001, function() {
    console.log("server has started....");
    console.log("监听的端口号是3001");
}) */
server.listen(3001, function() {
    console.log("server has started....");
    console.log("监听的端口号是3001");
})
