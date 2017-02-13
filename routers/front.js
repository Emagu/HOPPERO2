'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var Sql = require("../lib/MySQL_X");
var Tool = require("../lib/tool");
var AccountRule = require("../config/Account");
var AccountLib = require("../lib/Account");
var router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
var Router = {
    index: getRouter("index"),
    info: getRouter("info"),
    patent: getRouter("patent"),
    process: getRouter("process"),
    contact: getRouter("contact"),
    productList: getRouter("productList")
};
router.get('/', function (req, res) {//路由攔劫~
    res.redirect('/front/index');//後端控制前端跳轉路由
});
router.use('/index', Router.index);
router.use('/info',Router.info);
router.use('/patent',Router.patent);
router.use('/process',Router.process);
router.use('/contact',Router.contact);
router.use('/productList',Router.productList);
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
    var newData = [];
    var AllPass = true;
    if(req.body.Account!=null){
        var accountTest = req.body.Account.length;
        if(AccountRule.AccountMin > accountTest || accountTest > AccountRule.AccountMax){
            res.send("帳號格式錯誤");
            AllPass = false;
        }else{
            newData.push({
        		key:"UA01",
    		    value:req.body.Account,
    		    type:"ENCRYPT"
    	    });
        }
    }else{
        res.send("帳號格式錯誤");
        AllPass = false;
    }
    if(req.body.Password!=null){
        var passwordTest = req.body.Password.length;
        if(AccountRule.PasswordMin > passwordTest || passwordTest > AccountRule.PasswordMax){
            res.send("密碼格式錯誤");
            AllPass = false;
        }
    }else{
        res.send("密碼格式錯誤");
        AllPass = false;
    }
    if(req.body.Password_RE!=null){
        var passwordReTest = req.body.Password_RE.length;
        if(AccountRule.PasswordMin > passwordReTest || passwordReTest > AccountRule.PasswordMax){
            res.send("兩次密碼輸入不相同");
            AllPass = false;
        }else if(req.body.Password_RE != req.body.Password){
            res.send("兩次密碼輸入不相同");
            AllPass = false;
        }else{
            newData.push({
        		key:"UA02",
    		    value:req.body.Password,
    		    type:"HASH"
    	    });
        }
    }else{
        res.send("兩次密碼輸入不相同");
        AllPass = false;
    }
    // if(req.body.Phone!=null){
    //     var PhoneTest = req.body.Phone;
    //     if(AccountRule.PhoneRegularize.test(PhoneTest)){
    //         // res.send("手機格式錯誤");
    //         // AllPass = false;
    //     }else{
    //         newData.push({
    //     		key:"UA03",
    // 		    value:req.body.Phone,
    // 		    type:"ENCRYPT"
    // 	    });
    //     }
    // }else{
    //     res.send("手機格式錯誤");
    //     AllPass = false;
    // }
    if(req.body.Email!=null){
        var EmailTest = req.body.Email;
        if(AccountRule.MailRegularize.test(EmailTest)){
            res.send("信箱格式錯誤");
            AllPass = false;
        }else{
            newData.push({
        		key:"UA04",
    	        value:req.body.Email,
    	        type:"ENCRYPT"
    	    });
        }
    }else{
        res.send("信箱格式錯誤");
        AllPass = false;
    }
    if(AllPass){
        var db = new Sql.DB();
        newData.push({
            key:"UA05",
            value:req.body.Name,
    		type:"ENCRYPT"
        });
        newData.push({
            key:"UA000",
            value:Tool.getTimeZone()
        });
        newData.push({
            key:"UA001",
            value:Tool.getTimeZone()
        });
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
router.post("/logout", AccountLib.logout);
function getRouter(url) {
    var router = require('./Front/' + url);
    return router;
}
module.exports = router;