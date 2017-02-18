'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const Sql = require("../lib/MySQL_X");
const Tool = require("../lib/tool");
const AccountRule = require("../config/Account");
const AccountLib = require("../lib/Account");
let router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.use(function(req, res, next) {//權限認證
    if(req.session._admin != null){
		AccountLib.checkLoginBySession(req.session).then(function(){
			req.session._admin.rank = 0;
			req.session.save();
			AccountLib.checkMangerBySession(req.session).then(function(rank){
				req.session._admin.rank = rank;
				req.session.save();
				next();
			},next); 
		},AccountLib.logout);  
	}else res.redirect('/');
});
const Router = {
    index: getRouter("index"),
	commodity: getRouter("commodity")//商品管理
};
router.get('/', function (req, res) {
    res.redirect('/member/index');
});
router.use('/index', Router.index);
router.use('/commodity', Router.commodity);
function getRouter(url) {
    let router = require('./Member/' + url);
    return router;
}
module.exports = router;