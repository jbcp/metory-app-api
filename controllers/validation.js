//날짜 형식
function dateValidation(date){
    if(date.length!=10 && date.split('-').length==3) return true;

    var year = Number(date.substring(0, 4));
    var month = Number(date.substring(5, 7));
    var day = Number(date.substring(8, 10));
    if( month<1 || month>12 ) return true;

    var maxDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var maxDay = maxDaysInMonth[month-1];
    if( month==2 && ( year%4==0 && year%100!=0 || year%400==0 ) ) {
        maxDay = 29;
    }
    if( day<=0 || day>maxDay ) return true;

    return false;
}

//성별
function sexValidation(sex){
    if(Number(sex)!=1 && Number(sex)!=2) return true;
    return false;
}

//email 형식
function emailValidation(email){
    if(email.indexOf('@')==-1 || email.indexOf('.')==-1) return true;
    return false;
}

//missing
function missingValidation(body){
    for(key in body){
        if(!body[key]) return true;
    }
    return false;
}

module.exports = {
    dateValidation,
    sexValidation,
    emailValidation,
    missingValidation
}