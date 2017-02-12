var Sql = require("../lib/MySQL_X");
/**
 * 確認是否為有效帳號
 * @param {User Session} session 
 * ----------------------------
 * 有效的話執行success
 * 無效的話執行error
 * ----------------------------
 **/
function checkLoginBySession(session){
    return new Promise(function (success, error){
        var DB = new Sql.DB();
        DB.select("1");
        DB.where("UA01",session.userID);
        DB.where("UA00",session.userNO);
        DB.get("UserAccount").then(function(resultData){
            if(resultData.length>0){
                console.log("success");
                success();
            }else{
                console.log("error");
                error();
            }
        });
    });
}
/**
 * 登出
 * @param {Html request}  req      
 * @param {html response} res      
 * ----------------------------
 * 重新導向登入畫面
 * ----------------------------
 **/
function logout(req,res){
    if(req.session._admin != null) delete req.session._admin;
    res.redirect('/');
}
module.exports={
    checkLoginBySession:checkLoginBySession,
    logout: logout
};