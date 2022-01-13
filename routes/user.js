const express = require('express');
const mysql = require('../controllers/mysql');
const valid = require('../controllers/validation');
const router = express.Router();

//회원가입
router.post('/', async (req, res, next)=>{
    console.log({req_body:req.body});
    
    try{
        let data = req.body,
            result = {};

        if(
            (data.name==undefined) || (data.email==undefined) || (data.pwd==undefined) ||
                    (data.hp==undefined) || (data.birth==undefined) || (data.sex==undefined)
        ){
            result = {
                code: 500,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
            //날짜 형식
            if(valid.dateValidation(data.birth)){
                result = {
                    code: 500,
                    rows: 0,
                    output: '날짜 형식을 확인하세요.'
                }
                res.send(result);
                return;
            }
            //성별
            if(valid.sexValidation(data.sex)){
                result = {
                    code: 500,
                    rows: 0,
                    output: '성별을 확인하세요.'
                }
                res.send(result);
                return;
            }
            //email 형식
            if(valid.emailValidation(data.email)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'email 형식을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_create_join(data.name, data.email, data.pwd, data.hp,
                data.birth, data.sex);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});


//회원가입_PASS 적용
router.post('/join', async (req, res, next)=>{
    console.log({req_body:req.body});
    try{
        var data = req.body;
        if(
            (data.name==undefined) || 
            (data.email==undefined) ||
            (data.birth==undefined) ||
            (data.pwd==undefined) ||
            (data.hp==undefined) ||
            (data.sex==undefined) ||
            //pass 정보
            (data.pass_customer_code==undefined) ||
            (data.pass_result_code==undefined) ||
            (data.pass_result_msg==undefined) ||
            (data.pass_result_name==undefined) ||
            (data.pass_result_birthday==undefined) ||
            (data.pass_result_sex_code==undefined) ||
            (data.pass_result_local_forigner_code==undefined) ||
            (data.pass_di==undefined) ||
            (data.pass_ci==undefined) ||
            (data.pass_ci_update==undefined) ||
            (data.pass_tel_com_code==undefined) ||
            (data.pass_cellphone_no==undefined) ||
            (data.pass_return_msg==undefined) ||
            (data.pass_tx_seq_no==undefined) 

            ){
            var result = {
                code: 500,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //chk birth
            console.log({birth:data.birth})
            if(data.birth.length!=10 && data.birth.split('-').length==3){
                var result = {
                    code: 500,
                    output: '생일 입력값을 확인하세요.'
                }
                res.send(result);
                return;
            }            
            //chk birth type
            var year = Number(data.birth.substring(0, 4));
            var month = Number(data.birth.substring(5, 7));
            var day = Number(data.birth.substring(8, 10));
            if( month<1 || month>12 ) {
                var result = {
                    code: 500,
                    output: '입력값을 확인하세요.'
                }
                res.send(result);
                return;
            }            
            var maxDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            var maxDay = maxDaysInMonth[month-1];
            if( month==2 && ( year%4==0 && year%100!=0 || year%400==0 ) ) {
                maxDay = 29;
            }
            if( day<=0 || day>maxDay ) {
                var result = {
                    code: 500,
                    output: '입력값을 확인하세요.'
                }
                res.send(result);
                return;
            }            
            //sex
            if(data.sex !=1 && data.sex !=2 ){
                var result = {
                    code: 500,
                    output: '입력값을 확인하세요.'
                }
                res.send(result);
                return;              
            }
            //email 
            if(data.email.indexOf('@')==-1 || data.email.indexOf('.')==-1){
                var result = {
                    code: 500,
                    output: '입력값을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        //var out =  await mysql.user_create_join(req.body.name, req.body.email, req.body.pwd, req.body.hp, req.body.birth, req.body.sex);
        //PASS적용
        var out =  await mysql.user_create_join_with_pass(req.body);
        res.send(out);
    }catch(err){
        console.log({err:err});
    }
});






//로그인
router.post('/login', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.email==undefined) || (data.pwd==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        } else {
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
            //email 형식
            if(valid.emailValidation(data.email)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'email 형식을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_read_login(data.email, data.pwd);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//QR코드 확인
router.post('/qrcode', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_read_qrcode(data.applid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});
//QR코드 확인
router.post('/test', async (req, res)=>{
    console.log({req_body:req.body});

    try{
       
        let out = await mysql.user_read_qrcode_test();
        res.send(out.output[0]);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//참여이력조회
router.post('/appl-history', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_read_appl_history(data.applid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//내정보 보기
router.post('/appl-detail', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_read_appl_detail(data.applid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//내정보 수정 - 패스워드 체크
router.post('/appl-pwdcheck', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined) || (data.subjpwd==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_read_appl_pwd(data.applid, data.subjpwd);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//내정보 수정 - 수정
router.post('/appl-modify', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined) || (data.applpwd==undefined) || (data.applsex==undefined) ||
                    (data.applphonenum==undefined) || (data.applbrthdtc==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
            //날짜 형식
            if(valid.dateValidation(data.applbrthdtc)){
                result = {
                    code: 500,
                    rows: 0,
                    output: '날짜 형식을 확인하세요.'
                }
                res.send(result);
                return;
            }
            //성별
            if(valid.sexValidation(data.applsex)){
                result = {
                    code: 500,
                    rows: 0,
                    output: '성별을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_update_appl_detail(data.applid, data.applpwd, data.applsex,
                data.applphonenum, data.applbrthdtc);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//비밀번호 변경
router.post('/change-pwd', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.email==undefined) || (data.pwd==undefined) || (data.newpwd==undefined) ||
                    (data.newpwd2==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
            //email 형식
            if(valid.emailValidation(data.email)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'email 형식을 확인하세요.'
                }
                res.send(result);
                return;
            }
            //newpwd2 check 
            if(data.newpwd != data.newpwd2){
                result = {
                    code: 500,
                    rows: 0,
                    output: '입력값을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_update_appl_pwd(data.email, data.pwd, data.newpwd);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//자원자가 서명한 동의서(한 개) 보기
router.post('/consent', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.sid==undefined) || (data.consentid==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_read_consent(data.sid, data.consentid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//Push 알람 수신 여부 저장
router.post('/push', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined) || (data.pushchk==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: '입력값을 확인하세요.'
            }
            res.send(result);
            return;
        }else{
            //missing
            if(valid.missingValidation(data)){
                result = {
                    code: 500,
                    rows: 0,
                    output: 'missing값을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.user_update_pushchk(data.applid, data.pushchk);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

module.exports = router;
