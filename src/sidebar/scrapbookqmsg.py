#!/usr/bin/env python3
from html.parser import HTMLParser
import urllib.request
import sys
import os
import shutil
import base64
import json
import struct
import socketserver
import threading
import time
from configparser import ConfigParser
from http.server import HTTPServer as BaseHTTPServer, SimpleHTTPRequestHandler


# 定义HTML解析器


class parseLinks(HTMLParser):
    imgList = set()
    cssList = set()
    imgDict = {}
    scriptContent = "\n<script>\n"
    #fwb64 = open("b64-to-blob.js", "r")
    #scriptContent += fwb64.read()
    scriptContent += "</script><script>\n"
    scriptContent += "var imgList = new Array();\n"

    def handle_starttag(self, tag, attrs):
        if tag == "link":
            for name, value in attrs:
                if name == "href":
                    parseLinks.cssList.add(value)
        if tag == "img":
            for name, value in attrs:
                if name == "src":
                    # print(tag)
                    parseLinks.imgList.add(value)
                    # print(self.get_starttag_text())


def getScrapbookqPage(id):
    # 创建HTML解析器的实例
    lParser = parseLinks()
    # 打开HTML文件
    file_schema = "file://"
    scrapbookq_path = "/home/joey/Downloads/scrapbookq/"
    scrapbookq_id = id
    fullpath = scrapbookq_path + "data/" + scrapbookq_id + "/"
    with urllib.request.urlopen(file_schema + fullpath + "index.html") as url:
        s = url.read()
        # print(s.decode('utf-8'))
        lParser.feed(s.decode('utf-8'))
        for x in parseLinks.imgList:
            if os.path.isfile(fullpath + x):
                #print(fullpath+x + " : " + str(os.path.isfile(fullpath+x)))
                fileextname = os.path.splitext(x)[1][1:]
                filepurename = os.path.splitext(x)[0]
                fr = open(fullpath + x, "rb")
                parseLinks.imgDict["b64data" + filepurename.replace(
                    "-", "") + fileextname] = base64.b64encode(fr.read()).decode()
                #createURL = "var " + "b64src" + filepurename + fileextname + " = window.URL.createObjectURL(b64toBlob(\"" + parseLinks.imgDict["b64data" + filepurename + fileextname] + "\", " + "\"image/" + fileextname + "\"))"
                createURL = "var " + "b64src" + filepurename.replace("-", "") + fileextname + " = window.URL.createObjectURL(b64toBlob(\"" + \
                    parseLinks.imgDict["b64data" + filepurename.replace(
                        "-", "") + fileextname] + "\", " + "\"image/" + fileextname + "\"));\n"
                parseLinks.scriptContent += createURL
                parseLinks.scriptContent += "imgList.push({name: \"" + x + "\", url: " + \
                    "b64src" + \
                    filepurename.replace("-", "") + fileextname + "});\n"
                fr.close()
        parseLinks.scriptContent += "for (let imgs = 0; imgs < document.images.length; imgs++) {\n"
        parseLinks.scriptContent += "console.log(document.images[imgs].src);\n"
        parseLinks.scriptContent += "for (let imgls = 0; imgls < imgList.length; imgls++) {\n"
        parseLinks.scriptContent += "if (document.images[imgs].src.slice(document.images[imgs].src.lastIndexOf(\"/\")+1) == imgList[imgls].name) {\n"
        parseLinks.scriptContent += "console.log(imgList[imgls].url);\n"
        parseLinks.scriptContent += "document.images[imgs].src = imgList[imgls].url;}}\n"
        parseLinks.scriptContent += "}\n"
        parseLinks.scriptContent += "</script>\n"
        bodyindex = str(s.decode("utf8")).index("</body>")
        print(bodyindex)

        ss = s.decode("utf8")[0:bodyindex]
        ss += parseLinks.scriptContent
        ss += "<style>\n"
        for x in parseLinks.cssList:
            if os.path.isfile(fullpath + x):
                ss += open(fullpath + x).read()
                ss += "\n"
        ss += "</style>\n"
        ss += s.decode("utf8")[bodyindex:]
        lParser.close()
        return ss


def getMessage():
    rawLength = sys.stdin.buffer.read(4)
    if len(rawLength) == 0:
        sys.exit(0)
    messageLength = struct.unpack('@I', rawLength)[0]
    message = sys.stdin.buffer.read(messageLength).decode('utf-8')
    return json.loads(message)

    # Encode a message for transmission,
    # given its content.


def encodeMessage(messageContent):
    encodedContent = json.dumps(messageContent).encode('utf-8')
    encodedLength = struct.pack('@I', len(encodedContent))
    print(encodedLength)
    return {'length': encodedLength, 'content': encodedContent}

    # Send an encoded message to stdout


def sendMessage(encodedMessage):
    sys.stdout.buffer.write(encodedMessage['length'])
    sys.stdout.buffer.write(encodedMessage['content'])
    sys.stdout.buffer.flush()


def postMessage(scrapbookqId):
    scrapbookhtml = getScrapbookqPage(scrapbookqId)

    msgLimit = 150000
    if len(scrapbookhtml) / msgLimit - int(len(scrapbookhtml) / msgLimit) > 0:
        msgCon = int(len(scrapbookhtml) / msgLimit) + 1
    else:
        msgCon = len(scrapbookhtml) / msgLimit
    msgNum = msgCon
    print(str(msgNum) + " : " + str(len(scrapbookhtml)))
    idx0 = 0
    idx1 = 0
    loopnum = 1
    #"POST:2017:1-7:msg"
    while msgNum > 0:
        idx1 = msgLimit * loopnum
        # print(scrapbookhtml[idx0:idx1])
        #msgContent = "POST:" + scrapbookqId + ":" + str(loopnum) + "-" + str(msgCon) + ":" + str(idx0) + " : " + str(idx1)
        msgContent = "POST:" + scrapbookqId + ":" + \
            str(loopnum) + "-" + str(msgCon) + ":" + scrapbookhtml[idx0:idx1]
        # print(msgContent.encode())
        sendMessage(encodeMessage(msgContent))
        loopnum += 1
        idx0 = idx1
        msgNum -= 1


def postMessage2(scrapbookqId):
    fr = open("/home/joey/test-image.html", "r+")
    scrapbookhtml = fr.read()
    fr.close()

    msgLimit = 150000
    if len(scrapbookhtml) / msgLimit - int(len(scrapbookhtml) / msgLimit) > 0:
        msgCon = int(len(scrapbookhtml) / msgLimit) + 1
    else:
        msgCon = len(scrapbookhtml) / msgLimit
    msgNum = msgCon
    print(str(msgNum) + " : " + str(len(scrapbookhtml)))
    idx0 = 0
    idx1 = 0
    loopnum = 1
    #"POST:2017:1-7:msg"
    while msgNum > 0:
        idx1 = msgLimit * loopnum
        # print(scrapbookhtml[idx0:idx1])
        #msgContent = "POST:" + scrapbookqId + ":" + str(loopnum) + "-" + str(msgCon) + ":" + str(idx0) + " : " + str(idx1)
        msgContent = "POST:" + scrapbookqId + ":" + \
            str(loopnum) + "-" + str(msgCon) + ":" + scrapbookhtml[idx0:idx1]
        # print(msgContent.encode())
        sendMessage(encodeMessage(msgContent))
        loopnum += 1
        idx0 = idx1
        msgNum -= 1

class MyHTTPHandler(SimpleHTTPRequestHandler):
    """This handler uses server.base_path instead of always using os.getcwd()"""
    def translate_path(self, path):
        path = SimpleHTTPRequestHandler.translate_path(self, path)
        relpath = os.path.relpath(path, os.getcwd())
        fullpath = os.path.join(self.server.base_path, relpath)
        return fullpath
    def do_GET(self):
        SimpleHTTPRequestHandler.do_GET(self)
    def do_POST(self):
        SimpleHTTPRequestHandler.do_POST(self)
    def do_HEAD(self):
        #self.send_header('Content-type','text/xml')
        SimpleHTTPRequestHandler.do_HEAD(self)
        #response.setContentType("text/xml;charset=utf-8");


class MyHTTPServer(BaseHTTPServer):
    """The main server, you pass in base_path which is the path you want to serve requests from"""
    def __init__(self, base_path, server_address, RequestHandlerClass=MyHTTPHandler):
        self.base_path = base_path
        BaseHTTPServer.__init__(self, server_address, RequestHandlerClass)

def startServer(httpd):
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.shutdown()
    pass
    httpd.server_close()

#"scrapbookq/2017;scrapbook/2011;"
def deleteFiles(files):
    delfiles = files.split(";")
    #删除末尾;分割出来的空串
    del delfiles[len(delfiles)-1]
    for i in range(len(delfiles)):
        if delfiles[i].split("/")[0] == "scrapbook":
            delfiles[i] = "ScrapBook/" + delfiles[i].split("/")[1]
        folderdir = folderspath[delfiles[i].split("/")[0]] + "data/" + delfiles[i].split("/")[1]
        if os.path.isdir(folderdir):
            shutil.rmtree(folderdir)

folderspath = {}
scrpbookq_httpds = {}
scrpbookq_httpds_threads = {}
cfg=ConfigParser()
cfg.read("scrapbookq.conf")
rdfspath = cfg.get("rdfs", "rdfspath").split(";")
#删除尾部的空串
del rdfspath[len(rdfspath)-1]
serverType = cfg.get("server", "serverport")
serverPort = cfg.getint("server", "serverport")
#filepath = os.path.expanduser(os.getenv('USERPROFILE'))+'\\Documents\\myfile.txt'
folders = ""
ports = ""
openmanual = cfg.get("rdfs", "openmanual")
#TEST:scrapbookq.rdf:scrapbookq.html:scrapbookq.rdf  TEST:1:1:0
scrapbookqrdf = "0"
scrapbookqhtml = "0"
scrapbookrdf = "0"
serverstatus = "0"
for path in rdfspath:
    if path.split("/")[-2] == "scrapbookq":
        folderspath["scrapbookq"] = path
        if os.path.exists(path+"scrapbookq.rdf") and os.path.isfile(path+"scrapbookq.rdf"):
            scrapbookqrdf = "1"
        if os.path.exists(path+"scrapbookq.html") and os.path.isfile(path+"scrapbookq.html"):
            scrapbookqhtml = "1" 
    if path.split("/")[-2] == "ScrapBook":
        folderspath["ScrapBook"] = path
        if os.path.exists(path+"scrapbook.rdf") and os.path.isfile(path+"scrapbook.rdf"):
            scrapbookrdf = "1"
time.sleep(1)            
print("TEST:" + scrapbookqrdf + ":" + scrapbookqhtml +  ":" + scrapbookrdf)

while True:
    receivedMessage = getMessage()
    if receivedMessage == "TESTSERVER":
        sendMessage(encodeMessage("TEST:" + scrapbookqrdf + ":" + scrapbookqhtml +  ":" + scrapbookrdf + ":" + serverstatus))
    if receivedMessage[:7] == "DELETE:":
        deleteFiles(receivedMessage[7:])
        sendMessage(encodeMessage("DELETED:" + receivedMessage[7:]))
    if receivedMessage == "rdfloaded:1":
        cfg.set("rdfs", "rdfloaded", "1")
        cfg.write(open("scrapbookq.conf", "w"))
    if receivedMessage == "CLOSESERVER":
        for path in rdfspath:
            scrpbookq_httpds[path].shutdown()
        serverstatus = "0"
        sendMessage(encodeMessage("CLOSESERVER DONE"))
    if receivedMessage == "STARTERVER": 
        for path in rdfspath:
            #server_address = ('', serverPort)
            scrpbookq_httpds[path] = MyHTTPServer(path, ("", serverPort))
            scrpbookq_httpds_threads[path] = threading.Thread(target=startServer, args=(scrpbookq_httpds[path],))
            scrpbookq_httpds_threads[path].start()
            time.sleep(1)
            folders += path.split("/")[-2] + ";"
            ports += str(serverPort) + ";"
            serverPort += 1
        serverstatus = "1"
        sendMessage(encodeMessage("STARTSERVER OK serverstatus:" + serverstatus))
        sendMessage(encodeMessage("SERVERS:" + folders + ":" + ports + ":" + str(cfg.getint("rdfs", "rdfloaded"))))
    #if receivedMessage.startswith("GET:"): 
        #scrapbookqId = "20171127195340"
        # postMessage2(scrapbookqId)
 