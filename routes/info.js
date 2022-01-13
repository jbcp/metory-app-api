const express = require('express');
const mysql = require('../controllers/mysql');
const valid = require('../controllers/validation');
const router = express.Router();
const request = require('request');

let subject_ip = "Insert a ip of the subject site"


router.get('/signup-privacy', async (req, res, next)=>{
    console.log({req_body:req.body});
    try{
        request(`${subject_ip}/config/privacy.txt`, function(err, response, body){
            let result = {
                "code":"200",
                "rows":"1",
                "output":body
            }
            //res.send(body);
            res.send(result);
        });
    }catch(err){
        console.log({err:err});
    }
});

//연구별 개인정보 이용 동의 
//파라미터는 연구번호를 받는다.
// sid
router.post('/privacy', async (req, res, next)=>{
    console.log({req_body:req.body});
    try{
        //sid 값 유효한지 판단
        //sid에 값에 맞는 내용 전달
        request(`${subject_ip}/config/privacy_app.txt`, function(err, response, body){
            let result = {
                "code":"200",
                "rows":"1",
                "output":body
            }
            //res.send(body);
            res.send(result);
        });
    }catch(err){
        console.log({err:err});
    }
});



router.post('/ip', async (req, res, next)=>{
    console.log({req_body:req.body});
    let site_ip = "Insert_site IP"
    try{
        let result = {
            "code":"200",
            "rows":"1",
            "output":{site_ip: site_ip, subject_ip:subject_ip}
        }
        //res.send(body);
        res.send(result);
    }catch(err){
        console.log({err:err});
    }
});




module.exports = router;
