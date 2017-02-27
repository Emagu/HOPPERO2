'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const Tool = require('../../lib/tool');
const SQL = require('../../lib/MySQL_X');
let router = express.Router();
let nowDate = null;//今天日期 格式YYYYMMDD
let todayCreate = 0;//今天創建數量 格式XXXX
router.use(fileUpload());
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {
	Render(res);
});
router.post('/getNewsList',function(req,res){
    let db = new SQL.DB();
    db.select("N01","DECRYPT","Title");
    db.select("N00","DEFAULT","NO");
    db.select("N000","DEFAULT","Date");
    db.where("NT00",req.body.Type);
    db.get("News").then(function(resData){
        res.json(resData);
    });
});
router.post('/editSumit', function(req, res) {
    //寫HTML檔
    if(nowDate!=Tool.getTimeZone(null,"YYYYMMDD")){
        nowDate = Tool.getTimeZone(null,"YYYYMMDD");
        todayCreate = 0;
    }
    let filename = nowDate + Tool.String.IntFormat(todayCreate,4,"0");
    fs.writeFile('./html/news/'+filename+'.txt', req.body.html, function (err) {
        if (err) {
            console.error(err); 
            res.send("fail");
        }else{
            //寫資料
            let db = new SQL.DB();
            if(req.body.Type == "ADD"){
                db.insert([{
                    key: "NT00",
                    value: req.body.newsType
                },{
                    key: "N01",
                    value: req.body.newsTitle,
                    action: "ENCRYPT"
                },{
                    key: "N02",
                    value: filename
                },{
                    key: "N000",
                    value: Tool.getTimeZone()
                }],"News").then(function(){
                    res.send("success");
                },function(err){
                    console.error(err); 
                    res.send("fail");
                });
            }else if(req.body.Type == "EDIT"){
                res.send("success");
            }else{
                res.send("fail");
            }
            
        } 
    });
});
router.post('/uploadNewsImage',function(req, res) {
    if (!req.files) res.send('fail');
    else {
        let imagesFile = req.files.file;
        let imagesDir = "./public/images/news";
        try {
            fs.mkdirSync(imagesDir);
        } catch (e) {
            if (e.code != 'EEXIST') {
                console.error(e);
                res.send("fail");
            }
        }
        try {
            imagesFile.mv(imagesDir + '/' + imagesFile.name, function (err) {
                if (err) {
                    console.error(err);
                    res.send('fail');
                } else res.json({location:imagesDir+'/' + imagesFile.name});
            });
        } catch (e) {
            console.error(e);
            res.send('fail');
        }
    }
});
router.post('/changeView', function (req,res) {
   switch (req.body.Type) {
        case 'list':
           listRender(res);
           break;
        case 'edit':
            if(req.body.NewsNo!=null){//修改
                
            }else{//新增
                editRender(res,"","ADD");
            }
           break;
        case 'reView':
           // code
           break;
   } 
});
//method
function Render(res) {
    let userData = {
        rank:2
    };
    res.render('layouts/member_layout', {
        Title: "新聞列表",
        Value: require("../../config/company"),
        UserData: userData,
        CSSs: [
            "../../public/css/front.css"
        ],
        JavaScripts: [
            "../../public/js/tinymce/tinymce.min.js",
            "../../public/js/moment.js"
        ],
        Include: [
            { url: "../pages/Member/news/main", value: {} }
        ],
        Script: [	
            
        ]
    });
}
function listRender(res) {
    res.render("./pages/Member/news/list", {
        value: {}
    });
}
function editRender(res,html,type) {
    res.render("./pages/Member/news/edit", {
        html: html,
        type: type
    });
}
module.exports = router;