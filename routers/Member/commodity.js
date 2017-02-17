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
router.use(function(req, res, next) {//管理權限認證
    if(req.session._admin != null){
		AccountLib.checkMangerBySession(req.session).then(function(rank){
			req.session._admin = {
                rank:rank
            };
            req.session.save();
			next();
		},AccountLib.logout);  
    }else res.redirect('/');
});
router.get('/', function (req, res) {
    Render(res,false);
});
//method
function Render(res) {
    res.render('layouts/member_layout', {
        Title: "管理中心-商品管理",
        Value: require("../../config/company"),
        CSSs: [
        ],
        JavaScripts: [    
        ],
        Include: [
			{ url: "../pages/Member/commodity", value: {} }
        ],
        Script: [	
        ]
    });
}
module.exports = router;