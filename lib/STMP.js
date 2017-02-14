const nodemailer = require('nodemailer');
const crypto = require('crypto');
const account='',password='';
const Sql = require("./MySQL_X");
const Tool = require("./tool");
//宣告發信物件
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: account+'@gmail.com',
        pass: password
    }
});
function register(useraccount,mail,path){
	return new Promise(function(success,fail){
		let date = Tool.getTimeZone();
		let certification=1;
		let hash = crypto.createHash('sha256').update(useraccount+date+mail+certification).digest('base64');
		console.log(hash);
		let link=path+"?id="+hash;
		let mailOptions = {
			to: mail, //收件者
			subject: '註冊認證信', // 主旨
			html: "請點擊下列連接來認證你的會員<br><a href="+link+"</a>"
		};
		// 送信
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				console.log(error);
				fail();
			}
			console.log('Message %s sent: %s', info.messageId, info.response);
			success();
		});
	});
	
}
// function verify(req,res){
// 	let DB = new Sql.DB();

// 	if(hash==reg.get){
		
// 	}
// 	else{
		
// 	}
// }
module.exports={
	register:register
};