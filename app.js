const express = require('express');
const EJS = require("ejs");
const express_session = require('express-session')(require('./config/Session'));
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('./lib/socket.io')(http, express_session);
//設定Server Port
http.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
    const addr = http.address();
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
    return require('./routers/' + url);
}
const Router = {
    message: getRouter("message"),
    mail: getRouter("mail"),
    front: getRouter("front"),
    verify: getRouter("verify")
};
//設定router
app.get('/', function (req, res) {
    res.redirect('/front');//後端控制前端跳轉路由
});
app.use('/mail', Router.mail);
app.use('/verify', Router.verify);
app.use('/front', Router.front);
