 reg delete "HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\scrapbookqmsg" /f 

 reg add    "HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\scrapbookqmsg" /d %cd%\scrapbookqmsg.json  /f 

