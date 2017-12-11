var port = browser.runtime.connectNative("scrapbookqmsg");
var msgContents = new Array();
msgContents[0] = 0;

/*
Open a new tab, and load "my-page.html" into it.
*/
function openMyPage() {
  console.log("Welcome to ScrapbookQ: " + browser.i18n.getUILanguage());
  var lan = browser.i18n.getUILanguage();
  var manualurl = null;
  switch (lan) {
    case "zh-CN":
      manualurl = "sidebar/doc/zh-CN/scrapbookq-usage_zh-CN.html";
      break;
    case "zh-TW":
      manualurl = "sidebar/doc/zh-TW/scrapbookq-usage_zh-TW.html";
      break;
    case "zh-HK":
      manualurl = "sidebar/doc/zh-TW/scrapbookq-usage_zh-TW.html";
      break;
    case "ja":
      manualurl = "sidebar/doc/ja/scrapbookq-usage_ja.html";
      break;
    case "ja-JP":
      manualurl = "sidebar/doc/ja/scrapbookq-usage_ja.html";
      break;
    case "ko":
      manualurl = "sidebar/doc/en/scrapbookq-usage_en.html";
      break;
    case "ko-KR":
      manualurl = "sidebar/doc/en/scrapbookq-usage_en.html";
      break;
    case "ru":
      manualurl = "sidebar/doc/ru/scrapbookq-usage_ru.html";
      break;
    case "ru-RU":
      manualurl = "sidebar/doc/ru/scrapbookq-usage_ru.html";
      break;
    default:
      manualurl = "sidebar/doc/en/scrapbookq-usage_en.html";
      break;

  }

  browser.tabs.create({
    "url": manualurl
  });
}

browser.browserAction.onClicked.addListener(openMyPage);

// listen for bookmarks being created
browser.bookmarks.onCreated.addListener(updateActiveTab);

// listen for bookmarks being removed
browser.bookmarks.onRemoved.addListener(updateActiveTab);

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);
updateActiveTab();
var currentTab = null;
function updateActiveTab(tabs) {
  function updateTab(tabs) {
    if (tabs[0]) {
      currentTab = tabs[0];
      //console.log("tabs.url: ", currentTab.url)
    }
  }
  var gettingActiveTab = browser.tabs.query({ active: true, currentWindow: true });
  gettingActiveTab.then(updateTab);
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

var downloadUrl = null;
var downloading = null;
var pagefilesidx = null;
var pagefilename = null;
var pageHtml = null;
var pageFiles = null;
var faviconfilename = null;

function onSaveCurrentPage() {

  function onStartedDownload(id) {
    // console.log(`Started downloading: ${id}`);
  }

  function onFailed(error) {
    console.log(`Download failed: ${error}`);
  }

  //pageHtml = request.pagecontent; pageFiles = request.pagefiles;
  var file = new File([pageHtml], "index.html", {
    type: "text/html",
  });


  downloadUrl = window.URL.createObjectURL(file);
  folderid = getNow();
  downloading = browser.downloads.download({ url: downloadUrl, filename: "scrapbookq/data/" + folderid + "/index.html", conflictAction: "overwrite" });
  downloading.then(onStartedDownload, onFailed);

  //有些页面html搜索不到favicon，所以在background.js里添加下载链接
  //browser.tabs.query({ currentWindow: true, active: true }).then(function (tabs) {
  if (currentTab.favIconUrl != null) {
    downloadUrl = currentTab.favIconUrl;
    //去掉文件名前后的/和?等内容
    let index0 = downloadUrl.lastIndexOf("/");
    let index1 = downloadUrl.search(/[?]/g);
    if (index1 < 0) {
      index1 = downloadUrl.length;
    }
    pagefilename = "scrapbookq/data/" + folderid + "/";
    faviconfilename = downloadUrl.substr(index0 + 1, index1 - index0 - 1);
    pagefilename += faviconfilename;

    console.log(downloadUrl + " 下载的文件名: " + pagefilename);
    downloading = browser.downloads.download({ url: downloadUrl, filename: pagefilename, conflictAction: "overwrite" });
    downloading.then(onStartedDownload, onFailed);
    pageFiles.push(currentTab.favIconUrl);
  }
  //});


  for (pagefilesidx = 0; pagefilesidx < pageFiles.length; pagefilesidx++) {
    downloadUrl = pageFiles[pagefilesidx];
    //抛弃内嵌的base64编码的图片
    if (downloadUrl.slice(0, 10) != "data:image") {
      //去掉文件名前后的/和?等内容
      var index0 = pageFiles[pagefilesidx].lastIndexOf("/");
      var index1 = pageFiles[pagefilesidx].search(/[?]/g);
      if (index1 < 0) {
        index1 = pageFiles[pagefilesidx].length;
      }
      pagefilename = "scrapbookq/data/" + folderid + "/";
      pagefilename += pageFiles[pagefilesidx].substr(index0 + 1, index1 - index0 - 1);

      //console.log(pageFiles[pagefilesidx] + "下载的文件名: " + pagefilesidx + " = " + pagefilename);
      downloading = browser.downloads.download({ url: downloadUrl, filename: pagefilename, conflictAction: "overwrite" });
      downloading.then(onStartedDownload, onFailed);
    }
  }
  //downloading.then(onStartedDownload, onFailed);
  console.log("currentTab.url: " + currentTab.url + " title: " + currentTab.title + " favicon: " + currentTab.favIconUrl + " id: " + folderid);
  browser.runtime.sendMessage({ id: folderid, title: currentTab.title, url: currentTab.url, favicon: faviconfilename });
  browser.tabs.executeScript({ code: "window.location.reload();" });
}

//folderid就是id
var folderid = null;
var faviconurl = null;
var faviconsourceurl = null;
function sendMessageToTabs(tabs) {
  //有些页面没有favicon，使用缺省图标
  if (tabs[0].favIconUrl != null) {
    //去掉文件名前后的/和?等内容
    var index0 = tabs[0].favIconUrl.lastIndexOf("/");
    var index1 = tabs[0].favIconUrl.search(/[?]/g);
    var str0 = null;
    if (index1 < 0) {
      index1 = tabs[0].favIconUrl.length;
    }
    str0 = tabs[0].favIconUrl.substr(index0 + 1, index1 - index0 - 1);
    faviconurl = str0;
  }
  else {
    faviconurl = null;
  }
  /*
  for (let tab of tabs) {
    browser.tabs.sendMessage(tab.id, { id: folderid, title: tabs[0].title, url: tabs[0].url, favicon: faviconurl });
    console.log("HHHHHHHHHHH" + tab.id + " ID = " + folderid);
  }
*/
  browser.runtime.sendMessage({ id: folderid, title: tabs[0].title, url: tabs[0].url, favicon: faviconurl });
}

function handleMessage(request, sender, sendResponse) {
  if (request.testserver != null) {
    port.postMessage("TESTSERVER");
    console.log("background.js port.postMessage(\"TESTSERVER\");");
  }
  if (request.startserver != null) {
    setTimeout(function () {
      port.postMessage("STARTSERVER");
      console.log("port.postMessage(\"STARTSERVER\")");
    }, 2000);
  }
  if (request.pagecontent != null) {
    console.log("Message from the content script: " + request.pagefiles[0]);
    pageHtml = request.pagecontent;
    pageFiles = request.pagefiles;
    onSaveCurrentPage();
    //browser.tabs.query({ currentWindow: true, active: true }).then(sendMessageToTabs);
  }
  //browser.runtime.sendMessage({ rdfloaded: "1" });
  if (request.rdfloaded == "1") {
    console.log("Message from the sidebar script: " + request.rdfloaded);
    port.postMessage("rdfloaded:1");
    console.log("background.js port.postMessage(\"rdfloaded:1\");");
  }
  //	browser.runtime.sendMessage({ delete: stemp });	
  if (request.delete != null) {
    console.log("Message from the sidebar script: " + request.delete);
    port.postMessage("DELETE:" + request.delete);
    console.log("background.js port.postMessage(\"DELETE:\");");
  }
  //初始化scrapbookq文件夹：把扩展目录里的文件下载到相应目录里
  if (request.extensionurl != null) {
    const sidebarurl = request.extensionurl.slice(0, request.extensionurl.indexOf("/doc/") + 1);
    downloading = browser.downloads.download({ url: sidebarurl + "scrapbookq-usage.html", filename: "scrapbookq/index.html", conflictAction: "overwrite" });
    //uniquify 防止覆盖原有数据，可惜firefox不支持prompt
    downloading = browser.downloads.download({ url: sidebarurl + "scrapbookq.rdf", filename: "scrapbookq/scrapbookq.rdf", conflictAction: "uniquify" });
    downloading = browser.downloads.download({ url: sidebarurl + "icons/file0.png", filename: "scrapbookq/data/file0.png", conflictAction: "overwrite" });

    var platform = navigator.platform;
    console.log(platform);
    if (platform == "Win64" || platform == "Win32") {
      downloading = browser.downloads.download({ url: sidebarurl + "scrapbookq_win.conf", filename: "scrapbookq/scrapbookq.conf", conflictAction: "overwrite" });
      downloading = browser.downloads.download({ url: sidebarurl + "native-messaging-hosts/scrapbookqmsg_win.json", filename: "scrapbookq/scrapbookqmsg.json", conflictAction: "overwrite" });
      downloading = browser.downloads.download({ url: sidebarurl + "scrapbookqmsg.exe", filename: "scrapbookq/scrapbookqmsg.exe", conflictAction: "overwrite" });
      downloading = browser.downloads.download({ url: sidebarurl + "init_scrapbookq.bat", filename: "scrapbookq/init_scrapbookq.bat", conflictAction: "overwrite" });
    }
    else {
      downloading = browser.downloads.download({ url: sidebarurl + "scrapbookq.conf", filename: "scrapbookq/scrapbookq.conf", conflictAction: "overwrite" });
      downloading = browser.downloads.download({ url: sidebarurl + "native-messaging-hosts/scrapbookqmsg.json", filename: "scrapbookq/native-messaging-hosts/scrapbookqmsg.json", conflictAction: "overwrite" });
      downloading = browser.downloads.download({ url: sidebarurl + "scrapbookqmsg", filename: "scrapbookq/scrapbookqmsg", conflictAction: "overwrite" });
    }
    console.log("background.js download extension files: " + sidebarurl + " scrapbookqmsg, scrapbookq.rdf, scrapbookq.conf, native-messaging-hosts/scrapbookqmsg.json");
  }
}

browser.runtime.onMessage.addListener(handleMessage);

function onShowDownloadDefaultFolder() {
  browser.downloads.showDefaultFolder();
}

function processMsg(response) {
  let scrapbookqId = "20171127195340";
  //"POST:2017:1-7:msg"
  if (response.slice(0, 4) == "POST") {
    let msgIndexId = 4;
    let msgIndexOrder = response.indexOf(":", msgIndexId + 1);
    let msgIndexOrder1 = response.indexOf("-");
    let msgIndexMsg = response.indexOf(":", msgIndexOrder + 1);
    let msgOrder = parseInt(response.slice(msgIndexOrder + 1, msgIndexOrder1));
    let msgCount = parseInt(response.slice(msgIndexOrder1 + 1, msgIndexMsg));
    let msgId = response.slice(msgIndexId + 1, msgIndexOrder);
    let msgContent = response.slice(msgIndexMsg + 1);
    console.log(msgOrder + " : " + msgCount + " : " + msgId);
    if (scrapbookqId == msgId) {
      msgContents[msgOrder] = msgContent;
      msgContents[0] += 1;
      console.log(msgOrder + " : " + msgCount + " RECEIVED：" + msgContents[0] + " LEFT: " + (msgCount - msgOrder));
      //消息全部获取，输出到新tab
      if (msgContents[0] == msgCount) {
        console.log("消息全部获取" + msgContents.length);
        let msgFullContent = "";
        for (let i = 1; i < msgContents.length; i++) {
          msgFullContent += msgContents[i];
        }
        //console.log(msgFullContent);
        let file = new File([msgFullContent], "index.html", {
          type: "text/html",
        });
        messageUrl = window.URL.createObjectURL(file);
        browser.tabs.create({ url: messageUrl });
      }
    }
  }
  else {
    console.log(msgId + " is not the type of " + scrapbookqId);
  }
}


port.onDisconnect.addListener((p) => {
  if (p.error) {
    console.log(`Disconnected due to an error: ${p.error.message}`);
    openMyPage();
    //browser.runtime.sendMessage({NativeAppConnectError: "p.error.message"});
    setTimeout(function () {
      browser.runtime.sendMessage({ NativeAppConnectError: p.error.message });
    }, 2000);

    console.log("background.js sendMessage: NativeAppConnectError");
    //alert(browser.i18n.getMessage("NativeAppConnectError") + "\n" + p.error.message);
  }
});

/*
listen for messages from the app.
*/

port.onMessage.addListener((response) => {
  console.log("background.js Received from APP: " + response.length + " = " + response);

  //{ Scrapbook string Rdfloaded string Serverport string Serverstate string }
  if (response.Serverport != null) {
    console.log("background.js sendMessage servers");
    browser.runtime.sendMessage({ Scrapbook: response.Scrapbook, Rdfloaded: response.Rdfloaded, Serverport: response.Serverport, Serverstate: response.Serverstate });
  }
  else if (response.indexOf("TEST") != -1) {
    const servertest = response.split(":");
    console.log("background.js sendMessage test" + servertest[1]);
    browser.runtime.sendMessage({ test: "TEST", serverstate: servertest[1] });
  }
  else if (response.indexOf("Undeleted:") != -1 && response.slice(response.indexOf("Undeleted:")).length != 11) {
    console.log(response.slice(response.indexOf("Undeleted:")));
    browser.runtime.sendMessage({ undelete: response.slice(response.indexOf("Undeleted:")) });
  }

  //processMsg(response);

  //browser.tabs.executeScript({ file: "sidebar/testlocalfiles.js" });    
});

/*
called when the item has been created, or when creation failed due to an error.
We'll just log success/failure here.
*/
function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
}

/*
called when there was an error.
We'll just log the error here.
*/
function onError(error) {
  console.log(`Error: ${error}`);
}

/*
create all the context menu items.
*/
browser.menus.create({
  id: "log-selection",
  title: "menuItemSelectionLogger",
  contexts: ["selection"]
}, onCreated);

browser.menus.create({
  id: "CapturePage",
  title: browser.i18n.getMessage("CapturePage"),
  contexts: ["all"],
  icons: {
    "16": "icons/file1.png",
    "32": "icons/file1_32.png"
  }
}, onCreated);

browser.menus.create({
  id: "ToggleSidebar",
  title: browser.i18n.getMessage("ToggleSidebar"),
  contexts: ["all"],
  command: "_execute_sidebar_action",
  icons: {
    "16": "icons/star0.png",
  }
}, onCreated);


browser.menus.create({
  id: "OpenDownloadDir",
  title: browser.i18n.getMessage("OpenDownloadDir"),
  contexts: ["all"],
  icons: {
    "16": "icons/folder1.png",
  }
}, onCreated);

/*
browser.menus.create({
  id: "TestCase",
  title: browser.i18n.getMessage("TestCase"),
  contexts: ["all"],
}, onCreated);


browser.menus.create({
  id: "StartServer",
  title: browser.i18n.getMessage("StartServer"),
  contexts: ["all"],
}, onCreated);

browser.menus.create({
  id: "CloseServer",
  title: browser.i18n.getMessage("CloseServer"),
  contexts: ["all"],
}, onCreated);

browser.menus.create({
  id: "InitDownloadDirectory",
  title: browser.i18n.getMessage("InitDownloadDirectory"),
  contexts: ["all"],
}, onCreated)
*/

/*
The click event listener, where we perform the appropriate action given the
ID of the menu item that was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "log-selection":
      console.log(info.selectionText);
      break;
    case "ToggleSidebar":
      console.log("Opening my sidebar");
      break;
    case "CapturePage":
      browser.tabs.executeScript({ file: "sidebar/getimages.js" });
      console.log("Clicked the tools CapturePage");
      break;
    case "OpenDownloadDir":
      onShowDownloadDefaultFolder();
      console.log("Clicked the tools OpenDownloadDir");
      break;
    case "TestCase":
      browser.tabs.create({ url: "sidebar/scrapbookq-usage.html" });
      browser.tabs.executeScript({ file: "sidebar/testlocalfiles.js" });
      console.log("Clicked the tools TestCase");
      break;
    case "StartServer":
      port.postMessage("STARTSERVER");
      console.log("port.postMessage(\"STARTSERVER\")");
      break;
    case "CloseServer":
      port.postMessage("CLOSESERVER");
      console.log("port.postMessage(\"CLOSESERVER\")");
      break;
    case "InitDownloadDirectory":
      //port.postMessage("CLOSESERVER");
      //不允许file://，只能从网络URL下载文件
      let downloading = browser.downloads.download({ url: "http://localhost:3338/Projects/FirefoxAddon/native-messaging/app/ping_pong.py", filename: "scrapbookq/ping_pong.py", conflictAction: "overwrite" });
      downloading = browser.downloads.download({ url: "http://localhost:3338/Projects/FirefoxAddon/native-messaging/app/ping_pong.json", filename: "scrapbookq/ping_pong.py", conflictAction: "overwrite" });
      downloading = browser.downloads.download({ url: "http://localhost:3338/Projects/FirefoxAddon/native-messaging/app/init_config.sh", filename: "scrapbookq/ping_pong.py", conflictAction: "overwrite" });
      //console.log(info.selectionText);
      break;
  }
});
