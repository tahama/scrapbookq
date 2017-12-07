//文件超出300行了，需要分割了
var scrapContainer = document.querySelector(".scrap-container");

var myWindowId;

function storApp() {
	//scrapContainer.setAttribute("contenteditable", false);
	browser.tabs.query({ windowId: myWindowId, active: true }).then((tabs) => {
		let contentToStore = {};
		let sbqApp = new ScrapBookQApp(arrNodes, document.body.innerHTML, folderport, scrapbookqhtmlok, scrapbookqrdfok, scrapbookrdfok, rdfloaded);

		let removeScrapbookq = browser.storage.local.remove("ScrapbookQApp");
		removeScrapbookq.then(onRemoved, onError);
		contentToStore["ScrapbookQApp"] = sbqApp;
		browser.storage.local.set(contentToStore);

		function onRemoved() {
			//console.log("storApp OK");
		}

		function onError(e) {
			console.log(e);
		}
		//var clearStorage = browser.storage.local.clear();
		//clearStorage.then(onCleared, onError);
	});
}

/*
window.addEventListener("beforeunload", function (e) {
	var confirmationMessage = "\o
	//好像不管用啊

	//saveScrapbookqData();
	console.log("Close window");
	(e || window.event).returnValue = confirmationMessage;     //Gecko + IE
	return confirmationMessage;                                //Webkit, Safari, Chrome etc.
});
*/
/*
Update the sidebar's content.

1) Get the active tab in this sidebar's window.
2) Get its stored content.
3) Put it in the content box.
*/
function updateContent() {
	browser.tabs.query({ windowId: myWindowId, active: true })
		.then((tabs) => {
			return browser.storage.local.get("ScrapbookQApp");
		})
		.then((storedInfo) => {
			if (storedInfo[Object.keys(storedInfo)[0]] != null) {
				let sbqApp = storedInfo[Object.keys(storedInfo)[0]];
				arrNodes = sbqApp.arrayNodes;
				document.body.innerHTML = sbqApp.sidebarhtml;
				folderport = sbqApp.folderport;
				scrapbookqhtmlok = sbqApp.scrapbookqhtmlok;
				scrapbookqrdfok = sbqApp.scrapbookqrdfok;
				scrapbookrdfok = sbqApp.scrapbookrdfok;
				rdfloaded = sbqApp.rdfloaded;
			};
			browser.runtime.sendMessage({ testserver: "TestServer" });
		});
}

/*
Update content when a new tab becomes active.
*/
//browser.tabs.onActivated.addListener(updateContent);

/*
Update content when a new page is loaded into a tab.
*/
//browser.tabs.onUpdated.addListener(updateContent);

/*
When the sidebar loads, get the ID of its window,
and update its content.
*/
browser.windows.getCurrent({ populate: true }).then((windowInfo) => {
	myWindowId = windowInfo.id;
	//console.log("windowInfo.id: " + windowInfo.id);  
	updateContent();
});

var folderport = new Array();
var scrapbookqhtmlok, scrapbookqrdfok, scrapbookrdfok, serverstatus, rdfloaded;

var currentTarget = null;
//var scrapContainer = document.querySelector(".scrap-container");
var docDetailContainer = document.querySelector(".docDetail-Container");
var arrNodes = null;

//标记第一次进入递归，tree-root不缩进，第二次及以后则为tree-node和tree-leaf则缩进,后来发现和class功能重合了，

//class=tree-root/tree-leaf vs isroot=0/1
var isroot = 0;
//剪切下来的html对象,要插入到html容器内
var delNode = null;
//剪切下来的scrapNode对象,要插入到数组里
var delArrayNode = null;
//保存删除文件列表：foldername/id
var delArrayIdFolder = new Array();
//用来显示属性的table
var docDetailTable = null;
//标识导入的scrapbook目录和新建的scrapbookq目录
var foldername = null;
//标识属性页面是否已经被打开
var detailOpened = false;
//错误代码
var LoadXMLState = function () {
	this.xmlfilename = null;
	this.errcode = null;
};

LoadXMLState.prototype.getFilename = function () {
	return this.xmlfilename;
};

LoadXMLState.prototype.getErrcode = function () {
	return this.errcode;
};

var loadstate = new LoadXMLState();
var xmlhttp;
var xmlDoc;

//接受background.js发来的消息，如果消息包含所需信息就进行处理
browser.runtime.onMessage.addListener(handleMessageScrapq);

function registeLlistener() {
	var currentDrop = null;
	var list = document.querySelector("div");
	var menuPaste = document.getElementById("menuPaste");
	var menuCut = document.getElementById("menuCut");
	var menuDelete = document.getElementById("menuDelete");
	var menuCreate = document.getElementById("menuCreate");
	var menuDetail = document.getElementById("menuDetail");
	var menuOpensourceurl = document.getElementById("opensourceurl");
	var menuOpennewtab = document.getElementById("opennewtab");
	var menuReload = document.getElementById("menuReload");
	//set menu label
	menuPaste.setAttribute("label", browser.i18n.getMessage("Paste"));
	menuCut.setAttribute("label", browser.i18n.getMessage("Cut"));
	menuDelete.setAttribute("label", browser.i18n.getMessage("Delete"));
	menuCreate.setAttribute("label", browser.i18n.getMessage("NewDirectory"));
	menuDetail.setAttribute("label", browser.i18n.getMessage("Property"));
	menuOpensourceurl.setAttribute("label", browser.i18n.getMessage("OpenOriginURL"));
	menuOpennewtab.setAttribute("label", browser.i18n.getMessage("OpenInNewTab"));
	menuReload.setAttribute("label", browser.i18n.getMessage("ReloadSidebar"));
	//addEventListener
	menuPaste.addEventListener("click", onPasteDocument, false);
	menuCut.addEventListener("click", onCutDocument, false);
	menuDelete.addEventListener("click", onDeleteDocument, false);
	menuCreate.addEventListener("click", onCreateFolder, false);
	menuDetail.addEventListener("click", onDocDetail, false);
	menuOpensourceurl.addEventListener("click", openSourceURL, false);
	menuOpennewtab.addEventListener("click", openScrapURLNewTab, false);
	menuReload.addEventListener("click", function () { 
		if (confirm(browser.i18n.getMessage("ConfirmReloadSidebar")) === true) {
			window.location.reload();
		}
		 
	}, false);
	//把mousedown事件处理函数注册为toggleCss是为了在右键菜单点击事件处理前获取点击对象的数据到currentTarget
	document.addEventListener("click", openScrapURL);
	document.addEventListener("mouseup", onMouseUp);
	document.addEventListener("mousedown", onMouseDown);
	//高亮左键点击对象
	list.addEventListener("click", toggleCss, false);
	//在右键菜单弹出之前高亮右键点击对象
	list.addEventListener("contextmenu", toggleCss, false);
}

function initScrapbookqHeader() {
	registeLlistener();

	var myul = document.getElementById("myul");
	var informationli = document.getElementById("informationli");
	var scrapbookqli = document.getElementById("scrapbookqli");
	var scrapbookli = document.getElementById("scrapbookli");
	var nativeappli = document.getElementById("nativeappli");
	var nativeserverli = document.getElementById("nativeserverli");
	var mylibutton = document.getElementById("mylisavedata");
	var scrapbookqrdf = document.getElementById("scrapbookqrdf");
	var scrapbookrdf = document.getElementById("scrapbookrdf");
	myul.addEventListener("mouseout", onOut, true);
	informationli.addEventListener("click", change, true);
	scrapbookqli.addEventListener("mouseover", onOver, true);
	scrapbookli.addEventListener("mouseover", onOver, true);
	mylibutton.addEventListener("mouseover", function () { mylibutton.className = "liMenuOver" }, true);
	mylibutton.addEventListener("mouseout", function () { mylibutton.className = "liMenu" }, true);
	mylibutton.addEventListener("mousedown", function () { mylibutton.className = "liMenuPress" }, true);
	mylibutton.addEventListener("click", function () { mylibutton.className = "liMenu"; saveScrapbookqData(); }, true);
	mylibutton.innerText = browser.i18n.getMessage("SaveData");
	informationli.innerText = browser.i18n.getMessage("LoadDataDown");
	document.getElementById("scrapbookqrdf").setAttribute("disabled", "disabled");
	document.getElementById("scrapbookrdf").setAttribute("disabled", "disabled");
	document.getElementById("nativeapp").setAttribute("disabled", "disabled");
	document.getElementById("nativeserver").setAttribute("disabled", "disabled");
	//scrapbookqrdf.addEventListener("change", function () { if (scrapbookqrdf.checked) loadRDFDoc("scrapbookq") }, true);
	//scrapbookrdf.addEventListener("change", function () { if (scrapbookrdf.checked) loadRDFDoc("scrapbook") }, true);

	//避免未选中任何对象时操作scrapbookq
	currentTarget = document.getElementById("scrapbookq");
	if (arrNodes == null) {
		arrNodes = new Array();
		arrNodes.push(new scrapNode(
			"urn:" + "scrapbookq" + ":item:" + "scrapbookq",
			"scrapbookq",
			"",
			"ScrapbookQ",
			"",
			"star0.png",
			"scrapbookq-usage.html",
			browser.i18n.getMessage("ManualTitle"),
			null,
			""
		));
	}
	document.getElementById("informationli").style.color = "red";
	document.getElementById("informationli").innerText = browser.i18n.getMessage("Loading");
	loadRDFDoc();
	document.getElementById("informationli").style.color = "black";
	document.getElementById("informationli").innerText = browser.i18n.getMessage("LoadDataDown");

	//在完全载入rdf并生成html后在保存入storage
	window.addEventListener("mouseout", storApp);

	//folderport.scrapbookq = 3338 folderport.ScrapBook = 3339
	function loadRDFDoc(rdfname) {
		scrapContainer = document.querySelector(".scrap-container");
		//loadXMLDoc("scrapbookq.rdf");
		if (scrapbookqrdfok == true) {
			loadXMLDoc("http://localhost:" + folderport.scrapbookq + "/scrapbookq.rdf");
			xmlDoc = xmlhttp.responseXML;
			initScrap(arrNodes, xmlDoc);
			displyScrap(arrNodes, scrapContainer);
		}
		if (scrapbookqhtmlok == true && 1 > 2) {
			loadXMLDoc("http://localhost:" + folderport.scrapbookq + "/scrapbookq.html");
			//scrapContainer.innerHTML = xmlhttp.responseText;
			displyScrap(arrNodes, scrapContainer);
		}
		if (scrapbookrdfok == true) {
			//加载新数据、更新输出、保存数据、更新状态、传输状态
			loadXMLDoc("http://localhost:" + folderport.scrapbook + "/scrapbook.rdf");
			xmlDoc = xmlhttp.responseXML;
			initScrap(arrNodes, xmlDoc);
			displyScrap(arrNodes, scrapContainer);
			if (rdfloaded == false) {
				saveScrapbookqData();
				rdfloaded = true;
				browser.runtime.sendMessage({ rdfloaded: "1" });
			}
		}
	}

	function onOver(event) {
		switch (event.target.id) {
			case "informationli":
				break;
			case "scrapbookqli":
				document.getElementById("scrapbookqli").className = "liMouseOver";
				break;
			case "scrapbookqrdf":
				document.getElementById("scrapbookqli").className = "liMouseOver";
				break;
			case "scrapbookli":
				document.getElementById("scrapbookli").className = "liMouseOver";
				break;
			case "scrapbookrdf":
				document.getElementById("scrapbookli").className = "liMouseOver";
				break;
			case "nativeappli":
				document.getElementById("nativeappli").className = "liMouseOver";
				break;
			case "nativeapp":
				document.getElementById("nativeappli").className = "liMouseOver";
				break;
			case "nativeserverli":
				document.getElementById("nativeserverli").className = "liMouseOver";
				break;
			case "nativeserver":
				document.getElementById("nativeserverli").className = "liMouseOver";
				break;
			default:
				break;
		}
	}

	function onOut(event) {
		switch (event.target.id) {
			case "myul":
				hideli();
				break;
			case "informationli":
				break;
			case "scrapbookqli":
				document.getElementById(event.target.id).className = "li";
				break;
			case "scrapbookli":
				document.getElementById(event.target.id).className = "li";
				break;
			case "nativeappli":
				document.getElementById(event.target.id).className = "li";
				break;
			case "nativeserverli":
				document.getElementById(event.target.id).className = "li";
				break;
			default:
				break;
		}
	}

	function hideli() {
		document.getElementById("informationli").innerText = browser.i18n.getMessage("LoadDataDown"); //↓
		document.getElementById("scrapbookqli").className = "liHide";
		document.getElementById("scrapbookli").className = "liHide";
		document.getElementById("nativeappli").className = "liHide";
		document.getElementById("nativeserverli").className = "liHide";

	}

	var nextState = 1;
	function change(event) {
		var liArray = document.getElementsByTagName("LI");
		var i = 1;
		var length = liArray.length;
		switch (nextState) {
			case 1:
				document.getElementById("informationli").innerText = browser.i18n.getMessage("LoadDataUp"); //↑
				document.getElementById("scrapbookqli").className = "liShow";
				document.getElementById("scrapbookli").className = "liShow";
				document.getElementById("nativeappli").className = "liShow";
				document.getElementById("nativeserverli").className = "liShow";
				nextState = 0;
				break;
			case 0:
				document.getElementById("informationli").innerText = browser.i18n.getMessage("LoadDataDown"); //↓
				document.getElementById("scrapbookqli").className = "liHide";
				document.getElementById("scrapbookli").className = "liHide";
				document.getElementById("nativeappli").className = "liHide";
				document.getElementById("nativeserverli").className = "liHide";
				nextState = 1;
				break;
			default:
				break;
		}
	}
}

//插入到目标id的后面,如果时folder插进去
function insertScrapNode(scrapArray, currentId, scrapNodeObj) {
	var subNode = null;
	for (var i = 0; i < scrapArray.length; i++) {
		if (scrapArray[i].id == currentId) {
			if (scrapArray[i].type == "folder") {
				//如果是目录，直接压入子目录
				if (scrapArray[i].subNodes != null) {
					scrapArray[i].subNodes.push(scrapNodeObj);
				}
				//如果的目录的subNode==null，需要新建Array作为subNode
				else {
					subNode = new Array();
					scrapArray[i].subNodes = subNode;
					scrapArray[i].subNodes.push(scrapNodeObj);
				}
			}
			else {
				scrapArray.splice(i + 1, 0, scrapNodeObj);
			}
			break;
		}
		else if (scrapArray[i].type == "folder") {
			//如果是目录则递归搜索
			if (scrapArray[i].subNodes != null) {
				insertScrapNode(scrapArray[i].subNodes, currentId, scrapNodeObj);
			}
			//如果的目录的subNode==null，需要新建Array作为subNode
			else {
				subNode = new Array();
				scrapArray[i].subNodes = subNode;
			}
		}
	}
}

//将目标id所在的scrapNode对象从原数组里移出，并返回此scrapNode对象
function cutScrapNode(scrapArray, currentId) {
	var subNode = null;
	for (var i = 0; i < scrapArray.length; i++) {
		if (scrapArray[i].id == currentId) {
			delArrayNode = scrapArray[i];
			scrapArray.splice(i, 1);
		}
		else if (scrapArray[i].type == "folder") {
			//如果是目录则递归搜索
			if (scrapArray[i].subNodes != null) {
				cutScrapNode(scrapArray[i].subNodes, currentId);
			}
		}
	}
}

//获取所有的leap的id和foldername
function getAllScrapNode(scrapArray) {
	//如果是leap，获取数据，返回
	if (scrapArray.type == "") {
		delArrayIdFolder.push(scrapArray.foldername + "/" + scrapArray.id);
	}
	else if (scrapArray.type == "folder" && scrapArray.subNodes != null) {
		//如果是目录非空则递归搜索
		for (var i = 0; i < scrapArray.subNodes.length; i++) {
			getAllScrapNode(scrapArray.subNodes[i]);
		}
	}
}


//将目标id所在的scrapNode对象从原数组里删除
function updateScrapNode(scrapArray, currentId, title, comment) {
	for (var i = 0; i < scrapArray.length; i++) {
		if (scrapArray[i].id == currentId) {
			scrapArray[i].title = title;
			scrapArray[i].comment = comment;
			break;
		}
		else if (scrapArray[i].type == "folder") {
			//如果是目录则递归搜索
			if (scrapArray[i].subNodes != null) {
				updateScrapNode(scrapArray[i].subNodes, currentId, title, comment)
			}
		}
	}
}

//保存scrapbookq数据到downloadfolder/scrapbookq/scrapbookq.rdf文件
function saveScrapbookqData() {
	var treeroot = document.createElement("RDF:RDF");
	var parentNode = document.createElement("RDF:Seq");
	parentNode.setAttribute("RDF:about", "urn:scrapbook:root");
	treeroot.appendChild(parentNode);
	array2XML(arrNodes, parentNode);
	reformXML(treeroot.innerHTML);
	//console.log("treeroot: " + treeroot.innerHTML);
	var mylibutton = document.getElementById("mylisavedata");
	//提示有数据变化
	mylibutton.innerText = browser.i18n.getMessage("SaveData");
	mylibutton.style.color = "black";

	function reformXML(xml) {
		var xmlHead = "\<?xml version=\"1.0\"?\>\n\<RDF:RDF xmlns:NS1=\"http:\/\/amb.vis.ne.jp\/mozilla\/scrapbook-rdf#\"\n         xmlns:NC=\"http:\/\/home.netscape.com\/NC-rdf#\"\n         xmlns:RDF=\"http:\/\/www.w3.org\/1999\/02\/22-rdf-syntax-ns#\"\>\n";
		var xmlEnd = "\n\<\/RDF:RDF\>";
		var xmlBody = xml.replace(/\>\<\/rdf:li\>/g, "\/\>").replace(/\>\<\/rdf:description\>/g, "\/\>").replace(/rdf:seq/g, "RDF:Seq").replace(/rdf:about/g, "RDF:about").replace(/rdf:li/g, "RDF:li").replace(/rdf:description/g, "RDF:Description").replace(/ ns1:/g, " NS1:").replace(/ NS1:/gim, "\n                   NS1:").replace(/\<RDF:Description/g, "\n  \<RDF:Description").replace(/\<RDF:Seq/g, "\n  \<RDF:Seq").replace(/\<\/RDF:Seq/g, "\n  \<\/RDF:Seq").replace(/\<RDF:li/g, "\n    \<RDF:li").replace(/rdf:resource/g, "RDF:resource").replace(/\&nbsp;/gim, " ");
		var xmlHtml = xmlHead + xmlBody + xmlEnd;
		downloadScrapbookqData(xmlHtml);
		//></rdf:li>	/>	console.log(xml.replace(/\>\<rdf:li\>/gim, "\/\>"));
		//console.log(xml.replace(/\>\<\/rdf:li\>/g, "\/\>"));
		//></rdf:description> /> console.log(xml.replace(/\>\<\/rdf:description\>/g, "\/\>"));
		//console.log(xml.replace(/\>\<\/rdf:description\>/g, "\/\>"));
		//rdf:seq RDF:Seq console.log(xml.replace(/rdf:seq/g, "RDF:Seq"));
		//console.log(xml.replace(/rdf:seq/g, "RDF:Seq"));
		//rdf:about RDF:about console.log(xml.replace(/rdf:about/g, "RDF:about"));
		//console.log(xml.replace(/rdf:about/g, "RDF:about"));
		//rdf:li RDF:li console.log(xml.replace(/rdf:li/g, "RDF:li"));
		//console.log(xml.replace(/rdf:li/g, "RDF:li"));
		//rdf:description RDF:Description console.log(xml.replace(/rdf:description/g, "RDF:Description"));
		//console.log(xml.replace(/rdf:description/g, "RDF:Description"));
		// ns1:  NS1: console.log(xml.replace(/ ns1:/g, " NS1:"));
		//console.log(xml.replace(/ ns1:/g, " NS1:"));
		//console.log(xml.replace(/ NS1:/gim, "\n                   NS1:"));
		//console.log(xml.replace(/\<RDF:Description/g, "\n  \<RDF:Description"));
		//console.log(xml.replace(/\<RDF:Seq/g, "\n  \<RDF:Seq"));
		//console.log(xml.replace(/\<\/rdf:seq/g, "\n  \<\/RDF:Seq"));
		//console.log(xml.replace(/\<rdf:li/g, "\n    \<RDF:li"));
		//rdf:resource RDF:resource replace(/rdf:resource/g, "RDF:resource")
		//console.log(xml.replace(/\>\<\/rdf:li\>/g, "\/\>").replace(/\>\<\/rdf:description\>/g, "\/\>").replace(/rdf:seq/g, "RDF:Seq").replace(/rdf:about/g, "RDF:about").replace(/rdf:li/g, "RDF:li").replace(/rdf:description/g, "RDF:Description").replace(/ ns1:/g, " NS1:").replace(/ NS1:/gim, "\n                   NS1:").replace(/\<RDF:Description/g, "\n  \<RDF:Description").replace(/\<RDF:Seq/g, "\n  \<RDF:Seq").replace(/\<\/RDF:Seq/g, "\n  \<\/RDF:Seq").replace(/\<RDF:li/g, "\n    \<RDF:li").replace(/rdf:resource/g, "RDF:resource"));
	}

	function array2XML(currentNode, parentNode) {
		var treenode = null;
		var treeli = null;
		var treeleaf = null;
		for (var i = 0; i < currentNode.length; i++) {
			//不保存scrapbookq说明文件到rdf
			if (currentNode[i].id == "scrapbookq") {
				continue;
			}
			treeleaf = document.createElement("RDF:Description");
			treeleaf.setAttribute("RDF:about", currentNode[i].about);
			treeleaf.setAttribute("NS1:id", currentNode[i].id);
			treeleaf.setAttribute("NS1:type", currentNode[i].type);
			//.replace(/\&/gim, "&amp;")			
			treeleaf.setAttribute("NS1:title", currentNode[i].title.replace(/\</gim, "&lt").replace(/\>/gim, "&gt").replace(/\"/gim, "&quot;").replace(/\'/gim, "&apos;").replace(/\&nbsp;/gim, " "));
			treeleaf.setAttribute("NS1:chars", currentNode[i].chars);
			if (currentNode[i].type != "folder") {
				treeleaf.setAttribute("NS1:icon", "resource:\/\/" + (currentNode[i].icon));
			}
			else {
				treeleaf.setAttribute("NS1:icon", currentNode[i].icon);
			}
			treeleaf.setAttribute("NS1:source", currentNode[i].source);
			treeleaf.setAttribute("NS1:comment", currentNode[i].comment);
			treeleaf.setAttribute("NS1:foldername", currentNode[i].foldername);
			treeroot.appendChild(treeleaf);

			treeli = document.createElement("RDF:li");
			treeli.setAttribute("RDF:resource", currentNode[i].about);
			parentNode.appendChild(treeli);

			if (currentNode[i].type == "folder") {
				treenode = document.createElement("RDF:Seq");
				treenode.setAttribute("RDF:about", currentNode[i].about);
				treeroot.appendChild(treenode);
				if (currentNode[i].subNodes != null) {
					array2XML(currentNode[i].subNodes, treenode);
				}
			}
		}
	}
}


//folderport["scrapbookq"]=1234
function handleMessageScrapq(request, sender, sendResponse) {
	console.log("== scrpq.js Received: == " + request);
	if (request.NativeAppConnectError != null) {
		console.log("== scrpq.js Received: == " + request.NativeAppConnectError);
		alert(request.NativeAppConnectError + "\n" + browser.i18n.getMessage("NativeAppConnectError"));
	}
	//browser.runtime.sendMessage({ servers: "SERVERS", folder: response.split(":")[1], port: response.split(":")[2], rdfloaded:response.split(":")[3] });
	if (request.servers != null) {
		document.getElementById("informationli").style.color = "black";
		document.getElementById("nativeserver").setAttribute("checked", "checked");
		console.log("folder: " + request.folder + " port: " + request.port + " rdfloaded: " + request.rdfloaded);
		rdfloaded = (request.rdfloaded == "1");
		for (let i = 0; i < request.folder.split(";").length - 1; i++) {
			folderport[request.folder.split(";")[i]] = parseInt(request.port.split(";")[i], 0);
		}
		for (x in folderport) {
			console.log("folderport[" + x + "] = " + folderport[x]);
		}
		initScrapbookqHeader();
	}
	//browser.runtime.sendMessage({ test: "TEST", sbqrdf: response[5], sbqhtml: response[7], sbrdf: response[9] });
	if (request.test != null) {
		document.getElementById("nativeapp").setAttribute("checked", "checked");
		console.log("sbqrdf: " + request.sbqrdf + " sbqhtml: " + request.sbqhtml + " sbrdf: " + request.sbrdf);
		if (request.sbqrdf == "1") {
			scrapbookqrdfok = true;
			document.getElementById("scrapbookqrdf").setAttribute("checked", "true");
		}
		else {
			scrapbookqrdfok = false;
			document.getElementById("scrapbookqrdf").removeAttribute("checked");
		}

		scrapbookqhtmlok = (request.sbqhtml == "1");

		if (request.sbrdf == "1") {
			scrapbookrdfok = true;
			document.getElementById("scrapbookrdf").setAttribute("checked", "true");
		}
		else {
			scrapbookrdfok = false;
			document.getElementById("scrapbookrdf").removeAttribute("checked");
		}

		serverstatus = (request.serverstatus == "1");

		console.log("scrapbookqrdfok: " + scrapbookqrdfok + " scrapbookqhtmlok: " + scrapbookqhtmlok + " scrapbookrdfok: " + scrapbookrdfok + " serverstatus: " + serverstatus);
		if (serverstatus == false) {
			document.getElementById("informationli").style.color = "blue";
			browser.runtime.sendMessage({ startserver: "STARTSERVER" });
		}
		else {
			document.getElementById("informationli").style.color = "black";
			initScrapbookqHeader();
		}
	}

	if (request.id != null) {
		console.log("Message from the background: " + request.id);
		//新建page页面
		var newLi = null;
		//新建page页面的icon
		var newIcon = null;
		//新建page页面的url
		var newURL = null;
		foldername = "scrapbookq";
		newLi = document.createElement("li");
		newIcon = document.createElement("img");
		if (request.favicon != null) {
			newIcon.setAttribute("src", "http://localhost:" + folderport[foldername] + "/data/" + request.id + "/" + request.favicon);
		}
		else {
			//有些页面没有favicon，使用缺省图标
			newIcon.setAttribute("src", "".concat(foldername, "/data/", "file0.png"));
		}
		newIcon.setAttribute("height", "14");
		newIcon.setAttribute("width", "12");
		newLi.appendChild(newIcon);
		newURL = document.createElement("a");
		newURL.setAttribute("id", request.id);
		newURL.setAttribute("nodetype", "");
		newURL.setAttribute("foldername", foldername);
		newURL.setAttribute("sourceurl", request.url);
		newURL.appendChild(document.createTextNode(request.title));
		newLi.appendChild(newURL);
		if (newLi != null) {
			if (currentTarget == null) {
				currentTarget = document.getElementById("scrapbookq");
			}
			//如果当前对象为页面文件，则向父节点<li>的父节点添加，并且修改父节点的isroot和class为当前对象的父节点一样
			if (currentTarget.tagName === "A") {
				//console.log("currentDrop.parentNode.getAttribute(isroot)", currentDrop.parentNode.getAttribute("isroot"));
				newLi.setAttribute("isroot", currentTarget.parentNode.getAttribute("isroot"));
				newLi.setAttribute("class", currentTarget.parentNode.getAttribute("class"));
				currentTarget.parentNode.parentNode.insertBefore(newLi, currentTarget.parentNode);
				newLi = null;
			}
			//如果当前对象为folder，则向父节点<details>添加，也就是放到folder里面，需要修改siroot=1和class=tree-leaf
			else if (currentTarget.tagName === "SUMMARY") {
				newLi.setAttribute("isroot", "1");
				newLi.setAttribute("class", "tree-leaf");
				currentTarget.parentNode.appendChild(newLi);
				newLi = null;
			}
			//没有选中任何对象，直接插入到最后
			else if (currentTarget.id == "scrapbookq") {
				newLi.setAttribute("isroot", "0");
				newLi.setAttribute("class", "tree-root");
				//currentTarget.insertBefore(newLi, currentTarget.childNodes[1]);
				currentTarget.appendChild(newLi);
				newLi = null;
			}
		}
		//根据数据新建scrapNode对象，插入当前目标对象之后，如果当前目标对象时folder就插进去

		//scrapNode(about, id, type, title, chars, icon, source, comment, subNodes, foldername) 
		var scrapNodeObj = new scrapNode(
			"urn:" + foldername + ":item:" + request.id,
			request.id,
			"",
			request.title,
			"",
			foldername + "/data/" + request.id + "/" + request.favicon,
			request.url,
			"",
			null,
			foldername
		);
		//同步数据
		insertScrapNode(arrNodes, currentTarget.getAttribute("id"), scrapNodeObj);
		//保存数据文件到rdf文件
		saveScrapbookqData();
	}
}

function onMouseDown(event) {

	/*
	console.log("mousedonw: " + event.target.innerText);
	event.target.setAttribute("draggable", "true");
	event.target.setAttribute("ondragstart", "drag(event)");
	*/
	toggleCss(event);
}

function onMouseUp(event) {

	/*
	console.log("mouseup: " + event.target.innerText);
	event.target.setAttribute("ondragover", "allowDrop(event)");
	event.target.setAttribute("ondrop", "drop(event)");
	*/
}

//将剪切下来的对象插入到当前目标对象页面之前/folder之内，暂时不考虑delArrayNode=null的情况
function onPasteDocument(event) {
	if (delNode != null || delArrayNode != null) {
		//如果当前对象为页面文件，则向父节点<li>的父节点添加，并且修改父节点的isroot和class为当前对象的父节点一样
		if (currentTarget.tagName === "A") {
			//console.log("currentDrop.parentNode.getAttribute(isroot)", currentDrop.parentNode.getAttribute("isroot"));
			delNode.setAttribute("isroot", currentTarget.parentNode.getAttribute("isroot"));
			delNode.setAttribute("class", currentTarget.parentNode.getAttribute("class"));
			currentTarget.parentNode.parentNode.insertBefore(delNode, currentTarget.parentNode);
			delNode = null;
		}
		//如果当前对象为folder，则向父节点<details>添加，也就是放到folder里面，需要修改siroot=1和class=tree-leaf
		else if (currentTarget.tagName === "SUMMARY") {
			delNode.setAttribute("isroot", "1");
			delNode.setAttribute("class", "tree-leaf");
			currentTarget.parentNode.appendChild(delNode);
			delNode = null;
		}
		//同步数据array
		insertScrapNode(arrNodes, currentTarget.getAttribute("id"), delArrayNode);
		delArrayNode = null;
		var mylibutton = document.getElementById("mylisavedata");
		//提示有数据变化
		mylibutton.innerText = browser.i18n.getMessage("SaveDataModified");
		mylibutton.style.color = "red";
	}
	else {
		alert("Paste content is null: " + delNode + " : " + delArrayNode);
	}
}

function onCutDocument(event) {
	//如果拖放对象到页面或者folder上则拖放有效，删除原节点，修改属性，插入到对应位置
	if (currentTarget.tagName === "A" || currentTarget.tagName === "SUMMARY") {
		delNode = currentTarget.parentNode.parentNode.removeChild(currentTarget.parentNode);
		//cutScrapNode将剪切下的scrapnode对象保存到delArrayNode
		cutScrapNode(arrNodes, currentTarget.getAttribute("id"));
		var mylibutton = document.getElementById("mylisavedata");
		//提示有数据变化
		mylibutton.innerText = browser.i18n.getMessage("SaveDataModified");
		mylibutton.style.color = "red";
		//当前对象被删除，重新分配当前对象
		currentTarget = document.getElementById("scrapbookq");
	}
}

//生成属性展示table，插入到当前对象之后
function onDocDetail(event) {
	if (detailOpened == true && docDetailTable != null) {
		//alert("Document Details Panel has already opend, please close it first.");
		docDetailTable.parentNode.removeChild(docDetailTable);
		//return;
	}

	initDocDetail();
	if (currentTarget.tagName === "A") {
		currentTarget.parentNode.parentNode.insertBefore(docDetailTable, currentTarget.parentNode.nextSibling);
	}
	else if (currentTarget.tagName === "SUMMARY") {
		currentTarget.parentNode.setAttribute("open", "true");
		currentTarget.parentNode.insertBefore(docDetailTable, currentTarget.nextSibling);
	}
	detailOpened = true;
}
//生成属性展示table，传给全局变量docDetailTable
function initDocDetail() {
	var table = document.createElement("table");
	table.setAttribute("class", "docDetailTable");
	table.setAttribute("id", "docDetailTable");
	var tr = null;
	var td = null;
	var lable = null;
	var title = document.createElement("input");
	title.setAttribute("type", "text");
	title.setAttribute("id", "docDetailTitle");
	var url = document.createElement("label");
	url.setAttribute("type", "text");
	url.setAttribute("id", "docDetailUrl");
	var image = document.createElement("img");
	image.setAttribute("src", "file0.png");
	image.setAttribute("height", "14");
	image.setAttribute("width", "12");
	image.setAttribute("id", "docDetailicon");
	var selectIcons = document.createElement("select");
	selectIcons.setAttribute("id", "docDetailIcons");
	var optionIconDefault = document.createElement("option");
	optionIconDefault.setAttribute("id", "docDetailIcondefault");
	optionIconDefault.setAttribute("value", "default");
	optionIconDefault.innerText = "Default";
	var optionIconCustomized = document.createElement("option");
	optionIconCustomized.setAttribute("id", "docDetailiIconConcustomized");
	optionIconCustomized.setAttribute("value", "customized");
	optionIconCustomized.innerText = "Customized";
	var optionIconUrl = document.createElement("option");
	optionIconUrl.setAttribute("id", "docDetailIconurl");
	optionIconUrl.setAttribute("value", "url");
	optionIconUrl.innerText = "URL";
	var lableId = document.createElement("lable");
	lableId.setAttribute("id", "docDetailId");
	var lableType = document.createElement("lable");
	lableType.setAttribute("id", "docDetailType");
	var lableDate = document.createElement("lable");
	lableDate.setAttribute("id", "docDetailDate");
	selectIcons.appendChild(optionIconDefault);
	selectIcons.appendChild(optionIconCustomized);
	selectIcons.appendChild(optionIconUrl);
	var comment = document.createElement("textarea");
	comment.setAttribute("id", "docDetailComment");
	comment.setAttribute("cols", "16");
	comment.setAttribute("rows", "1");
	var buttonCancel = document.createElement("button");
	buttonCancel.innerText = "Cancel";
	var buttonOk = document.createElement("button");
	buttonOk.innerText = "OK";

	tr = document.createElement("tr");
	lable = document.createElement("label");
	lable.innerText = "Title:";
	td = document.createElement("td");
	td.appendChild(lable);
	tr.appendChild(td);
	td = document.createElement("td");
	td.appendChild(title);
	tr.appendChild(td);
	table.appendChild(tr);

	tr = document.createElement("tr");
	lable = document.createElement("label");
	lable.innerText = "URL:";
	td = document.createElement("td");
	td.appendChild(lable);
	tr.appendChild(td);
	td = document.createElement("td");
	td.appendChild(url);
	tr.appendChild(td);
	table.appendChild(tr);

	/*因为API不能读取本地文件，取消自定义图标功能
	tr = document.createElement("tr");
	lable = document.createElement("label");
	lable.innerText = "Icon:";
	td = document.createElement("td");
	td.appendChild(lable);
	tr.appendChild(td);
	td = document.createElement("td");
	td.appendChild(image);	
	td.appendChild(selectIcons);
	tr.appendChild(td);
	table.appendChild(tr);
	*/

	tr = document.createElement("tr");
	lable = document.createElement("label");
	lable.innerText = "ID:";
	td = document.createElement("td");
	td.appendChild(lable);
	tr.appendChild(td);
	td = document.createElement("td");
	td.appendChild(lableId);
	tr.appendChild(td);
	table.appendChild(tr);

	tr = document.createElement("tr");
	lable = document.createElement("label");
	lable.innerText = "TYPE:";
	td = document.createElement("td");
	td.appendChild(lable);
	tr.appendChild(td);
	td = document.createElement("td");
	td.appendChild(image);
	td.appendChild(lableType);
	tr.appendChild(td);
	table.appendChild(tr);

	tr = document.createElement("tr");
	lable = document.createElement("label");
	lable.innerText = "Date:";
	td = document.createElement("td");
	td.appendChild(lable);
	tr.appendChild(td);
	td = document.createElement("td");
	td.appendChild(lableDate);
	tr.appendChild(td);
	table.appendChild(tr);

	tr = document.createElement("tr");
	lable = document.createElement("label");
	lable.innerText = "Comment:";
	td = document.createElement("td");
	td.appendChild(lable);
	tr.appendChild(td);
	td = document.createElement("td");
	td.appendChild(comment);
	tr.appendChild(td);
	table.appendChild(tr);

	tr = document.createElement("tr");
	td = document.createElement("td");
	td.appendChild(buttonOk);
	tr.appendChild(td);
	td = document.createElement("td");
	td.appendChild(buttonCancel);
	tr.appendChild(td);
	table.appendChild(tr);

	title.value = currentTarget.innerText;
	url.innerText = currentTarget.getAttribute("sourceurl");
	for (let i = 0; i < currentTarget.parentNode.childNodes.length; i++) {
		if (currentTarget.parentNode.childNodes[i].tagName == "IMG") {
			image.setAttribute("src", currentTarget.parentNode.childNodes[i].getAttribute("src"));
		}
	}
	//image.setAttribute("src", currentTarget.parentNode.childNodes[0].getAttribute("src"));
	comment.value = currentTarget.getAttribute("comment");
	lableId.innerText = currentTarget.getAttribute("id");
	var nodetype = currentTarget.getAttribute("nodetype");
	lableType.innerText = (nodetype === "" ? "web : " + currentTarget.getAttribute("foldername") : nodetype + " : " + currentTarget.getAttribute("foldername"));
	var ids = currentTarget.getAttribute("id");
	lableDate.innerText = ids.substr(0, 4).concat("/", ids.substr(4, 2), "/", ids.substr(6, 2), " ", ids.substr(8, 2), ":", ids.substr(10, 2), ":", ids.substr(12, 2));

	/*如果是folder，则禁止编辑URL和comment
	if (currentTarget.tagName === "SUMMARY") {
		url.setAttribute("disabled", "disabled");
		comment.setAttribute("disabled", "disabled");
	}
	*/

	buttonOk.addEventListener("click", onClickOk, false);
	buttonCancel.addEventListener("click", onClickCancel, false);

	docDetailTable = table;
}

function onClickCancel(event) {
	docDetailTable.parentNode.removeChild(docDetailTable);
	detailOpened = false;
}

function onClickOk(event) {
	currentTarget.innerText = document.getElementById("docDetailTitle").value;
	if (currentTarget.tagName === "A") {
		currentTarget.setAttribute("comment", document.getElementById("docDetailComment").value);

		/*取消修改URL和Icon
		currentTarget.setAttribute("sourceurl", document.getElementById("docDetailUrl").value);
		if (currentTarget.previousSibling.tagName === "IMG") {
			currentTarget.previousSibling.setAttribute("src", document.getElementById("docDetailicon").getAttribute("src"));
		}
		*/
	}
	//同步数据array，folder的html里面没有加入comment属性，直接在array里同步数据
	updateScrapNode(arrNodes, currentTarget.getAttribute("id"), currentTarget.innerText, document.getElementById("docDetailComment").value);
	docDetailTable.parentNode.removeChild(docDetailTable);
	detailOpened = false;
	var mylibutton = document.getElementById("mylisavedata");
	//提示有数据变化
	mylibutton.innerText = browser.i18n.getMessage("SaveDataModified");
	mylibutton.style.color = "red";
}

function onDetail2(event) {
	//event.target是menuitem
	var id = currentTarget.getAttribute("id");
	var sourceurl = currentTarget.getAttribute("sourceurl");
	var nodetype = currentTarget.getAttribute("nodetype");
	var type = nodetype === "" ? "web" : nodetype;
	var title = currentTarget.innerText;
	var icon = currentTarget.parentNode.childNodes[0].getAttribute("src");
	var params = "scrapbookqdetail.html?id=".concat(id, "&url=", sourceurl, "&icon=", icon, "&type=", type, "&title=", title);
	var prarmsEncoded = encodeURI(params);
	browser.windows.create({ type: "normal", height: 400, width: 500, top: 10, left: 10, url: prarmsEncoded });
}

function openScrapURL(event) {
	//如果点击的是页面文件则在当前tab中打开
	let scrapURL = null;
	if (event.button === 0 && event.target.tagName === "A") {
		if (currentTarget.getAttribute("id") == "scrapbookq") {
			scrapURL = "scrapbookq-usage.html";
		}
		else {
			scrapURL = "http://localhost:" + folderport[currentTarget.getAttribute("foldername")] + "/data/" + currentTarget.getAttribute("id") + "/index.html";
		}

		browser.tabs.update({ url: scrapURL });
	}
}


function openScrapURLNewTab(event) {
	//如果点击的是页面文件则新建tab中打开
	let scrapURL = null;
	if (currentTarget.getAttribute("nodeType") != "folder") {
		if (currentTarget.getAttribute("id") == "scrapbookq") {
			scrapURL = "scrapbookq-usage.html";
		}
		else {
			scrapURL = "http://localhost:" + folderport[currentTarget.getAttribute("foldername")] + "/data/" + currentTarget.getAttribute("id") + "/index.html";
		}
		browser.tabs.create({ url: scrapURL });
	}
}

function openSourceURL(event) {
	//如果点击的是页面文件则在当前tab中打开		
	if (currentTarget.getAttribute("nodeType") != "folder") {
		var scrapURL = currentTarget.getAttribute("sourceURL");
		//console.log("sourceURL: " + scrapURL);
		browser.tabs.update({ url: scrapURL });
	}
}


function toggleCss(event) {
	//window.location.href = "data/20171029142147/index.html";		
	if (event.target.tagName === "A") {
		//取消前一次的点击对象高亮，记录当前点击对象并高亮
		if (currentTarget != null) {
			currentTarget.classList.remove("done");
		}
		event.target.classList.toggle("done");
		currentTarget = event.target;
	}
	if (event.target.tagName === "SUMMARY") {
		//取消前一次的点击对象高亮，记录当前点击对象并高亮
		if (currentTarget != null) {
			currentTarget.classList.remove("done");
		}
		event.target.classList.toggle("done");
		currentTarget = event.target;
	}
}

/**
 * 找到root节点，获取root内部的各项相关数据，存入数组
 * @param {*} arrNodes 
 */
function initScrap(arrNodes, xmlDoc) {
	foldername = "scrapbook";
	isroot = 0;
	//xmlDoc = xmlhttp.responseXML;
	var y = xmlDoc.getElementsByTagName("RDF:Seq");
	for (var j = 0; j < y.length; j++) {
		if (y[j].getAttribute("RDF:about") == "urn:scrapbook:root") {
			//console.log("match root");
			var rootSubNodes = xmlDoc.getElementsByTagName("RDF:Seq")[j].childNodes;
			for (var k = 0; k < rootSubNodes.length; k++) {
				if (rootSubNodes[k].nodeType == 1) {
					//console.log("root.length: " + rootSubNodes.length + " root[" + k + "]: " + rootSubNodes[k].getAttribute("RDF:resource"));
					getScrapNodes(rootSubNodes[k].getAttribute("RDF:resource"), arrNodes);
				}
			}
			break;
		}
	}
}

/**
 * 输出节点到html，如果节点是目录则递归输出
 * @param {*} currentNode 
 * @param {*} parentNode 
 */
function displyScrap(currentNode, parentNode) {
	var treeroot = document.createElement("details");
	var treenode = null;
	var nodeSummary = null;
	var treeleaf = null;
	var img = null;
	var aText = null;
	for (var i = 0; i < currentNode.length; i++) {
		//如果已经输出渲染过项目，则避免再次输出渲染
		if (document.getElementById(currentNode[i].id) != null) {
			continue;
		}
		if (currentNode[i].type == "folder") {
			treenode = document.createElement("details");
			if (isroot == 0) {
				treenode.setAttribute("class", "tree-root");
				treenode.setAttribute("isroot", "0");
			}
			else {
				treenode.setAttribute("class", "tree-node");
				treenode.setAttribute("isroot", "1");
			}
			nodeSummary = document.createElement("Summary");
			nodeSummary.textContent = currentNode[i].title.replace(/\&lt/gim, "\<").replace(/\&gt/gim, "\>").replace(/\&quot;/gim, "\"").replace(/\&apos;/gim, "\'");
			nodeSummary.setAttribute("id", currentNode[i].id);
			nodeSummary.setAttribute("foldername", currentNode[i].foldername);
			nodeSummary.setAttribute("nodeType", currentNode[i].type);
			nodeSummary.setAttribute("comment", currentNode[i].comment);
			treenode.appendChild(nodeSummary);
			parentNode.appendChild(treenode);
			if (currentNode[i].subNodes != null) {
				//进入下层目录则isroot+1，退出时isroot-1，退出到顶时isroot==0
				isroot += 1;
				displyScrap(currentNode[i].subNodes, treenode);
				isroot -= 1;
			}
		}
		else if (currentNode[i].type != "folder") {
			treeleaf = document.createElement("li");
			if (isroot == 0) {
				treeleaf.setAttribute("class", "tree-root");
				treeleaf.setAttribute("isroot", "0");
			}
			else {
				treeleaf.setAttribute("class", "tree-leaf");
				treeleaf.setAttribute("isroot", "1");
			}
			treeleaf.textContent = "";
			img = document.createElement("img");
			img.setAttribute("height", "14");
			img.setAttribute("width", "12");
			//folderport["scrapbookq"]=1234
			if (currentNode[i].icon != "" && currentNode[i].icon.indexOf("/") != -1) {
				//scrapbook/data/20171020232214/favicon.ico -> http://localhost:3339/data/20171020232214/favicon.ico 
				img.setAttribute("src", "http://localhost:" + folderport[currentNode[i].icon.slice(0, currentNode[i].icon.indexOf("/"))] + currentNode[i].icon.slice(currentNode[i].icon.indexOf("/")));
			}
			if (currentNode[i].icon == "") {
				img.setAttribute("src", "icons/file0.png");
			}
			if (currentNode[i].id == "scrapbookq") {
				img.setAttribute("src", "icons/star0.png");
			}
			aText = document.createElement("a");
			aText.setAttribute("class", "icon-li");
			//aText.setAttribute("href", "");
			aText.appendChild(document.createTextNode(currentNode[i].title.replace(/\&lt/gim, "\<").replace(/\&gt/gim, "\>").replace(/\&quot;/gim, "\"").replace(/\&apos;/gim, "\'")));
			aText.setAttribute("id", currentNode[i].id);
			aText.setAttribute("foldername", currentNode[i].foldername);
			aText.setAttribute("sourceURL", currentNode[i].source);
			aText.setAttribute("nodeType", currentNode[i].type);
			aText.setAttribute("comment", currentNode[i].comment);
			treeleaf.appendChild(img);
			treeleaf.appendChild(aText);
			parentNode.appendChild(treeleaf);
		}
	}
}


/*根据给定RDFResource生成链表
从RDF:Seq生成链表，用数组实现：
根据给定的resource在所有Description里面搜索
如果type是文件，查询数据，生成对象，subNodes=null,push对象进数组
如果type是folder，查询数据，生成对象，subNodes=new Array ()，push对象进数组
在所有Seq中搜索目标about，找到后，遍历目标Seq,
对目标Seq里面的每一项resource进行递归查询
退出递归的条件：1、因为都是确定langth的循环，不存在无限循环；2、递归到目录里面最后一个文件后逐层返回
**/
function getScrapNodes(RDFResource, arrNodes) {
	xmlDoc = xmlhttp.responseXML;
	var x = xmlDoc.getElementsByTagName("RDF:Description");
	for (var i = 0; i < x.length; i++) {
		//如果已经加载过项目，则避免再次加载
		if (document.getElementById(x[i].getAttribute("NS1:id")) != null) {
			continue;
		}
		if (x[i].getAttribute("RDF:about") == RDFResource) {
			//function scrapNode (about,id,type,title,chars,icon,source,comment,subNodes) 
			var currentNode = new scrapNode(
				x[i].getAttribute("RDF:about"),
				x[i].getAttribute("NS1:id"),
				x[i].getAttribute("NS1:type"),
				//需要把转义过的字符翻译成正常字符
				x[i].getAttribute("NS1:title"),
				x[i].getAttribute("NS1:chars"),
				//去掉前缀：resource://
				x[i].getAttribute("NS1:icon").substr(11),
				x[i].getAttribute("NS1:source"),
				x[i].getAttribute("NS1:comment"),
				null,
				x[i].getAttribute("RDF:about").split(":")[1]
			);
			if (currentNode.type != "folder") {
				arrNodes.push(currentNode);
				//console.log("push file: " + currentNode.title);
			}

			if (currentNode.type == "folder") {
				var newNode = new Array();
				currentNode.subNodes = newNode;
				arrNodes.push(currentNode);
				//console.log("push folder: " + currentNode.title);

				var y = xmlDoc.getElementsByTagName("RDF:Seq");
				for (var j = 0; j < y.length; j++) {
					//console.log(j + "at"  + y.length + " about: " + y[j].getAttribute("RDF:about") + "==" + currentNode.about);
					if (y[j].getAttribute("RDF:about") == currentNode.about) {
						//console.log("match folder");			
						var xx = xmlDoc.getElementsByTagName("RDF:Seq")[j].childNodes;
						for (var k = 0; k < xx.length; k++) {
							if (xx[k].nodeType == 1) {
								//console.log("k: " + k + " xx[k]: " + xx[k].getAttribute("RDF:resource"));
								getScrapNodes(xx[k].getAttribute("RDF:resource"), newNode);
							}
						}
						break;
					}
				}
			}
		}
	}
}

function ScrapBookQApp(arrayNodes, sidebarhtml, folderport, scrapbookqhtmlok, scrapbookqrdfok, scrapbookrdfok, rdfloaded) {
	this.arrayNodes = arrayNodes;
	this.sidebarhtml = sidebarhtml;
	this.folderport = folderport;
	this.scrapbookqhtmlok = scrapbookqhtmlok;
	this.scrapbookqrdfok = scrapbookqrdfok;
	this.scrapbookrdfok = scrapbookrdfok;
	this.rdfloaded = rdfloaded;
}

function scrapNode(about, id, type, title, chars, icon, source, comment, subNodes, foldername) {
	this.about = about;
	this.id = id;
	this.type = type;
	this.title = title;
	this.chars = chars;
	this.icon = icon;
	this.source = source;
	this.comment = comment;
	this.subNodes = subNodes;
	this.foldername = foldername;
}

function loadXMLDoc(dname) {
	xmlhttp = null;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	}
	xmlhttp.onload = onloadXML;
	xmlhttp.onerror = onerrorXML;
	xmlhttp.onreadystatechange = stateChange;
	if (xmlhttp != null) {
		xmlhttp.open("GET", dname, false);
		//xmlhttp.setRequestHeader("Content-Type", "text/xml");
		if (dname.indexOf(".rdf") != -1) {
			xmlhttp.overrideMimeType("text/xml");
		}
		xmlhttp.send(null);
		//return xmlhttp.responseXML;
	}
	else {
		alert("Your browser does not support XMLHTTP.");
	}


	function onloadXML() {
		console.log("load XML Doc " + dname + " loading...");
	}

	function onerrorXML() {
		console.log("load XML Doc :" + dname + " error!");
	}

	function stateChange() {
		//4 = "loaded"
		if (xmlhttp.readyState == 4) {
			//200 = OK
			if (xmlhttp.status == 200) {
				// ...our code here...
				console.log("load XML Doc: " + dname + " Success: 200");
				loadstate.errcode = xmlhttp.status;
				loadstate.xmlfilename = dname;
			}
			else {
				loadstate.errcode = xmlhttp.status;
				loadstate.xmlfilename = dname;
				alert("Problem retrieving XML data: " + dname + " : " + xmlhttp.status);
			}
		}
	}
}

function onCreateFolder(event) {
	var treenode = null;
	var nodeSummary = null;
	var treeleaf = null;
	var img = null;
	var aText = null;
	var folderTitle = browser.i18n.getMessage("NewDirectory");
	var nowId = getNow();
	foldername = "scrapbookq";
	treenode = document.createElement("details");
	//只有父节点<li>里面才有"isroot"属性，当前节点为<A>
	if (currentTarget.parentNode.getAttribute("isroot") == "0") {
		treenode.setAttribute("class", "tree-root");
		treenode.setAttribute("isroot", "0");
	}
	else {
		treenode.setAttribute("class", "tree-node");
		treenode.setAttribute("isroot", "1");
	}
	nodeSummary = document.createElement("Summary");
	nodeSummary.textContent = folderTitle;
	nodeSummary.setAttribute("id", nowId);
	nodeSummary.setAttribute("nodeType", "folder");
	nodeSummary.setAttribute("foldername", foldername);
	treenode.appendChild(nodeSummary);
	//向父节点<li>/<detail>的父节点添加
	if (currentTarget.tagName == "A") {
		currentTarget.parentNode.parentNode.insertBefore(treenode, currentTarget.parentNode);
	}
	else if (currentTarget.tagName == "SUMMARY") {
		treenode.setAttribute("class", "tree-node");
		treenode.setAttribute("isroot", "1");
		currentTarget.appendChild(treenode);
	}
	//根据数据新建scrapNode对象，插入当前目标对象之后，如果当前目标对象时folder就插进去

	//scrapNode(about, id, type, title, chars, icon, source, comment, subNodes, foldername) 
	var scrapNodeObj = new scrapNode(
		"urn:" + foldername + ":item:" + nowId,
		nowId,
		"folder",
		folderTitle,
		"",
		"",
		"",
		"",
		null,
		foldername
	);
	insertScrapNode(arrNodes, currentTarget.getAttribute("id"), scrapNodeObj);
	var mylibutton = document.getElementById("mylisavedata");
	//提示有数据变化
	mylibutton.innerText = browser.i18n.getMessage("SaveDataModified");
	mylibutton.style.color = "red";
}

function onDeleteDocument(event) {
	//如果当前对象为页面文件，则从父节点<li>的父节点<li>删除<li>
	if (currentTarget.getAttribute("nodetype") === "") {
		currentTarget.parentNode.parentNode.removeChild(currentTarget.parentNode);
	}
	//如果当前对象为folder，则从父节点<details>的父节点<div>或其他删除<details>，然后删除<summary>
	else if (confirm(browser.i18n.getMessage("ConfirmDeleteDirectory")) === true) {
		currentTarget.parentNode.parentNode.removeChild(currentTarget.parentNode);
		currentTarget.parentNode.removeChild(currentTarget);
	}
	//同步数据

	//将对象节点从原数组删除，存储到delArrayNode
	cutScrapNode(arrNodes, currentTarget.getAttribute("id"));
	//从delArrayNode获得所有leep的foldername和id存入delArrayIdFolder
	getAllScrapNode(delArrayNode);
	//将数组数据保存为rdf文件
	saveScrapbookqData();
	//发送删除文件列表
	let stemp = "";
	for (let i = 0; i < delArrayIdFolder.length; i++) {
		stemp += delArrayIdFolder[i];
		stemp += ";";
	}
	//清空数组
	delArrayIdFolder = [];
	//当前对象被删除，重新分配当前对象
	currentTarget = document.getElementById("scrapbookq");
	browser.runtime.sendMessage({ delete: stemp });
}

function getNow() {
	var now = new Date();
	var ns = "".concat(now.getFullYear());
	ns = ns.concat(now.getMonth() + 1 < 10 ? "0".concat(now.getMonth() + 1) : now.getMonth() + 1);
	ns = ns.concat(now.getDate() < 10 ? "0".concat(now.getDate()) : now.getDate());
	ns = ns.concat(now.getHours() < 10 ? "0".concat(now.getHours()) : now.getHours());
	ns = ns.concat(now.getMinutes() < 10 ? "0".concat(now.getMinutes()) : now.getMinutes());
	ns = ns.concat(now.getSeconds() < 10 ? "0".concat(now.getSeconds()) : now.getSeconds());
	return ns;
}

function allowDrop(event) {
	event.preventDefault();
}

function drag(event) {
	event.dataTransfer.setData("Text", event.target.id);
}

// a-a A-A A-a a-A a-F a-f f-f F-F f-F F-f f-A f-a F-A F-a
function drop(event) {
	event.preventDefault();
	var data = event.dataTransfer.getData("Text");
	var currentDragTitle = document.getElementById(data).innerText;
	currentDrop = event.target;
	//console.log("dragTitle: " + currentDragTitle + " currentDrop: " + event.target.innerText + " = " + event.target.tagName + " currentTarget: " + currentTarget.tagName);

	var delNode = null;
	//如果拖放对象到页面或者folder上则拖放有效，删除原节点，修改属性，插入到对应位置
	if (currentDrop.tagName === "A" || currentDrop.tagName === "SUMMARY") {
		delNode = currentTarget.parentNode.parentNode.removeChild(currentTarget.parentNode);
		//console.log("deNode: " + delNode.innerText + delNode.tagName);
	}
	//如果当前对象为页面文件，则向父节点<li>的父节点添加，并且修改父节点的isroot和class为当前对象的父节点一样
	if (currentDrop.tagName === "A") {
		//console.log("currentDrop.parentNode.getAttribute(isroot)", currentDrop.parentNode.getAttribute("isroot"));
		delNode.setAttribute("isroot", currentDrop.parentNode.getAttribute("isroot"));
		delNode.setAttribute("class", currentDrop.parentNode.getAttribute("class"));
		currentDrop.parentNode.parentNode.insertBefore(delNode, currentDrop.parentNode);
	}
	//如果当前对象为folder，则向父节点<details>添加，也就是放到folder里面，需要修改siroot=1和class=tree-leaf
	else if (currentDrop.tagName === "SUMMARY") {
		delNode.setAttribute("isroot", "1");
		delNode.setAttribute("class", "tree-leaf");
		currentDrop.parentNode.appendChild(delNode);
	}
}

function downloadScrapbookqData(domHtml) {

	function onStartedDownload(id) {
		console.log(`Started downloading: ${id}`);
	}

	function onFailed(error) {
		console.log(`Download failed: ${error}`);
	}

	//alert("保存文件到scrapbookq/scrapbookq.rdf");

	//pageHtml = request.pagecontent; pageFiles = request.pagefiles;
	let file = new File([domHtml], "scrapbookq.rdf", {
		type: "text/xml",
	});

	downloadUrl = window.URL.createObjectURL(file);
	downloading = browser.downloads.download({ url: downloadUrl, filename: "scrapbookq/scrapbookq.rdf", conflictAction: "overwrite" });

	/* 不用了，直接存储到storage里
	file = new File([scrapContainer.innerHTML], "scrapbookq.html", {
		type: "text/xml",
	});

	downloadUrl = window.URL.createObjectURL(file);
	downloading = browser.downloads.download({ url: downloadUrl, filename: "scrapbookq/scrapbookq.html", conflictAction: "overwrite" });
*/
	//downloading.then(onStartedDownload, onFailed);
}

/*
var treeroot = document.createElement("RDF:RDF");
var parentNode = document.createElement("RDF:Seq");
parentNode.setAttribute("RDF:about", "urn:scrapbook:root");
treeroot.appendChild(parentNode);
array2XML(arrNodes, parentNode);
function array2XML(currentNode, parentNode) {	
	var treenode = null;
	var treeli = null;
	var treeleaf = null;
	for (var i = 0; i < currentNode.length; i++) {
		treeleaf = document.createElement("RDF:Description");
		treeleaf.setAttribute("RDF:about", currentNode[i].about);
		treeleaf.setAttribute("NS1:id", currentNode[i].id);
		treeleaf.setAttribute("NS1:type", currentNode[i].type);
		treeleaf.setAttribute("NS1:title", currentNode[i].title);
		treeleaf.setAttribute("NS1:chars", currentNode[i].chars);
		treeleaf.setAttribute("NS1:icon", currentNode[i].icon);
		treeleaf.setAttribute("NS1:source", currentNode[i].source);
		treeleaf.setAttribute("NS1:comment", currentNode[i].comment);
		treeleaf.setAttribute("NS1:foldername", currentNode[i].foldername);
		treeroot.appendChild(treeleaf);

		treeli = document.createElement("RDF:li");
		treeli.setAttribute("RDF:resource", currentNode[i].about);
		parentNode.appendChild(treeli);

		if (currentNode[i].type == "folder") {
			treenode = document.createElement("RDF:Seq");
			treenode.setAttribute("RDF:about", currentNode[i].about);
			treeroot.appendChild(treenode);
			if (currentNode[i].subNodes != null) {
				array2XML(currentNode[i].subNodes, treenode);
			}
		}		
	}
}

*/