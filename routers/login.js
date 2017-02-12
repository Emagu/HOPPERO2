'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var Sql = require("../lib/MySQL_X");
var Tool = require("../lib/tool");
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {//路由攔劫~
    loginRender(res);
});
/**
 * 登入
 * @param {string} Account   : 使用者帳號(UA01)
 * @param {string} Password  : 使用者密碼(UA02)
 * --------------------------------------------
 * 回傳值
 * @status {string} "success"
 * @status {string} 各類錯誤訊息
 **/
router.post("/login", function (req, res) {
    var DB = new Sql.DB();
    DB.select("UA00",'DEFAULT','userNO');
    DB.select("UA01",'DEFAULT','userID');
    DB.select("UA001");
    DB.where("UA01",req.body.Account.trim(),"=","AND","ENCRYPT");
    DB.where("UA02",req.body.Password.trim(),"=","AND","HASH");
    DB.get("UserAccount").then(function(resultData){
        if (resultData.length <= 0) {
            res.send("帳號或密碼不正確!");
        } else if (resultData[0].UA002 == 0) {
            res.send("帳號尚未認證啟用！");
        } else {//登入成功
            DB = new Sql.DB();
            DB.where("UA00",resultData[0].userNO.toString());
            DB.update([
                {
                    key:"UA001",
                    value:Tool.getTimeZone()
                }
            ],"UserAccount").then(function(){
                console.log("success");
            },function(err){
                console.log(err);
            });
            req.session._admin = {
                userNO: resultData[0].userNO,
                userID: resultData[0].userID
            };
            req.session.save();
            res.send("success");
        }
    });
});
/**
 * 註冊
 * @param {string} Account      : 使用者帳號(UA01)
 * @param {string} Password     : 使用者密碼(UA02)
 * @param {string} Password_RE  : 使用者密碼確認(UA02)
 * @param {string} Phone        : 使用者手機(UA03)
 * @param {string} Email        : 使用者信箱(UA04)
 * @param {string} Name         : 使用者姓名(UA05)
 * --------------------------------------------
 * 回傳值
 * @status {string} "success"
 * @status {string} "註冊失敗"
 **/
router.post("/register", function (req, res) {
    /*資料格試驗證*/
    if(req.body.Account!=null){
        
    }
    else{
        var db = new Sql.DB();
        var newData = [
            {
        		key:"UA01",
    		    value:req.body.Account,
    		    type:"ENCRYPT"
    	    },{
        	    key:"UA02",
    		    value:req.body.Password,
    		    type:"HASH"
    	    },{
        		key:"UA03",
    		    value:req.body.Phone,
    		    type:"ENCRYPT"
    	    },{
        	    key:"UA04",
    	        value:req.body.Email,
    	        type:"ENCRYPT"
    	    },{
        		key:"UA05",
    		    value:req.body.Name,
    		    type:"ENCRYPT"
    	    },{
        		key:"UA000",
    		    value:Tool.getTimeZone()
    	    },{
        		key:"UA001",
    		    value:Tool.getTimeZone()
    	    }
        ];
        db.insert(newData,'UserAccount').then(function(data){
            res.send("success");
        },function error(msg) {
            console.log(msg);
            res.send("註冊失敗");
        });
    }
});
/**
 * 登出
 * ----------------------------
 * 重新導向登入畫面
 **/
router.post("/logout", function(req, res) {
    if(req.session._admin != null) delete req.session._admin;
    res.redirect('/login');
});
//method
function loginRender(res) {
    res.render('layouts/login_layout', {//因為前面在app.js有設定views的root資料夾在./views所以這邊路徑是從./views開始算
        /*
         * 參數資料從server根目錄開始算
         * */
        Title: "登入",
        CSSs: [
            { url: "./public/css/toastr.min.css", local: "head" },
        ],
        JavaScripts: [
            { url: "./public/js/toastr.min.js", local: "head" },
            { url: "./public/js/jquery.backstretch.min.js", local: "head" },
            { url: "./public/js/jquery.validate.js", local: "head" }
        ],
        //為了傳送Value所以根目錄一樣是./views開始算
        Include: [
            { url: "../pages/login", value: {} }
        ],
        Script: [	
            { url: "../script/login", value: {} }
        ]
    });
}
module.exports = router;