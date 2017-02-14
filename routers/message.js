'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const Sql = require("../lib/MySQL_X");
const Tool = require("../lib/tool");
const AccountLib = require("../lib/Account");
let router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true
}));
router.use(function(req, res, next) {//權限認證
    if(req.session._admin != null)  AccountLib.checkLoginBySession(req.session._admin).then(next,AccountLib.logout);  
    else res.redirect('/');
});
router.get('/', function (req, res) {//路由攔劫~
    testRender(res);
});
router.post('/send',function (req, res) {//發出訊息
    let DB = new Sql.DB();
    DB.insert([
        {
            key:"UA00A",
            value:req.session._admin.userNO
        },
        {
            key:"UA00B",
            value:req.body.SendTo
        },
        {
            key:"M01",
            value:req.body.Message,
            type:"ENCRYPT"
        },
        {
            key:"M000",
            value:Tool.getTimeZone
        }
    ],"Message").then(function(){
        res.send("secces");
    },function(){
        res.send("發送失敗");
    });
});
//method
function testRender(res) {
    res.render('layouts/login_layout', {
        Title: "測試",
        CSSs: [
            { url: "./public/css/toastr.min.css", local: "head" },
        ],
        JavaScripts: [
            { url: "./public/js/toastr.min.js", local: "head" },
            { url: "./public/js/jquery.backstretch.min.js", local: "head" },
            { url: "./public/js/jquery.validate.js", local: "head" }
        ],
        Include: [
            { url: "../pages/test", value: {} }
        ],
        Script: [	
            { url: "../script/message", value: {} }
        ]
    });
}
module.exports = router;