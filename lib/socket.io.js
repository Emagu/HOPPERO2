'use strict';
const COOKIES = require('cookie');
const Sql = require("./MySQL_X");
let Users = [];
const USE_MESSAGE = false; //站內聊天框
const USE_MAIL = true; //站內信
let WebSocket = function(http,session){
    let io = require('socket.io')(http);
    //Session初始化
	io.use(function(socket, next) {
		session(socket.request, socket.request.res, next);
    });
    //客戶連線瞜~
    io.on("connection", function (socket){
        //socket = 客戶端
		let cookiesObject = COOKIES.parse(socket.request.headers.cookie);
        let SessionObject = socket.request.session;
        let user = SessionObject._admin;
        if(user!=null){
            user.socket = socket;
            Users[user.userNO] = user;
            socket.userNO = user.userNO;
    		socket.on('disconnect', function () {
    		    delete Users[socket.userNO];
    			console.log('disconnect');
    		});
        }
	});
	setInterval(function(){//週期任務
	    Users.forEach(function(user){//所有已連線使用者
	        if(USE_MESSAGE){
	            //判斷是否有為接收的訊息
    	        getNewMessage(user.userNO).then(function(data){
    	            if(data.length>0) {
    	                updateMessageStatus(data[0].NO);
    	                user.socket.emit("SendMessage",data[0]);
    	            }
    	        });
	        }
	        if(USE_MAIL){
	            //判斷是否有未讀信件
    	        getNewMail(user.userNO).then(function(data){
                    user.socket.emit("SendNewMailCount",data.length);
    	        });
	        }
	    });
	},1000);
};
/**
 * 取得未傳送的訊息
 * @param {int} userNo  : 接收者的userNO(UA00)
 **/
function getNewMessage(userNO){
    let DB = new Sql.DB();
    DB.select("M00","DEFAULT","NO");
    DB.select("M01","DECRYPT","Message");
    DB.select("UA01","DECRYPT","Sender");
    DB.select("UA00","DEFAULT","SenderNO");
    DB.join("UserAccount","Message.UA00A=UserAccount.UA00");
    DB.where("UA00B",userNO);
    DB.where("M002",0);
    return DB.get("Message");
}
/**
 * 取得未讀的信
 * @param {int} userNo  : 接收者的userNO(UA00)
 **/
function getNewMail(userNO){
    let DB = new Sql.DB();
    DB.select("1");
    DB.where("UA00B",userNO);
    DB.where("MA001",0);
    DB.where("MA002",0);
    return DB.get("Mail");
}
/**
 * 更新傳送的訊息的狀態
 * @param {int} MessageNo  : 剛傳送訊息的MessageNO(M00)
 **/
function updateMessageStatus(MessageNO){
    let DB = new Sql.DB();
    DB.where("M00",MessageNO.toString());
    DB.update([
        {
            key:"M002",
            value:1
        }
    ],"Message").then(function(){
        console.log("susses");
    },function(err){
        console.log(err);
    });
}
module.exports = WebSocket;