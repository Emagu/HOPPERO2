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
    Render(res,req.session._admin);
});
//method
function Render(res,userData) {
    res.render('layouts/member_layout', {
        Title: "管理中心-首頁",
        Value: require("../../config/company"),
		UserData: userData,
        CSSs: [
        ],
        JavaScripts: [    
        ],
        Include: [
        ],
        Script: [	
        ]
    });
}
module.exports = router;