import { checkLogInStatus } from "../shared/auth.js";

function displayOrderResult() {
  const messageDescription = document.querySelectorAll(".message__description");

  const params = new URLSearchParams(window.location.search);
  const orderNo = params.get("number");

  messageDescription[0]["textContent"] = `訂單編號：${orderNo}`;
}

checkLogInStatus();
displayOrderResult();
