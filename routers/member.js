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
const Router = {
    index: getRouter("index")
};
router.get('/', function (req, res) {//路由攔劫~
    res.redirect('/member/index');//後端控制前端跳轉路由
});
router.use('/index', Router.index);
function getRouter(url) {
    let router = require('./Member/' + url);
    return router;
}
module.exports = router;