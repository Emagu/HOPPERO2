'use strict';
const Sql = require("../lib/MySQL_X");
module.exports = new function(){
	/**
	 * 確認是否為有效帳號
	 * @param {User Session} session 
	 * ----------------------------
	 * 有效的話執行success
	 * 無效的話執行error
	 * ----------------------------
	 **/
	this.checkLoginBySession = function(session){
		return new Promise(function (success, error){
			if(session._admin != null){
				let DB = new Sql.DB();
				DB.select("1");
				DB.where("UA01",session._admin.userID);
				DB.where("UA00",session._admin.userNO);
				DB.where("UA002",'1');//已啟動
				DB.where("UA003",'0');//未註銷
				DB.get("UserAccount",true).then(function(resultData){
					if(resultData.length>0){
						console.log("success");
						success();
					}else{
						console.log("loginCheck fail");
						error();
					}
				},function(err){
					console.error(err);
					error();
				});
			}else{
				console.log("loginCheck fail");
				error();
			}
		});
	}
	/**
	 * 確認是否為有效管理人員
	 * @param {User Session} session 
	 * @returns {string} 人員職階
	 * ----------------------------
	 * 有效的話執行success
	 * 無效的話執行error
	 * ----------------------------
	 **/
	this.checkMangerBySession = function(session){
		return new Promise(function (success, error){
			if(session._admin != null){
				let DB = new Sql.DB();
				DB.select("MA01");//職階
				DB.where("UA00",session._admin.userNO);
				DB.where("MA001",'0');//未註銷
				DB.get("MangerAccount",true).then(function(resultData){
					if(resultData.length>0){
						console.log("success");
						success(resultData[0].MA01);
					}else{
						console.log("MangerCheck fail");
						error();
					}
				},function(err){
					console.error(err);
					error();
				});
			}else{
				console.log("MangerCheck fail");
				error();
			}
		});
	}
	/**
	 * 登出
	 * @param {Html request}  req      
	 * @param {Html response} res      
	 * ----------------------------
	 * 重新導向登入畫面
	 * ----------------------------
	 **/
	this.logout = function(req,res){
		if(req.session._admin != null) delete req.session._admin;
		res.send('return');
	}
};