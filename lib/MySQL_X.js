'use strict';
const Mysql = require("mysql");
const DBConfig = require("../config/database");
const encryptConfig = require("../config/encrypt");
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
        if (orderData != null) {
            if (orderData.length > 0) {
                QueryArray.push("Order By");
                orderData.forEach(function (order, index) {
                    QueryArray.push(order.KEY);
                    if (order.TYPE != "DEFAULT") QueryArray.push(order.TYPE);
                    if (index != (orderData.length - 1)) QueryArray.push(",");
                });
            }
        }
        //插入 Limit
        if (limitData != null) {
            if (limitData.START != null && limitData.LENGTH != null) {
                QueryArray.push("Limit");
                QueryArray.push(limitData.START);
                QueryArray.push(",");
                QueryArray.push(limitData.LENGTH);
            }
        }
        //生成字串
        return QueryArray.join(" ");
    }
    //public method
    /**
     * Select
     * @param {string} key      : Table 欄位名稱
     * @param {string} action   : 加解密動作
     * @param {string} name     : 選取後的暱稱
     * --------------------------------------------
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
     * --------------------------------------------
     * @return Null
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
    /**
     * Join
     * @param {string} tableName    : 關聯的表名
     * @param {string} relation     : 關聯的運算式
     * @param {string} type         : 關聯的類型
     * --------------------------------------------
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
     * --------------------------------------------
     * @return Null
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
    /**
     * where
     * @param {string} key          : 欄位名稱
     * @param {string} value        : 比較數值
     * @param {string} relation     : 比較類型
     * @param {string} type         : 邏輯關聯類型
     * @param {string} action       : 比較數值加解密動作
     * --------------------------------------------
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
     * --------------------------------------------
     * @return Null
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
    this.groupBy = function (key) {
        if (typeof key === "string") {
            GroupByArray.push({
                KEY: key,
            });
        } else {
            console.log("groupBy set error");
        }
    };
    this.orderBy = function (key, type) {
        if (typeof key === "string" && key != '') {
            if (type == 'DESC' || type == 'desc' || type == "asc") {
                
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
    this.limit = function (start, length) {
        if (typeof start == 'number' && typeof length == 'number' && start >= 0 && length > 0)
            LimitSet = {
                START: start,
                LENGTH: length
            };
        else console.log("limit set error");
    };
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
    // this.insert = function (newData, tableName, userData, remark) {
    //     return new Promise(function (query, error) {
    //         if (tableName == null) {
    //             error("error TableName");
    //         } else if (newData == null) {
    //             error("error data");
    //         } else {
    //             let SqlQuery = "";
    //             let columns = [];
    //             let values = [];
                
    //             for (let i in newData) {
    //                 columns.push(newData[i].key);
    //                 switch (newData[i].type) {
    //                     case "ENCRYPT":
    //                         values.push(aesEncrypt(newData[i].value, true));
    //                         NeedEncrypt = true;
    //                         break;
    //                     case "DECRYPT":
    //                         values.push(aesDecrypt(newData[i].value, true));
    //                         NeedEncrypt = true;
    //                         break;
    //                     case "HASH":
    //                         values.push("SHA2('" + newData[i].value + "', 256)");
    //                         break;
    //                     case "DEFAULT":
    //                         values.push("'" + newData[i].value + "'");
    //                         break;
    //                     default:
    //                         values.push("'" + newData[i].value + "'");
    //                         break;
    //                 }
    //             }
    //             if (NeedEncrypt) {
    //                 SqlQuery += "SET block_encryption_mode = '" + encryptConfig.type + "';";
    //                 SqlQuery += "SET @key_str = '" + encryptConfig.key + "';";
    //                 SqlQuery += "SET @init_vector = '" + encryptConfig.i_v + "';";
    //             }
    //             SqlQuery += "Insert Into " + tableName + " (" + columns.join(',') + ") Values (" + values.join(',') + ");";
    //             if (userData != null) auditTrailLog(SqlQuery, tableName, "Insert", userData, remark);
    //             querySql(SqlQuery, NeedEncrypt).then(
    //                 function (info) {
    //                     query(info);
    //                 },
				//     function (err) {
    //                     console.error(err);
    //                     error(err);
    //                 }
    //             );
    //         }
    //     });
    // };
    // this.update = function (newData, tableName, userData, remark) {//
    //     return new Promise(function (query, error) {
    //         if (tableName == null) {
    //             MysqlInit();
    //             error("error TableName");
    //         } else if (newData == null) {
    //             MysqlInit();
    //             error("error data");
    //         } else {
    //             let SqlQuery = "";
    //             if (NeedEncrypt) {
    //                 SqlQuery += "SET block_encryption_mode = '" + encryptConfig.type + "';";
    //                 SqlQuery += "SET @key_str = '" + encryptConfig.key + "';";
    //                 SqlQuery += "SET @init_vector = '" + encryptConfig.i_v + "';";
    //             }
    //             SqlQuery += "Update " + tableName + " SET " + bulidUpdate(newData) + " " + bulidWhere() + ";";
    //             //console.log(SqlQuery);
    //             if (userData != null) auditTrailLog(SqlQuery, tableName, "Update", userData, remark);
    //             querySql(SqlQuery, NeedEncrypt).then(
    //                 function (info) {
    //                     MysqlInit();
    //                     query(info);
    //                 },
				//     function (err) {
    //                     MysqlInit();
    //                     error(err);
    //                 }
    //             );
    //         }
    //     });
    // };
    this.query = function (Sql, NE) {
        //console.log(Sql);
        return querySql(Sql, NE);
    };
    this.last_query = LAST_SQL;
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
    // 
    //private method
    
    
    // function bulidWhere() {
    //     if (WhereArray.length <= 0) return " ";
    //     else {
    //         let WhereQueryArray = "";
    //         for (let i in WhereArray) {
    //             let WhereQuery;
    //             if (WhereArray[i].VALUE == "null" && WhereArray[i].RELATION == "null") {
    //                 WhereQuery = "AND " + WhereArray[i].KEY + " ";
    //             } else {
    //                 let QWV, WV;
    //                 if (!WhereArray[i].VALUE.includes('.')) WV = "'" + WhereArray[i].VALUE + "'";
    //                 switch (WhereArray[i].ACTION) {
    //                     case "ENCRYPT":
    //                         QWV = "TO_BASE64(AES_ENCRYPT(" + WV + ",@key_str, @init_vector ))";
    //                         break;
    //                     case "DECRYPT":
    //                         QWV = "CONVERT(AES_DECRYPT(FROM_BASE64(" + WV + "),@key_str, @init_vector ) using utf8)";
    //                         break;
    //                     case "HASH":
    //                         QWV = "SHA2(" + WV + ", 256)";
    //                         break;
    //                     case "DEFAULT":
    //                         QWV = WV;
    //                         break;
    //                 }
    //                 if (i == 0) {
    //                     if (WhereArray[i].TYPE == "AND" || WhereArray[i].TYPE == "OR") {
    //                         WhereQuery = "WHERE " + WhereArray[i].KEY + " " + WhereArray[i].RELATION + " " + QWV + " ";
    //                     } else {
    //                         WhereQuery = "WHERE " + WhereArray[i].TYPE + " " + WhereArray[i].KEY + " " + WhereArray[i].RELATION + " " + QWV + " ";
    //                     }
    //                 } else {
    //                     WhereQuery = WhereArray[i].TYPE + " " + WhereArray[i].KEY + " " + WhereArray[i].RELATION + " " + QWV + " ";
    //                 }
    //             }
    //             WhereQueryArray += WhereQuery;
    //         }
    //         return WhereQueryArray;
    //     }
    // }
    // function bulidUpdate(newData) {
    //     if (newData.length == 0) {
    //         return "";
    //     } else {
    //         let SqlQuery = "";
    //         let columns = [];
    //         for (let i in newData) {
    //             switch (newData[i].type) {
    //                 case "ENCRYPT":
    //                     columns.push(newData[i].key + "= '" + aesEncrypt(newData[i].value, true) + "'");
    //                     NeedEncrypt = true;
    //                     break;
    //                 case "DECRYPT":
    //                     columns.push(newData[i].key + "= '" + aesDecrypt(newData[i].value, true) + "'");
    //                     NeedEncrypt = true;
    //                     break;
    //                 case "HASH":
    //                     columns.push(newData[i].key + "= '" + "SHA2('" + newData[i].value + "', 256)'");
    //                     break;
    //                 case "DEFAULT":
    //                     columns.push(newData[i].key + "= '" + newData[i].value + "'");
    //                     break;
    //                 default:
    //                     columns.push(newData[i].key + "= '" + newData[i].value + "'");
    //                     break;
    //             }
    //         }
    //         SqlQuery += columns.join(",");
    //         return SqlQuery;
    //     }
    // }
    function querySql(sql, NE) {
        LAST_SQL = sql;
        return new Promise(function (query, error) {
            connection.query(sql, [], function (err, res) {
                let realData = [];
                if (err) {
                    console.log(sql);
                    error(err);
                }
                else {
                    //console.log(res);
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
}
function auditTrailLog(sql, tableName, workType, userData, remark) {
    function newTrailLog(userName) {
        let db = new DB();
        db.insert(
            [
                {
                    key: "UP01",
                    value: userData.id,
                    type: "DECRYPT"
                },
                {
                    key: "H01",
                    value: userData.hotel_id
                },
                {
                    key: "ATL02",
                    value: userName,
                    type: userData.id == userData.admin_id ? "" : "ENCRYPT"
                },
                {
                    key: "ATL03",
                    value: remark
                },
                {
                    key: "ATL04",	
                    value: workType
                },
                {
                    key: "ATL05",
                    value: tableName
                },
                {
                    key: "ATL06",
                    value: sql.replace(/\'/g, '"')
                },
                {
                    key: "ATL07",
                    value: userData.IP
                },
                {
                    key: "ATL001",
                    value: userData.Date
                }
            ],
			"audittraillog"
        ).then(function (status) {
            console.log(status);
        });
    }
    let d = new DB();
    if (userData.id == userData.admin_id) {
        d.where("UP01", userData.id);
        d.get("member", true).then(
            function (member_data) {
                newTrailLog(member_data[0].M04);
            },
		    function (err) {
                console.error(err);
            });
    } else {
        d.where("UP01", userData.id);
        d.get("staffaccount").then(
            function (member_data) {
                newTrailLog(member_data[0].SA02);
            }, function (err) {
                console.error(err);
            }
        );
    }
}
module.exports = {
    DB: DB,
    getLastQuery: LAST_SQL
};