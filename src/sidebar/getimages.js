var imgs;
var label = null;
var imagesURL = new Array();
/*
label = document.createElement("lable");
label.innerText = "URL: " + document.URL;
document.body.appendChild(label);

label = document.createElement("br");
document.body.appendChild(label);

label = document.createElement("lable");
label.innerText = "Images: ";
document.body.appendChild(label);

label = document.createElement("lable");
label.innerText = document.images.length;
document.body.appendChild(label);

label = document.createElement("br");
document.body.appendChild(label);
*/

for (imgs = 0; imgs < document.images.length; imgs++) {
    imagesURL.push(document.images[imgs].src);
    //去掉文件名前后的/和?等内容
    let index0 = document.images[imgs].src.lastIndexOf("/");
    let index1 = document.images[imgs].src.search(/[?]/g);
    let str0 = null;
    if (index1 < 0) {
        index1 = document.images[imgs].src.length;
    }
    str0 = document.images[imgs].src.substr(index0 + 1, index1 - index0 - 1);
    document.images[imgs].src = str0;

    /*
    var i = document.images[imgs].src.search(/[?]/g);
    var len = document.images[imgs].src.lenght;
    if (i > 0) {
        len = i;
    }
    label = document.createElement("lable");
    label.innerText = document.images[imgs].src.substr(0, len);
    document.body.appendChild(label);
    label = document.createElement("br");
    document.body.appendChild(label);
    */
}
  

var links = document.getElementsByTagName("link");
var lnks;
for (lnks = 0; lnks < links.length; lnks++) {
    if (links[lnks].getAttribute("rel") == "stylesheet" || links[lnks].getAttribute("rel") == "shortcut icon") {
        //href以/开头就是从域名根目录算起
        if (links[lnks].getAttribute("href")[0] == "/") {
            imagesURL.push(document.URL.slice(0, document.URL.indexOf("/")) + "//" + document.domain + links[lnks].getAttribute("href"));
        }
        else {
            imagesURL.push(document.URL + links[lnks].getAttribute("href"));
        }

        //去掉文件名前后的/和?等内容
        let index0 = links[lnks].getAttribute("href").lastIndexOf("/");
        let index1 = links[lnks].getAttribute("href").search(/[?]/g);
        let str0 = null;
        if (index1 < 0) {
            index1 = links[lnks].getAttribute("href").length;
        }
        str0 = links[lnks].getAttribute("href").substr(index0 + 1, index1 - index0 - 1);
        links[lnks].setAttribute("href", str0);
        /*
         var linkindex = links[lnks].getAttribute("href").search(/[?]/g);
         var linklen = links[lnks].getAttribute("href").lenght;
         if (linkindex > 0) {
             linklen = linkindex;
         }
         label = document.createElement("lable");
         label.innerText = links[lnks].getAttribute("href").substr(0, linklen);
         document.body.appendChild(label);
         label = document.createElement("br");
         document.body.appendChild(label);
         */
    }
}
/*
label = document.createElement("lable");
label.innerText = document.URL;
document.body.appendChild(label);
label = document.createElement("br");
document.body.appendChild(label);
*/

var pagehtml = document.getElementsByTagName("html")[0].innerHTML;
browser.runtime.sendMessage({ pagecontent: pagehtml, pagefiles: imagesURL });
//window.location.reload();

function handleMessageContent(request, sender, sendResponse) {
    console.log("== getimages.js Received Message from the background ==");
    console.log("==id: " + request.id + " icon:" + request.favicon);
}
//browser.runtime.onMessage.addListener(handleMessageContent);