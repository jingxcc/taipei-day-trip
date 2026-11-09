import { checkLogInStatus, getAuthHeaders } from "../shared/auth.js";

async function displayOrderResult() {
  const loginInfo = await checkLogInStatus();
  if (!loginInfo.status) return;
  const params = new URLSearchParams(window.location.search);
  const orderNo = params.get("number");
  if (!orderNo) {
    window.location.replace("/orders");
    return;
  }
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(orderNo)}`, {
      headers: getAuthHeaders(),
      cache: "no-store",
    });
    if (response.status === 401) {
      window.location.replace("/");
      return;
    }
    if (response.status === 404) {
      window.location.replace("/orders");
      return;
    }
    if (!response.ok) throw new Error("訂單資料取得失敗");
    const result = await response.json();
    if (result.data.status !== "PAID") {
      window.location.replace("/orders");
      return;
    }
    const orderResult = document.getElementById("orderResult");
    document.getElementById("orderNumber").textContent = result.data.number;
    orderResult.classList.remove("hidden");
  } catch (error) {
    console.error(error);
    document.getElementById("orderError").classList.remove("hidden");
  }
}

displayOrderResult();
