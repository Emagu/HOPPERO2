'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const busboy = require('connect-busboy');
const fs = require('fs-extra');
const Tool = require('../../lib/tool');
const SQL = require('../../lib/MySQL_X');
let router = express.Router();
let nowDate = null;//今天日期 格式YYYYMMDD
let todayCreate = 0;//今天創建數量 格式XXXX
router.use(busboy());
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {
    res.redirect('/member/news/list');
});
router.get('/list', function (req, res) {
    listRender(res, req.session._admin);
});
router.get('/edit', function (req, res) {
    editRender(res, req.session._admin, {
        html: req.query.html,
        title: req.query.title,
        action: req.query.action
    });
});
router.get('/preview', function (req, res) { 
    previewRender(res, {
        html: req.query.html,
        title: req.query.title,
        type: req.query.type,
        action: req.query.action
    });
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
    todayCreate++;
    let filename = nowDate + Tool.String.IntFormat(todayCreate,4,"0");
    fs.writeFile('./html/news/'+filename+'.txt', req.body.html, function (err) {
        if (err) {
            console.error(err); 
            res.send("fail");
        }else{
            //寫資料
            let db = new SQL.DB();
            if(req.body.action == "add"){
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
                }],"News", {
                    userNO: req.session._admin.userNO,//系統
                    IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress
                }, 12).then(function(){
                    res.send("success");
                },function(err){
                    console.error(err); 
                    res.send("fail");
                });
            }else if(req.body.action == "edit"){
                res.send("success");
            }else{
                res.send("fail");
            }
            
        } 
    });
});
router.post('/uploadNewsImage',function(req, res) {
    let fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);    
        //Path where image will be uploaded
        fstream = fs.createWriteStream(__dirname + '/../../public/images/news/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {
            console.log("Upload Finished of " + filename);
            res.json({ location: '/public/images/news/' + filename});
        });
    });
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
function listRender(res,userData) {
    res.render('layouts/member_layout', {
        Title: "新聞列表",
        Value: require("../../config/company"),
        UserData: userData,
        CSSs: [
            "/public/css/front.css"
        ],
        JavaScripts: [
            "/public/js/moment.js"
        ],
        Include: [
            { url: "../pages/Member/news/list", value: {} }
        ],
        Script: [	
            
        ]
    });
}
function editRender(res,userData, editData) {
    res.render('layouts/member_layout', {
        Title: "新聞列表",
        Value: require("../../config/company"),
        UserData: userData,
        CSSs: [
            "/public/css/front.css"
        ],
        JavaScripts: [
            "/public/js/tinymce/tinymce.min.js",
        ],
        Include: [
            { url: "../pages/Member/news/edit", value: editData }
        ],
        Script: [	
            
        ]
    });
}
function previewRender(res, news) {
    res.render('layouts/front_layout', {
        Title: "新聞列表-" + news.title,
        Value: require("../../config/company"),
        Login: false,
        CSSs: [
        ],
        JavaScripts: [
            "../../public/js/moment.js"
        ],
        Include: [
            {
                url: "../pages/Member/news/preview", value: news
            }
        ],
        Script: [	
        ]
    });
}

module.exports = router;