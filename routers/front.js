'use strict';
var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
var Router = {
    index: getRouter("index"),
    info: getRouter("info"),
    patent: getRouter("patent"),
    process: getRouter("process"),
    contact: getRouter("contact"),
    productList: getRouter("productList")
};
router.get('/', function (req, res) {//路由攔劫~
    res.redirect('/index');//後端控制前端跳轉路由
});
router.use('/index', Router.index);
router.use('/info',Router.info);
router.use('/patent',Router.patent);
router.use('/process',Router.process);
router.use('/contact',Router.contact);
router.use('/productList',Router.productList);
function getRouter(url) {
    var router = require('./Front/' + url);
    return router;
}


module.exports = router;