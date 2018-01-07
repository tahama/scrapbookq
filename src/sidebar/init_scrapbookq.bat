 reg delete "HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\scrapbookqmsg" /f 
 reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\scrapbookqmsg" /f
 reg add    "HKEY_CURRENT_USER\Software\Mozilla\NativeMessagingHosts\scrapbookqmsg" /d %cd%\scrapbookqmsg.json  /f 
 reg add    "HKEY_LOCAL_MACHINE\SOFTWARE\Mozilla\NativeMessagingHosts\scrapbookqmsg" /d %cd%\scrapbookqmsg.json  /f
