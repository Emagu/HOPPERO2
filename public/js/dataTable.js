var dataTable = new function () {
    var self = this;
    var tableID = null;//表格ID
    var columnsNum = null;//欄位數量
    var columnsData = null;//欄位標頭資料
    var limitSet = 10;//單頁顯示數量 預設10
    var SelectPage = 0;//第幾頁
    var sortColums = null;//最優先的排列欄位
    var dataUrl = "";//Ajax目標
    var dataType = "POST";//Ajax類型
    var AjaxRequest = function (){
        return {
            pages:SelectPage,
            pageLimit: limitSet,
            sortSetting: {
                colums: sort(),
                sortColums: sortColums
            }
        };
    };
    var MuliSort = true;//多重排列
    /**
     * @param {string} dataUrl
     * @param {string} dataType
     * @param {object} PostData
     * @param {function} callBack
     * ------------------------------------
     * PostData格式:
     * {
     *      pageLimit:單頁顯示數量,
     *      sortSetting:排列設定
     * }
     * ------------------------------------
     * callBack格式:
     * {
     *      rowsData:[
     *          //columnsData     
     *          {
     *              欄位名稱(columnID): value 欄位數值(Html string),
     *              欄位名稱(columnID): value 欄位數值(Html string)
     *                                  .
     *                                  .
     *                                  .
     *          }
     *      ],
     *      TotalDataNum:總數
     * }
     **/
    function getData(url, type, data, callback) {
        if (type != "GET") {
            $.post(url, data, callback,"json");
        }
    }
    function sort(columnID, type) {
        var sortSetting = {};
        if (MuliSort) {
            $('#' + tableID + ' > thead').children().children().each(function () {
                var td_a = $(this).find("a");
                if(td_a.data("id")!=null) sortSetting[td_a.data("id")] = td_a.data("status");
            });
        } else { 

        }
        if (columnID != null && type != null ) { 
            getData(dataUrl, dataType, AjaxRequest(), draw);
        }
        return sortSetting;
    }
    function addSortEvent(value) {
        var iconObject = $('<a></a>').attr({
            "data-status": "ASC",
            "data-id": value
        });
        iconObject.html("↓");
        iconObject.click(function () {
            var status = $(this).data("status");
            switch (status) {
                case "ASC"://小到大轉換成大到小
                    $(this).html("↑");
                    $(this).data("status", "DESC");
                    break;
                case "DESC"://大到小轉換成小到大
                    $(this).html("↓");
                    $(this).data("status", "ASC");
                    break;
            }
            sortColums = value;
            sort(value, status);
        });
        return iconObject;
    }
    function draw(data) {
        var rowsData = null;
        var totalCount = null;
        if (data != null) {
            rowsData = data.rowsData;
            totalCount = data.TotalDataNum;
        }
        //覆蓋資料欄位
        if ($('#' + tableID + ' > tbody').length == 0) $('#' + tableID).append('<tbody></tbody>');
        else $('#' + tableID + ' > tbody').replaceWith('<tbody></tbody>');
        for (var rs = 0; rs < limitSet; rs++) {
            var tr = $('<tr></tr>');
            for (var cs = 0; cs < columnsNum; cs++) {
                var td = $('<td></td>');
                if (rowsData != null) { 
                    if (rowsData[rs] != null) {
                        var columnValue = null;
                        if (columnsData[cs].action != null) {
                            columnValue = columnsData[cs].action(rowsData[rs][columnsData[cs].id]);
                        } else {
                            columnValue = rowsData[rs][columnsData[cs].id];
                        }
                        td.text(columnValue == null ? "" : columnValue);
                    }
                }
                tr.append(td);
            }
            $('#' + tableID + ' > tbody').append(tr);
        }
        //畫按鈕
        if ($('#' + tableID + ' > tfoot').length == 0) $('#' + tableID).append('<tfoot></tfoot>');
        else $('#' + tableID + ' > tfoot').replaceWith('<tfoot></tfoot>');
        for (var page = 0; page < (totalCount / limitSet); page++) {
            $('#' + tableID + ' > tfoot').append("<button>"+(page+1)+"</button>");
        }
    }
    this.init = function (option) {
        tableID = option.TableID;
        limitSet = option.pageLimit!=null ? option.pageLimit : limitSet;
        dataUrl = option.dataUrl;
        columnsData = option.columns;
        columnsNum = option.columns.length;
        //覆蓋表頭
        if ($('#' + tableID + ' > thead').length == 0) $('#' + tableID).append('<thead></thead>');
        else $('#' + tableID + ' > thead').replaceWith('<thead></thead>');
        //產生標題列
        var trObject = $('<tr></tr>');
        option.columns.forEach(function (column) {
            var tdObject = $('<td></td>');
            $.each(column.style, function (index, value) {
                tdObject.css(index, value);
            });
            tdObject.text(column.title);
            if (column.sort) tdObject.append(addSortEvent(column.id));
            trObject.append(tdObject);
        });
        //覆蓋標題列
        if ($('#' + tableID + ' > thead > tr').length == 0) $('#' + tableID + ' > thead').append(trObject);
        else $('#' + tableID + ' > thead').replaceWith(trObject);
        //覆蓋資料列
        if (dataUrl != null) getData(dataUrl, dataType, AjaxRequest(), draw);
        else draw();
    };
    this.resizePage = function (newSize) {
        limitSet = newSize;
        getData(dataUrl, dataType, AjaxRequest(), draw);
    };
    this.reGet = function (data,url, type, callback) {
        $.extend(data, AjaxRequest());
        if (callback == null) callback = draw;
        if (url == null) url = dataUrl;
        if (type == null) type = dataType;
        getData(url, type, data, callback);
    };
};