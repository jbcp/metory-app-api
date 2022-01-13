const express = require('express');
const mysql = require('../controllers/mysql');
const valid = require('../controllers/validation');
const router = express.Router();

//스크리닝 질문지 가져오기
router.post('/', async (req, res)=>{
    //body값
    //sid
    console.log({req_body:req.body});
    

    try{
        let out = await mysql.screening_get_screening(req.body.sid);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});

// 스크리닝 질문지 저장하기.
router.post('/save', async (req, res)=>{
    //body값
    //said, screening_id, responses: [{screening_question_id, aswer, today} 리스트들]
    // {
    //     said:1,
    //     screening_id:12,
    //     today:"2021-01-03 12:12",
    //     responses_answer: [
    //         {screening_question_id: 1,
    //         answer: "날짜"},
    //          {
    //              ...
    //          },
    //       ],
    //      responses_sub_answer: [
    //               ...
    //]
    // }
    console.log({req_body:req.body});
    

    try{
        let out = await mysql.screening_set_screening(req.body);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});


// 스크리닝 질문지 저장하기.
router.post('/load', async (req, res)=>{
   
    console.log({req_body:req.body});
    
    //body
    // said
    try{
        let out = await mysql.screening_load_screening(req.body);
        res.send(out);
        return;
    }catch(err){
        console.log({err:err});
    }
});


module.exports = router;

