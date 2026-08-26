function getNumFromStr(numText) {
  const regexpNum = /\d+/;
  let num;
  const normalizedText = numText.replaceAll(",", "");
  if (normalizedText.match(regexpNum)) {
    num = normalizedText.match(regexpNum)[0];
    num = !isNaN(parseInt(num)) ? parseInt(num) : undefined;
    return num;
  }
}

function formatPrice(price) {
  return `新台幣 ${Number(price).toLocaleString("zh-TW")} 元`;
}

function getLastPathSegment(urlPathName) {
  // let urlPathName = window.location.pathname;
  let pathNameSegments = urlPathName.split("/").filter(Boolean);
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
  return todayString;
}

function checkEmptyFields(fields, message = "請填寫必要資訊") {
  const hasEmptyField = Object.values(fields).some((value) => {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  });

  if (hasEmptyField) {
    return {
      valid: false,
      message,
    };
  }

  return {
    valid: true,
  };
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

export {
  getNumFromStr,
  formatPrice,
  getLastPathSegment,
  todayStr,
  checkEmptyFields,
  checkValidEmail,
  checkValidPhoneNumber,
};
