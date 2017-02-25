'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const AccountLib = require("../../lib/Account");
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
	        let news = {
                Title: "最新商品出清 全館最低下殺一折",
                Date: "2017/02/10",
                HTML: "201702100001"
            };
	        newsRender(res,true,news);
	    }else{
	        Render(res,true);
	    }
	},function(){
	    if(req.query.NO!=null){
	        let news = {
                Title: "最新商品出清 全館最低下殺一折",
                Date: "2017/02/10",
                HTML: "201702100001"
            };
	        newsRender(res,true,news);
	    }else{
	        Render(res,false);
	    }
	});
});
router.post('/getNewsList',function(req,res){
    console.log(req.body.Type);
    res.json([
        {
            NO:1,
            Title:"最新商品出清 全館最低下殺一折",
            Date:"2017/02/10"
        },
        {
            NO:2,
            Title:"最新商品出清 全館最低下殺一折",
            Date:"2017/02/11"
        },
        {
            NO:3,
            Title:"最新商品出清 全館最低下殺一折",
            Date:"2017/02/11"
        }
    ]);
});
//method
function Render(res,login) {
    res.render('layouts/front_layout', {
        Title: "新聞列表",
        Value: require("../../config/company"),
        Login: login,
        CSSs: [
        ],
        JavaScripts: [
            
        ],
        Include: [
            { url: "../pages/Front/news", value: {} }
        ],
        Script: [	
            
        ]
    });
}
function newsRender(res,login,news){
    res.render('layouts/front_layout', {
        Title: "新聞列表-"+news.Title,
        Value: require("../../config/company"),
        Login: login,
        CSSs: [
        ],
        JavaScripts: [
            
        ],
        Include: [
            { url: "../pages/Front/news/detail", value: {
                    news:news,
                    HTML:"./body/"+news.HTML
                }
            }
        ],
        Script: [	
            
        ]
    });
}
module.exports = router;