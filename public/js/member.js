$(document).scroll(function () {
    if ($(document).scrollTop() > 0) {
        $("#wrap_top").css({ "position": "fixed", "z-index": "1001", "box-shadow": "0px 1px 3px #888888", "min-height": "30px" });
        $("#wrap_left").css({ "position": "fixed", "top": "15%" });
        $(".wrap_top_p").addClass("changetoleft_p");
        $(".wrap_top_hr").addClass("changetoleft_hr");
        $(".wrap_body_hr").fadeIn();
        $("#logopic").css({ "width": "7.5%" });
        $("#logopic img").addClass("changetosmall");
        $("#wrap_top_hide").css({ "display": "block" });
    }
    else {
        $("#wrap_top").css({ "position": "relative", "box-shadow": "0px 0px 0px black", "min-height": "100px" });
        $("#wrap_left").css({ "position": "absolute", "top": "0%" });
        $(".wrap_top_p").removeClass("changetoleft_p");
        $(".wrap_top_hr").removeClass("changetoleft_hr");
        $(".wrap_body_hr").hide();
        $("#logopic").css({ "width": "15%" });
        $("#logopic img").removeClass("changetosmall");
        $("#wrap_top_hide").css({ "display": "none" });
    }
});
