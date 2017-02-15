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
    Render(res,false);
});
//method
function Render(res) {
    res.render('layouts/member_layout', {
        Title: "會員中心-首頁",
        Value: require("../../config/company"),
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