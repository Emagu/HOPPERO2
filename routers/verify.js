'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const STMPMail = require("../lib/STMP");
let router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {//路由攔劫~
     res.send(req.query.id);
});
router.get('/send', function (req, res) {//路由攔劫~
    STMPMail.register("tests","emagumail@gmail.com",'https://' + req.get('host') + req.originalUrl);
    res.redirect('/front/index');//後端控制前端跳轉路由
});
module.exports = router;