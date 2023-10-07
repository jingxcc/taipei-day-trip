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
  console.log(pathNameSegments);
  return pathNameSegments[pathNameSegments.length - 1];
}

export default {
  getNumFromStr: getNumFromStr,
  getUrlSourceNum: getUrlSourceNum,
};
