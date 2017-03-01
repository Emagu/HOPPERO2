'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require("fs");
const AccountLib = require("../../lib/Account");
const Sql = require("../../lib/MySQL_X");
const Tool = require("../../lib/tool");
const CompanyConfig = require("../../config/company");
let router = express.Router();
router.use(fileUpload());
router.use(bodyParser.json());       // to support JSON-encoded bodies
router.use(bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true
}));
router.get('/', function (req, res) {
    if (req.session._admin.rank != null) {
        Render(res, req.session._admin);
    } else {
        res.redirect('/member');
    }
});
router.post('/selectTypeView', function (req, res) {
    res.render("pages/Member/commodity/type");
});
router.post('/getType', function (req, res) {
    let DB = new Sql.DB();
    DB.select("PT00", "DEFAULT", "NO");
    DB.select("PT01", "DEFAULT", "Name");
    DB.select("PT02", "DEFAULT", "Father");
    DB.get('ProductType').then(function (result) {
        res.json(result);
    }, function (err) {
        console.error(err);
        res.json("error");
    });
});
router.post('/editType', function (req, res) {
    
});
router.post('/selectObjectView', function (req, res) {
    res.render("pages/Member/commodity/object", {
        value: { Date: Tool.getTimeZone() }
    });
});
router.post('/getObjectTable', function (req, res) {
    console.log(req.body);
    
    let DB = new Sql.DB();
    let pageLimit = parseInt(req.body.pageLimit);//單頁數量
    let pages = parseInt(req.body.pages);//所選頁數
    let sortColums = req.body.sortSetting.colums;//排列欄位設定資料
    let firstSort = req.body.sortSetting.sortColums;//最優先排列欄位名稱
    DB.select("DP00", "DEFAULT", "ID");
    DB.select("DP01", "DECRYPT", "Name");
    DB.select("DP02", "DEFAULT", "O_Cost");
    DB.select("DP03", "DEFAULT", "S_Cost");
    DB.select("DP000", "DEFAULT", "Time");
    if (firstSort != null) {
        if (sortColums.hasOwnProperty(firstSort)){
            let sortType = sortColums[firstSort];
            if (sortType == 'DESC' || sortType == 'desc' || sortType == "ASC" || sortType == "asc") { 
                DB.orderBy(firstSort, sortType);
            }
        }
    }
    for (var key in sortColums) {
        if (sortColums.hasOwnProperty(key)) {
            let sortType = sortColums[key];
            if ((sortType == 'DESC' || sortType == 'desc' || sortType == "ASC" || sortType == "asc") && sortType != firstSort) { 
                DB.orderBy(key, sortType);
            }
        }
    }
    DB.limit(pages*pageLimit, pageLimit);
    DB.get("DetailProduct",true).then(function (pageData) {
        DB.select("1");
        DB.get("DetailProduct", true).then(function (countData) {
            res.json({
                rowsData: pageData,
                TotalDataNum: countData.length
            });
        }, function (err) {
            console.error(err);
            res.json("搜尋失敗");
        });
    }, function (err) {
        console.error(err);
        res.json("搜尋失敗");
    });
});
router.post('/newObject', function (req, res) {
    //資料處理
    let newObjectData = [];
    if (req.body.o_commodity_code != null) {
        if (req.body.o_commodity_code != '') {
            newObjectData.push({
                key: "DP00",
                value: req.body.o_commodity_code
            });
        } else {
            res.send("商品編號格式錯誤");
            return;
        }
    } else {
        res.send("商品編號格式錯誤");
        return;
    }
    if (req.body.o_commodity_name != null) {
        if (req.body.o_commodity_name != '') {
            newObjectData.push({
                key: "DP01",
                value: req.body.o_commodity_name,
                action: "ENCRYPT"
            });
        } else {
            res.send("商品名稱格式錯誤");
            return;
        }
    } else {
        res.send("商品名稱格式錯誤");
        return;
    }
    if (req.body.o_commodity_type[0] != null) {
        if (req.body.o_commodity_type[0] != '') {
            newObjectData.push({
                key: "DP06",
                value: req.body.o_commodity_type[0]
            });
        } else {
            res.send("商品類型格式錯誤");
            return;
        }
    } else {
        res.send("商品類型格式錯誤");
        return;
    }
    if (req.body.o_commodity_Ocost != null) {
        if (req.body.o_commodity_Ocost != '') {
            newObjectData.push({
                key: "DP02",
                value: req.body.o_commodity_Ocost
            });
        } else {
            res.send("商品原價格式錯誤");
            return;
        }
    } else {
        res.send("商品原價格式錯誤");
        return;
    }
    if (req.body.o_commodity_Scost != null) {
        if (req.body.o_commodity_Scost != '') {
            newObjectData.push({
                key: "DP03",
                value: req.body.o_commodity_Scost
            });
        } else {
            res.send("商品售價格式錯誤");
            return;
        }
    } else {
        res.send("商品售價格式錯誤");
        return;
    }
    if (req.body.o_commodity_shortDescription != null) {
        if (req.body.o_commodity_shortDescription != '') {
            newObjectData.push({
                key: "DP04",
                value: req.body.o_commodity_shortDescription,
                action: "ENCRYPT"
            });
        } else {
            res.send("商品簡短說明格式錯誤");
            return;
        }
    } else {
        res.send("商品簡短說明格式錯誤");
        return;
    }
    if (req.body.o_commodity_detailDescription != null) {
        if (req.body.o_commodity_detailDescription != '') {
            newObjectData.push({
                key: "DP05",
                value: req.body.o_commodity_detailDescription,
                action: "ENCRYPT"
            });
        } else {
            res.send("商品詳細說明格式錯誤");
            return;
        }
    } else {
        res.send("商品詳細說明格式錯誤");
        return;
    }
    let userIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let db = new Sql.DB();
    newObjectData.push({
        key: "DP000",
        value: Tool.getTimeZone(null,"YYYY-MM-DD")
    });
    db.insert(newObjectData, 'DetailProduct', {
        userNO: req.session._admin.userNO,
        IP: userIP
    }, 11).then(function (data) {
        //相片上傳
        if (!req.files) res.send('success');
        else {
            let imagesFile = req.files.o_commodity_images;
            let imagesDir = CompanyConfig.imagesUrl + "/commodity/" + req.body.o_commodity_code;
            try {
                fs.mkdirSync(imagesDir);
            } catch (e) {
                if (e.code != 'EEXIST') {
                    console.error(e);
                    res.send("新增產品項失敗");
                }
            }
            try {
                if (imagesFile.length == 1) {
                    imagesFile.mv(imagesDir + '/' + imagesFile.name, function (err) {
                        if (err) {
                            console.error(err)
                            res.send('新增產品項失敗');
                        } else res.send('success');
                    });
                } else if (imagesFile.length > 1) {
                    imagesFile.forEach(function (file) {
                        file.mv(imagesDir + '/' + file.name, function (err) {
                            if (err) {
                                throw err;
                            }
                        });
                    });
                    res.send('success');
                } else {
                    res.send('success');
                }
            } catch (e) {
                console.error(e)
                res.send('新增產品項失敗');
            }
        }
    }, function (err) {
        console.error(err);
        res.send("新增產品項失敗");
    });
});
router.get('/selectInputView', function (req, res) {
    
});
router.get('/selectWSView', function (req, res) {
    
});
//method
function Render(res, userData) {
    res.render('layouts/member_layout', {
        Title: "管理中心-商品管理",
        Value: require("../../config/company"),
        UserData: userData,
        CSSs: [
        ],
        JavaScripts: [   
        ],
        Include: [
            { url: "../pages/Member/commodity/main", value: {} }
        ],
        Script: [	
        ]
    });
}
module.exports = router;