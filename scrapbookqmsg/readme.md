# build and compress
## linux
go build -ldflags "-s -w" Projects/goProjects/scrapbookqmsg/scrapbookqmsg.go 
upx -9 scrapbookqmsg

## windows

go build -ldflags "-s -w" scrapbookqmsg.go
upx -9 scrapbookqmsg.exe

# 需要解决的问题

* 获取操作系统信息
* 获取路径分割符 **已经解决**
* 获取用户主目录 **已经解决**
* 获取当前工作目录 **已经解决**
* 改变当前工作目录 **已经解决**
* 文件是否存在 **已经解决**
* 文件夹是否存在 **已经解决**
* 修改文件 scrapbookq.conf **已经解决**
* 修改文件 native-messaging-hosts/scrapbookqmsg.json **已经解决**
* 读取conf配置信息: **已经解决**
* 写入文件 **已经解决**
* 移动文件夹 **已经解决**
* 启动服务器 **已经解决**
* 关闭服务器 **已经解决**
* 处理消息 **已经解决**
