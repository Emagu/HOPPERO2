# 賣水的網站
* 系統
	- DataBase: Mysql5.5
	- ApplicationSystem: Nodejs v4.6.1
	- NodeModule:
		* body-parser: ^1.15.2,
    	* cookie: ^0.3.1,
    	* cookie-parser: ^1.4.3,
    	* ejs: 2.5.5,
    	* express: ^4.14.0,
    	* express-session: ^1.14.2,
    	* mysql: ^2.12.0,
    	* promise: ^7.1.1,
    	* socket.io: ^1.7.2,
    	* moment-timezone: *
* 已完成
	- 2017/2/20
		1.	新增DataTable單頁顯示數量變更功能
		2.	新增DataTable排列功能
		3.	變更MySQL_X功能
	- 2017/2/19
		1.	新增商品管理-商品項管理(資料庫建置&畫面&功能初步完成)
		2.	修改tool工具
		3.	新增檔案存取用庫
		4.	新增前端函式庫
	- 2017/2/18
		1.	新增商品管理-商品類管理(前端畫面&功能初步完成)
	- 2017/2/17
		1.	修復後台認證錯誤
		2.	修復註冊成功後顯示錯誤
	- 2017/2/16
		1.	註冊認證信功能完成(認證信點擊後網址畫面未製作)
		2.	新增時間相關處理函式庫
		3.	修改後台顯示
		4.	修改權限認證函式
		5.	增加驗證函式說明
		6.	新增重置密碼相關功能與畫面
		7.	新增帳號啟動相關功能與畫面
	- 2017/2/14
		1.	優化前台顯示畫面
		2.	修改package.json設定
		3.	更新變數型態格式為ES6規範
		4.	修改MySQL_X庫並新增詳細敘述
		5.	新增資料庫變更記錄功能
		6.	所有新增與修改資料庫環節增加變更記錄監控
	- 2017/2/13
		1.	登入註冊畫面顯示
		2.	註冊資料正規化
		3.	註冊畫面與功能完成並測試
		4.	登入畫面與功能完成並測試
		5.	登出畫面與功能完成並測試
		6.	登入畫面跳轉註冊畫面功能完成並測試
		7.	註冊後端BUG修復
	- 2017/2/12
		1.	修復帳號認證錯誤
		2.	站內信系統修改
		3.	前台頁面-首頁完成
		4.	前台頁面-框架完成
		5.	前台路由-規畫完成
	- 2017/2/6		
		1.	完成權限認證
		2.	站內信系統(未測試)
    - 2017/1/13 	
    	1.	專案啟動
    	2.	會員系統後端完成
* 功能
	1. 會員系統
	2. 版面<前端>
	3. 商品架
		- 前台
			1. 排列顯示
			2. 搜尋
			3. 類別標籤
			4. 留言板
			5. 站內私信(或是聊天框)
		- 後台
			1. 留言板管理
			2. 站內私信管理(或是聊天框)
			3. 訂單管理
			4. 上架(網路貨品數量管理<進銷存>)[經理權限]
			5. 活動規則管理(滿額送，買多送禮)[經理權限]
	4. 購物車
		1. 多筆訂單整合
		2. 滿額送等活動邏輯運算
		3. 結帳資料
	5. 訊息推播(5000/25000)
	6. 金流串接<單一廠商>(5000/25000)
	7. 使用者操作記錄


	