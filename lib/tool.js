'use strict';
let moment = require("moment-timezone");
/**
 * URL加密
 * @param {string} url : 網址
 * @param {object} params : 傳送參數 
 **/
function nav(url, params){
    var hash = url + '?',
        paramsArray = [];
    for(var e in params){
        if(params.hasOwnProperty(e)){
            paramsArray.push(e + '=' + encodeURIComponent(encodeURIComponent(params[e])));
        }
    }
    hash = hash + paramsArray.join('&');
    return hash;
}
/**
 * 物件是否在陣列中
 * @param {Array,Object} array  : 被判斷陣列
 * @param {Object} element      : 欲判斷物件
 **/
function isExist(array, element) {
    'use strict';
    if (this == null) {
        throw new TypeError('Array.prototype.includes called on null or undefined');
    }
    let len = parseInt(array.length, 10) || 0;
    if (len === 0) {
        return false;
    }
    let n = parseInt(arguments[1], 10) || 0;
    let k;
    if (n >= 0) {
        k = n;
    } else {
        k = len + n;
        if (k < 0) { k = 0; }
    }
    let currentElement;
    while (k < len) {
        currentElement = array[k];
        if (element === currentElement ||
         (element !== element && currentElement !== currentElement)) { // NaN !== NaN
            return true;
        }
        k++;
    }
    return false;
}
/**
 * 取得時區的現在時間
 * @param {string} timezone     : 要取得的時區字串，預設為台北
 * @param {string} formatString : 輸出時間字串格式 預設"YYYY-MM-DD HH:mm:ss"
 **/
function getTimeZone(timezone,formatString){
    if(timezone==null){
        timezone = "Asia/Taipei";
    }
    if (formatString == null) return moment().format("YYYY-MM-DD HH:mm:ss");
    else return moment().format(formatString);
}
 /**
	type:
		Key				Shorthand
		years			y
		quarters		Q
		months			M
		weeks			w
		days			d
		hours			h
		minutes			m
		seconds			s
		milliseconds	ms
 **/
 /**
 * 增加時間
 * @param {string} 	time  : 要增加的時間
 * @param {string} 	type  : 增加的類型
 * @param {int}		value : 增加的量
 **/
function addTime(time,type,value){
	let timeType = ["years","y","quarters","Q","months","M","weeks","w","days","d","hours","h","minutes","m","seconds","s","milliseconds","ms"];
	if(timeType.indexOf(type)==-1) return "error Type";
	return moment(time).add(value,type).format("YYYY-MM-DD HH:mm:ss");
}
/**
 * 比較時間
 * @param {string} 	timeA : 時間A
 * @param {string} 	timeB : 時間B
 * @returns {int}	1:A比B晚 0:A與B同時 -1:A比B早
 **/
function compareTime(timeA,timeB){
	let momentA = moment(timeA);
	let momentB = moment(timeB);
	if(momentA > momentB){//A>B
		return 1;
	}else if(momentA == momentB){//A=B
		return 0;
	}else{
		return -1;
	}
}
module.exports = {
	encodeURL:nav,
    isExist: isExist,
    getTimeZone:getTimeZone,
	addTime: addTime,
	compareTime:compareTime
};