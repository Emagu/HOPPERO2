var express = require('express');
var EJS = require("ejs");
var express_session = require('express-session')(require('./config/Session'));
var cookieParser = require('cookie-parser');
var http = require('http');
var path = require('path');
var app = express();
var http = require('http').createServer(app);
var io = require('./lib/socket.io')(http, express_session);
//設定Server Port
http.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
    var addr = http.address();
    console.log("server listening at", addr.address + ":" + addr.port);
});
// all environments
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express_session);
app.use(cookieParser());
app.use('/public', express.static(__dirname + '/public'));//開放資料
//router init
function getRouter(url) {
    var router = require('./routers/' + url);
    return router;
}
var Router = {
    message: getRouter("message"),
    mail: getRouter("mail"),
    front: getRouter("front")
};
//設定router
app.get('/', function (req, res) {
     res.redirect('/front');//後端控制前端跳轉路由
});
app.use('/mail', Router.mail);
app.use('/front', Router.front);
