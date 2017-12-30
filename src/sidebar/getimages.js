var imgs;
var label = null;
var imagesURL = new Array();
var jsURL = new Array ();

for (imgs = 0; imgs < document.images.length; imgs++) {
    let imgurl = null;
    imgurl = document.images[imgs].src;
    if (imgurl != null && imgurl.length != 0 && imgurl.indexOf("://") != -1) {
		//console.log("ImageURL: " + imgurl + " length: " + imgurl.length);
        imagesURL.push(imgurl);
        /*
        //去掉文件名前后的/和?等内容
        let index0 = document.images[imgs].src.lastIndexOf("/");
        let index1 = document.images[imgs].src.search(/[?]/g);
        let str0 = null;
        if (index1 < 0) {
            index1 = document.images[imgs].src.length;
        }
        str0 = document.images[imgs].src.substr(index0 + 1, index1 - index0 - 1);
        document.images[imgs].src = str0;
        */
    }
}

var links = document.getElementsByTagName("link");
var lnks;
for (lnks = 0; lnks < links.length; lnks++) {
    let imgurl = null;
    if (links[lnks].href != null && (links[lnks].rel == "stylesheet" || links[lnks].rel == "shortcut icon")) {
        imagesURL.push(links[lnks].href);
        /*
        //去掉文件名前后的/和?等内容
        let index0 = links[lnks].href.lastIndexOf("/");
        let index1 = links[lnks].href.search(/[?]/g);
        let str0 = null;
        if (index1 == -1) {
            index1 = links[lnks].href.length;
        }
        str0 = links[lnks].href.substr(index0 + 1, index1 - index0 - 1);
        links[lnks].href = str0;
        */
    }
}

var pagehtml = document.getElementsByTagName("html")[0].innerHTML;
var scriptsurl = new Array();
var scripts = document.getElementsByTagName("script");
for (let i = 0; i < scripts.length; i++) {
    if (scripts[i].src != null && scripts[i].src.length > 0) {
        if (scripts[i].src.indexOf("://") == -1) {
            //href以/开头就是从域名根目录算起
            if (scripts[i].src[0] == "/") {
                jsURL.push(document.URL.slice(0, document.URL.indexOf("/")) + "//" + document.domain + scripts[i].src);
            }
            else {
                jsURL.push(document.URL + scripts[i].src);
            }
        }
        else {
            jsURL.push(scripts[i].src);
        }
        let scriptidx = scripts[i].src.lastIndexOf("/");
        if (scriptidx != -1) {
            scriptsurl[scripts[i].src] = scripts[i].src.slice(scriptidx + 1);
            //console.log(document.scripts[i].src.slice(idx + 1));
        }
        else {
            scriptsurl[scripts[i].src] = scripts[i].src;
            //console.log(document.scripts[i].src);
        }
    }
}

var regexp = null;
var rep = null;
var newHtml = null;
for (x in scriptsurl) {
    regexp = new RegExp("(src=.*" + scriptsurl[x].replace(/\?/g, ".") + ")", "gi");
    newHtml = pagehtml.replace(regexp, "src=\"" + scriptsurl[x]);
    pagehtml = newHtml;
}

var urlprefix = document.URL.slice(0, document.URL.indexOf("/")) + "//" + document.domain;
regexp = new RegExp("(href=\"/" + ")", "gi");
newHtml = pagehtml.replace(regexp, "href=\"" + urlprefix + "/");
pagehtml = newHtml;

browser.runtime.sendMessage({ pagecontent: pagehtml, pagefiles: imagesURL, jsfiles: jsURL });
//window.location.reload();

function handleMessageContent(request, sender, sendResponse) {
    console.log("== getimages.js Received Message from the background ==");
    console.log("==id: " + request.id + " icon:" + request.favicon);
}

//browser.runtime.onMessage.addListener(handleMessageContent);
