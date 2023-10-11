import auth from "../shared/auth.js";

function displayOrderResult() {
  const messageDescription = document.querySelectorAll(".message__description");

  const urlParams = new URLSearchParams(window.location.search);
  let orderId = urlParams.get("number");

  messageDescription[0]["textContent"] = `訂單編號：${orderId}`;
}

auth.checkLogInStatus();
displayOrderResult();
