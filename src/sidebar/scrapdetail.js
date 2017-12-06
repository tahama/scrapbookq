var id = document.getElementById("id");
var type = document.getElementById("type");
var title = document.getElementById("title");
var url = document.getElementById("url");
var icon = document.getElementById("icon");
var comment = document.getElementById("comment");
var date = document.getElementById("date");
var ok = document.getElementById("ok");
var cancel = document.getElementById("cancel");
var oGetVars = {};
ok.addEventListener("click", onClickOk, false);
cancel.addEventListener("click", onClickCancel, false);

getParas();
if (oGetVars.id != null) {
    id.innerText = oGetVars.id;
}
if (oGetVars.title != null) {
    title.value = oGetVars.title;
}
if (oGetVars.url != null) {
    url.value = oGetVars.url;
}
if (oGetVars.icon != null) {
    icon.src = oGetVars.icon;
}
if (oGetVars.type != null) {
    type.innerText = oGetVars.type;
}
comment.innerText = window.location.search;
var ids = id.innerText;
date.innerText = ids.substr(0, 4).concat("/", ids.substr(4, 2), "/", ids.substr(6, 2), " ", ids.substr(8, 2), ":", ids.substr(10, 2), ":", ids.substr(12, 2));

document.getElementsByTagName("TITLE")[0].text = oGetVars.title;

function getParas () {
    if (window.location.search.length > 1) {
      for (var aItKey, nKeyId = 0, aCouples = window.location.search.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
        aItKey = aCouples[nKeyId].split("=");
        oGetVars[decodeURIComponent(aItKey[0])] = aItKey.length > 1 ? decodeURIComponent(aItKey[1]) : "";
      }
    }
}

function onClickOk (event) {
    console.log("onClickOk");
    open("http://www.baidu.com");
}

function onClickCancel (event) {
    alert("onClickCancel");
}