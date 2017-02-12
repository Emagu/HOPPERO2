'use strict';
/*
	.select(key,type,name) 	select key as name, if type = (ENCRYPT,DECRYPT,HASH)
	.where(key,value,relation,type,action) where (type) key relation value 
		relation:{
			=,<=,>=,<,>,null,LIKE
		}
		type:{
			AND,OR,IN,NOT IN
		}
		action:{
			ENCRYPT,DECRYPT,HASH
		}
	.orderBy(key,type)		order by key type
*/
const CONSOLE_SQL_LOG = false;//true: console.log(sql_string) 輸出該次SQL語句
const Mysql = require("mysql");
const DBConfig = require("../config/database");
const encryptConfig = require("../config/encrypt");
const FS = require("fs");
const connection = Mysql.createPool(DBConfig);
//require("console-stamp")(console, { pattern : "yyyy/mm/dd HH:MM:ss.l" });
let LAST_SQL;
function DB() {
    //暫存
    let SelectArray = []; //Element = {KEY:搜尋表的KEY,TYPE:是否加密,NAME:搜尋結果顯示的變數名稱}
    let JoinArray = [];//Element = {TARGET:Join Table目標,RELATION:Join Table 關係,TYPE:Join 方式}
    let WhereArray = [];//Element = {KEY:WHERE Table Ket,RELATION:比較關係,VALUE:比較值,TYPE: AND OR,ACTION:加解密動作}
    let NeedEncrypt = false;
    let OrderByArray = [];
    let GroupByArray = [];
    let LimitSet = new Object();
    //public method
    this.select = function (key, type, name) {//(key,type,name)
        if (key != '' && (typeof key == 'number' || typeof key == 'string')) {
            if (type == 'ENCRYPT' || type == 'DECRYPT' || type == 'HASH') {
                if (name == null) {
                    // console.log(NeedEncrypt);
                    console.log("加密蒐尋 必須帶有欄位暱稱!");
                    return;
                }
                NeedEncrypt = true;
            } else {
                type = 'DEFAULT';
            }
            SelectArray.push({
                KEY: key.toString(),
                TYPE: type,
                Name: name
            });
        } else console.log("select key:" + key + "set error");
    };
    this.join = function (tableName, relation, type) {//(tableName,relation,type)
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
    this.where = function (key, value, relation, type, action) {//(key,value,relation,type,action)
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
                SqlQuery += bulidQueryString(SelectArray, tableName, JoinArray, WhereArray, GroupByArray, OrderByArray, LimitSet) + ";";
                
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
    this.insert = function (newData, tableName, userData, remark) {
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
                    switch (newData[i].type) {
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
                if (userData != null) auditTrailLog(SqlQuery, tableName, "Insert", userData, remark);
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
    this.update = function (newData, tableName, userData, remark) {//
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
                SqlQuery += "Update " + tableName + " SET " + bulidUpdate(newData) + " " + bulidWhere() + ";";
                //console.log(SqlQuery);
                if (userData != null) auditTrailLog(SqlQuery, tableName, "Update", userData, remark);
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
        //console.log(Sql);
        return querySql(Sql, NE);
    };
    this.last_query = LAST_SQL;
    this.dataTableQuery = function (tableName, sumArray) {
        function bulidSumQuery() {
            let str = "";
            for (let i in sumArray) {
                str += ",SUM(" + sumArray[i].Name + ") as " + sumArray[i].Name;
            }
            return str;
        }
        return new Promise(function (query, error) {
            if (tableName == null) {
                error("error TableName");
            } else {
                let SqlQuery = "";
                if (NeedEncrypt) {
                    SqlQuery += "SET block_encryption_mode = '" + encryptConfig.type + "';";
                    SqlQuery += "SET @key_str = '" + encryptConfig.key + "';";
                    SqlQuery += "SET @init_vector = '" + encryptConfig.i_v + "';";
                }
                let FromQuery;
                if (sumArray == null) FromQuery = bulidQueryString([{ KEY: 1, TYPE: 'DEFAULT' }], tableName, JoinArray, WhereArray, GroupByArray);
                else FromQuery = bulidQueryString(sumArray, tableName, JoinArray, WhereArray, GroupByArray);
                SqlQuery += "SELECT COUNT(*) as num_of_rows";
                if (sumArray != null) SqlQuery += bulidSumQuery();
                SqlQuery += " FROM(" + FromQuery + ") AS COUNT_TABLE;";//計數
                SqlQuery += bulidQueryString(SelectArray, tableName, JoinArray, WhereArray, GroupByArray, OrderByArray, LimitSet) + ";";
                querySql(SqlQuery, NeedEncrypt).then(
                    function (data) {
                        query(data);
                    }, function (err) {
                        error(err);
                    }
                );
            }
        });
    };
    //private method
    function bulidQueryString(selectData, fromData, joinData, whereData, groupData, orderData, limitData) {
        let QueryArray = [];
        //插入Select
        QueryArray.push("Select");
        if (selectData.length <= 0) QueryArray.push("*");
        else {
            selectData.forEach(function (select, index) {
                switch (select.TYPE) {
                    case "ENCRYPT":
                        QueryArray.push("TO_BASE64(AES_ENCRYPT(" + select.KEY + ",@key_str, @init_vector))");
                        NeedEncrypt = true;
                        break;
                    case "DECRYPT":
                        QueryArray.push("CONVERT(AES_DECRYPT(FROM_BASE64(" + select.KEY + "),@key_str, @init_vector ) using utf8)");
                        NeedEncrypt = true;
                        break;
                    case "HASH":
                        QueryArray.push("SHA2('" + select.KEY + "', 256)");
                        break;
                    case "DEFAULT":
                        QueryArray.push(select.KEY);
                        break;
                }
                if (typeof select.Name != 'undefined') {
                    QueryArray.push("AS");
                    QueryArray.push(select.Name);
                }
                if (index != (selectData.length - 1)) {
                    QueryArray.push(",");
                }
            });
        }
        //插入From
        QueryArray.push("From");
        QueryArray.push(fromData);
        //插入Join
        joinData.forEach(function (join) {
            if (join != "INNER") QueryArray.push(join.TYPE);
            QueryArray.push("Join");
            QueryArray.push(join.TARGET);
            if (join.RELATION != 'null') {
                QueryArray.push("ON");
                QueryArray.push(join.RELATION);
            }
        });
        //插入Where
        if (whereData.length > 0) {
            QueryArray.push("Where");
            whereData.forEach(function (where, index) {
                if (index != 0 || (where.TYPE != "AND" && where.TYPE != "OR")) QueryArray.push(where.TYPE);
                QueryArray.push(where.KEY);
                if (where.RELATION != "null") QueryArray.push(where.RELATION);//判斷式不加
                switch (where.ACTION) {
                    case "ENCRYPT":
                        QueryArray.push("TO_BASE64(AES_ENCRYPT('" + where.VALUE + "',@key_str, @init_vector ))");
                        break;
                    case "DECRYPT":
                        QueryArray.push("CONVERT(AES_DECRYPT(FROM_BASE64('" + where.VALUE + "'),@key_str, @init_vector ) using utf8)");
                        break;
                    case "HASH":
                        QueryArray.push("SHA2('" + where.VALUE + "', 256)");
                        break;
                    case "DEFAULT":
                        if (where.VALUE != "null") {
                            if (where.RELATION != "IN") QueryArray.push("'" + where.VALUE + "'");
                            else QueryArray.push(where.VALUE);
                        }
                        break;
                }
            });
        }
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
        let QueryString = "";
        QueryArray.forEach(function (QueryElement) {
            QueryString += QueryElement + " ";
        });
        return QueryString;
    }
    function MysqlInit() {
        SelectArray = []; //Element = {KEY:搜尋表的KEY,TYPE:是否加密,NAME:搜尋結果顯示的變數名稱}
        JoinArray = [];//Element = {TARGET:Join Table目標,RELATION:Join Table 關係,TYPE:Join 方式}
        WhereArray = [];//Element = {KEY:WHERE Table Ket,RELATION:比較關係,VALUE:比較值,TYPE: AND OR,ACTION:加解密動作}
        NeedEncrypt = false;
        GroupByArray = [];
        OrderByArray = [];
        LimitSet = new Object();
    }
    function bulidWhere() {
        if (WhereArray.length <= 0) return " ";
        else {
            let WhereQueryArray = "";
            for (let i in WhereArray) {
                let WhereQuery;
                if (WhereArray[i].VALUE == "null" && WhereArray[i].RELATION == "null") {
                    WhereQuery = "AND " + WhereArray[i].KEY + " ";
                } else {
                    let QWV, WV;
                    if (!WhereArray[i].VALUE.includes('.')) WV = "'" + WhereArray[i].VALUE + "'";
                    switch (WhereArray[i].ACTION) {
                        case "ENCRYPT":
                            QWV = "TO_BASE64(AES_ENCRYPT(" + WV + ",@key_str, @init_vector ))";
                            break;
                        case "DECRYPT":
                            QWV = "CONVERT(AES_DECRYPT(FROM_BASE64(" + WV + "),@key_str, @init_vector ) using utf8)";
                            break;
                        case "HASH":
                            QWV = "SHA2(" + WV + ", 256)";
                            break;
                        case "DEFAULT":
                            QWV = WV;
                            break;
                    }
                    if (i == 0) {
                        if (WhereArray[i].TYPE == "AND" || WhereArray[i].TYPE == "OR") {
                            WhereQuery = "WHERE " + WhereArray[i].KEY + " " + WhereArray[i].RELATION + " " + QWV + " ";
                        } else {
                            WhereQuery = "WHERE " + WhereArray[i].TYPE + " " + WhereArray[i].KEY + " " + WhereArray[i].RELATION + " " + QWV + " ";
                        }
                    } else {
                        WhereQuery = WhereArray[i].TYPE + " " + WhereArray[i].KEY + " " + WhereArray[i].RELATION + " " + QWV + " ";
                    }
                }
                WhereQueryArray += WhereQuery;
            }
            return WhereQueryArray;
        }
    }
    function bulidUpdate(newData) {
        if (newData.length == 0) {
            return "";
        } else {
            let SqlQuery = "";
            let columns = [];
            for (let i in newData) {
                switch (newData[i].type) {
                    case "ENCRYPT":
                        columns.push(newData[i].key + "= '" + aesEncrypt(newData[i].value, true) + "'");
                        NeedEncrypt = true;
                        break;
                    case "DECRYPT":
                        columns.push(newData[i].key + "= '" + aesDecrypt(newData[i].value, true) + "'");
                        NeedEncrypt = true;
                        break;
                    case "HASH":
                        columns.push(newData[i].key + "= '" + "SHA2('" + newData[i].value + "', 256)'");
                        break;
                    case "DEFAULT":
                        columns.push(newData[i].key + "= '" + newData[i].value + "'");
                        break;
                    default:
                        columns.push(newData[i].key + "= '" + newData[i].value + "'");
                        break;
                }
            }
            SqlQuery += columns.join(",");
            return SqlQuery;
        }
    }
    function querySql(sql, NE) {
        if (CONSOLE_SQL_LOG) {
            FS.writeFile("./log/sql/" + new Date().getFullYear() + (new Date().getMonth() + 1) + new Date().getDate() + (new Date().getHours() + 8) + new Date().getMinutes() + ".txt", '\n' + sql, { flag: 'a' }, function (error) {
                if (error) console.log(error);
            });
        }
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