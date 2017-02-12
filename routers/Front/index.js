'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var AccountLib = require("../../lib/Account");
var router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {//路由攔劫~
    var login = false;
    if(req.session._admin != null){
        AccountLib.checkLoginBySession(req.session._admin)
        .then(function(){
            login = true;
        }).finally(function(){
            Render(res,login);
        });
    }else{
        Render(res,login);
    }
});
//method
function Render(res,login) {
    res.render('layouts/front_layout', {//因為前面在app.js有設定views的root資料夾在./views所以這邊路徑是從./views開始算
        /*
         * 參數資料從server根目錄開始算
         * */
        Title: "首頁",
        Value: require("../../config/company"),
        Login: login,
        CSSs: [
        ],
        JavaScripts: [
            
        ],
        //為了傳送Value所以根目錄一樣是./views開始算
        Include: [
            { url: "../pages/Front/index", value: {} }
        ],
        Script: [	
            { url: "../script/index", value: {} }
        ]
    });
}
module.exports = router;