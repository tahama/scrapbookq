
document.getElementById("initScrapbookQDirectory").addEventListener("click", function onClickInit(event) {
    if (confirm(browser.i18n.getMessage("ConfirmInitDirectory")) === true) {
    browser.runtime.sendMessage({ extensionurl: document.URL.slice(0, document.URL.lastIndexOf("/") + 1) });
    browser.downloads.showDefaultFolder();
    }
});