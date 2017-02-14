'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const Sql = require("../lib/MySQL_X");
const Tool = require("../lib/tool");
const AccountRule = require("../config/Account");
const AccountLib = require("../lib/Account");
let router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
const Router = {
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
    let DB = new Sql.DB();
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
    let newData = [];
    let AllPass = true;
    if(req.body.Account!=null){
        let accountTest = req.body.Account.length;
        if(AccountRule.AccountMin > accountTest || accountTest > AccountRule.AccountMax){
            AllPass = false;
            res.send("帳號格式錯誤");
        }else{
            newData.push({
        		key:"UA01",
    		    value:req.body.Account,
    		    type:"ENCRYPT"
    	    });
        }
    }else{
        AllPass = false;
        res.send("帳號格式錯誤");
    }
    if(req.body.Password!=null){
        let passwordTest = req.body.Password.length;
        if(AccountRule.PasswordMin > passwordTest || passwordTest > AccountRule.PasswordMax){
            AllPass = false;
            res.send("密碼格式錯誤");
        }
    }else{
        AllPass = false;
        res.send("密碼格式錯誤");
    }
    if(req.body.Password_RE!=null){
        let passwordReTest = req.body.Password_RE.length;
        if(AccountRule.PasswordMin > passwordReTest || passwordReTest > AccountRule.PasswordMax){
            AllPass = false;
            res.send("兩次密碼輸入不相同");
        }else if(req.body.Password_RE != req.body.Password){
            AllPass = false;
            res.send("兩次密碼輸入不相同");
        }else{
            newData.push({
        		key:"UA02",
    		    value:req.body.Password,
    		    type:"HASH"
    	    });
        }
    }else{
        AllPass = false;
        res.send("兩次密碼輸入不相同");
    }
    // if(req.body.Phone!=null){
    //     let PhoneTest = req.body.Phone;
    //     if(AccountRule.PhoneRegularize.test(PhoneTest)){
    //         // AllPass = false;
    //         // res.send("手機格式錯誤");
    //     }else{
    //         newData.push({
    //     		key:"UA03",
    // 		    value:req.body.Phone,
    // 		    type:"ENCRYPT"
    // 	    });
    //     }
    // }else{
    //     AllPass = false;
    //     res.send("手機格式錯誤");
    // }
    if(req.body.Email!=null){
        let EmailTest = req.body.Email;
        if(AccountRule.MailRegularize.test(EmailTest)){
            AllPass = false;
            res.send("信箱格式錯誤");
            
        }else{
            newData.push({
        		key:"UA04",
    	        value:req.body.Email,
    	        type:"ENCRYPT"
    	    });
        }
    }else{
        AllPass = false;
        res.send("信箱格式錯誤");
    }
    if(AllPass){
        let db = new Sql.DB();
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
    let router = require('./Front/' + url);
    return router;
}
module.exports = router;