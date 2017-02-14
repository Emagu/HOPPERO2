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
router.get('/', function (req, res) {
    testRender(res);
});
/**
 * 發送信件
 * @param {int} SendTo              : 接收者編號(UA00)
 * @param {string} MessageTitle     : 信件標題(M01)
 * @param {string} Message          : 信件內容(M02)
 * --------------------------------------------
 * 回傳值
 * @status {string} "success"
 * @status {string} 各類錯誤訊息
 **/
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
            key:"MA01",
            value:req.body.MessageTitle,
            type:"ENCRYPT"
        },
        {
            key:"MA02",
            value:req.body.Message,
            type:"ENCRYPT"
        },
        {
            key:"MA000",
            value:Tool.getTimeZone()
        }
    ],"Mail").then(function(){
        res.send("secces");
    },function(error){
        res.send("發送失敗");
    });
});
/**
 * 取得信件列表
 * @param {int} type              : 信件類別
 * --------------------------------------------
 * type 分類:
 * 0:全部
 * 1:已讀
 * 2:未讀
 * --------------------------------------------
 * 回傳值
 * @status {array} 信件列表
 **/
router.post('/getMailList',function (req, res) {
    console.log(req.body.type);
    let DB = new Sql.DB();
    DB.select("MA00","DEFAULT","MailNO");
    DB.select("MA01","DECRYPT","MailTitle");
    DB.select("MA000","DEFAULT","Time");
    DB.select("MA002","DEFAULT","Status");
    DB.select("UA05","DECRYPT","Sender");
    DB.where("UA00B",req.session._admin.userNO);
    DB.join("UserAccount","UserAccount.UA00=Mail.UA00B");
    DB.where("MA002",0);
    switch(req.body.type){
        case 1:
            DB.where("MA001",0);
            break;
        case 2:
            DB.where("MA001",1);
            break;
    }
    DB.get("Mail").then(function(data){
        res.send(data);
    },function(error){
        res.send("發送失敗");
    });
});
/**
 * 取得信件內容
 * @param {int} MailNO              : 信件編號(MA00)
 * --------------------------------------------
 * 回傳值
 * @status {array} 信件內容
 **/
router.post('/getMail',function (req, res) {
    let DB = new Sql.DB();
    DB.select("MA01","DECRYPT","MailTitle");
    DB.select("MA02","DECRYPT","MailMessage");
    DB.select("MA000","DEFAULT","Time");
    DB.select("UA05","DECRYPT","Sender");
    DB.where("MA00",req.body.MailNO);
    DB.join("UserAccount","UserAccount.UA00=Mail.UA00B");
    DB.get("Mail").then(function(data){
        let DB = new Sql.DB();
        DB.where("MA00",req.body.MailNO);
        DB.update([{//更新已讀狀態
            key:"MA001",
            value:1
        }],"Mail").then(function(){
            res.send(data[0]);
        },function(error){
            res.send("發送失敗");
        });
    },function(error){
        res.send("發送失敗");
    });
});
/**
 * 刪除信件
 * @param {int} MailNO              : 信件編號(MA00)
 * --------------------------------------------
 * 回傳值
 * @status {string} success
 **/
router.post('/delMail',function (req, res) {
    let DB = new Sql.DB();
    DB.where("MA00",req.body.MailNO);
    DB.update([{//更新為刪除狀態
        key:"MA002",
        value:1
    }],"Mail").then(function(){
        res.send("success");
    },function(error){
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
            { url: "../pages/mail", value: {} }
        ],
        Script: [	
            { url: "../script/mail", value: {} }
        ]
    });
}
module.exports = router;