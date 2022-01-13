//    var actionNameArr = ["", "신청", "예약", "본인확인", "동의서 설명요청", "동의 설명시작", " 동의 설명 종료", "동의서 서명", "동의확인", "동의철회", "탈락", "선정", "신청취소대기", "신청취소", "종료", "동의서 업데이트"];
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const adler32 = require('adler32');
const { Console } = require('console');
const request = require('request');

const crypto = require('crypto');


require('date-utils');

//config 읽기
const dataBuffer = fs.readFileSync(path.join(__dirname,"..","config/config.json"));
const dataJSON = dataBuffer.toString()
var config = JSON.parse(dataJSON);

//개발자용 db정보
config = config.development;
//config = config.development3;
const setting = {
    host: config.host,
    user: config.username,
    password: config.password,
    database: config.database,
    connectionLimit: 4,
    dateStrings: 'date'
}

/*
    mysql 쿼리문에 따른 결과출력

    1. SELECT
    - output[0][0].studyid
    2. INSERT
    - 
    ResultSetHeader {
        fieldCount: 0,
        affectedRows: 1, <---- 적용된 결과값을 나타냄.
        insertId: 140,
        info: '',
        serverStatus: 2,
        warningStatus: 1
    },
*/

// table명_CRUD_내용

//회원가입
async function user_create_join(name, email, pwd, hp, birth, sex){
    let pool = '';
    let connection = '';
    let n_sex = Number(sex);

    try{
        pool = await mysql.createPool(setting);
        var newDate = new Date();
        newDate.setHours(newDate.getHours()+9);
        var today = newDate.toFormat('YYYY-MM-DD');
        connection = await pool.getConnection(async conn => conn)

        //기존 가입된 이메일인지 확인
        let query =`SELECT EXISTS (SELECT * FROM applicant WHERE APPLMAIL=${connection.escape(email)}) AS SUCCESS;`;
        let output = await connection.query(query);
        var result = {};

        if(output[0][0].SUCCESS==0){
            //기존 가입된 이메일이 아니므로 계정 생성
            query = `INSERT INTO applicant(APPLNAME, APPLMAIL, APPLPWD, APPLPHONENUM, APPLBRTHDTC, APPLSEX, APPLDATE)
                        VALUES(${connection.escape(name)}, ${connection.escape(email)}, ${connection.escape(pwd)}, ${connection.escape(hp)}, ${connection.escape(birth)}, ${n_sex}, '${today}');`;
            await connection.query(query);

            //생성된 계정의 APPLID 가져오기
            query = `SELECT LAST_INSERT_ID() AS APPLID;`;
            output = await connection.query(query);
            let applid = Number(output[0][0].APPLID);
        
            //create QRCODE
            let str = `APPLID=${applid} and APPLDATE='${today}';`;
            let str_byte = new Buffer.from(str);
            let qrcode = adler32.sum(str_byte);

            //QRCODE 업데이트
            query = `UPDATE applicant SET QRCODE='${qrcode}' WHERE APPLID=${applid};`
            await connection.query(query);

            result = {
                code: 200,
                rows: 1,
                output: "회원가입이 완료되었습니다."
            }
        }else{
            result = {
                code: 500,
                rows: 0,
                output: "동일 이메일이 존재합니다."
            }
            return result
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }    
}


//회원가입 PASS회원가입 적용
//사용자가입_PASS적용
async function user_create_join_with_pass(body){
    let name = body.name;
    let email = body.email;
    let pwd = body.pwd;
    let hp = body.hp;
    let birth = body.birth;
    let sex = body.sex;
    //pass 값
    let pass_customer_code= body.pass_customer_code
    let pass_result_code= body.pass_result_code
    let pass_result_msg= body.pass_result_msg
    let pass_result_name= body.pass_result_name
    let pass_result_birthday= body.pass_result_birthday
    let pass_result_sex_code= body.pass_result_sex_code
    let pass_result_local_forigner_code= body.pass_result_local_forigner_code
    let pass_di= body.pass_di
    let pass_ci= body.pass_ci
    let pass_ci_update= body.pass_ci_update
    let pass_tel_com_code= body.pass_tel_com_code
    let pass_cellphone_no= body.pass_cellphone_no
    let pass_return_msg= body.pass_return_msg
    let pass_tx_seq_no= body.pass_tx_seq_no


    
    
    //pass값 저장후 생성된 passid
    let passid ='';

    let pool ='';
    let connection ='';
    try{
        pool = await mysql.createPool(setting);
        var newDate = new Date();
        newDate.setHours(newDate.getHours()+9);
        var today = newDate.toFormat('YYYY-MM-DD');
        connection  = await pool.getConnection(async conn => conn)

        //기존 가입된 이메일인지 확인
        let query =`SELECT EXISTS (SELECT * FROM applicant WHERE APPLMAIL = "${email}") AS SUCCESS;`;
        let output = await connection.query(query);

        if(output[0][0].SUCCESS==0){
            //PASS 내용 확인 
            query =`SELECT EXISTS (SELECT * FROM pass WHERE DI = "${pass_di}") AS SUCCESS;`;
            output = await connection.query(query);
            if(output[0][0].SUCCESS==0){
                //PASS정보 저장
            query = `INSERT INTO pass( CUSTOMER_CODE,  RESULT_CODE,  RESULT_MSG,  RESULT_NAME,  RESULT_BIRTHDAY,  RESULT_SEX_CODE, RESULT_LOCAL_FORIGNER_CODE,  DI,  CI,  CI_UPDATE, TEL_COM_CODE, CELLPHONE_NO, RETURN_MSG, TX_SEQ_NO) VALUES('${pass_customer_code}','${pass_result_code}','${pass_result_msg}','${pass_result_name}','${pass_result_birthday}','${pass_result_sex_code}','${pass_result_local_forigner_code}','${pass_di}','${pass_ci}','${pass_ci_update}','${pass_tel_com_code}','${pass_cellphone_no}','${pass_return_msg}','${pass_tx_seq_no}');`;
            // console.log({query_pass:query});
             let output = await connection.query(query);
             
             //저장된 PASSID값 가져오기. 
             query =`SELECT PASSID FROM pass WHERE DI='${pass_di}'`;
             output = await connection.query(query);
             console.log({"out":output[0][0].PASSID});
             passid = output[0][0].PASSID;
                         
 
             //기존 가입된 이메일이 아니므로 계정 생성
             query = `INSERT INTO applicant(APPLNAME, APPLMAIL, APPLPWD, APPLPHONENUM, APPLBRTHDTC, APPLSEX, APPLDATE, PASS, PASSID) VALUES('${name}', '${email}', '${pwd}', '${hp}', '${birth}', ${sex}, '${today}', 1, ${passid});`;
 
          
             console.log({query:query});
 
             output = await connection.query(query);
 
             //생성된 계정의 APPLID 가져오기
             let applid = '';
             query = `SELECT APPLID FROM applicant WHERE APPLNAME= "${name}" AND APPLMAIL= "${email}" AND APPLPWD= "${pwd}" AND APPLPHONENUM= "${hp}" AND APPLBRTHDTC= "${birth}" AND APPLSEX= "${sex}" AND APPLDATE= "${today}"`;
             output = await connection.query(query);
             applid = output[0][0].APPLID;
         
             //create QRCODE - QRCODE 다시 만들어야함.
             let str = `APPLID = "${applid}" and APPLDATE = "${today}";`;
 
             let str_byte = new Buffer(str);
             // let qrcode=String.fromCharCode.apply(String, bytes);
             let qrcode= adler32.sum(str_byte);
 
             //QRCODE 업데이트
             query = `UPDATE applicant SET QRCODE = '${qrcode}' WHERE APPLID = "${applid}";`
             output = await connection.query(query);
 
             var result ={
                 code: 200,
                 rows: 1,
                 output: applid
             }
             return result

            }else{


                var result ={
                    code: 200,
                    rows: 0,
                    output: "이전에 PASS로 인증을 한 사용자 입니다."
                }
                return result;
            }


            
        }else{
            var result ={
                code: 200,
                rows: 0,
                output: "동일 이메일이 존재합니다."
            }
            return result
        }
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            out: err
        }
        return result
    }finally{
        connection.release();
    }    
}



//로그인
async function user_read_login(email, password){
    let pool = '';
    let connection = '';

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn)
		
		var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLMAIL=${connection.escape(email)}) AS SUCCESS`
        var output = await connection.query(query);
        var result = {};
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 이메일 가입정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT * FROM applicant WHERE APPLMAIL=${connection.escape(email)}`;
            output = await connection.query(query);

            if(output[0][0].APPLPWD==password){
                result = {
                    code: 200,
                    rows: output[0].length,
                    output: {
                        "APPLID": output[0][0].APPLID,
                        "APPLNAME": output[0][0].APPLNAME,
                        "APPLMAIL": output[0][0].APPLMAIL,
                        "APPLPHONENUM": output[0][0].APPLPHONENUM,
                        "APPLBRTHDTC": output[0][0].APPLBRTHDTC,
                        "APPLSEX": output[0][0].APPLSEX,
                        "APPLDATE": output[0][0].APPLDATE,
                        "QRCODE": output[0][0].QRCODE
                    }
                }	
            }else{
                result = {
                    code: 500,
                    rows: 0,
                    output: "비밀번호가 맞지 않습니다."
                }
                return result
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }    
}

//QR코드 확인
async function user_read_qrcode(applid){
    let pool = '';
    let connection = '';
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
		
		var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS`
        var output = await connection.query(query);
        var result = {};

		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT QRCODE FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS`
            output = await connection.query(query);
    
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자에 대한 QR코드 정보가 없습니다."
                }
                return result
            }else{
                query = `SELECT QRCODE FROM applicant WHERE APPLID=${connection.escape(n_applid)};`;
                output = await connection.query(query);

                result = {
                    code: 200,
                    rows: output[0].length,
                    output: output[0][0].QRCODE
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}
//QR코드 확인
async function user_read_qrcode_test(){
    let pool = '';
    let connection = '';
    let n_applid = Number(12);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
		
		var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS`
        var output = await connection.query(query);
        var result = {};

            query = `SELECT *  FROM applicant;`;
            output = await connection.query(query);

            result = {
                code: 200,
                rows: output[0].length,
                output: output[0]
            }
        
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//참여이력조회
async function user_read_appl_history(applid){
    let pool = '';
    let connection = '';
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        connection  = await pool.getConnection(async conn => conn);
        
		var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS`
        var output = await connection.query(query);
        var result = {};

		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
                }
                return result
            }else{
                query = `SELECT SA.SAID, SA.APPLDTC, SA.SASTAGE, S.TITLE, S.SITEID, SI.SITENAME, SA.SAACTIVE, SA.SACLOSEDTC FROM study_applicant SA, study S, site SI WHERE S.SITEID=SI.SITEID AND SA.SID=S.SID AND SA.APPLID=${connection.escape(n_applid)} ORDER BY SA.SAID DESC;`;
                output = await connection.query(query);

                result = {
                    code: 200,
                    rows: output[0].length,
                    output: output[0]
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//내정보 보기
async function user_read_appl_detail(applid){
    let pool = '';
    let connection = '';
    let n_applid = Number(applid);
    
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
		
		var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS`
        var output = await connection.query(query);
        var result = {};

		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT APPLID, APPLNAME, APPLMAIL, APPLPHONENUM, APPLBRTHDTC, APPLSEX, QRCODE FROM applicant WHERE APPLID=${connection.escape(n_applid)};`;
            output = await connection.query(query);

            result = {
                code: 200,
                rows: output[0].length,
                output: output[0]
            }
        }
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//내정보 수정 - 패스워드 체크
async function user_read_appl_pwd(applid, subjpwd){
    let pool = '';
    let connection = '';
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
		
		var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS`
        var output = await connection.query(query);
        var result = {};

		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT APPLPWD FROM applicant WHERE APPLID=${connection.escape(n_applid)};`;
            output = await connection.query(query);
            
            if(subjpwd==output[0][0].APPLPWD){
                result = {
                    code: 200,
                    rows: 1,
                    output: "true"
                }
            } else {
                result = {
                    code: 200,
                    rows: 0,
                    output: "false"
                }
            }
        }
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            out: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//내정보 수정 - 수정
async function user_update_appl_detail(applid, applpwd, applsex, applphonenum, applbrthdtc){
    let pool = '';
    let connection = '';
    let n_applid = Number(applid);
    let n_applsex = Number(applsex);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
		
		var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS`
        var output = await connection.query(query);
        var result = {};



		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{

            query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLPWD=${connection.escape(applpwd)}) AS SUCCESS`
            output = await connection.query(query);
            result = {};

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "비밀번호가 맞지 않습니다."
                }
                return result
            }


            query = `UPDATE applicant SET APPLPWD=${connection.escape(applpwd)}, APPLBRTHDTC=${connection.escape(applbrthdtc)}, APPLPHONENUM=${connection.escape(applphonenum)}, APPLSEX=${n_applsex} WHERE APPLID=${connection.escape(n_applid)};`
            await connection.query(query);

                result = {
                code: 200,
                rows: 1,
                output: "SUCCESS"
            };
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//비밀번호 변경
async function user_update_appl_pwd(email, pwd, newpwd){
    let pool = '';
    let connection = '';

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
		var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLMAIL=${connection.escape(email)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};

		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 이메일 가입정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT * FROM applicant WHERE APPLMAIL=${connection.escape(email)};`;
            output = await connection.query(query);
            if(output[0][0].APPLPWD!=pwd){
                 result = {
                    code: 500,
                    rows: 0,
                    output: "비밀번호가 맞지 않습니다."
                }
                return result
            }else{
                query = `UPDATE applicant SET APPLPWD=${connection.escape(newpwd)} WHERE APPLMAIL=${connection.escape(email)};`
                await connection.query(query);

                result = {
                    code: 200,
                    rows: 1,
                    output: "비밀번호가 변경되었습니다."
                }	
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//자원자가 서명한 동의서(한 개) 보기 - 수정 예정
async function user_read_consent(sid, consentid){
    let pool = '';
    let connection = '';
    let n_sid = Number(sid);
    let n_consentid = Number(consentid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        let query = `SELECT SUBJ_SIGNDTC, LAR_SIGNDTC, SUBJ_SIGN, SUBJ_SIGN_NAME, LAR_SIGN, LAR_SIGN_NAME FROM consent_subject WHERE CONSENTID=${connection.escape(n_consentid)};`;
        let output = await connection.query(query);
        
        var result = {
            code: 200,
            rows: output[0].length,
            output: output[0]
        }

        query = `SELECT CDID, CDIDNUM, CDTITLE, CDCONTENT FROM consent_detail WHERE CONSENTID=${connection.escape(n_consentid)} ORDER BY CDIDNUM ASC;`;
        output = await connection.query(query);
        result.output[0].CDID = output[0][0].CDID;
        result.output[0].CDIDNUM = output[0][0].CDIDNUM;
        result.output[0].CDTITLE = output[0][0].CDTITLE;
        result.output[0].CDCONTENT = output[0][0].CDCONTENT;

        query = `SELECT ST.TITLE, S.SITENAME FROM site S, study ST WHERE ST.SITEID=S.SITEID AND ST.SID=${connection.escape(n_sid)};`;
        output = await connection.query(query);
        result.output[0].TITLE = output[0][0].TITLE;
        result.output[0].SITENAME = output[0][0].SITENAME;

        query = `SELECT CFILE, CFILENAME FROM consent WHERE CONSENTID=${connection.escape(n_consentid)};`;
        output = await connection.query(query);
        result.output[0].CFILE = output[0][0].CFILE;
        result.output[0].CFILENAME = output[0][0].CFILENAME;
        result.output[0].TARGETIP = config.host;

        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//Push 알람 수신 여부 저장
async function user_update_pushchk(applid, pushchk){
    let pool = '';
    let connection = '';
    let n_applid = Number(applid);
    let n_pushchk = Number(pushchk);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `UPDATE applicant SET PUSHCHK=${connection.escape(n_pushchk)} WHERE APPLID=${connection.escape(n_applid)};`;
            await connection.query(query);
            
            result = {
                code: 200,
                rows: 1,
                output: "SUCCESS"
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 모집공고 리스트 
async function study_read_all_recruiting(){
    let pool = '';
    let connection = '';
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study WHERE SPUBLISHED=1 AND SACTIVE=1) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};

		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "게시중인 모집공고가 없습니다."
            }
            return result
        }else{
            query = `SELECT S.SID, S.TITLE, S.SAPPL, S.SSEX, S.SNUM, S.STARGET, S.SDATE,  S.SFILE, SI.SITENAME, S.SACTIVE FROM study S, site SI WHERE S.SPUBLISHED=1 AND S.SITEID=SI.SITEID AND SACTIVE=1 ORDER BY S.EMERGENCY DESC, S.SID DESC ;`;
            output = await connection.query(query);

            result = {
                code: 200,
                rows: output[0].length,
                output: output[0]
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 모집공고 보기
async function study_read_detail(sid){
    let pool = '';
    let connection = '';
    let n_sid = Number(sid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
		
		var query = `SELECT EXISTS (SELECT * FROM study WHERE SID=${connection.escape(n_sid)}) AS SUCCESS`
        var output = await connection.query(query);
        var result = {};

		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 연구에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT SID, SPONSORID, PRTNO, TITLE, SAPPL, SSEX, SNUM, STARGET, SDATE, SFILE, SFILENAME, SACTIVE, SPUBLISHED, EMERGENCY, SITEID FROM study WHERE SID=${connection.escape(n_sid)};`;
            output = await connection.query(query);

            result = {
                code: 200,
                rows: output[0].length,
                output: output[0]
            }
            result.output[0].SITEIP = config.host;
		
            query = `SELECT EXISTS (SELECT * FROM study_detail WHERE SDPUBLISHED=1 AND SID=${connection.escape(n_sid)}) AS SUCCESS`
            output = await connection.query(query);
    
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 연구에 대한 상세정보가 없습니다."
                }
                return result
            }else{
                //study detil 추가
                query = `SELECT SDTITLE, SDCONTENT FROM study_detail WHERE SDPUBLISHED=1 AND SID=${connection.escape(n_sid)};`;
                output = await connection.query(query);
                result.output[0].SDTITLE = output[0][0].SDTITLE;
                result.output[0].SDCONTENT = output[0][0].SDCONTENT;
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 모집공고 즐겨찾기 추가
async function study_create_favorite(sid, applid){
    let pool = '';
    let connection = '';
    let n_sid = Number(sid);
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 연구에 대한 정보가 없습니다."
                }
                return result
            }else{
                query = `INSERT INTO favorite(SID, APPLID) VALUES(${connection.escape(n_sid)}, ${connection.escape(n_applid)});`;
                await connection.query(query);

                result = {
                    code: 200,
                    rows: 1,
                    output: "SUCCESS"
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 모집공고 즐겨찾기 삭제
async function study_read_favorite(sid, applid){
    let pool = '';
    let connection = '';
    let n_sid = Number(sid);
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 연구에 대한 정보가 없습니다."
                }
                return result
            }else{
                query = `DELETE FROM favorite WHERE SID=${connection.escape(n_sid)} AND APPLID=${connection.escape(n_applid)};`;
                await connection.query(query);

                result = {
                    code: 200,
                    rows: 1,
                    output: "SUCCESS"
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 자원 - 참여중인 연구 또는 종료된 연구가 있는지
async function study_read_study_applicant(applid, sid){
    let pool = '';
    let connection = '';
    let n_sid = Number(sid);
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 연구에 대한 정보가 없습니다."
                }
                return result
            }else{
                query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE APPLID=${connection.escape(n_applid)} AND SAACTIVE=1) AS SUCCESS;`
                output = await connection.query(query);

                //현재 참여중인 연구가 없는경우
                if(output[0][0].SUCCESS==0){
                    query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE APPLID=${connection.escape(n_applid)} AND SASTAGE=6 AND SID=${connection.escape(n_sid)}) AS SUCCESS;`
                    output = await connection.query(query);

                    //이전에 동일 임상시험에 참여하여 연구 종료한 적이 없는경우
                    if(output[0][0].SUCCESS==0){
                        result = {
                            code: 200,
                            rows: 1,
                            output: "참여가능"
                        }
                    }else{//이전에 동일 임상시험에 참여하여 연구 종료한 적이 있는경우
                        result = {
                            code: 500,
                            rows: 1,
                            output: '해당 연구 참여완료기록이 있습니다.'
                            //out: output[0][0].SID
                        }
                        return result
                    }
                }else{//현재 참여중인 연구가 있는경우
                    query = `SELECT SID FROM study_applicant WHERE APPLID=${connection.escape(n_applid)} AND SAACTIVE=1 ORDER BY APPLID DESC LIMIT 1 ;`
                    output = await connection.query(query);
                    
                    if(output[0][0].SID==sid){
                        result = {
                            code: 500,
                            rows: 1,
                            output: '이미 연구에 참여중입니다.'
                            //out: output[0][0].SID
                        }
                        return result
                    }else{
                        result = {
                            code: 500,
                            rows: 1,
                            output: '다른 연구에 참여중입니다.'
                            //out: output[0][0].SID
                        }
                        return result
                    }
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 자원 - 지원
async function study_create_enroll_apply(applid, sid){
    let pool = '';
    let connection = '';
    let n_sid = Number(sid);
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        var date = new Date();
        // var today = date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
        date.setHours(date.getHours()+9);
        var today = date.toISOString().replace('T', ' ').substring(0, 19);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 연구에 대한 정보가 없습니다."
                }
                return result
            }else{
                //SITEID 가져오기
                let siteid = '';
                query = `SELECT SITEID FROM study WHERE SID=${connection.escape(n_sid)};`
                output = await connection.query(query);
                siteid = Number(output[0][0].SITEID);
                console.log('완료 : SITEID를 가져왔습니다.');

                //INSERT INTO STUDY_APPLICANT
                query = `INSERT INTO study_applicant(SITEID, SID, APPLID, APPLDTC) VALUES(${siteid}, ${connection.escape(n_sid)}, ${connection.escape(n_applid)}, '${today}')`;
                await connection.query(query);
                console.log('완료 : INSERT INTO STUDY_APPLICANT');

                //SAID 가져오기
                query = `SELECT LAST_INSERT_ID() AS SAID;`;
                output = await connection.query(query);
                let said = Number(output[0][0].SAID);

                //CSGRPID 가져오기
                query = `SELECT EXISTS (SELECT * FROM consent_group WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
                output = await connection.query(query);
                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "동의서 그룹이 지정되어있지 않습니다."
                    }
                    return result
                }else{
                    query = `SELECT CSGRPID FROM consent_group WHERE SID=${connection.escape(n_sid)};`;
                    output = await connection.query(query);
                    console.log('완료 : CSGRPID를 가져왔습니다.');

                    for(var i=0; i<output[0].length; i++){
                        //CONSENTID 가져오기
                        let consentid = '';
                        query = `SELECT EXISTS (SELECT * FROM consent WHERE SID=${connection.escape(n_sid)} AND CSGRPID=${Number(output[0][i].CSGRPID)} AND ISPUBLISH=1) AS SUCCESS;`;
                        var output2 = await connection.query(query);
                        if(output2[0][0].SUCCESS==0){
                            result = {
                                code: 500,
                                rows: 0,
                                output: "동의서가 생성되어있지 않습니다."
                            }
                            return result
                        }else{
                            query = `SELECT CONSENTID FROM consent WHERE SID=${connection.escape(n_sid)} AND CSGRPID=${Number(output[0][i].CSGRPID)} AND ISPUBLISH=1 ORDER BY CONSENTID DESC LIMIT 1;`
                            var output3 = await connection.query(query);
                            consentid = Number(output3[0][0].CONSENTID);
                            console.log('완료 : CONSENTID를 가져왔습니다.');
    
                            //INSERT INTO CONSENT_SUBJECT
                            query = `INSERT INTO consent_subject(SAID, CONSENTID, SITEID) VALUES(${said}, ${consentid}, ${siteid});`;
                            await connection.query(query);
                            console.log('완료 : INSERT INTO CONSENT_SUBJECT');
    
                            result = {
                                code: 200,
                                rows: 1,
                                output: "SUCCESS"
                            }
                        }
                    }
                }
            }
        }
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 지원취소
async function study_update_enroll_cancle(applid, said){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        var date = new Date();
        // var today = date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
        date.setHours(date.getHours()+9);
        var today = date.toISOString().replace('T', ' ').substring(0, 19);

        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
                }
                return result
            }else{
                //자원자 동의서 count
                let stage = 0;
                let logcontent = '';
                let out = 0;

                query = `SELECT COUNT(CSID) AS CNT FROM consent_subject WHERE SAID=${connection.escape(n_said)} AND CSCLOSE=1;`;
                output = await connection.query(query);
                console.log('완료 : 자원자 동의서 count');

                if(output[0][0].CNT==0){
                    stage = 9;
                    logcontent = "신청취소";
                    out = 1;
                }else{
                    stage = 8;
                    logcontent = "동의철회";
                    out = 2;
                }

                //UPDATE STUDY_APPLICANT
                query = `UPDATE study_applicant SET SAACTIVE=0, SASTAGE=${stage}, SACLOSEDTC='${today}' WHERE SAID=${connection.escape(n_said)};`;
                await connection.query(query);
                console.log('완료 : UPDATE STUDY_APPLICANT');

                result = {
                    code: 200,
                    rows: 1,
                    output: out
                };
            }
        }
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 동의서 자원자 서명 저장_사이트 출력하기.
async function study_update_const_start_output_site(said, consentid){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_consentid = Number(consentid);
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM consent WHERE CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS`
            output = await connection.query(query);

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 동의서 대한 정보가 없습니다."
                }
                return result;
            }else{

                // date.setHours(date.getHours()+9);
                // var today = date.toISOString().replace('T', ' ').substring(0, 19);
                // let today = new Date()
                // var year = today.getFullYear();
                // var month = ('0' + (today.getMonth() + 1)).slice(-2);
                // var day = ('0' + today.getDate()).slice(-2);
                // var dateString = year + '-' + month  + '-' + day;   

                // var hours = ('0' + today.getHours()).slice(-2); 
                // var minutes = ('0' + today.getMinutes()).slice(-2);
                // var seconds = ('0' + today.getSeconds()).slice(-2); 

                // var timeString = hours + ':' + minutes  + ':' + seconds;

                var date = new Date();
                // var today = date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
                date.setHours(date.getHours()+9);
                var today = date.toISOString().replace('T', ' ').substring(0, 19);
                
                let nowtime = today;

                
                //블록체인 저장을 위한 데이터값 불러오기.
                //동의서 설명시작시간
                //site_id=SITENAME, protocol_no, channel_name, user_id 

                query = 
                    `select s.SITENAME , st.SITEID, sp.SPONSORNAME , st.SPONSORID, st.PRTNO, st.BCCHANNEL, app.APPLMAIL, c.CVERSION , c.CFILE_HASH
                    from study st, site s ,sponsor sp, applicant app, consent c 
                    where 
                    st.SID  = (select sa.SID from study_applicant sa where sa.said =${connection.escape(n_said)} and sa.SAACTIVE =1) and 
                    st.SITEID = s.SITEID and 
                    st.SPONSORID  = sp.SPONSORID and 
                    app.APPLID  = (select sa2.APPLID from study_applicant sa2 where sa2.SAID=${connection.escape(n_said)}) and
                    c.CONSENTID =${connection.escape(n_consentid)}
                    `
                
                
                    // console.log({query});
                output = await connection.query(query);


              
                result = {
                    code: 200,
                    rows: 1,
                    output: [output[0][0], nowtime]
                };
            }
        }
      
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}
//연구 동의서 자원자 서명 저장
async function study_update_const_start(said, consentid, consent_explation_start_time){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_consentid = Number(consentid);
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM consent WHERE CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS`
            output = await connection.query(query);

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 동의서 대한 정보가 없습니다."
                }
                return result;
            }else{
                // let today = new Date()
                // var year = today.getFullYear();
                // var month = ('0' + (today.getMonth() + 1)).slice(-2);
                // var day = ('0' + today.getDate()).slice(-2);
                // var dateString = year + '-' + month  + '-' + day;   

                // var hours = ('0' + today.getHours()).slice(-2); 
                // var minutes = ('0' + today.getMinutes()).slice(-2);
                // var seconds = ('0' + today.getSeconds()).slice(-2); 

                // var timeString = hours + ':' + minutes  + ':' + seconds;
                
                // let nowtime = `${dateString} ${timeString}`;

                

                query = `UPDATE consent_subject set CSSTARTDTC='${consent_explation_start_time}'  WHERE SAID= ${n_said} and CONSENTID =${n_consentid};`
                console.log({query})
                await connection.query(query);
                result = {
                    code: 200,
                    rows: 1,
                    output: "SUCCESS"
                };
            }
        }
      
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 동의서 자원자 서명 저장_블록체인 저장 목적, 사용자 서명 해시값 가져오기 
async function study_update_const_start_get_subject_sign(said, consentid, csname, cssign, signdtc){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_consentid = Number(consentid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM consent WHERE CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS`
            output = await connection.query(query);

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 동의서 대한 정보가 없습니다."
                }
                return result;
            }else{
                //CONTACT_COPTION:대면/비대면, INV_SIGN_COPTIONFROM:연구자 서명 동의서 옵션
                query = `SELECT CONTACT_COPTION, INV_SIGN_COPTION FROM consent WHERE CONSENTID=${connection.escape(n_consentid)};`;
                output = await connection.query(query);
                
                let CSSTAGE = "";
                if(output[0][0].CONTACT_COPTION==1){
                    CSSTAGE = (output[0][0].INV_SIGN_COPTION==1)? "CS_CONTACT_STAGE=7":" CS_CONTACT_STAGE=8 , CSCLOSE=1";
                }else{
                    CSSTAGE = (output[0][0].INV_SIGN_COPTION==1)? "CS_UNCONTACT_STAGE=5":" CS_UNCONTACT_STAGE=6 , CSCLOSE=1";
                }

                query = `SELECT EXISTS (SELECT * FROM consent_subject WHERE SAID=${connection.escape(n_said)} AND CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS`
                output = await connection.query(query);
    
                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "입력하신 자원자에 대한 동의 정보가 없습니다."
                    }
                    return result;
                }else{
                    let di = String(n_said);
                    query  = `SELECT p.DI FROM pass p, applicant a WHERE p.PASSID= a.PASSID and a.APPLID = (SELECT APPLID FROM study_applicant WHERE SAID =${n_said});`
                    output = await connection.query(query);
                    if(output[0].length>0){
                        di  = output[0][0].DI;
                       
                    }
        

                    let hash = crypto.createHash('sha256').update(di).digest('hex');

                    console.log({hash});
                    result = {
                        code: 200,
                        rows: 1,
                        output: hash
                    };
                }
            }
        }
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}
//연구 동의서 자원자 서명 저장
async function study_update_const_appl(said, consentid, csname, cssign, signdtc){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_consentid = Number(consentid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM consent WHERE CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS`
            output = await connection.query(query);

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 동의서 대한 정보가 없습니다."
                }
                return result;
            }else{
                //CONTACT_COPTION:대면/비대면, INV_SIGN_COPTIONFROM:연구자 서명 동의서 옵션
                query = `SELECT CONTACT_COPTION, INV_SIGN_COPTION FROM consent WHERE CONSENTID=${connection.escape(n_consentid)};`;
                output = await connection.query(query);
                
                let CSSTAGE = "";
                if(output[0][0].CONTACT_COPTION==1){
                    CSSTAGE = (output[0][0].INV_SIGN_COPTION==1)? "CS_CONTACT_STAGE=7":" CS_CONTACT_STAGE=8 , CSCLOSE=1";
                }else{
                    CSSTAGE = (output[0][0].INV_SIGN_COPTION==1)? "CS_UNCONTACT_STAGE=5":" CS_UNCONTACT_STAGE=6 , CSCLOSE=1";
                }

                query = `SELECT EXISTS (SELECT * FROM consent_subject WHERE SAID=${connection.escape(n_said)} AND CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS`
                output = await connection.query(query);
    
                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "입력하신 자원자에 대한 동의 정보가 없습니다."
                    }
                    return result;
                }else{
                    query = `UPDATE consent_subject SET ${CSSTAGE}, SUBJ_SIGNDTC=${connection.escape(signdtc)}, CSENDDTC = IF(CSENDDTC IS NULL, ${connection.escape(signdtc)}, CSENDDTC), SUBJ_SIGN=${connection.escape(cssign)}, SUBJ_SIGN_NAME=${connection.escape(csname)} WHERE SAID=${connection.escape(n_said)} AND CONSENTID=${connection.escape(n_consentid)};`;
                    await connection.query(query);
                    console.log('완료 : UPDATE CONSENT_SUBJECT');

                    result = {
                        code: 200,
                        rows: 1,
                        output: "SUCCESS"
                    };
                }
            }
        }
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}
//연구 동의서 자원자 서명 체크 항목 
async function study_update_const_check(consentid){
    let pool = '';
    let connection = '';
    let n_consentid = Number(consentid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = ``;
        var output = '';
        var result = {};
     
            query = `SELECT EXISTS (SELECT * FROM consent WHERE CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS`
            output = await connection.query(query);

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 동의서 대한 정보가 없습니다."
                }
                return result;
            }else{
                //CONTACT_COPTION:대면/비대면, INV_SIGN_COPTIONFROM:연구자 서명 동의서 옵션
                query = `SELECT CDIDNUM, CDTITLE, CDCONTENT FROM consent_detail WHERE CONSENTID=${connection.escape(n_consentid)};`;
                output = await connection.query(query);
                
                result = {
                    code: 200,
                    rows: output[0].length,
                    output: output[0]
                }
            }
            
        
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 동의서 법적대리인 서명 저장
async function study_update_const_lar(said, consentid, csname, cssign, signdtc){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_consentid = Number(consentid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM consent WHERE CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS`
            output = await connection.query(query);

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 동의서 대한 정보가 없습니다."
                }
                return result;
            }else{
                //CONTACT_COPTION:대면/비대면, INV_SIGN_COPTIONFROM:연구자 서명 동의서 옵션
                query = `SELECT CONTACT_COPTION, INV_SIGN_COPTION FROM consent WHERE CONSENTID=${connection.escape(n_consentid)};`;
                output = await connection.query(query);
                
                let CSSTAGE = "";
                if(output[0][0].CONTACT_COPTION==1){
                    CSSTAGE = (output[0][0].INV_SIGN_COPTION==1)? "CS_CONTACT_STAGE=7":" CS_CONTACT_STAGE=8 , CSCLOSE=1";
                }else{
                    CSSTAGE = (output[0][0].INV_SIGN_COPTION==1)? "CS_UNCONTACT_STAGE=5":" CS_UNCONTACT_STAGE=6 , CSCLOSE=1";
                }

                query = `SELECT EXISTS (SELECT * FROM consent_subject WHERE SAID=${connection.escape(n_said)} AND CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS`
                output = await connection.query(query);

                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "입력하신 자원자에 대한 동의 정보가 없습니다."
                    }
                    return result;
                }else{
                    query = `UPDATE consent_subject SET ${CSSTAGE}, LAR_SIGNDTC=${connection.escape(signdtc)}, CSENDDTC = IF(CSENDDTC IS NULL, ${connection.escape(signdtc)}, CSENDDTC), LAR_SIGN=${connection.escape(cssign)}, LAR_SIGN_NAME=${connection.escape(csname)} WHERE SAID=${connection.escape(n_said)} AND CONSENTID=${connection.escape(n_consentid)};`;
                    await connection.query(query);
                    console.log('완료 : UPDATE CONSENT_SUBJECT');

                    result = {
                        code: 200,
                        rows: 1,
                        output: "SUCCESS"
                    };
                }
            }
        }
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 동의서 동의철회/신청취소
async function study_create_const_withdraw(applid, said){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        var newDate = new Date();
        newDate.setHours(newDate.getHours()+9);
        var today = newDate.toFormat('YYYY-MM-DD');
        connection  = await pool.getConnection(async conn => conn);
        var result = {};
        var SASTAGE = '';
        var LOGCONTENT = '';
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
                }
                return result
            }else{
                // A. 자원자가 한번이라도 동의한 적이 있는지 확인한다.        
                query = `SELECT COUNT(CSID) AS CNT FROM consent_subject WHERE SAID=${connection.escape(n_said)} AND CSCLOSE=1;`;
                output = await connection.query(query);
                if(output[0][0].CNT==0){
                    SASTAGE = 9;
                    LOGCONTENT = "신청취소";
                    result = {
                        code: 200,
                        rows: 1,
                        output: "신청취소"
                    };
                }else{
                    SASTAGE = 8;
                    LOGCONTENT = "동의철회";
                    result ={
                        code: 200,
                        rows: 1,
                        output: "동의철회"
                    };
                }
                
                // B. SUBJECT_APPLICANT TABLE에 기록한다.
                query = `UPDATE study_applicant SET SAACTIVE=0, SASTAGE=${SASTAGE}, SACLOSEDTC='${today}' WHERE SAID=${connection.escape(n_said)};`;
                await connection.query(query);  
            }
        }
        return result;
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 Q&A 읽기
async function study_read_qna(sid, said){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_sid = Number(sid);

    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 연구에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
                }
                return result
            }else{
                query = `SELECT EXISTS (SELECT * FROM study_applicant SA, qna q WHERE SA.SAID=q.SAID AND SA.SID=${connection.escape(n_sid)} AND q.SAID=${connection.escape(n_said)}) AS SUCCESS;`;
                output = await connection.query(query);

                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "QNA가 작성되어있지 않습니다."
                    }
                    return result;
                }else{
                    query = `SELECT q.SAID, q.INVID, q.QNADTC, q.QNACONTENT, q.SUBJ_FLAG FROM study_applicant SA, qna q WHERE SA.SAID=q.SAID AND SA.SID=${connection.escape(n_sid)} AND q.SAID=${connection.escape(n_said)} ORDER BY q.QNAID ASC;`;
                    output = await connection.query(query);
                    result = {
                        code: 200,
                        rows: output[0].length,
                        output: output[0]
                    }
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 Q&A 작성
async function study_create_qna(applid, said, qnacontent){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_applid = Number(applid);

    try{
        pool = await mysql.createPool(setting);
        var date = new Date();
        date.setHours(date.getHours()+9);
        var today = date.toISOString().replace('T', ' ').substring(0, 19);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
                }
                return result
            }else{
                query = `INSERT INTO qna(APPLID, SAID, SUBJ_FLAG, QNADTC, QNACONTENT)
                        VALUES(${connection.escape(n_applid)}, ${connection.escape(n_said)}, 1, '${today}', ${connection.escape(qnacontent)});`;
                await connection.query(query);
                
                result = {
                    code: 200,
                    rows: 1,
                    output: "qna 작성 완료"
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//연구 자원자 동의정보 보기
async function mystudy_read_consent_appl(csid){
    let pool = '';
    let connection = '';
    let n_csid = Number(csid);
    
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM consent_subject WHERE CSID=${connection.escape(n_csid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};

        if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 동의 정보가 없습니다."
            }
            return result;
        }else{
            query = `SELECT * FROM consent_subject WHERE CSID=${connection.escape(n_csid)};`;
            output = await connection.query(query);
           
            result = {
                code: 200,
                rows: output[0].length,
                output: output[0]
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//내연구 동의서 설명요청
async function mystudy_create_request(applid, said, consentid, nowdtc){
    let pool = '';
    let connection = '';
    let n_applid = Number(applid);
    let n_said = Number(said);
    let n_consentid = Number(consentid);
    
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn)
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
                }
                return result
            }else{
                query = `SELECT EXISTS (SELECT * FROM consent WHERE CONSENTID=${connection.escape(n_consentid)}) AS SUCCESS;`;
                output = await connection.query(query);
                
                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "입력하신 동의서 대한 정보가 없습니다."
                    }
                    return result
                }else{
                    query =`UPDATE consent_subject SET CS_CONTACT_STAGE=4, CSREQUESTDTC=${connection.escape(nowdtc)} WHERE SAID=${connection.escape(n_said)} AND CONSENTID=${connection.escape(n_consentid)} AND CS_CONTACT_STAGE=3`;
                    await connection.query(query);

                    result = {
                        code: 200,
                        rows: 1,
                        output: "SUCCESS"
                    }
                }
            }
        }
        return result
        
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }    
}

//내연구 자원자의 연구 상태 및 예약 정보 및 QR정보
async function mystudy_read_status_appl(said){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE APPLID=${connection.escape(n_said)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
            }
            return result
        }else{
            
   
            query = `SELECT EXISTS (SELECT * FROM appointment WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
            output = await connection.query(query);

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자의 예약 정보가 없습니다."
                }
                return result;
            }else{
                query = `SELECT IFNULL(APPOINTID, 0) AS APPOINTID, DATE_FORMAT(APPOINTDTC, '%Y-%m-%d %H:%i') AS VISITDTC, DATE_FORMAT(IDENTIFYDTC, '%Y-%m-%d %H:%i') AS PASS FROM appointment WHERE SAID=${connection.escape(n_said)} ORDER BY APPOINTID DESC LIMIT 1;`;
                output = await connection.query(query);

                result = {
                    code: 200,
                    rows: output[0].length,
                    output: output[0]
                }

                query = `SELECT SASTAGE, APPLID FROM study_applicant WHERE SAID=${connection.escape(n_said)};`;
                output = await connection.query(query);
                result.output[0].SASTAGE = output[0][0].SASTAGE;
                let applid = Number(output[0][0].APPLID);

                query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${applid}) AS SUCCESS;`;
                output = await connection.query(query);
                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "입력하신 자원자에 대한 정보가 없습니다."
                    }
                    return result;
                }else{
                    query = `SELECT EXISTS (SELECT QRCODE FROM applicant WHERE APPLID=${applid}) AS SUCCESS`
                    output = await connection.query(query);
            
                    if(output[0][0].SUCCESS==0){
                        result = {
                            code: 500,
                            rows: 0,
                            output: "입력하신 자원자에 대한 QR코드 정보가 없습니다."
                        }
                        return result
                    }else{
                        query = `SELECT QRCODE FROM applicant WHERE APPLID=${applid};`;
                        output = await connection.query(query);
                        result.output[0].QRCODE = output[0][0].QRCODE;
                    }
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            let: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//내연구 자원자 모든 동의서 리스트 - 수정예정
async function mystudy_read_all_consent(said){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    
    try{
        pool = await mysql.createPool(setting);
        connection  = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};

        if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
            }
            return result;
        }else{
            query = `SELECT SID FROM study_applicant WHERE SAID=${connection.escape(n_said)};`;
            output = await connection.query(query);
            let sid = Number(output[0][0].SID);

            query = `SELECT EXISTS (SELECT * FROM consent WHERE SID=${sid}) AS SUCCESS;`;
            output = await connection.query(query);

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "동의서에 대한 정보가 없습니다."
                }
                return result;
            }else{
                query = `SELECT * FROM consent WHERE SID=${sid};`;
                output = await connection.query(query);
                result = {
                    code: 200,
                    rows: output[0].length,
                    output: output[0]
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//내연구 현재 참여중인 연구 정보 보기
async function mystudy_read_detail(applid){
    let pool = '';
    let connection = '';
    let n_applid = Number(applid);
    
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${connection.escape(n_applid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};

        if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 정보가 없습니다."
            }
            return result;
        }else{
            query = `SELECT SA.SAID, SA.SID, S.SACTIVE FROM study_applicant SA, study S WHERE APPLID=${connection.escape(n_applid)} AND S.SID=SA.SID AND S.SACTIVE=1 AND SA.SAACTIVE=1 ORDER BY SA.SAID DESC LIMIT 1;`;
            output = await connection.query(query);

            result = {
                code: 200,
                rows: output[0].length,
                output: {
                    "SAID": output[0][0].SAID,
                    "SID": output[0][0].SID
                }
            }
            let sid = Number(output[0][0].SID);
            
            //자원자 이름 가져오기
            query = `SELECT APPLNAME FROM applicant WHERE APPLID=${connection.escape(n_applid)};`;
            output = await connection.query(query);
            result.output.APPLNAME = output[0][0].APPLNAME;
            
            query = `SELECT EXISTS (SELECT * FROM study WHERE SID=${sid}) AS SUCCESS;`;
            output = await connection.query(query);

            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 연구에 대한 정보가 없습니다."
                }
                return result;
            }else{
                //연구 정보 가져오기
                query = `SELECT TITLE, SITEID, SAPPL, SSEX FROM study WHERE SID=${sid};`;
                output = await connection.query(query);
                result.output.TITLE = output[0][0].TITLE;
                result.output.SAPPL = output[0][0].SAPPL;
                result.output.SSEX = output[0][0].SSEX;
                let siteid = Number(output[0][0].SITEID);
            
                query = `SELECT EXISTS (SELECT * FROM site WHERE SITEID=${siteid}) AS SUCCESS;`;
                output = await connection.query(query);
    
                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "입력하신 기관에 대한 정보가 없습니다."
                    }
                    return result;
                }else{
                    //사이트 정보 가져오기
                    query = `SELECT SITENAME FROM site WHERE SITEID=${siteid};`;
                    output = await connection.query(query);
                    result.output.SITENAME = output[0][0].SITENAME;
                    result.output.SITEID = siteid;
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//내연구 진행중 연구의 동의 그룹별 최근 동의서 리스트
async function mystudy_read_consent_stdgrp(said, sid){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_sid = Number(sid);
    
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 연구에 대한 정보가 없습니다."
            }
            return result
        }else{
            //체크: 연구확인.
            query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
                }
                return result
            }else{
                //체크: 동의서 그룹이 있는지 확인.
                query = `SELECT EXISTS (SELECT * FROM consent_group WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
                output = await connection.query(query);

                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "동의서 그룹이 지정되어있지 않습니다."
                    }
                    return result;
                }else{
                    // CONSENT_GROUP
                    query = `SELECT CSGRPID, CSGRPTITLE, CSGRPTYPE FROM consent_group WHERE SID=${connection.escape(n_sid)};`;
                    output = await connection.query(query);

                    result ={
                        code: 200,
                        rows: output[0].length,
                        output: output[0]
                    }
                    console.log("CONSENT_GROUP");
                    console.log({output: output[0], length:output[0].length});
                    
                    for(var i=0; i<output[0].length; i++){
                        console.log(`check_${i}`);
                        query = `SELECT EXISTS (SELECT * FROM consent WHERE CSGRPID=${Number(output[0][i].CSGRPID)} AND ISPUBLISH=1) AS SUCCESS;`;
                        var output2 = await connection.query(query);
        
                        if(output2[0][0].SUCCESS==0){
                            result = {
                                code: 500,
                                rows: 0,
                                output: "동의서 그룹에 대한 동의서가 지정되어있지 않습니다."
                            }
                            return result;
                        }else{
                            // CONSENT 값 넣기.
                            query = `SELECT CONSENTID, CVERSION, CPUBLISHDTC, CONTACT_COPTION, INV_SIGN_COPTION, CFILE, CFILENAME FROM consent WHERE CSGRPID=${Number(output[0][i].CSGRPID)} AND ISPUBLISH=1 ORDER BY CONSENTID DESC LIMIT 1;`;
                            var output3 = await connection.query(query);
                            result.output[i].CONSENTID = output3[0][0].CONSENTID;
                            result.output[i].CVERSION = output3[0][0].CVERSION;
                            result.output[i].CCREATEDTC = output3[0][0].CCREATEDTC;
                            result.output[i].CONTACT_COPTION = output3[0][0].CONTACT_COPTION;
                            result.output[i].INV_SIGN_COPTION = output3[0][0].INV_SIGN_COPTION;
                            result.output[i].CFILE = output3[0][0].CFILE;
                            result.output[i].CFILENAME = output3[0][0].CFILENAME;
                            console.log("CONSENT");
                        
                            query = `SELECT EXISTS (SELECT * FROM consent_subject WHERE CONSENTID=${Number(output3[0][0].CONSENTID)} AND SAID=${connection.escape(n_said)}) AS SUCCESS;`;
                            var output4 = await connection.query(query);
                    
                            if(output4[0][0].SUCCESS==0){
                                result = {
                                    code: 500,
                                    rows: 0,
                                    output: "입력하신 자원자에 대한 동의 정보가 없습니다."
                                }
                                return result;
                            }else{
                                // CONSENT_SUBJECT
                                query = `SELECT CSID, CS_CONTACT_STAGE, CS_UNCONTACT_STAGE, CSIDENTIFICATION, CSCLOSE FROM consent_subject WHERE CONSENTID=${Number(output3[0][0].CONSENTID)} AND SAID=${connection.escape(n_said)};`;
                                var output5 = await connection.query(query);
                                result.output[i].CSID = output5[0][0].CSID;
                                if(output5[0][0].CONTACT_COPTION==1){
                                    result.output[i].CSSTAGE = output5[0][0].CS_CONTACT_STAGE;
                                }else{
                                    result.output[i].CSSTAGE = output5[0][0].CS_UNCONTACT_STAGE;
                                }
                                result.output[i].CSIDENTIFICATION = output5[0][0].CSIDENTIFICATION;
                                result.output[i].CSCLOSE = output5[0][0].CSCLOSE;
                                console.log("CONSENT_SUBJECT");
                                
                                //동의서명내용_상운
                                query = `SELECT CDIDNUM, CONSENTID, CDTITLE, CDCONTENT FROM consent_detail WHERE CONSENTID = ${output3[0][0].CONSENTID};`
                                var output_chk = await connection.query(query);
                                result.output[i].CHECK = output_chk[0];

                                //비대면 체크 일경우 예약부분 생략 
                                query = `SELECT EXISTS (SELECT * FROM consent WHERE SID='${connection.escape(n_sid)}' AND  CONTACT_COPTION=0 AND ISPUBLISH =1 order by CONSENTID DESC ) AS SUCCESS;`
                                var output5_1 = await connection.query(query);
                                console.log({output5_1:output5_1[0][0]})
                                if(output5_1[0][0].SUCCESS==0){
                                    //예약관련
                                    query = `SELECT EXISTS (SELECT DATE_FORMAT(IDENTIFYDTC,'%Y-%m-%d %H:%i') AS IDENTIFYDTC FROM appointment WHERE SAID=${connection.escape(n_said)} AND IDENTIFYDTC IS NULL AND APPOINTDTC >= NOW()) AS SUCCESS;`;
                                    var output6 = await connection.query(query);
                        
                                    if(output6[0][0].SUCCESS==0){
                                        result = {
                                            code: 500,
                                            rows: 0,
                                            output: "예정된 예약 정보가 없습니다."
                                        }
                                        return result;
                                    }else{
                                        // APPOINTMENT
                                        query = `SELECT IFNULL(APPOINTID,0) AS APPOINTID, DATE_FORMAT(APPOINTDTC,'%Y-%m-%d %H:%i') AS APPOINTDTC, DATE_FORMAT(IDENTIFYDTC,'%Y-%m-%d %H:%i') AS IDENTIFYDTC FROM appointment WHERE SAID=${connection.escape(n_said)} AND IDENTIFYDTC IS NULL AND APPOINTDTC >= NOW();`;
                                        output = await connection.query(query);
                                        result.output[i].APPOINTID = output[0][0].APPOINTID;
                                        result.output[i].APPOINTDTC = output[0][0].APPOINTDTC;
                                        result.output[i].IDENTIFYDTC = output[0][0].IDENTIFYDTC;
                                        console.log("APPOINTMENT");
                                    }//else
                                }
                            }
                        }
                    }
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//내연구 방문 예약하기
async function mystudy_create_visit(said, visitdtc, sid){
    let pool = '';
    let connection = '';
    let n_said = Number(said);
    let n_sid = Number(sid);
    
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);
        
        var query = `SELECT EXISTS (SELECT * FROM study WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};
        
		if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 연구에 대한 정보가 없습니다."
            }
            return result
        }else{
            query = `SELECT EXISTS (SELECT * FROM study_applicant WHERE SAID=${connection.escape(n_said)}) AS SUCCESS;`;
            output = await connection.query(query);
            
            if(output[0][0].SUCCESS==0){
                result = {
                    code: 500,
                    rows: 0,
                    output: "입력하신 자원자에 대한 참여이력 정보가 없습니다."
                }
                return result
            }else{
                // 유요한 예약 존재유무
                query = `SELECT IFNULL(APPOINTID, 0) AS APPOINTID FROM appointment WHERE SAID=${connection.escape(n_said)} AND IDENTIFYDTC IS NULL AND APPOINTDTC >= NOW();`;
                output = await connection.query(query);
                console.log("유요한 예약 존재유무");
                
                
                // 유요한 예약이 있으면 예약 변경, 없으면 생성
                let appointid = 0;
                let newappoint = 0;
                if(output[0].APPOINTID == 0){
                    newappoint = 1;
                    query = `INSERT INTO APPOINTMENT(SAID, APPOINTDTC) VALUES(${connection.escape(n_said)}, ${connection.escape(visitdtc)});`;
                    await connection.query(query);

                    query = `SELECT LAST_INSERT_ID() AS APPOINTID;`;
                    output = await connection.query(query);
                    appointid = Number(output[0][0].APPOINTID);
                }else{
                    query = `UPDATE appointment SET APPOINTDTC=${connection.escape(visitdtc)} WHERE APPOINTID=${appointid};`;
                    await connection.query(query);
                }
                console.log("유요한 예약이 있으면 예약 변경, 없으면 생성");

                // SASTAGE 변경
                query = `UPDATE study_applicant SET SASTAGE=3 WHERE SAID=${connection.escape(n_said)} AND SASTAGE=2;`;
                await connection.query(query);
                console.log("SASTAGE 변경");
                
                // CONSENT GROUP 가져오기
                query = `SELECT EXISTS (SELECT * FROM consent_group WHERE SID=${connection.escape(n_sid)}) AS SUCCESS;`;
                output = await connection.query(query);
                var result = {};

                if(output[0][0].SUCCESS==0){
                    result = {
                        code: 500,
                        rows: 0,
                        output: "동의서 그룹이 지정되어있지 않습니다."
                    }
                    return result;
                }else{
                    query = `SELECT CSGRPID, CSGRPTYPE FROM consent_group WHERE SID=${connection.escape(n_sid)};`;
                    output = await connection.query(query);
                    
                    result = {
                        code: 200,
                        rows: output[0].length,
                        output: output[0]
                    }
                
                    // QRCODE 가져오기
                    query = `SELECT APPLID FROM study_applicant WHERE SAID=${connection.escape(n_said)};`;
                    output = await connection.query(query);
                    let applid = Number(output[0][0].APPLID);

                    query = `SELECT EXISTS (SELECT * FROM applicant WHERE APPLID=${applid}) AS SUCCESS;`;
                    output = await connection.query(query);
            
                    if(output[0][0].SUCCESS==0){
                        result = {
                            code: 500,
                            rows: 0,
                            output: "입력하신 자원자에 대한 정보가 없습니다."
                        }
                        return result;
                    }else{
                        query = `SELECT EXISTS (SELECT QRCODE FROM applicant WHERE APPLID=${connection.escape(applid)}) AS SUCCESS`
                        output = await connection.query(query);
                        var qrcode = '';
                
                        if(output[0][0].SUCCESS==0){
                            result = {
                                code: 500,
                                rows: 0,
                                output: "입력하신 자원자에 대한 QR코드 정보가 없습니다."
                            }
                            return result
                        }else{
                            query = `SELECT QRCODE FROM applicant WHERE APPLID=${applid};`;
                            output = await connection.query(query);
                            qrcode = output[0][0].QRCODE;
                            console.log("QRCODE 가져오기");
                        }

                        // CONSENT GROUP별 CONSENT SUBJECT - CSSTAGE 본인확인단계로 변경
                        for(var i = 0; i < result.rows; i++){
                            result.output[i].QRCODE = qrcode;
            
                            query = `SELECT EXISTS (SELECT * FROM consent WHERE CSGRPID=${Number(result.output[i].CSGRPID)} AND ISPUBLISH=1) AS SUCCESS;`;
                            output = await connection.query(query);
                    
                            if(output[0][0].SUCCESS==0){
                                result = {
                                    code: 500,
                                    rows: 0,
                                    output: "동의서 그룹에 대한 동의서가 지정되어있지 않습니다."
                                }
                                return result;
                            }else{
                                query = `SELECT CONSENTID, CVERSION, CONTACT_COPTION FROM consent WHERE CSGRPID=${Number(result.output[i].CSGRPID)} AND ISPUBLISH=1 ORDER BY CONSENTID DESC LIMIT 1;`;
                                output = await connection.query(query);
                                result.output[i].CONSENTID = Number(output[0][0].CONSENTID);
                                result.output[i].CVERSION = output[0][0].CVERSION;
                                result.output[i].CONTACT_COPTION = Number(output[0][0].CONTACT_COPTION);
            
                                query = `SELECT EXISTS (SELECT * FROM consent_subject WHERE CONSENTID=${Number(result.output[i].CONSENTID)} AND SAID=${connection.escape(n_said)}) AS SUCCESS;`;
                                output = await connection.query(query);
                        
                                if(output[0][0].SUCCESS==0){
                                    result = {
                                        code: 500,
                                        rows: 0,
                                        output: "입력하신 자원자에 대한 동의 정보가 없습니다."
                                    }
                                    return result;
                                }else{
                                    query = `SELECT CSID, CS_CONTACT_STAGE, IFNULL(APPOINTID, 0) AS APPOINTID FROM consent_subject WHERE CONSENTID=${Number(result.output[i].CONSENTID)} AND SAID=${connection.escape(n_said)};`;
                                    output = await connection.query(query);
                                    result.output[i].CSID = Number(output[0][0].CSID);
                                    if(output[0][0].CS_CONTACT_STAGE == 1){
                                        if(newappoint == 1){
                                            query = `UPDATE consent_subject SET CS_CONTACT_STAGE = 2, APPOINTID = ${appointid} WHERE CSID = ${Number(result.output[i].CSID)};`;
                                            result.output[i].APPOINTID = appointid;
                                        }else{
                                            result.output[i].APPOINTID = Number(output[0][0].APPOINTID);
                                            query = `UPDATE consent_subject SET CS_CONTACT_STAGE = 2 WHERE CSID = ${Number(result.output[i].CSID)};`;
                                        }                
                                        output = await connection.query(query);
                                        result.output[i].CSSTAGE = 2;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

//내연구 현재 참여중인 연구의 동의서 종료 확인
async function mystudy_read_consent_isend(csid){
    let pool = '';
    let connection = '';
    let n_csid = Number(csid);
    
    try{
        pool = await mysql.createPool(setting);
        connection = await pool.getConnection(async conn => conn);

        var query = `SELECT EXISTS (SELECT * FROM consent_subject WHERE CSID=${connection.escape(n_csid)}) AS SUCCESS;`;
        var output = await connection.query(query);
        var result = {};

        if(output[0][0].SUCCESS==0){
            result = {
                code: 500,
                rows: 0,
                output: "입력하신 자원자에 대한 동의 정보가 없습니다."
            }
            return result;
        }else{
            query = `SELECT CSCLOSE FROM consent_subject WHERE CSID=${connection.escape(n_csid)};`;
            output = await connection.query(query);
            
            result = {
                code: 200,
                rows: output[0].length,
                output: output[0]
            }
        }

        return result
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            output: err
        }
        return result
    }finally{
        connection.release();
    }   
}

async function screening_get_screening(sid){
    let nsid = sid;
    //1.(설문지 id 가져오기) screening에서 sid값을 이용하여 screening_id 값 리스트 가져오기 (설문지 id 가져오기)
    //2.(screening_head 가져오기) screening_head에서 screening_id값을 이용하여 설문지 정보 가져오기
    //3.(질문 리스트뽑기) screening_question에서 질문 리스트 전체가져오기
    //4.(질문 카테고리 값 가져오기) 3번에서 question_category_id 값을 이용하여 question_category테이블에 값 가져오기, 중복제거해야함
    //5.(질문 값가져오기) 3번 question_id 값들을 가지고 question 값들을 실제 질문을 가져오고 응답유형도 가져온다.
    //6.(응답문항가져오기) 5번에서 가져온 응답유형중 선택지의경우 answer_group_no 값을 answer_list에서 조회하여 가져온다. 
    //7.출력을 정리하여 뿌린다. 
    

    let pool ='';
    let connection ='';

    let devmon_question=[];

    try{
        pool = await mysql.createPool(setting);
        connection  = await pool.getConnection(async conn => conn)

        //screening 테이블에 screening가 있는지 확인 
        let query =`SELECT EXISTS (SELECT * FROM screening ) AS SUCCESS;`;
        let output = await connection.query(query);
        if(output[0][0].SUCCESS==0){
            
            var result ={
                code: 201,
                rows: 0,
                output: "Screening 설문지가 없습니다."
            }
            return result
        }

        let screening_list =[];
        
        //설문지ID 값 가져오기 
        query = `SELECT screening_id FROM screening `;
        output = await connection.query(query);
        
      
        screening_id_list = output[0];

        console.log(screening_id_list)
        

        let screening_id = output[0][0].screening_id
        
        
        let final_result={
                info:{
                    sid: nsid,
                     }
        };
        let ref ={};
        //concept가져오기 
        query= `SELECT concept_id, concept_name, concept_class_id FROM concept;`;
        output = await connection.query(query);
        ref.concept = output[0];

        
        //설문 문항의 보기 그룹 조회.
        query = `select answer_item_group_id, answer_item_seq , answer_item_id , answer_item_text from answer_item where answer_item_group_id in (select q.answer_item_group_id from SCREENING_QUESTION sq, QUESTION q where sq.screening_id =${screening_id} and sq.question_id=q.question_id and answer_item_group_id is not null group by answer_item_group_id order by answer_item_group_id asc);`
        output = await connection.query(query);
        ref.answer_item = output[0]
        // console.log({output:output[0]})
       

        //서브문항지 
        query = `SELECT question_group_id, sub_question_content, answer_type_concept_id, answer_item_group_id, sub_question_seq FROM sub_question WHERE question_group_id = (select distinct q.question_group_id from SCREENING_QUESTION sq, QUESTION q , survey_section ss where sq.screening_id =1  and  sq.question_id=q.question_id and sq.survey_section_id =ss.survey_section_id and q.QUESTION_GROUP_ID is not null order by sq.section_seq asc, sq.question_seq asc);`;
        output = await connection.query(query);
        ref.screening_sub_question = output[0];

        final_result.ref = ref;

        let screening_set ={};

        //설문지 제목, 설문지 주체등 설문지 머리말 기본정보값조회 
        query= `select screening_head_id, screening_head_title, screening_head_value from screening_head where screening_id=${screening_id};`
        output = await connection.query(query);
        screening_set.screening_header_info = output[0];



        //설문지문항. 
        query =`select sq.screening_question_id , q.question_id, q.question_group_id, q.question_content, q.answer_item_group_id, q.answer_type_concept_id,sq.question_seq,ss.survey_section_id, sq.section_seq , ss.survey_section_name, ss.survey_section_info from SCREENING_QUESTION sq, QUESTION q , survey_section ss where sq.screening_id =${screening_id}  and  sq.question_id=q.question_id and sq.survey_section_id =ss.survey_section_id  order by sq.section_seq asc, sq.question_seq asc;`
        output = await connection.query(query);
        screening_set.screening_question = output[0];
        for(i=0;i<output[0].length;i++){
            devmon_question.push({screening_question_id:output[0][i].screening_question_id});
        }
        
        final_result.devmon_question_list = devmon_question;
        final_result.screening_set= screening_set
        //보조질문지 내용 가져오기.
        //1. screening_question 테이블에서 해당 screening_id 값 기준으로 나오는 question_id 값을 추출한다.
        //2. 1번에서 나온 question_id 값들을 가지고 question 테이블에서 질문을 추출하고 question_group_id 가 있는걸 뽑는다. 
        //3. 2번에 나온 question_group_id 값들을 이용하여 sub_question 테이블에서 해당되는 문제들을 뽑는다.
        //4. 3번에서 나온 데이터를 추출하여 리턴한다.

        //1. select distinct  a.SECTION_SEQ, a.SURVEY_SECTION_ID ,a.QUESTION_SEQ, a.QUESTION_ID, b.QUESTION_GROUP_ID from screening_question a, question b, sub_question c where a.QUESTION_ID = b.QUESTION_ID order by a.SECTION_SEQ, a.SURVEY_SECTION_ID ,a.QUESTION_SEQ
        query= `SELECT (SELECT question_id, question_group_id FROM question WHERE question_id IN (SELECT question_id FROM screening_question WHERE screening_id = ${screening_id}))`

        return final_result;



        
    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            out: err
        }
        return result
    }finally{
        connection.release();
    }    
}

//스크리닝 질문 저장.
async function screening_set_screening(body){
    //모바일앱에서 스크리닝 질문을 받아와 저장을 하는 메서드
    // 단계
    // 8-a 대상자의 응답저장 - 한번만 응답가능
    // 문제에 대한 응답 저장
    let data = body;

    let said = data.said;
    let applid = data.applid;

    let screening_id = data.screening_id;

    let responses = data.response_answer;
    let today = data.datetime;


    let pool ='';
    let connection ='';
    try{
        pool = await mysql.createPool(setting);
        connection  = await pool.getConnection(async conn => conn)
        let query ='';
        let output ;
        // let output2 = '';

        //있는지 판단.
        // 있으면 => update, 없으면 insert

        for(i=0;i<responses.length;i++){
            let screening_question_id = responses[i].screening_question_id;
            let answer = responses[i].answer;

            query = `SELECT EXISTS (SELECT * FROM SCREENING_ANSWER WHERE SAID=${connection.escape(said)} AND screening_id=${connection.escape(screening_id)} AND SCREENING_QUESTION_ID = ${connection.escape(screening_question_id)}) AS SUCCESS;`
            output = await connection.query(query);

               
            //SCREENING_ANSWER 테이블에 내용 삽입 또는 업데이트
            if(output[0][0].SUCCESS==0){
                query = `INSERT INTO SCREENING_ANSWER(SCREENING_ID, SAID,SCREENING_QUESTION_ID,  ANSWER_SOURCE_VALUE, ANSWERDTC) values(${screening_id}, ${said}, ${screening_question_id}, '${answer}','${today}')`;

            }else{
                query = `UPDATE SCREENING_ANSWER SET SCREENING_ID=${screening_id}, SAID= ${said},SCREENING_QUESTION_ID= ${screening_question_id},  ANSWER_SOURCE_VALUE= '${answer}', ANSWERDTC='${today}' WHERE SAID=${connection.escape(said)} AND screening_id=${connection.escape(screening_id)} AND SCREENING_QUESTION_ID = ${connection.escape(screening_question_id)}`;
            }

            console.log({"로그_응답쿼리확인":query})
            output = await connection.query(query);
            console.log({insert_or_update_output:output});

            let screening_answer_id = 0;
            let get_last_insert_sponsor = "SELECT LAST_INSERT_ID() as id;";

            query = get_last_insert_sponsor
            output = await connection.query(query);
            console.log({screening_answer_id:output[0]});
            screening_answer_id = output[0][0].id;

            //문제 답 로그 삽입 쿼리
            query = `INSERT INTO SCREENING_ANSWER_LOG(SCREENING_ID, SAID,SCREENING_QUESTION_ID,  ANSWER_SOURCE_VALUE, ANSWERDTC, SCREENING_ANSWER_ID, WHO, WHO_ID, HOW, LOGDTC) values(${screening_id}, ${said}, ${screening_question_id}, '${answer}','${today}',"${screening_answer_id}",'대상자', ${applid},'CREATE','${today}');`;
            await connection.query(query);
        }
        // servey_subject 테이블에 SUBMITTED에 1로 표시
        query = `INSERT SURVEY_SUBJECT (SCREENING_ID, SAID, SUBMITTED, SUBMITDTC) values(${screening_id},${said},1,'${today}')`;
        await connection.query(query);
        
        console.log("자가진단 답안지 넣기 완료");


        //서브 질문그룹에 대한 응답 저장
        responses = data.response_sub_answer;
        for(i=0;i<responses.length;i++){
            let question_group_id = responses[i].question_group_id;
            let sub_question_id = responses[i].sub_question_id;
            let answer = responses[i].answer;

            //데이터 확인 유무 
            query = `SELECT EXISTS (SELECT * FROM group_answer WHERE SAID=${connection.escape(said)} AND SCREENING_ID = ${connection.escape(screening_id)} AND QUESTION_GROUP_ID=${connection.escape(question_group_id)} AND SUB_QUESTION_ID=${connection.escape(sub_question_id)}) AS SUCCESS;`
            output = await connection.query(query);

               
             //group_answer 테이블에 저장 또는 업데이트 
            if(output[0][0].SUCCESS==0){
                query = `INSERT INTO group_answer(SCREENING_ID, SAID,QUESTION_GROUP_ID,  SUB_QUESTION_ID,ANSWER_SOURCE_VALUE, ANSWERDTC) values(${screening_id}, ${said}, ${question_group_id},${sub_question_id}, '${answer}','${today}');`;
                
            }else{
                query = `UPDATE group_answer SET SCREENING_ID=${screening_id}, SAID= ${said}, QUESTION_GROUP_ID=${question_group_id },SUB_QUESTION_ID=${sub_question_id}, ANSWER_SOURCE_VALUE= '${answer}', ANSWERDTC='${today}'  WHERE SAID=${connection.escape(said)} AND SCREENING_ID = ${connection.escape(screening_id)} AND QUESTION_GROUP_ID=${connection.escape(question_group_id)} AND SUB_QUESTION_ID=${connection.escape(sub_question_id)}`;

            }
          
            await connection.query(query);

            let group_answer_id = 0;
            query = `SELECT LAST_INSERT_ID() as id;`;
            output = await connection.query(query);
            console.log({group_answer_id:output[0][0].id});
            group_answer_id = output[0][0].id;


            //로그 남기기 
            query = `INSERT INTO GROUP_ANSWER_LOG(QUESTION_GROUP_ID, SUB_QUESTION_ID, ANSWER_SOURCE_VALUE, ANSWERDTC, SAID, SCREENING_ID, GROUP_ANSWER_ID,WHO, WHO_ID, HOW, LOGDTC) values(${question_group_id}, ${sub_question_id}, '${answer}','${today}',${said},${screening_id},${group_answer_id},'대상자', ${applid},'CREATE','${today}')`;
            console.log(query);
            await connection.query(query);
        }
        console.log("서브 응답 저장완료.")
        let result = {
            code:200,
            rows:1,
            output: "success"
        }
        
        return result ;

    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            out: err
        }
        return result
    }finally{
        connection.release();
    }    
}
//스크리닝 불러오기 응답
async function screening_load_screening(body){
    //모바일앱에서 스크리닝 저장한 응답 불러오기.
    // said로 조회 그대로 출력.
    let data = body;
    let said = data.said;



    let pool ='';
    let connection ='';
    try{
        pool = await mysql.createPool(setting);
        connection  = await pool.getConnection(async conn => conn)
        let query ='';
        let output ={};
       
        
        query = `SELECT * FROM screening_answer WHERE said = ${said}`;


        output.screening_answer = await connection.query(query);
        
        query = `SELECT * FROM group_answer WHERE said = ${said}`;
        output.group_answer = await connection.query(query);

        query = `select idx, SUBMITDTC, last_updatedtc , SFILEPATH, SFILENAME from survey_subject  where screening_id=1 and SAID=${said}  ORDER BY idx desc limit 1`
        output.pdf = await connection.query(query);

        let result = {
            code:200,
            rows:1,
            output: {
                screening_pdf:  output.pdf[0],
                screening_answer: output.screening_answer[0],
                group_answer: output.group_answer[0]
            }
        }
        
        return result;

    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: -1,
            out: err
        }
        return result
    }finally{
        connection.release();
    }    
}



function Print_log(name, lot, message){
    console.error({
        function_name: name, 
        location: lot,
        message: message
    })
}

function output_result(code, rows, out){
    var result = {
        code:code,
        rows:rows,
        output: out
    }
    return result;
}

async function test(query){
    let pool = await mysql.createPool(setting);
    try{
        let connection  = await pool.getConnection(async conn => conn)
        let output = await connection.query(query);

        connection.release();

        var result ={
            code: 200,
            rows: output[0].length,
            output: output[0]
        }
        return result

    }catch(err){
        console.error({err:err})
        var result = {
            code: 500,
            rows: 0,
            output: err
        }
        return result
    }
}

module.exports = { 
    user_create_join,
    user_read_login, 
    user_read_qrcode,
    user_read_appl_history,
    user_read_appl_detail,
    user_read_appl_pwd,
    user_update_appl_detail,
    user_update_appl_pwd,
    user_read_consent,
    user_update_pushchk,

    study_read_all_recruiting,
    study_read_detail,
    study_create_favorite,
    study_read_favorite,
    study_read_study_applicant,
    study_create_enroll_apply,
    study_update_enroll_cancle,
    study_update_const_appl,
    study_update_const_lar,
    study_create_const_withdraw,
    study_read_qna,
    study_create_qna,
    study_update_const_start,
    study_update_const_start_output_site,

    study_update_const_start_get_subject_sign,

    mystudy_create_request,
    mystudy_read_status_appl,
    mystudy_read_detail,
    mystudy_read_all_consent,
    mystudy_read_consent_appl,
    mystudy_read_consent_stdgrp,
    mystudy_create_visit,
    mystudy_read_consent_isend,

    

    user_create_join_with_pass,
    study_update_const_check,

    screening_get_screening,
    screening_set_screening,
    screening_load_screening,



    user_read_qrcode_test

}
