package main
import (
	"fmt"
	"os"
	"strings"
	"io/ioutil"
	"encoding/json"
//	"log"
	"io"
	"bufio"
	"net/http"
	"time"
//	"strconv"
	"regexp"
)

var config map[string]interface{}
func main() {
	if len(os.Args) == 2 && os.Args[1] == "init" {
		initScrapbookq ()
		return
	}	

	currentwd, err := os.Getwd()
	if err != nil {
		fmt.Println(err.Error())
	}
	//homeDir := os.ExpandEnv("$HOME")
	//ostype := "linux"
	pathSep := '/'
	if os.IsPathSeparator('\\') {
		//ostype = "windows"
		pathSep = '\\'
	}

	if IsFile("scrapbookq.conf"){
	config = readConfig("scrapbookq.conf")
	//config["rdfloaded"] = 1
	//config["serverport"] = 33338
	//config["rdfpath"] = /home/Doc/Documents/firefox/ScrapBook/
	}
	//if s, err := strconv.Atoi(v); err == nil 
	cwd := fmt.Sprintf("%s%c", currentwd, pathSep)
	//http.Handle("/", http.FileServer(http.Dir( fmt.Sprintf("%s%c", currentwd, pathSep)))) 
	http.Handle("/scrapbookq/", http.StripPrefix("/scrapbookq/", http.FileServer(http.Dir(cwd))))
	scrapbookdir := config["rdfpath"].(string)

	serverState := "0"
    s := &http.Server{
        Addr:           fmt.Sprintf("%c%s", ':', config["serverport"]),
        Handler:        nil,
        ReadTimeout:    10 * time.Second,
        WriteTimeout:   10 * time.Second,
        MaxHeaderBytes: 1 << 20,
	}	
	m := Message{"0", "0", "0", "0", "0"}
	m.Rdfloaded = config["rdfloaded"].(string)
	m.Serverport = config["serverport"].(string) 	
	m.Downloadjs = config["downloadjs"].(string) 
	if IsDir(scrapbookdir) {
		http.Handle("/scrapbook/", http.StripPrefix("/scrapbook/", http.FileServer(http.Dir(scrapbookdir))))
		m.Scrapbook = "1"
	} else {
		m.Scrapbook = "0"
	}

    //var msg Message
    //json.Unmarshal(b,&msg)//将序列化的byte[]重写反序列化为对象。
	//b, _ := json.Marshal(m)//将json对象序列化为byte[]
	//sendMsgString(string(b))

	//test local
	if len(os.Args) == 2 && os.Args[1] == "start" {
		if serverState == "0" {
		go func() {
			s.ListenAndServe()
		}()
		serverState = "1"
		fmt.Println(fmt.Sprintf("STARTSERVER OK:%s", serverState))
		}
		m.Serverstate = serverState
		//b, _ := json.Marshal(m)//将json对象序列化为byte[]
		fmt.Println(m)
	}

	var msg []byte
	for {
	msg = getMsg()

		if string(msg[0:11]) == "DOWNLOADOK:" {
			time.Sleep(time.Duration(2)*time.Second)
			rmurlmsg := RmURL(string(msg[11:]))
			sendMsgString(fmt.Sprintf("DOWNLOADOK: %s errorMsg: %s", string(msg[11:]), rmurlmsg))
		}
		
		if string(msg) == "TESTSERVER" {
			//"TEST:0" 
			sendMsgString(fmt.Sprintf("TEST:%s", serverState))
		}
		
		if string(msg) == "STARTSERVER" {
			if serverState == "0" {
				go func() {
					err = s.ListenAndServe()					
				}()
				serverState = "1"
			}
			m.Serverstate = serverState
			b, _ := json.Marshal(m)//将json对象序列化为byte[]
			time.Sleep(time.Duration(2)*time.Second)
			sendMsgBytes(b)
		}
		
		if string(msg) == "CLOSESERVER" {
			if serverState == "1" {
				s.Shutdown(nil)
				serverState = "0"
				sendMsgString("CLOSESERVER OK")
			} else {
				sendMsgString("CLOSESERVER ALREAD")
			}			
		}
		
		if string(msg) == "rdfloaded:1" {
			config["rdfloaded"] = "1"
			writeConfig("scrapbookq.conf", config)
			sendMsgString(config["rdfloaded"].(string))
		}
		
		if string(msg[0:7]) == "DELETE:" {
			d, ud := deleteFiles(string(msg[7:]))
			sendMsgString(fmt.Sprintf("Deleted: %s Undeleted: %s", d, ud))
		}
	} 

}

type Message struct {
    Scrapbook string
	Rdfloaded string
	Serverport string
	Serverstate string
	Downloadjs string
}


func getMsg () []byte{
	inputReader := bufio.NewReader(os.Stdin)	
		s, _ := inputReader.Peek(4)
		//n := 0   
		for {
		s, _  = inputReader.Peek(4)
		if s[0] > 0 {
			inputReader.Discard(4)
			b := make([]byte, s[0])
			_, _ = inputReader.Read(b)
			return b[1:len(b)-1]
		}
	}
}
	
func sendMsgBytes (arr []byte) {
	var l []byte
	l = []byte{byte((len(arr)>>0)&0xFF), byte((len(arr)>>8)&0xFF), byte((len(arr)>>16)&0xFF), byte((len(arr)>>32)&0xFF)}
	//fmt.Println("s:", []byte(s), "a:", a, " arr:", arr, " len(arr): ", len(arr)>>8, " cap(arr): ", cap(arr), " l: ", l)
	os.Stdout.Write(l);
	os.Stdout.Write(arr);
}

//sendMsg("hello") : hello
func sendMsgString (msg string) {
	var arr []byte
	arr = make([]byte, len(msg)+2)
	arr[0] = '"'
	copy(arr[1:len(arr)-1], []byte(msg))
	arr[len(msg)+1] = '"'
	var l []byte
	l = []byte{byte((len(arr)>>0)&0xFF), byte((len(arr)>>8)&0xFF), byte((len(arr)>>16)&0xFF), byte((len(arr)>>32)&0xFF)}
	//fmt.Println("s:", []byte(s), "a:", a, " arr:", arr, " len(arr): ", len(arr)>>8, " cap(arr): ", cap(arr), " l: ", l)
	os.Stdout.Write(l);
	os.Stdout.Write(arr);
}	


func initScrapbookq () {
	currentdw, err := os.Getwd()
	if err != nil {
		fmt.Println(err.Error())
	}
	homeDir := os.ExpandEnv("$HOME")
	ostype := "linux"
	pathSep := '/'
	if os.IsPathSeparator('\\') {
		ostype = "windows"
		pathSep = '\\'
	}
	
	//jsonPath := "me/native-messaging-hosts/scrapbookqmsg.json"
	//jsonDir := "me/native-messaging-hosts"
	//jsonConfigPath := "/home/joey/.mozilla/native-messaging-hosts/scrapbookqmsg.json"
	//jsonConfigDir := "/home/joey/.mozilla/native-messaging-hosts"

	jsonPath := fmt.Sprintf("%s%c%s%c%s", currentdw, pathSep, "native-messaging-hosts", pathSep, "scrapbookqmsg.json")
	jsonDir := fmt.Sprintf("%s%c%s", currentdw, pathSep, "native-messaging-hosts")
	jsonConfigPath := fmt.Sprintf("%s%c%s", homeDir, pathSep, ".mozilla/native-messaging-hosts/scrapbookqmsg.json")
	jsonConfigDir := fmt.Sprintf("%s%c%s", homeDir, pathSep, ".mozilla/native-messaging-hosts")
	nativeAppPath := fmt.Sprintf("%s%c%s", currentdw, pathSep, "scrapbookqmsg")
	if ostype == "windows" {
		jsonConfigPath = fmt.Sprintf("%s%c%s", homeDir, pathSep, "./mozilla/native-messaging-hosts/scrapbookqmsg.json")
		jsonConfigDir = fmt.Sprintf("%s%c%s", homeDir, pathSep, "./mozilla/native-messaging-hosts")
	}

	myjsonMap, err := readJsonFile(jsonPath)
    if err != nil {
        fmt.Println("readJsonFile: ", err.Error())
    }
	//fmt.Println(myjsonMap)
	myjsonMap["path"] = nativeAppPath
	//fmt.Println(myjsonMap)
	writeJsonFile(jsonPath, myjsonMap)

	jsonexist, _ := PathExists(jsonConfigDir)
	if jsonexist == false {
		fmt.Println("not exist")
		err := os.Rename(jsonDir, jsonConfigDir)
		if err != nil {
			fmt.Println(err)
			return
		}
	} else {
		fmt.Println("Exist")
		err := os.Rename(jsonPath, jsonConfigPath)
		if err != nil {
			fmt.Println(err)
			return
		}
	}

	/*
	var config map[string]interface{}
	if IsFile("scrapbookq.conf"){
	config = readConfig("scrapbookq.conf")
	//config["rdfloaded"] = 1
	//config["serverport"] = 33338
	config["rdfpath"] = fmt.Sprintf("%s%c", currentdw, pathSep)
	//fmt.Println(config)
	writeConfig("scrapbookq.conf", config)
	}
	*/
	fmt.Println("ScrapbookQ is OK, Bye.")
}

var myjson map[string]interface{}


func writeJsonFile(filename string, jsonBody map[string]interface{}) {
	f, err := os.OpenFile(filename, os.O_WRONLY|os.O_TRUNC, 0600)
	defer f.Close()
	if err != nil {
		fmt.Println("Open json file error")
		return
	}

	b, err := json.Marshal(jsonBody)
	if err != nil {
		fmt.Println("json.Marshal error:", err)
	}
	f.Write(b)	
}

func readJsonFile(filename string) (map[string]interface{}, error) {
    bytes, err := ioutil.ReadFile(filename)
    if err != nil {
        fmt.Println("readJsonFile: ", err.Error())
        return nil, err
    }

    if err := json.Unmarshal(bytes, &myjson); err != nil {
        fmt.Println("Unmarshal: ", err.Error())
        return nil, err
    }

    return myjson, nil
}

func IsDir(name string) bool {
    fi, err := os.Stat(name)
    if err != nil {
        //fmt.Println("IsDir Error: ", err)
        return false
    }

    return fi.IsDir()
}

func CreateDir(name string) bool {
    if IsDir(name) {
        fmt.Printf("%s is already a directory.\n", name)
        return true
    }

    if createDirImpl(name) {
        fmt.Println("Create directory successfully.")
        return true
    } else {
        return false
    }
}

func createDirImpl(name string) bool {
    err := os.MkdirAll(name, 0755)
    if err == nil {
        return true
    } else {
        fmt.Println("Error: ", err)
        return false
    }
}

func IsFile(file string) bool {
    f, e := os.Stat(file)
    if e != nil {
        return false
    }
    return !f.IsDir()
}

func PathExists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

func writeConfig(filename string, config map[string]interface{}) {
	f, err := os.OpenFile(filename, os.O_WRONLY|os.O_TRUNC, 0600)
	defer f.Close()
	if err != nil {
		fmt.Println("Open file error")
		return
	}

for k, v := range config {
	//fmt.Println(k, v)
	num, err := f.WriteString(k + "=" + v.(string) + "\n")
	if err != nil {
		fmt.Printf("Write file error %d", num)
	}
	/*
	if k == "rdfspath" {
		num, err := f.WriteString(k + "=" + v.(string) + "\n")
		if err != nil {
			fmt.Printf("Write file error %d", num)
		}

	} else {
	num, err := f.WriteString(k + "=" + fmt.Sprintf("%d", v.(int)) + "\n")
	if err != nil {
		fmt.Printf("Write file error %d", num)
	}
	}
	**/
}
}

func readConfig(filename string) map[string]interface{}{
var per map[string]interface{}
//实例化这个map
per = make(map[string]interface{})
//打开这个ini文件
f, err := os.OpenFile(filename, os.O_RDONLY, 0600)
if err != nil {
	fmt.Println("Open file error")
	return per
}
defer f.Close()
//读取文件到buffer里边
buf := bufio.NewReader(f)
for {
//按照换行读取每一行
l, err := buf.ReadString('\n')
//相当于PHP的trim
line := strings.TrimSpace(l)
//判断退出循环
if err != nil {
if err != io.EOF {
//return err
panic(err)
}
if len(line) == 0 {
break
}
}
switch {
case len(line) == 0:
//匹配[db]然后存储
case line[0] == '[' && line[len(line)-1] == ']':
section := strings.TrimSpace(line[1 : len(line)-1])
fmt.Println(section)
default:
//downloadjs=1 这种的可以匹配存储
i := strings.IndexAny(line, "=")
per[strings.TrimSpace(line[0:i])] = strings.TrimSpace(line[i+1:])

}
}	
return per
}


func deleteFiles (files string) (string, string){
    currentwd, err := os.Getwd()
	if err != nil {
		fmt.Println(err.Error())
    }
    pathSep := '/'
	if os.IsPathSeparator('\\') {
		//ostype = "windows"
		pathSep = '\\'
	}
    cwd := fmt.Sprintf("%s%c", currentwd, pathSep)
	//rdfpath := "/home/Doc/Documents/firefox/ScrapBook/"
	rdfpath := config["rdfpath"].(string)
	sp := strings.Split(files, ";")
	sp = append(sp[:len(sp)-1])
    var delfilepath string
	var deletedFiles string
	var undeletedFiles string
    for _,v := range sp {
        x := strings.Split(v, "/")
        if x[0] == "scrapbookq" {
            delfilepath = fmt.Sprintf("%s%s%c%s",cwd, "data", pathSep, x[1])
        }
        if x[0] == "scrapbook" {
            delfilepath = fmt.Sprintf("%s%s%c%s", rdfpath, "data", pathSep, x[1])
        }
        delTarget, _ := PathExists(delfilepath)
        if delTarget == false {
            undeletedFiles = fmt.Sprintf("%s%s;", deletedFiles, x[1])
        } else {
			//do some delete thing
			err = os.RemoveAll(delfilepath)
			if err == nil {
				deletedFiles = fmt.Sprintf("%s%s;", deletedFiles, x[1])
			} else {
				undeletedFiles = fmt.Sprintf("%s%s;", deletedFiles, x[1])
			}
        }
	}
	return deletedFiles, undeletedFiles
}

func RmURL(files string) (errstring string){
	var indexfilepath string
	//var errstring string
	currentwd, err := os.Getwd()
	if err != nil {
		errstring =  err.Error()
		return
    }
    pathSep := '/'
	if os.IsPathSeparator('\\') {
		//ostype = "windows"
		pathSep = '\\'
	}
    cwd := fmt.Sprintf("%s%c", currentwd, pathSep)
	//rdfpath := "/home/Doc/Documents/firefox/ScrapBook/"
	rdfpath := config["rdfpath"].(string)
	x := strings.Split(files, "/")

    if x[0] == "scrapbookq" {
        indexfilepath = fmt.Sprintf("%s%s%c%s%c%s",cwd, "data", pathSep, x[1], pathSep, "index.html")
    }
    if x[0] == "scrapbook" {
        indexfilepath = fmt.Sprintf("%s%s%c%s%c%s", rdfpath, "data", pathSep, x[1], pathSep, "index.html")
    }
    indexfileTarget, _ := PathExists(indexfilepath)
    if indexfileTarget == false {
		errstring = fmt.Sprintf("%s index.html does not exit.", indexfilepath) 
		return
    } else {
		fis, err := os.Open(indexfilepath)
		if err != nil {
			//errMsg := fmt.Errorf("%v", err)
			errstring = fmt.Sprintf("Open file error: %s", indexfilepath) 
			return
		}
		time.Sleep(time.Duration(5)*time.Second)
		buff, _ := ioutil.ReadAll(fis)
		html := string(buff)		
		var myExpLTGTOneLine = regexp.MustCompile(`(?i)(?P<first><[^<>]*)\n(?P<second>[^<>]*>)`)
		//ltgts := myExpLTGTOneLine.FindAllStringSubmatch(html, -1)
		html = myExpLTGTOneLine.ReplaceAllString(html, "$first$second")
	
		if config["downloadjs"].(string) == "1" {
			var myExpJSsrc = regexp.MustCompile(`(?i)<script(?P<first>.*?)src=[\"\']{1}[^\"\']*/(?P<second>[^\"\'\?]*?)(\?.*?)*[\"\']{1}(?P<third>.*?)>`)
			//jss := myExpJSsrc.FindAllStringSubmatch(html, -1)
			html = myExpJSsrc.ReplaceAllString(html, "<scrapbookqscript$first src=\"" + "$second" + "\"$third>")
		}
		

		var myExpCSSsrc = regexp.MustCompile(`(?i)<link(?P<first>.*?rel=[\"\']{1}stylesheet\".*?)href=[\"\']{1}[^\"\']*/(?P<second>[^\"\'\?]*?)(\?.*?)*[\"\']{1}(?P<third>.*?)>`)
		//if !myExpCSSsrc.MatchString(html) {
		var myExpCSSsrc2 = regexp.MustCompile(`(?i)<link(?P<first>.*?)href=[\"\']{1}[^\"\']*/(?P<second>[^\"\'\?]*?)(\?.*?)*[\"\']{1}(?P<third>.*?rel=[\"\']{1}stylesheet\".*?)/{0,1}>`)
		//}
		//csss := myExpCSSsrc.FindAllStringSubmatch(html, -1)
		html = myExpCSSsrc.ReplaceAllString(html, "<scrapbookqlink$first href=\"" + "$second" + "\"$third>")
		html = myExpCSSsrc2.ReplaceAllString(html, "<scrapbookqlink$first href=\"" + "$second" + "\"$third>")
	
		var myExpICONsrc = regexp.MustCompile(`(?i)(?P<first><link.*?rel=[\"\']{1}shortcut icon\".*?)href=[\"\']{1}[^\"\']*/(?P<second>[^\"\'\?]*?)(\?.*?)*[\"\']{1}(?P<third>.*?)>`)
		if !myExpICONsrc.MatchString(html) {
			myExpICONsrc = regexp.MustCompile(`(?i)(?P<first><link.*?)href=[\"\']{1}[^\"\']*/(?P<second>[^\"\'\?]*?)(\?.*?)*[\"\']{1}(?P<third>.*?rel=[\"\']{1}shortcut icon\".*?)/{0,1}>`)
		}
		//favicons := myExpICONsrc.FindAllStringSubmatch(html, -1)
		html = myExpICONsrc.ReplaceAllString(html, "$first href=\"" + "$second" + "\"$third>")
		
		var myExpIMGsrc = regexp.MustCompile(`(?i)<img(?P<first>.*?)src=[\"\']{1}[^\"\']*/(?P<second>[^\"\'\?]*?)(\?.*?)*[\"\']{1}(?P<third>.*?)>`)
		//imgs := myExpIMGsrc.FindAllStringSubmatch(html, -1)
		html = myExpIMGsrc.ReplaceAllString(html, "<scrapbookqimg$first src=\"" + "$second" + "\"$third>")
	
		var myExpLTScrapbookq = regexp.MustCompile(`<scrapbookq`)
		//ltscrapbookq := myExpLTScrapbookq.FindAllStringSubmatch(html, -1)
		html = myExpLTScrapbookq.ReplaceAllString(html, "<")
		fis.Close()

		fis, err = os.OpenFile(indexfilepath, os.O_WRONLY|os.O_TRUNC, 0600)
		defer fis.Close()
		if err != nil {
			errstring = fmt.Sprintf("Open index.html error: %s", indexfilepath)
			return
		}
		fis.WriteString(html)
		errstring = fmt.Sprintf("RmURL index.html OK: %s", indexfilepath)
		return
	}	
}
