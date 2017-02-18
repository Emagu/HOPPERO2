'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const AccountLib = require("../../lib/Account");
const Sql = require("../../lib/MySQL_X");
let router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {
	if(req.session._admin.rank!=null){
		Render(res,req.session._admin);
	}else{
		res.redirect('/member');
	}
});
router.post('/getType', function (req, res){
    let DB = new Sql.DB();
    DB.select("PT00", "DEFAULT", "NO");
    DB.select("PT01", "DEFAULT", "Name");
    DB.select("PT02", "DEFAULT", "Father");
	DB.get('ProductType').then(function(result){
		res.json(result);
	},function(err){
		console.error(err);
		res.json("error");
	});
});
router.post('/newType', function (req, res) {
    let name = req.body.Name;
    let father = req.body.Father;
    let DB = new Sql.DB();
    DB.insert([{
            key: "PT01",
            value: name
        }, {
            key: "PT02",
            value: father
        }],
        'ProductType', {
            userNO: req.session._admin.userNO,
            IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress
        }, 10
    ).then(function () {
        res.send("success");
    }, function (err) {
        console.error(err);
        res.send("error");
    });
});
router.post('/selectTypeView', function (req, res) {
    res.render('pages/Member/commodity/type');
});
router.post('/selectObjectView', function (req, res) {
    res.render('pages/Member/commodity/object');
});
router.post('/selectInputView', function (req, res) {
    res.render('pages/Member/commodity/input');
});
router.post('/selectWSView', function (req, res) {
    res.render('pages/Member/commodity/WS');
});
//method
function Render(res,userData) {
    res.render('layouts/member_layout', {
        Title: "管理中心-商品管理",
        Value: require("../../config/company"),
		UserData: userData,
        CSSs: [
			"../../public/css/toastr.min.css"
        ],
        JavaScripts: [    
			"../../public/js/jquery.validate.js",
			"../../public/js/toastr.min.js"
        ],
        Include: [
			{ url: "../pages/Member/commodity/main", value: {} }
        ],
        Script: [	
        ]
    });
}
module.exports = router;