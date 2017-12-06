#!/usr/bin/env python3
import os
from configparser import ConfigParser
import shutil
import stat
import json

userdir = os.path.expanduser("~")
cwd_scrapbookq = os.getcwd()

if os.path.isfile("scrapbookqmsg.py"):
    os.chmod("scrapbookqmsg.py", stat.S_IXOTH | stat.S_IROTH | stat.S_IXGRP | stat.S_IRGRP | stat.S_IRWXU)

if os.path.isfile("scrapbookq.conf"):
    cfg = ConfigParser()
    cfg.read("scrapbookq.conf")
    cfg.set("rdfs", "rdfspath", cwd_scrapbookq + "/;")
    cfg.write(open("scrapbookq.conf", "w"))

def movefiles ():
    if os.path.exists(userdir + "/.mozilla"):
        if os.path.exists(userdir + "/.mozilla/native-messaging-hosts"):
            if os.path.exists(userdir + "/.mozilla/native-messaging-hosts/scrapbookqmsg.json"):
                print("File Exist: " + userdir + "/.mozilla/native-messaging-hosts/scrapbookqmsg.json")
            else:
                shutil.move("native-messaging-hosts/scrapbookqmsg.json", userdir + "/.mozilla/native-messaging-hosts/")
        else:
            shutil.move("native-messaging-hosts", userdir + "/.mozilla/") 
            
if os.path.isfile("native-messaging-hosts/scrapbookqmsg.json"):
    with open("native-messaging-hosts/scrapbookqmsg.json", "r") as ifs:
        data = json.load(ifs)
    with open("native-messaging-hosts/scrapbookqmsg.json", "w") as ofs:
        data["path"] = os.getcwd() + "/scrapbookqmsg.py"
        json.dump(data, ofs, ensure_ascii=False)
        movefiles ()
print("Everythin is OK, Welcome to ScrapbookQ.")


