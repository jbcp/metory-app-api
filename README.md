# metory-app-api

METORY - The real-world feasibility of a blockchain-based dynamic consent platform 



### Installation 

환경 

```
nodejs - v14.18.0
npm - v6.14.15
```



라이브러리 패키지 설치

```
npm install 
```



설정파일 

```bash
#Database 설정, DApp 접속 주소 변경
경로: /config/config.json

{
  "development": {
    "username": "UserName",
    "password": "Password",
    "database": "Database", 
    "host": "Host",  
    "dialect": "mysql",
    "operatorsAliases": false
  },
  "dapp": {
    "ip": "DApp IP" 
  }
}


#연구자용, 대상자용 접속 사이트 주소 설정 
경로: /routes/info.js

```

실행
```
npm start
```



## Acknowledgement

*This research was supported by a grant from the Korea Health Technology R&D Project through the Korea Health Industry Development Institute (KHIDI), funded by the Ministry of  Health & Welfare, Republic of Korea (Grant Number: HI19C0332).*

---

Copyright©2021, All Rights Reserved by Center for Clinical Pharmacology and Biomedical Research Institute, Jeonbuk National University Hospital, Jeonju, Republic of Korea,  Clinical Trial Center, Seoul National University Hospital, Seoul, Republic of Korea

