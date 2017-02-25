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
	Render(res);
});
router.post('/changeView',function (req,res) {
   switch (req.body.Type) {
        case 'add':
           addRender(res);
           break;
        case 'edit':
           // code
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
            "../../public/css/front.css",
            "../../public/css/floatDiv.css"
        ],
        JavaScripts: [
        ],
        Include: [
            { url: "../pages/Member/news/main", value: {} }
        ],
        Script: [	
            
        ]
    });
}
function addRender(res) {
    res.render("../pages/member/news/add", {
        value: {}
    });
}
module.exports = router;