# scrapbookq

ScrapbookQ is a Firefox extension, which helps you to save Web pages and easily manage collections.

ScrapbookQ = ScrapBook for Quantum

Windows and Linux support.

## Installation

1. Install ScrapBook. This will add a icon button at firefox toolbar.
1. click scrapbookq toolbar icon button. This will open scrapbookq manual page.
1. click "initScrapbookq" button in scrapbookq manual page.  This will create scrapbookq folder and some files.
1. find and open "scrapbookq" folder, then execute "init_scrapbookq.bat" file which is in "scrapbookq" folder
1. restart firefox.

## Import old ScrapBook scrapbook.rdf data

1. Find and open "scrapbookq" folder, then edit scrapbookq.conf
1. Set rdfpath to the path of scrapbook.rdf, which is mostly at "ScrapBook" folder.
1. for example, scrapbook.rdf path is D:\123\ScrapBook\scrapbook.rdf 
1. looks like: rdfpath=D:\\\\123\\\\ScrapBook\\\\
    
## Funtions

1. Compatible with old ScrapBook extension
1. Support import ScrapBook data
1. Support manage captures at browser sidebar

## Shortcomming

* Current version only support Windows and Linux
* Installation needs user do something: click one button and then enter one line bash command
* Without a Korean manual because Korean looks like a shading pattern and can't tell which line machine translation should be inserted into

## Todo

* Develop a windows version (Done)
* Support mulit document format

## Change Log.en

* 0.1.7.0 Fix bug: scrapbookqmsg send message error under windows system. Add "Search" function, both Case sensitive or non Case Sensitive. Delete "SaveData" button, update UI.
* 0.1.6.2 Fix bug: empty sidebar has no menu to rebuild itself. Add "Rebuild" menu item to browser right click menu.
* 0.1.6.1 Fix bug: rebuild and delete ScrapbookQ may clear sidebar, icon display has improved, capture page has improved too.add ConfirmRebuildSidebar message.
* 0.1.6 Fix bug:css href error, update message on windows, update es, ru translation, add downloadjs option
* 0.1.5 Add sort function
* 0.1.4 Add supprot to windows. Rewrite native App，windows users only need to click mouse twice after install this extension.
* 0.1.3 Save sidebar data in local storage，accelorate sidebar loading speed，add sidebar reload menu，modify rdfloaded function
* 0.1.2 fix bug:list checkbox state wrong, now manual onle open at first time after installation or enconter an error.
* 0.1.1 Update installation guide, now use initscrapbookq.py to init scrapbookq folder.
* 0.1.0 The first version, delete init.sh when release for AMO test warning thing, and forget to update manual installation guide.

## 特性

1. 兼容原ScrapBook文档格式
1. 支持导入原ScrapBook文档(scrapbookq.conf里添加原ScrapBook文档路径)
1. 支持浏览器侧边栏管理档案：增、改、删、刷新(后期会增加排序)
1. 0.1.4版开始支持 windows 和 linux

## 关于作者

本人乃Javascript新新新人一枚，看到javacript示例里满眼的promise、then()、()=>和其他各种奇奇怪怪的陌生玩意儿，不禁感动得热泪盈眶，再看一眼列出的单子：ES3、ES5、ES6、...那种无力感...怎一个酸爽了得。详见[在 2016 年学 JavaScript 是一种什么样的体验？](https://zhuanlan.zhihu.com/p/22782487)，请诸小白与我共飨

## Change Log.zh-CN

* 0.1.7.0 版修复bug：windows下发送消息异常。添加搜索功能，可以设置是否大小写敏感。删除"保存"按钮，改成"搜索"按钮。更新界面。
* 0.1.6.2 版修复bug：空白侧边栏没有右键菜单，所以不能通过右键菜单来重建侧边栏。添加"重建"菜单项到浏览器右键菜单
* 0.1.6.1版改进图标显示、改进页面格式、修复bug：rebuild + 删除 ScrapbookQ后sidebar空白、添加ConfirmRebuildSidebar翻译
* 0.1.6 版修复下载css文件href错误问题，更新windows平台的消息，添加es、ru用户翻译文件，添加下载javascript选项及功能
* 0.1.5 版增加排序功能
* 0.1.4 加入windows支持。用go重写了本地应用程序，这样就不需要windows用户自己去安装其他软件了，只要安装插件再点两次鼠标就行了。
* 0.1.3 sidebar数据存储到local storage，加快sidebar加载速度，加入sidebar重载功能，修改rdfloaded标志功能
* 0.1.2 修复下拉列表多选框状态错误，修改只在第一次/遇到错误才打开用户说明页面，不用每次都打开
* 0.1.1 更新安装指南，改用initscrapbookq.py
* 0.1.0 第一个基本功能版本，发布时因为mozilla报警，临时删除了init.sh，安装指南文档没有及时更新，还是用init.sh

## FAQ.zh-CN

**Q:  为什么侧边栏里有些文件没有图标？**

在侧边栏点击鼠标右键，在右键菜单里点"重新载入侧边栏"即可。

## About Author.en

The author is a newbee in Javascript programming. He even can not write a correct JS Promise, also have no idear about some .then() things. It is very helpful if someone have some professional advices about ScrapbookQ project.

## FAQ.en

**Q: What is ScrapbookQ?**

This is a big problem. ScrapbookQ does the same thing as a firefox extension named ScrapBook does. Please google "ScrapBook firefox extension".

**Q: Can I use ScrapbookQ on windows?**

Version 0.1.4 Now support both Windows and Linux.
Current version only support Linux and Python3, next version will do somework to support windows.

**Q: How to get ScrapbookQ?**

Press on [ScrapbookQ](https://addons.mozilla.org/firefox/addon/scrapbookq) can lead to ScrapbookQ, and then click "Add this extension to firefox" blue button in the website.

**Q: Why those pages have no icons in sidebar?**

Please move mouse onto sidebar and press "reload sidebar" menu item in right click menu.

**Q: Why no Mac OS X version here?**

Mac OS X users can use this extension as linux users do.
This has not been test because I have no Mac OS X device.

**Q: How to help improve this project?**

Fork this project and improve it, or develop a new extension better than ScrapbookQ. This is a trivial little thing for almost all JavaScript programmers.

**Q: How to help the author?**

Stars for this project on [github](https://github.com/tahama/scrapbookq) and [Firefox](https://addons.mozilla.org/firefox/addon/scrapbookq) is good enough. And if you're a millionaire, just do what you like and familiar.
