function getNumFromStr(numText) {
  const regexpNum = /\d+/;
  let num;
  if (numText.match(regexpNum)) {
    num = numText.match(regexpNum)[0];
    num = !isNaN(parseInt(num)) ? parseInt(num) : undefined;
    return num;
  }
}

function getUrlSourceNum(urlPathName) {
  // let urlPathName = window.location.pathname;
  let pathNameSegments = urlPathName.split("/");
  // console.log(pathNameSegments);
  return pathNameSegments[pathNameSegments.length - 1];
}

function todayStr() {
  let date = new Date();
  let day = date.getDate();
  day = day < 10 ? "0" + day : day;
  let month = date.getMonth() + 1;
  month = month < 10 ? "0" + month : month;
  let year = date.getFullYear();

  let todayString = `${year}-${month}-${day}`;
  console.log(todayString);
  return todayString;
}

function checkEmptyFields(fieldDict) {
  let isEmptyField = false;
  Object.keys(fieldDict).forEach((item) => {
    fieldDict[item] =
      typeof fieldDict[item] === "string"
        ? fieldDict[item].trim()
        : fieldDict[item];

    if (fieldDict[item] === "" || fieldDict[item] === undefined) {
      isEmptyField = true;
    }
  });
  if (isEmptyField) {
    // message = "Please fill in all fields !";
    let message = "請填寫必要資訊";
    return {
      error: true,
      message: message,
    };
  }
  return isEmptyField;
}

function checkValidEmail(email) {
  const emailRegExp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  let isValidEmail = emailRegExp.test(email);
  if (!isValidEmail) {
    let message = "請輸入有效 Email";
    return {
      error: true,
      message: message,
    };
  }

  return isValidEmail;
}

function checkValidPhoneNumber(phoneNum) {
  const phoneNumRegExp = /^09\d{8}$/;
  let isValidEmailphoneNum = phoneNumRegExp.test(phoneNum);
  if (!isValidEmailphoneNum) {
    let message = "請輸入有效的手機號碼";
    return {
      error: true,
      message: message,
    };
  }

  return isValidEmailphoneNum;
}

export default {
  getNumFromStr: getNumFromStr,
  getUrlSourceNum: getUrlSourceNum,
  todayStr: todayStr,
  checkEmptyFields: checkEmptyFields,
  checkValidEmail: checkValidEmail,
  checkValidPhoneNumber: checkValidPhoneNumber,
};
