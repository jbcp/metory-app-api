const express = require('express');
const mysql = require('../controllers/mysql');
const valid = require('../controllers/validation');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const request = require('request');

//config 읽기
const dataBuffer = fs.readFileSync(path.join(__dirname,"..","config/config.json"));
const dataJSON = dataBuffer.toString()
var config = JSON.parse(dataJSON);

//개발자용 db정보
config = config.dapp;

//연구 모집공고 리스트
router.post('/all-recruiting', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let out = await mysql.study_read_all_recruiting();
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//연구 모집공고 보기
router.post('/detail', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.sid==undefined)
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

        let out = await mysql.study_read_detail(data.sid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//연구 모집공고 즐겨찾기 추가
router.post('/add-favorite', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.sid==undefined) || (data.applid==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: 0
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

        let out = await mysql.study_create_favorite(data.sid, data.applid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 모집공고 즐겨찾기 삭제
router.post('/delete-favorite', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.sid==undefined) || (data.applid==undefined)
        ){
            result = {
                code: 200,
                rows: 0,
                output: 0
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

        let out = await mysql.study_read_favorite(data.sid, data.applid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 자원 - 참여중인 연구 또는 종료된 연구가 있는지
router.post('/enroll/check', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined) || (data.sid==undefined)
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

        let out = await mysql.study_read_study_applicant(data.applid, data.sid);
        res.send(out);
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 자원 - 지원
router.post('/enroll/apply', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined) || (data.sid==undefined)
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
            //참여중인 연구 또는 종료된 연구가 있는지 체크결과 반영
            var chkRes = await mysql.study_read_study_applicant(data.applid, data.sid);
            if(chkRes.output != "참여가능"){
                result = {
                    code: 500,
                    rows: 0,
                    output: chkRes.output
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.study_create_enroll_apply(data.applid, data.sid);
        res.send(out);
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 지원취소
router.post('/enroll/cancle', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined) || (data.said==undefined)
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

        let out = await mysql.study_update_enroll_cancle(data.applid, data.said);
        res.send(out);
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 동의 시작
// 이전에 mystudy/consent-stdgrp 에서 params에서 sid, said를 받고  동의서 리스트 결과값에서 consentid를 받을 수 있음
//said, consentid

router.post('/const-start', async (req, res, next)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.said==undefined) || (data.consentid==undefined)
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
            // if(valid.dateValidation(data.signdtc)){
            //     result = {
            //         code: 500,
            //         rows: 0,
            //         output: '날짜 형식을 확인하세요.'
            //     }
            //     res.send(result);
            //     return;
            // }
        }
        //블록체인 저장; [output, nowtime]
        // 필요 파라미터 
        // site_id, user_id
        let site_nowtime = await mysql.study_update_const_start_output_site(data.said, data.consentid);
        console.log(site_nowtime.output[1]);
        //site_id, protocol_no, channel_name, user_id

        let consent_idx = `${site_nowtime.output[0].SITENAME}consent_${data.consentid}_s${data.said}`;
  //      console.log(output1)

  

        const options = {
            uri:`${config.ip}/api/consent/explanation`, 
            method: 'POST',
            body: {
                channel_name:   site_nowtime.output[0].BCCHANNEL,
                user_id:        site_nowtime.output[0].APPLMAIL,
                
                consent_idx:    consent_idx,
                site_id:        site_nowtime.output[0].SITENAME,
                protocol_no:    site_nowtime.output[0].PRTNO,
                sponsor_id:     site_nowtime.output[0].SPONSORNAME, 
                subject_id:     data.said,
                consent_version: site_nowtime.output[0].CVERSION,
                consent_hash: site_nowtime.output[0].CFILE_HASH,
                consent_explation_start_time: site_nowtime.output[1],

            },  
            json:true
          }
          console.log({options});
          
          request(options, async function(err,response,body){
         
                console.log({err, body});

         
               // DB저장;
                let out =  await mysql.study_update_const_start(data.said, data.consentid, site_nowtime.output[1]);
                res.send(out);
          })


     
        return;
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 동의서 자원자 서명 저장
router.post('/const-appl', async (req, res, next)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.said==undefined) || (data.consentid==undefined) || (data.csname==undefined) || 
                    (data.cssign==undefined) || (data.signdtc==undefined)
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
        
        //블록체인 저장. 아래는 Dapp에서 요청 파라미타 값. 
        // req.body.channel_name == undefined ||
        // req.body.user_id == undefined ||
        // req.body.consent_idx == undefined ||
        // req.body.subject_consent_sign_time == undefined ||
        // req.body.subject_sign_hash == undefined
        let site_nowtime = await mysql.study_update_const_start_output_site(data.said, data.consentid);
        console.log(site_nowtime.output[1]);

        let consent_idx = `${site_nowtime.output[0].SITENAME}consent_${data.consentid}_s${data.said}`;
        // console.log(output1)
       
        let subject_sign_hash  = await mysql.study_update_const_start_get_subject_sign(data.said, data.consentid);
        

        const options = {
            uri:`${config.ip}/api/consent/sign-subject`, 
            method: 'POST',
            body: {
                channel_name:   site_nowtime.output[0].BCCHANNEL,
                user_id:        site_nowtime.output[0].APPLMAIL,

                site_id:        site_nowtime.output[0].SITENAME,
                protocol_no:    site_nowtime.output[0].PRTNO,
                sponsor_id:     site_nowtime.output[0].SPONSORNAME, 
                
                consent_idx:    String(consent_idx),
                subject_consent_sign_time: String(data.signdtc),
                subject_sign_hash: String(subject_sign_hash.output)

            },  
            json:true
          }
          console.log({options});
          request(options,async function(err,response,body){
         
                console.log({err, body});

               // DB저장;
                let out =  await mysql.study_update_const_appl(data.said, data.consentid, data.csname,
                             data.cssign, data.signdtc);
                
                res.send(out);
          })



        // let out = await mysql.study_update_const_appl(data.said, data.consentid, data.csname,
        //         data.cssign, data.signdtc);
        // res.send(out);
        return;
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});
//연구 동의서 서명 체크사항.
router.post('/const-check', async (req, res, next)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(data.consentid==undefined){
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

        let out = await mysql.study_update_const_check(data.consentid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 동의서 법적대리인 서명 저장
router.post('/const-lar', async (req, res, next)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.said==undefined) || (data.consentid==undefined) || (data.csname==undefined) || 
                    (data.cssign==undefined) || (data.signdtc==undefined)
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
            if(valid.dateValidation(data.signdtc)){
                result = {
                    code: 500,
                    rows: 0,
                    output: '날짜 형식을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.study_update_const_lar(data.said, data.consentid, data.csname,
                data.cssign, data.signdtc);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 동의서 동의철회/신청취소
router.post('/const-withdraw', async (req, res, next)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined) || (data.said==undefined)
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

        let out = await mysql.study_create_const_withdraw(data.applid, data.said, data.sid,
                data.siteid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 Q&A 읽기
router.post('/qna/:said', async (req, res, next)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.sid==undefined) || (data.said==undefined)
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

        let out = await mysql.study_read_qna(data.sid, data.said);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 Q&A 작성
router.post('/qna', async (req, res, next)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined) || (data.said==undefined) || (data.qnacontent==undefined)
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

        let out = await mysql.study_create_qna(data.applid, data.said, data.qnacontent);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
        res.send(err);
    }
});

//연구 자원자 동의정보 보기
router.post('/consent-appl', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.csid==undefined)
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

        let out = await mysql.mystudy_read_consent_appl(data.csid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

module.exports = router;
