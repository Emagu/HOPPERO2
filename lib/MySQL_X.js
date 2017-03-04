'use strict';
/**************************************************************************************************
 *                                    MySQL語句建立函式庫 v2.1                                    *
 *------------------------------------------------------------------------------------------------*
 * 更新記錄:                                                                                      *
 *      v2.3:                                                                                     *
 *          1.完成limit功能更新&詳細敘述                                                          *
 *          1.完成orderBy功能更新&詳細敘述                                                        *
 *      v2.2:                                                                                     *
 *          1.完成變動記錄功能&詳細敘述                                                           *
 *          2.更新使用jsdoc說明文件標準                                                           *
 *      v2.1:                                                                                     *
 *          1.完成update功能更新&詳細敘述                                                         *
 *      v2.0:                                                                                     *
 *          1.完成select功能更新&詳細敘述                                                         *
 *          2.完成insert功能更新&詳細敘述                                                         *
 *------------------------------------------------------------------------------------------------* 
 *  已有功能:                                                                                     *
 *      1.select                                                                                  *
 *      2.insert                                                                                  *
 *      3.order by(未更新)                                                                        *
 *      4.group by(未更新)                                                                        *
 *      5.limit(未更新)                                                                           *
 *      6.update                                                                                  *
 *      7.變動記錄                                                                                *
 **************************************************************************************************/
const Mysql = require("mysql");
const DBConfig = require("../config/database");
const encryptConfig = require("../config/encrypt");
const Tool = require("../lib/tool");
const FS = require("fs");
const connection = Mysql.createPool(DBConfig);
//require("console-stamp")(console, { pattern : "yyyy/mm/dd HH:MM:ss.l" });
let LAST_SQL;
function DB() {
    //暫存
    /**
     *  Select 暫存陣列
     *  Structure: Object Array
     *  ---------------------------
     *  Element:
     *  Structure: Object
     *  {
     *      KEY:搜尋表的KEY,
     *      ACTION:是否加密,
     *      NAME:搜尋結果顯示的變數名稱
     *  }
     **/
    let SelectArray = []; 
    /**
     *  Join 暫存陣列
     *  Structure: Object Array
     *  ---------------------------
     *  Element:
     *  Structure: Object
     *  {
     *      TARGET:     Join Table目標,
     *      RELATION:   Join Table關係,
     *      TYPE:       Join 方式
     *  }
     **/
    let JoinArray = [];
    /**
     *  Join 暫存陣列
     *  Structure: Object Array
     *  ---------------------------
     *  Element:
     *  Structure: Object
     *  {
     *      TARGET:     Join Table目標,
     *      RELATION:   Join Table關係,
     *      TYPE:       Join 方式
     *  }
     **/
    let WhereArray = [];//Element = {KEY:WHERE Table Ket,RELATION:比較關係,VALUE:比較值,TYPE: AND OR,ACTION:加解密動作}
    let OrderByArray = [];
    let GroupByArray = [];
    let LimitSet = new Object();
    let NeedEncrypt = false;
    //private method
    /**
     * BulidSelect
     * --------------------------------------------
     * @return {Array} : 排列好的SQL語法陣列
     **/
    function BulidSelect(){
        let SelectQuery = [];
        SelectQuery.push("Select");
        if (SelectArray.length <= 0) SelectQuery.push("*");
        else {
            SelectArray.forEach(function (select, index) {
                switch (select.ACTION) {
                    case "ENCRYPT":
                        SelectQuery.push("TO_BASE64(AES_ENCRYPT(" + select.KEY + ",@key_str, @init_vector))");
                        NeedEncrypt = true;
                        break;
                    case "DECRYPT":
                        SelectQuery.push("CONVERT(AES_DECRYPT(FROM_BASE64(" + select.KEY + "),@key_str, @init_vector ) using utf8)");
                        NeedEncrypt = true;
                        break;
                    case "HASH":
                        SelectQuery.push("SHA2('" + select.KEY + "', 256)");
                        break;
                    case "DEFAULT":
                        SelectQuery.push(select.KEY);
                        break;
                }
                if (typeof select.NAME != 'undefined') {
                    SelectQuery.push("AS");
                    SelectQuery.push(select.NAME);
                }
                if (index != (SelectArray.length - 1)) {
                    SelectQuery.push(",");
                }
            });
        }
        return SelectQuery;
    }
    /**
     * BulidJoin
     * --------------------------------------------
     * @return {Array} : 排列好的SQL語法陣列
     **/
    function BulidJoin(){
        let JoinQuery = [];
        JoinArray.forEach(function (join) {
            if (join != "INNER") JoinQuery.push(join.TYPE);
            JoinQuery.push("Join");
            JoinQuery.push(join.TARGET);
            if (join.RELATION != 'null') {
                JoinQuery.push("ON");
                JoinQuery.push(join.RELATION);
            }
        });
        return JoinQuery;
    }
    /**
     * BulidWhere
     * --------------------------------------------
     * @return {Array} : 排列好的SQL語法陣列
     **/
    function BulidWhere(){
        let WhereQuery = [];
        if (WhereArray.length > 0) {
            WhereQuery.push("Where");
            WhereArray.forEach(function (where, index) {
                if (index != 0 || (where.TYPE != "AND" && where.TYPE != "OR")) WhereQuery.push(where.TYPE);
                WhereQuery.push(where.KEY);
                if (where.RELATION != "null") WhereQuery.push(where.RELATION);//判斷式不加
                switch (where.ACTION) {
                    case "ENCRYPT":
                        WhereQuery.push("TO_BASE64(AES_ENCRYPT('" + where.VALUE + "',@key_str, @init_vector ))");
                        break;
                    case "DECRYPT":
                        WhereQuery.push("CONVERT(AES_DECRYPT(FROM_BASE64('" + where.VALUE + "'),@key_str, @init_vector ) using utf8)");
                        break;
                    case "HASH":
                        WhereQuery.push("SHA2('" + where.VALUE + "', 256)");
                        break;
                    case "DEFAULT":
                        if (where.VALUE != "null") {
                            if (where.RELATION != "IN") WhereQuery.push("'" + where.VALUE + "'");
                            else WhereQuery.push(where.VALUE);
                        }
                        break;
                }
            });
        }
        return WhereQuery;
    }
    /**
     * BulidLimit
     * --------------------------------------------
     * @return {Array} : 排列好的SQL語法陣列
     **/
    function BulidLimit() {
        let LimitQuery = [];
        if (LimitSet != null) {
            if (LimitSet.START != null && LimitSet.LENGTH != null) {
                LimitQuery.push("Limit");
                LimitQuery.push(LimitSet.START);
                LimitQuery.push(",");
                LimitQuery.push(LimitSet.LENGTH);
            }
        }
        return LimitQuery;
    }
    /**
     * BulidOrderBy
     * --------------------------------------------
     * @return {Array} : 排列好的SQL語法陣列
     **/
    function BulidOrderBy() {
        let OrderByQuery = [];
        if (OrderByArray != null) {
            if (OrderByArray.length > 0) {
                OrderByQuery.push("Order By");
                OrderByArray.forEach(function (order, index) {
                    OrderByQuery.push(order.KEY);
                    if (order.TYPE != "DEFAULT") OrderByQuery.push(order.TYPE);
                    if (index != (OrderByArray.length - 1)) OrderByQuery.push(",");
                });
            }
        }
        return OrderByQuery;
    }
    /**
     * BulidUpdate
     * --------------------------------------------
     * @param {array} newData : 更新的資料
     * --------------------------------------------
     * newData element 格式
     *  {
     *      key:    欄位名稱
     *      value:  資料數值
     *      action: 加解密動作
     *  }
     * --------------------------------------------
     * @return {string} : 排列好的SQL語法
     **/
    function BulidUpdate(newData) {
        if (newData.length == 0) {
            return "";
        } else {
            let columns = [];
            newData.forEach(function(data){
                switch (data.action) {
                    case "ENCRYPT":
                        columns.push(data.key + "= " + aesEncrypt(data.value, true));
                        NeedEncrypt = true;
                        break;
                    case "DECRYPT":
                        columns.push(data.key + "= " + aesDecrypt(data.value, true));
                        NeedEncrypt = true;
                        break;
                    case "HASH":
                        columns.push(data.key + "= " + "SHA2('" + data.value + "', 256)");
                        break;
                    case "DEFAULT":
                        columns.push(data.key + "= '" + data.value + "'");
                        break;
                    default:
                        columns.push(data.key + "= '" + data.value + "'");
                        break;
                }
            });
            return columns.join(",");
        }
    }
    /**
     * MysqlInit
     * --------------------------------------------
     * 重置暫存資料
     * --------------------------------------------
     * @return Null
     **/
    function MysqlInit() {
        SelectArray = []; 
        JoinArray = [];
        WhereArray = [];
        NeedEncrypt = false;
        GroupByArray = [];
        OrderByArray = [];
        LimitSet = new Object();
    }
    /** --------------------------------------------
     * 回傳使用範例
     *  querySql("select '1' from 'UserAccount';",false).then(function(result){
     *     console.log(result);//印出結果
     *  },function(err){
     *      console.error(err);
     *  });
     **/
    /**
     * querySql
     * --------------------------------------------
     * 送出SQL語句需求
     * --------------------------------------------
     * @param {string}  sql : SQL語句
     * @param {bool}    NE  : 是否需要執行加解密動作
     * @returns {promise}
     **/
    function querySql(sql, NE) {
        LAST_SQL = sql;
        return new Promise(function (query, error) {
            connection.query(sql, [], function (err, res) {
                let realData = [];
                if (err) {
                    console.log(sql);
                    error(err);
                }else {
                    if (NE) {
                        MysqlInit();
                        if (res.length > 4) {
                            for (let i=3; i < res.length; i++) {
                                realData.push(res[i]);
                            }
                            query(realData);
                        } else {
                            query(res[3]);
                        }
                    } else {
                        MysqlInit();
                        query(res);
                    }
                }
            });
        });
    }
    /** --------------------------------------------
     *  userData格式:
     *  {
     *      userNO:UA00,
     *      IP: 使用者IP
     *  }
     **/
    /**
     * auditTrailLog
     * --------------------------------------------
     * 修改SQL記錄
     * --------------------------------------------
     * @param {string}  sql      : SQL語句
     * @param {int}     workType : 工作類型
     * @param {object}  userData : 修改者資料
     * @returns {null}
     **/
    function auditTrailLog(sql, workType, userData) {
        let db = new DB();
        let logData = [];
        //↓處理使用者資料
        //使用者編號
        if(userData.userNO==null){//系統
            logData.push({
                key: "UA00",
                value: "-1"
            });
        }else{
            logData.push({
                key: "UA00",
                value: userData.userNO
            });
        }
        //IP
        logData.push({
            key: "UAA03",
            value: userData.IP
        });
        //時間
        logData.push({
            key: "UAA000",
            value: Tool.getTimeZone()
        });
        //↑處理使用者資料
        //SQL語句
        logData.push({
            key: "UAA02",
            value: sql.replace(/'/g,'"')
        });
        //工作類型
        if(workType==null){//未知!!!GGGG
            logData.push({
                key: "UAA01",
                value: 0
            });
        }else{
            logData.push({
                key: "UAA01",
                value: workType
            });
        }
        db.insert(logData,"UserAccountAction").then(function(){
        },function(err){
            console.error(err);
        });
    }
    function aesEncrypt(target, is_value) {
        if (is_value === true) {
            //IS VALUE
            return "TO_BASE64(AES_ENCRYPT('" + target + "',@key_str, @init_vector))";
        } else {
            //IS KEY
            return "TO_BASE64(AES_ENCRYPT(" + target + ",@key_str, @init_vector))";
        }
    }
    function aesDecrypt(target, is_value) {
        if (is_value === true) {
            //IS VALUE
            return "CONVERT(AES_DECRYPT(FROM_BASE64('" + target + "'),@key_str, @init_vector ) using utf8)";
        } else {
            //IS KEY
            return "CONVERT(AES_DECRYPT(FROM_BASE64(" + target + "),@key_str, @init_vector ) using utf8)";
        }
    }
    function bulidQueryString(fromData, groupData, orderData, limitData) {
        let QueryArray = [];
        //插入Select
        QueryArray = QueryArray.concat(BulidSelect());
        //插入From
        QueryArray.push("From");
        QueryArray.push(fromData);
        //插入Join
        QueryArray = QueryArray.concat(BulidJoin());
        //插入Where
        QueryArray = QueryArray.concat(BulidWhere());
        //插入 Group By
        if (groupData.length > 0) {
            QueryArray.push("Group By");
            groupData.forEach(function (group, index) {
                QueryArray.push(group.KEY);
                if (index != (groupData.length - 1)) QueryArray.push(",");
            });
        }
        //插入 Order By
        QueryArray = QueryArray.concat(BulidOrderBy());
        //插入 Limit
        QueryArray = QueryArray.concat(BulidLimit());
        //生成字串
        return QueryArray.join(" ");
    }
    //public method
    /** --------------------------------------------
     * action:
     * 'DEFAULT'    : 無動作(預設)
     * 'ENCRYPT'    : 加密
     * 'DECRYPT'    : 解密
     * 'HASH'       : 不可逆加密
     * --------------------------------------------
     * 操作範例
     * SQL.select("UA00","DEFAULT","NO");
     * SQL.select("UA01","DECRYPT","ID"); 
     * => SELECT "UA00" AS "NO", CONVERT(AES_DECRYPT(FROM_BASE64("UA01",@key_str, @init_vector ) using utf8) AS "ID"
     **/
     /**
     * Select
     * @param {string} key      : Table 欄位名稱
     * @param {string} action   : 加解密動作
     * @param {string} name     : 選取後的暱稱
     * @returns {null}
     **/
    this.select = function (key, action, name) {
        if (key != '' && (typeof key == 'number' || typeof key == 'string')) {
            if (action == 'ENCRYPT' || action == 'DECRYPT' || action == 'HASH') {
                if (name == null) {
                    console.log("加密蒐尋 必須帶有欄位暱稱!");
                    return;
                }
                NeedEncrypt = true;
            } else {
                action = 'DEFAULT';
            }
            SelectArray.push({
                KEY: key.toString(),
                ACTION: action,
                NAME: name
            });
        } else console.log("select key:" + key + "set error");
    };
    /**--------------------------------------------
     * type:
     * "LEFT"   預設
     * "Natural"
     * "RIGHT" 
     * "LEFT OUTER"
     * "INNER"
     * --------------------------------------------
     * 操作範例
     * SQL.join("MangerAccount","MangerAccount.UA00=UserAccount.UA00");
     * SQL.get("UserAccount"); 
     * => LEFT JOIN 'MangerAccount' ON 'MangerAccount.UA00=UserAccount.UA00' From 'UserAccount'
     **/
    /**
     * Join
     * @param {string} tableName    : 關聯的表名
     * @param {string} relation     : 關聯的運算式
     * @param {string} type         : 關聯的類型
     * @returns {null}
     **/
    this.join = function (tableName, relation, type) {
        if (typeof tableName === "string" && tableName != '' && typeof relation == "string" && relation != '') {
            if (type != "Natural" && type != "RIGHT" && type != "LEFT OUTER" && type != "INNER") {
                type = "LEFT";
            }
            JoinArray.push({
                TARGET: tableName,
                RELATION: relation,
                TYPE: type
            });
        } else console.log("join set error");
    };
    /** --------------------------------------------
     * relation:
     * "="  預設
     * "<"
     * ">"
     * "<>"
     * "<="
     * ">="
     * "null"
     * "LIKE"
     * "IN"
     * --------------------------------------------
     * type:
     * "AND" 預設
     * "OR"
     * "NOT IN"
     * --------------------------------------------
     * action:
     * 'DEFAULT'    : 無動作(預設)
     * 'ENCRYPT'    : 加密
     * 'DECRYPT'    : 解密
     * 'HASH'       : 不可逆加密
     * --------------------------------------------
     * 操作範例
     * SQL.where("UA00","1");
     * SQL.where("UA01","Jacky","<>","OR","DECRYPT");
     * => where "UA00" = '1' OR "UA01" <> CONVERT(AES_DECRYPT(FROM_BASE64('Jacky'),@key_str, @init_vector ) using utf8)
     **/
    /**
     * where
     * @param {string} key          : 欄位名稱
     * @param {string} value        : 比較數值
     * @param {string} relation     : 比較類型
     * @param {string} type         : 邏輯關聯類型
     * @param {string} action       : 比較數值加解密動作
     * @returns {null}
     **/
    this.where = function (key, value, relation, type, action) {
        if (typeof key === "string" && key != '') {
            if (relation != "<" && relation != ">" && relation != "<>" && relation != "<=" && relation != ">=" && relation != "null" && relation != "LIKE" && relation != "IN") {
                relation = "=";
            }
            if (type != "AND" && type != "OR" && type != "NOT IN") {
                type = "AND";
            }
            if (action == 'ENCRYPT' || action == 'DECRYPT' || action == 'HASH') {
                NeedEncrypt = true;
            } else {
                action = 'DEFAULT';
            }
            WhereArray.push({
                KEY: key,
                RELATION: relation,
                VALUE: value,
                TYPE: type,
                ACTION: action
            });
        } else console.log("where set error");
    };
    
    //↓尚未更新區塊
    this.groupBy = function (key) {
        if (typeof key === "string") {
            GroupByArray.push({
                KEY: key,
            });
        } else {
            console.log("groupBy set error");
        }
    };
    //↑尚未更新區塊
    /** --------------------------------------------
     * 操作範例
     * SQL.orderBy("UA00","ASC");
     * => UA00 從小到大排列
     **/
    /**
     * orderBy
     * @param {string} key        : 排列目標的key Name
     * @param {string} type       : 排列方法
     **/
    this.orderBy = function (key, type) {
        if (typeof key === "string" && key != '') {
            if (type == 'DESC' || type == 'desc' || type=="ASC" || type == "asc") {
                
            } else {
                type = 'DEFAULT';
            }
            OrderByArray.push({
                KEY: key,
                TYPE: type
            });
        } else {
            console.log("orderBy set error");
        }
    };
    /** --------------------------------------------
     * 操作範例
     * SQL.limit(0,20);
     * => 從第0筆後的20筆資料
     **/
    /**
     * limit
     * @param {int} start        : 開頭的資料index
     * @param {int} length       : 搜尋的資料長度
     **/
    this.limit = function (start, length) {
        if (typeof start == 'number' && typeof length == 'number' && start >= 0 && length > 0)
            LimitSet = {
                START: start,
                LENGTH: length
            };
        else console.log("limit set error");
    };
    /** --------------------------------------------
     * select 條件設置完畢後使用
     * --------------------------------------------
     * 操作範例
     * SQL.select("UA00");
     * SQL.where("UA00",1);
     * SQL.get("UserAccount");
     * => SELECT 'UA00' FROM 'UserAccount' WHERE 'UA00' = '1';
     * --------------------------------------------
     * 回傳使用範例
     *  SQL.get("UserAccount").then(function(result){
     *     console.log(result);//印出搜尋結果
     *  },function(err){
     *      console.error(err);
     *  });
     **/
    /**
     * get
     * @param {string} tableName        : 搜尋Table名稱
     * @param {bool} outputSql          : 是否consle 使用的SQL語句(用於偵錯)
     * @returns {promise}
     **/
    this.get = function (tableName, outputSql) {
        const promise_query = new Promise(function (query, error) {
            if (tableName == null) {
                error("error TableName");
            } else {
                let SqlQuery = "";
                if (NeedEncrypt) {
                    SqlQuery += "SET block_encryption_mode = '" + encryptConfig.type + "';";
                    SqlQuery += "SET @key_str = '" + encryptConfig.key + "';";
                    SqlQuery += "SET @init_vector = '" + encryptConfig.i_v + "';";
                }
                SqlQuery += bulidQueryString(tableName, GroupByArray, OrderByArray, LimitSet) + ";";
                if (outputSql === true) {
                    console.log(SqlQuery);
                }
                querySql(SqlQuery, NeedEncrypt).then(
                    function (data) {
                        query(data);
                    },
    			    function (err) {
                        console.error(err);
                        error(err);
                    }
                );
            }
        });
        MysqlInit();
        return promise_query;
    };
    /** --------------------------------------------
     * newData element 格式
     *  {
     *      key:    欄位名稱
     *      value:  資料數值
     *      action: 加解密動作
     *  }
     * --------------------------------------------
     * action:
     * 'DEFAULT'    : 無動作(預設)
     * 'ENCRYPT'    : 加密
     * 'DECRYPT'    : 解密
     * 'HASH'       : 不可逆加密
     * --------------------------------------------
     *  userData格式:
     *  {
     *      userNO:UA00,
     *      IP: 使用者IP
     *  }
     * --------------------------------------------
     * workType(查閱SQL工作表)
     * --------------------------------------------
     * 操作範例
     *  let newData = [{
     *      key:"UA05",
     *      value:req.body.Name,
     *		action:"ENCRYPT"
     *  },{
     *      key:"UA000",
     *      value:Tool.getTimeZone()
     *  },{
     *      key:"UA001",
     *      value:Tool.getTimeZone()
     *  }];
     *  SQL.insert(newData,"UserAccount");
     * --------------------------------------------
     * 回傳使用範例
     *  SQL.insert(newData,"UserAccount").then(function(result){
     *     console.log(result);//印出結果
     *  },function(err){
     *      console.error(err);
     *  });
     **/
    /**
     * insert
     * @param {Array} newData        : 新增的資料陣列
     * @param {string} tableName     : 新增的表名
     * @param {object} userData      : 新增者的資料
     * @param {string} workType      : 工作類型
     * @returns {promise}            
     **/
    this.insert = function (newData, tableName, userData, workType) {
        return new Promise(function (query, error) {
            if (tableName == null) {
                error("error TableName");
            } else if (newData == null) {
                error("error data");
            } else {
                let SqlQuery = "";
                let columns = [];
                let values = [];
                
                for (let i in newData) {
                    columns.push(newData[i].key);
                    switch (newData[i].action) {
                        case "ENCRYPT":
                            values.push(aesEncrypt(newData[i].value, true));
                            NeedEncrypt = true;
                            break;
                        case "DECRYPT":
                            values.push(aesDecrypt(newData[i].value, true));
                            NeedEncrypt = true;
                            break;
                        case "HASH":
                            values.push("SHA2('" + newData[i].value + "', 256)");
                            break;
                        case "DEFAULT":
                            values.push("'" + newData[i].value + "'");
                            break;
                        default:
                            values.push("'" + newData[i].value + "'");
                            break;
                    }
                }
                if (NeedEncrypt) {
                    SqlQuery += "SET block_encryption_mode = '" + encryptConfig.type + "';";
                    SqlQuery += "SET @key_str = '" + encryptConfig.key + "';";
                    SqlQuery += "SET @init_vector = '" + encryptConfig.i_v + "';";
                }
                SqlQuery += "Insert Into " + tableName + " (" + columns.join(',') + ") Values (" + values.join(',') + ");";
                if (userData != null) auditTrailLog(SqlQuery, workType, userData);
                querySql(SqlQuery, NeedEncrypt).then(
                    function (info) {
                        query(info);
                    },
				    function (err) {
                        console.error(err);
                        error(err);
                    }
                );
            }
        });
    };
    /************************************************************
     *      update格式說明                                      *
     ************************************************************
     * newData element 格式
     *  {
     *      key:    欄位名稱
     *      value:  資料數值
     *      action: 加解密動作
     *  }
     * ---------------------------------------------------------
     * action:
     * 'DEFAULT'    : 無動作(預設)
     * 'ENCRYPT'    : 加密
     * 'DECRYPT'    : 解密
     * 'HASH'       : 不可逆加密
     * ---------------------------------------------------------
     *  userData格式:
     *  {
     *      userNO:UA00,
     *      IP: 使用者IP
     *  }
     * ---------------------------------------------------------
     * workType(查閱SQL工作表)
     * ---------------------------------------------------------
     * 操作範例
     *  let newData = [{
     *      key:"UA05",
     *      value:req.body.Name,
     *		action:"ENCRYPT"
     *  },{
     *      key:"UA000",
     *      value:Tool.getTimeZone()
     *  },{
     *      key:"UA001",
     *      value:Tool.getTimeZone()
     *  }];
     *  SQL.update(newData,"UserAccount");
     * ---------------------------------------------------------
     * 
     * 範例
     *  SQL.update(newData,"UserAccount").then(function(result){
     *     console.log(result);//印出結果
     *  },function(err){
     *      console.error(err);
     *  });
     ***********************************************************/
    /**
     * update
     * @param {Array} newData        : 更新的資料陣列
     * @param {string} tableName     : 更新的表名
     * @param {object} userData      : 更新者的資料
     * @param {string} workType      : 工作類型
     * @returns {promise}
     **/
    this.update = function (newData, tableName, userData, workType) {
        return new Promise(function (query, error) {
            if (tableName == null) {
                MysqlInit();
                error("error TableName");
            } else if (newData == null) {
                MysqlInit();
                error("error data");
            } else {
                let SqlQuery = "";
                if (NeedEncrypt) {
                    SqlQuery += "SET block_encryption_mode = '" + encryptConfig.type + "';";
                    SqlQuery += "SET @key_str = '" + encryptConfig.key + "';";
                    SqlQuery += "SET @init_vector = '" + encryptConfig.i_v + "';";
                }
                SqlQuery += "Update " + tableName + " SET " + BulidUpdate(newData) + " " + BulidWhere().join(" ") + ";";
                if (userData != null) auditTrailLog(SqlQuery, workType, userData);
                querySql(SqlQuery, NeedEncrypt).then(
                    function (info) {
                        MysqlInit();
                        query(info);
                    },
				    function (err) {
                        MysqlInit();
                        error(err);
                    }
                );
            }
        });
    };
    
    this.query = function (Sql, NE) {
        return querySql(Sql, NE);
    };
    
    // this.dataTableQuery = function (tableName, sumArray) {
    //     function bulidSumQuery() {
    //         let str = "";
    //         for (let i in sumArray) {
    //             str += ",SUM(" + sumArray[i].Name + ") as " + sumArray[i].Name;
    //         }
    //         return str;
    //     }
    //     return new Promise(function (query, error) {
    //         if (tableName == null) {
    //             error("error TableName");
    //         } else {
    //             let SqlQuery = "";
    //             if (NeedEncrypt) {
    //                 SqlQuery += "SET block_encryption_mode = '" + encryptConfig.type + "';";
    //                 SqlQuery += "SET @key_str = '" + encryptConfig.key + "';";
    //                 SqlQuery += "SET @init_vector = '" + encryptConfig.i_v + "';";
    //             }
    //             let FromQuery;
    //             if (sumArray == null) FromQuery = bulidQueryString([{ KEY: 1, TYPE: 'DEFAULT' }], tableName, JoinArray, WhereArray, GroupByArray);
    //             else FromQuery = bulidQueryString(sumArray, tableName, JoinArray, WhereArray, GroupByArray);
    //             SqlQuery += "SELECT COUNT(*) as num_of_rows";
    //             if (sumArray != null) SqlQuery += bulidSumQuery();
    //             SqlQuery += " FROM(" + FromQuery + ") AS COUNT_TABLE;";//計數
    //             SqlQuery += bulidQueryString(SelectArray, tableName, JoinArray, WhereArray, GroupByArray, OrderByArray, LimitSet) + ";";
    //             querySql(SqlQuery, NeedEncrypt).then(
    //                 function (data) {
    //                     query(data);
    //                 }, function (err) {
    //                     error(err);
    //                 }
    //             );
    //         }
    //     });
    // };
    
    
}
module.exports = {
    DB: DB,
    getLastQuery: LAST_SQL
};