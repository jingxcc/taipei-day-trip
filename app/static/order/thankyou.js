// import lib from "../shared/lib.js";
const messageDescription = document.querySelectorAll(".message__description");

const urlParams = new URLSearchParams(window.location.search);
let orderId = urlParams.get("number");

messageDescription[0]["textContent"] = `訂單編號：${orderId}`;
// messageDescription[1]["textContent"] = `付款狀態：${orderId}`;
