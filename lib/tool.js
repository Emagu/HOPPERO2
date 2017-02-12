/**
 * 物件是否在陣列中
 * @param {Array,Object} array  : 被判斷陣列
 * @param {Object} element      :欲判斷物件
 **/
function isExist(array, element) {
    'use strict';
    if (this == null) {
        throw new TypeError('Array.prototype.includes called on null or undefined');
    }
    var len = parseInt(array.length, 10) || 0;
    if (len === 0) {
        return false;
    }
    var n = parseInt(arguments[1], 10) || 0;
    var k;
    if (n >= 0) {
        k = n;
    } else {
        k = len + n;
        if (k < 0) { k = 0; }
    }
    var currentElement;
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
 * @param {string} timezone  : 要取得的時區字串，預設為台北
 **/
function getTimeZone(timezone){
    if(timezone==null){
        timezone = "Asia/Taipei";
    }
    return require("moment-timezone")().format("YYYY-MM-DD HH:mm:ss");
}
module.exports = {
    isExist: isExist,
    getTimeZone:getTimeZone
};