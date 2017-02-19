//Need JQuery
function hideFloatBox(){
	$(".float_box_bg").removeClass("change_float_box_opacity");
	$("#float_box_login").removeClass("change_float_box_true");
	$("#float_box_login").css({"left":"150%"});
	$("#float_box_register").removeClass("change_float_box_true");
	$("#float_box_register").css({"left":"150%"});
	$("#float_box_success").removeClass("change_float_box_true");
	$("#float_box_success").css({"left":"150%"});
	$("#float_box_forget").removeClass("change_float_box_true");
	$("#float_box_forget").css({"left":"150%"});
}
function showForgetPasswordBox(){
	$('#form_forget_password').validate({
		rules : {
			m_forget_password_mail : {required : true},
			m_forget_password_account : {required : true}
		}
	});
	$(".float_box_bg").addClass("change_float_box_opacity");
	$("#float_box_forget").addClass("change_float_box_true");
	$("#float_box_forget").css({"left":"30%"});
}
function showSuccessBox(type){
	$(".float_box_bg").addClass("change_float_box_opacity");
	$("#float_box_success").addClass("change_float_box_true");
	$("#float_box_success").css({"left":"30%"});
	switch(type){
		case "register":
			$("#success_float_text").text("註冊成功!請前往信箱收取認證信");
			break;
		case "ForgetPassword":
			$("#success_float_text").text("重置密碼的連結已發送至信箱!請前往信箱收取信件");
			break;
	}
}
function showRegisterBox(){
	$('#form_register').validate({
		rules : {
			m_register_account : {required : true},
			m_register_password : {required : true},
			m_register_password_check: {required : true},
			m_register_mail: {required : true},
			m_register_name: {required : true},
			m_register_yes: {required : true}
		}
	});
	$(".float_box_bg").addClass("change_float_box_opacity");
	$("#float_box_register").addClass("change_float_box_true");
	$("#float_box_register").css({"left":"30%"});
}
function showLoginBox(){
	$('#form_login').validate({
		rules : {
			m_login_account: {required : true},
			m_login_password: {required : true}
		}
	});
	$(".float_box_bg").addClass("change_float_box_opacity");
	$("#float_box_login").addClass("change_float_box_true");
	$("#float_box_login").css({"left":"30%"});
}
function SendLoginData(){
	if($('#form_login').valid()==true){
		$.post("/front/login",{
			Account:$("input[name='m_login_account']").val(),
			Password:$("input[name='m_login_password']").val(),
		},
		function(data){
			if(data != 'success'){
				toastr.error( '',data, {
					"positionClass": "toast-bottom-full-width",
					"timeOut": "3000",
					"closeButton": true
				});
			}else{
				location.reload();
			}
		},'html');
	}
}
function SendRegisterData(){
	if($('#form_register').valid()==true){
		$.post("/front/register",{
			Account:$("input[name='m_register_account']").val(),
			Password:$("input[name='m_register_password']").val(),
			Password_RE:$("input[name='m_register_password_check']").val(),
			Email:$("input[name='m_register_mail']").val(),
			Name:$("input[name='m_register_name']").val(),
		},
		function(data){
			if(data != 'success'){
				toastr.error( '',data, {
					"positionClass": "toast-bottom-full-width",
					"timeOut": "3000",
					"closeButton": true
				});
			}else{
				showSuccessBox("register");
			}
		},'html');
	}
}
function Logout(){
	$.post("/front/logout",{},
	function(data){
		if(data=="return"){
			location.href = "/";
		}
	},'html');
}
function SendForgetPassword(){
	if($('#form_forget_password').valid()==true){
		$.post("/verify/forgetPassword",{
			Account:$("input[name='m_forget_password_account']").val(),
			Email:$("input[name='m_forget_password_mail']").val()
		},
		function(data){
			console.log(data);
			if(data != 'success'){
				toastr.error( '',data, {
					"positionClass": "toast-bottom-full-width",
					"timeOut": "3000",
					"closeButton": true
				});
			}else{
				hideFloatBox();
				showSuccessBox("ForgetPassword");
			}
		},'html');
	}
}
