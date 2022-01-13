const express = require('express');
const mysql = require('../controllers/mysql');
const valid = require('../controllers/validation');
const router = express.Router();

//내연구 동의서 설명요청
router.post('/add-request', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.applid==undefined) || (data.said==undefined) || (data.consentid==undefined) ||
                    (data.nowdtc==undefined)
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
            if(valid.dateValidation(data.nowdtc)){
                result = {
                    code: 500,
                    rows: 0,
                    output: '날짜 형식을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.mystudy_create_request(data.applid, data.said, data.consentid,
                data.nowdtc);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//내연구 자원자의 연구 상태 및 예약 정보 및 QR정보
router.post('/status-appl', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.said==undefined)
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

        let out = await mysql.mystudy_read_status_appl(data.said);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//내연구 자원자 모든 동의서 리스트
router.post('/all-consent', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.said==undefined)
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

        let out = await mysql.mystudy_read_all_consent(data.said);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//내연구 현재 참여중인 연구 정보 보기
router.post('/', async (req, res)=>{
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

        let out = await mysql.mystudy_read_detail(data.applid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//내연구 진행중 연구의 동의 그룹별 최근 동의서 리스트
router.post('/consent-stdgrp', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.said==undefined) || (data.sid==undefined)
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

        let out = await mysql.mystudy_read_consent_stdgrp(data.said, data.sid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//내연구 방문 예약하기
router.post('/add-visit', async (req, res)=>{
    console.log({req_body:req.body});

    try{
        let data = req.body,
            result = {};

        if(
            (data.said==undefined) || (data.visitdtc==undefined) || (data.sid==undefined)
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
            if(valid.dateValidation(data.visitdtc)){
                result = {
                    code: 500,
                    rows: 0,
                    output: '날짜 형식을 확인하세요.'
                }
                res.send(result);
                return;
            }
        }

        let out = await mysql.mystudy_create_visit(data.said, data.visitdtc, data.sid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

//내연구 현재 참여중인 연구의 동의서 종료 확인
router.post('/const-isend', async (req, res)=>{
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

        let out = await mysql.mystudy_read_consent_isend(data.csid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

module.exports = router;
