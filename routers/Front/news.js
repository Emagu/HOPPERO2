'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const AccountLib = require("../../lib/Account");
const SQL = require("../../lib/MySQL_X");
let router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {
	AccountLib.checkLoginBySession(req.session)
	.then(function(){
	    if(req.query.NO!=null){
	        let db = new SQL.DB();
	        db.select("N01","DECRYPT","Title");
	        db.select("N02");
	        db.select("N000");
	        db.where("N00",req.query.NO);
	        db.get("News").then(function(resData){
	            if(resData.length>0){
	                let news = {
                        Title: resData[0].Title,
                        Date: resData[0].N000
                    };
                    fs.readFile('./html/news/'+resData[0].N02+".txt", function (err, data) {
                        if (err) {
                            console.error(err);
                            res.redirect("./");
                        }else{
                            news.html = data;
                            detailRender(res,true,news);
                        }
                    });
	            }else{
	                res.redirect("./");
	            }
	        },function(err){
	            console.error(err);
	            res.redirect("./");
	        });
	    }else if(req.query.list!=null){
            getNewsList(res,true,req.query.list);
	    }else{
            getNewsList(res,true,1);
	    }
	},function(){
	    if(req.query.NO!=null){
	        let db = new SQL.DB();
	        db.select("N01","DECRYPT","Title");
	        db.select("N02");
	        db.select("N000");
	        db.where("N00",req.query.NO);
	        db.get("News").then(function(resData){
	            if(resData.length>0){
	                let news = {
                        Title: resData[0].Title,
                        Date: resData[0].N000
                    };
                    fs.readFile('./html/news/'+resData[0].N02+".txt", function (err, data) {
                        if (err) {
                            console.error(err);
                            res.redirect("./");
                        }else{
                            news.html = data;
                            detailRender(res,false,news);
                        }
                    });
	            }else{
                    res.redirect("./");
	            }
	        },function(err){
	            console.error(err);
	            res.redirect("./");
	        });
	    }else if(req.query.list!=null){
            getNewsList(res,false,req.query.list);
	    }else{
	        getNewsList(res,false,1);
	    }
	});
});
//method
function getNewsList(res,login,type){
    let db = new SQL.DB();
    db.select("N01","DECRYPT","Title");
    db.select("N00","DEFAULT","NO");
    db.select("N000","DEFAULT","Date");
    db.where("NT00",type);
    db.get("News").then(function(resData){
        listRender(res,login,resData);
    });
}
function detailRender(res,login,news) {
    res.render('layouts/front_layout', {
        Title: "新聞列表-" + news.Title,
        Value: require("../../config/company"),
        Login: login,
        CSSs: [
        ],
        JavaScripts: [
            "../../public/js/moment.js"
        ],
        Include: [
            { url: "../pages/Front/news", value:{
                list: null,
                news: news
            }}
        ],
        Script: [	
        ]
    });
}
function listRender(res,login,list) {
    res.render('layouts/front_layout', {
        Title: "新聞列表",
        Value: require("../../config/company"),
        Login: login,
        CSSs: [
        ],
        JavaScripts: [
            "../../public/js/moment.js"
        ],
        Include: [
            { url: "../pages/Front/news", value:{
                list: list,
                news: null
            }}
        ],
        Script: [	
        ]
    });
}
module.exports = router;