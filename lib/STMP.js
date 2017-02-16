const nodemailer = require('nodemailer');
const crypto = require('crypto');
const account='',password='';
const Sql = require("./MySQL_X");
const Tool = require("./tool");
const AccountConfig = require("../config/Account");
//宣告發信物件
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: account+'@gmail.com',
        pass: password
    }
});
/**
 * 註冊認證信
 * @param {object} userData : 使用者資料
 * @param {string} path : 伺服器網址
 **/
function register(userData,path){
	return new Promise(function(success,fail){
		let date = Tool.getTimeZone();
		let certification = '1';
		let hash = crypto.createHash('sha256').update(userData.account+date+userData.mail+certification).digest('base64');
		let link = path + "/verify?id=" + hash;
		let mailOptions = {
			to: userData.mail, //收件者
			subject: '註冊認證信', // 主旨
			html: "請點擊下列連接來認證你的會員<br><a href="+link+">"+link+"</a>"
		};
		CreateVerify(hash,userData.userNO,"1",AccountConfig.RegisterVerifyTime,userData.IP).then(function(){
			// 送信
			transporter.sendMail(mailOptions, (error, info) => {
				if (error) {
					console.log(error);
					fail();
				}
				console.log('Message %s sent: %s', info.messageId, info.response);
				success();
			});
		},function(err){
			console.error(err);
			fail();
		});
	});
}
/**
 * 建立認證資料
 * @param {string} hash : 認證碼(CM01)
 * @param {int} userNO : 使用者編號(UA00)
 * @param {string} verifyType : 認證模式(CM02)
 * @param {array} failuerTimeRange : 失效時間([時間類型,數值] EX:["minutes",30] = 30分鐘後失效)
 * @param {string} IP : 使用者IP
 **/
function CreateVerify(hash,userNO,verifyType,failuerTimeRange,IP){
	let DB = new Sql.DB();
	let createTime = Tool.getTimeZone();
	let failureTime = Tool.addTime(createTime,failuerTimeRange[0],failuerTimeRange[1]);
	let verifyData = [{
		key:"CM01",
		value:hash
	},{
		key:"UA00",
		value:userNO
	},{
		key:"CM02",
		value:verifyType
	},{
		key:"CM000",
		value:createTime
	},{
		key:"CM001",
		value:failureTime
	}];
	return DB.insert(verifyData,'CertificationMail',{
		userNO: userNO,
        IP: IP
	},7);
}
module.exports={
	register:register
};