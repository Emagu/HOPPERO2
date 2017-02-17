'use strict';
const express = require('express');
const bodyParser = require('body-parser');
let router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {//路由攔劫~

});
module.exports = router;