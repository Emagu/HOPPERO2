'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const STMPMail = require("../lib/STMP");
const Sql = require("../lib/MySQL_X");
const Tool = require("../lib/tool");
let router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {
    let verifyCode = req.query.id;//認證碼
	let DB = new Sql.DB();
	DB.select("UA00");
	DB.select("CM001");
	DB.select("CM02");
	DB.where("CM01",verifyCode);
	DB.get("CertificationMail").then(function(result){//取得認證碼資料
		if(result.length>0){
			let verifyData = result[0];
			if(Tool.compareTime(Tool.getTimeZone(),verifyData.CM001)==-1){//認證碼是否過期
				switch(verifyData.CM02){//認證模式
					case 1://會員信箱認證
						let DB = new Sql.DB();
						DB.where("UA00",verifyData.UA00);
						DB.update([
							{
								key:"UA002",
								value:1
							}
						],"UserAccount",{
							userNO: verifyData.UA00,
							IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress
						},8).then(function(){
							res.send("success");
						},function(err){
							console.error(err);
							res.send("fail");
						})
						break;
					default:
						console.log("無效識別碼");
						res.send("error");
						break;
				}
			}
		}else{
			console.log("找不到識別碼");
			res.send("error");
		}
	},function(err){
		console.error(err);
		res.send("error");
	});
});
function Render(res,login) {
    res.render('layouts/front_layout', {
        Title: "聯繫我們",
        Value: require("../../config/company"),
        Login: login,
        CSSs: [
        ],
        JavaScripts: [
            
        ],
        //為了傳送Value所以根目錄一樣是./views開始算
        Include: [
            { url: "../pages/Front/contact", value: {} }
        ],
        Script: [	
            
        ]
    });
}
module.exports = router;