'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const STMPMail = require("../lib/STMP");
const Sql = require("../lib/MySQL_X");
const Tool = require("../lib/tool");
const AccountLib = require("../lib/Account");
let router = express.Router();
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
     // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {
    let verifyCode = req.query.id;//認證碼
	verifyCode = decodeURIComponent(verifyCode);
	let DB = new Sql.DB();
	DB.select("UA00");
	DB.select("CM001");
	DB.select("CM02");
	DB.where("CM01",verifyCode);
	DB.get("CertificationMail",true).then(function(result){//取得認證碼資料
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
							registerRender(req,res,"success");
						},function(err){
							console.error(err);
							registerRender(req,res,"error");
						})
						break;
					case 2://重置密碼
						req.session.verify={
							userNO:verifyData.UA00
						};
						resetPasswordRender(req,res);
						break;
					default:
						console.log("無效識別碼");
						failRender(req,res,"fail",verifyData.CM02);
						break;
				}
			}else{
				console.log("過期識別碼");
				failRender(req,res,"overDate",verifyData.CM02);
			}
		}else{
			console.log("找不到識別碼");
			failRender(req,res,"fail");
		}
	},function(err){
		console.error(err);
		failRender(req,res,"error");
	});
});
/**
 * 忘記密碼
 * @param {string} Email : 使用者信箱(UA04)
 * @param {string} Account : 使用者帳號(UA01)
 **/
router.post('/forgetPassword',function(req,res){
	let mail = req.body.Email;
	let userID = req.body.Account;
	let DB = new Sql.DB();
	DB.select("UA00");
	DB.where("UA01",userID,"=","AND","ENCRYPT");
	DB.where("UA04",mail,"=","AND","ENCRYPT");
	DB.get("UserAccount").then(function(resultData){
		if(resultData.length > 0){
			STMPMail.reSetPassword({
				account : userID,
				mail : mail,
				IP: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
				userNO: resultData[0].UA00
			},'http://' + req.get('host')).then(function(){
				res.send("success");
			},function(err){
				console.error(err);
				res.send("error");
			});
		}else{
			res.send("找不到符合的帳號");
		}
	},function(err){
		console.error(err);
		res.send("error");
	});
});
/**
 * 註冊認證後畫面
 * @param {object} req
 * @param {object} res
 * @param {string} status
 **/
function registerRender(req,res,status) {
	AccountLib.checkLoginBySession(req.session)
	.then(function(){
		res.render('layouts/front_layout', {
			Title: "會員信箱認證",
			Value: require("../config/company"),
			Login: true,
			CSSs: [
			],
			JavaScripts: [
			],
			Include: [
				{ 	
					url: "../pages/Verify/register", 
					value: {
						status:status
					} 
				}
			],
			Script: [	
				
			]
		});
	},function(){
		res.render('layouts/front_layout', {
			Title: "會員信箱認證",
			Value: require("../config/company"),
			Login: false,
			CSSs: [
			],
			JavaScripts: [
			],
			Include: [
				{ 	
					url: "../pages/Verify/register",
					value: {
						status:status
					} 
				}
			],
			Script: [	
				
			]
		});
	});
}
/**
 * 重置密碼畫面
 * @param {object} req
 * @param {object} res
 **/
function resetPasswordRender(req,res) {
	AccountLib.checkLoginBySession(req.session)
	.then(function(){
		res.render('layouts/front_layout', {
			Title: "重置密碼",
			Value: require("../config/company"),
			Login: true,
			CSSs: [
			],
			JavaScripts: [
			],
			Include: [
				{ url: "../pages/Verify/resetPassword", value: {} }
			],
			Script: [	
				{ url: "../script/Verify/resetPassword", value: {} }
			]
		});
	},function(){
		res.render('layouts/front_layout', {
			Title: "重置密碼",
			Value: require("../config/company"),
			Login: false,
			CSSs: [
			],
			JavaScripts: [
			],
			Include: [
				{ url: "../pages/Verify/resetPassword", value: {} }
			],
			Script: [	
				{ url: "../script/Verify/resetPassword", value: {} }
			]
		});
	});
}
/**
 * 認證失敗畫面
 * @param {object} req
 * @param {object} res
 * @param {string} status : 狀態
 * @param {string} type : 認證類型
 **/
function failRender(req,res,status,type) {
	AccountLib.checkLoginBySession(req.session)
	.then(function(){
		res.render('layouts/front_layout', {
			Title: "會員信箱認證",
			Value: require("../config/company"),
			Login: true,
			CSSs: [
			],
			JavaScripts: [
			],
			Include: [
				{ 
					url: "../pages/Verify/fail", 
					value: {
						status:status,
						type:type
					} 
				}
			],
			Script: [	
				
			]
		});
	},function(){
		res.render('layouts/front_layout', {
			Title: "會員信箱認證",
			Value: require("../config/company"),
			Login: false,
			CSSs: [
			],
			JavaScripts: [
			],
			Include: [
				{ 
					url: "../pages/Verify/fail", 
					value: {
						status:status,
						type:type
					} 
				}
			],
			Script: [	
				
			]
		});
	});
}
module.exports = router;