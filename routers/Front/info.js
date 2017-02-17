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
router.get('/', function (req, res) {//路由攔劫~
	AccountLib.checkLoginBySession(req.session)
	.then(function(){
		Render(res,true);
	},function(){
		Render(res,false);
	});
});

//method
function Render(res,login) {
    res.render('layouts/front_layout', {
        Title: "公司簡介",
        Value: require("../../config/company"),
        Login: login,
        CSSs: [
        ],
        JavaScripts: [
            
        ],
        Include: [
            { url: "../pages/Front/info", value: {} }
        ],
        Script: [	
            
        ]
    });
}
module.exports = router;