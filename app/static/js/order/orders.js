import { checkLogInStatus, getAuthHeaders } from "../shared/auth.js";
import { DISPLAY_TIME_SLOT } from "../shared/constants.js";
import { formatPrice } from "../shared/utils.js";

const PAYMENT_STATES = {
  PAID: {
    label: "付款完成",
    className: "paid",
    note: "付款已完成，請依預訂日期與時間參加行程。",
  },
  FAILED: {
    label: "付款失敗",
    className: "failed",
    note: "您可以重新填寫信用卡資訊並付款。",
  },
  PENDING: {
    label: "付款確認中",
    className: "pending",
    note: "付款結果尚未確認，請勿重新付款。",
  },
};
const DEFAULT_STATE = {
  label: "狀態待確認",
  className: "pending",
  note: "目前無法確認付款狀態，請勿重新付款。",
};
const RETRY_PAYMENT_UNAVAILABLE_MESSAGE =
  "此訂單無法重新付款，請重新選擇行程。";
const LOAD_ERROR_MESSAGE = "訂單資料取得失敗，請稍後再試。";

const content = document.getElementById("ordersContent");
const list = document.getElementById("ordersList");
const loadingState = document.getElementById("ordersLoadingState");
const emptyState = document.getElementById("ordersEmptyState");

const errorState = document.getElementById("ordersErrorState");
const reloadBtn = document.getElementById("ordersReloadBtn");

function createOrderItem(order) {
  const orderFragment = document
    .getElementById("orderItemTemplate")
    .content.cloneNode(true);
  const paymentDisplay = PAYMENT_STATES[order.status] || DEFAULT_STATE;
  orderFragment.querySelector(".order-card__number span").textContent =
    order.number;
  const paymentStatusElement = orderFragment.querySelector(
    ".order-card__status",
  );
  paymentStatusElement.textContent = paymentDisplay.label;
  paymentStatusElement.classList.add(
    `order-card__status--${paymentDisplay.className}`,
  );
  const attractionLink = orderFragment.querySelector(".order-card__attraction");
  attractionLink.textContent = order.trip.attraction.name;
  attractionLink.href = `/attraction/${order.trip.attraction.id}`;
  orderFragment.querySelector(".order-card__date").textContent =
    order.trip.date;
  orderFragment.querySelector(".order-card__time").textContent =
    DISPLAY_TIME_SLOT[order.trip.time] || order.trip.time;
  orderFragment.querySelector(".order-card__guests").textContent =
    `${order.guestCount} 人`;
  orderFragment.querySelector(".order-card__price").textContent = formatPrice(
    order.price,
  );
  const paymentNoteElement = orderFragment.querySelector(".order-card__note");
  paymentNoteElement.textContent = paymentDisplay.note;

  if (order.status === "FAILED") {
    if (Number.isSafeInteger(order.bookingId) && order.bookingId > 0) {
      const retryPaymentLink =
        orderFragment.querySelector(".order-card__retry");
      retryPaymentLink.href = `/checkout/${order.bookingId}`;
      retryPaymentLink.classList.remove("hidden");
    } else {
      paymentNoteElement.textContent = RETRY_PAYMENT_UNAVAILABLE_MESSAGE;
    }
  }
  return orderFragment;
}

async function loadOrders() {
  content.setAttribute("aria-busy", "true");
  reloadBtn.disabled = true;
  loadingState.classList.remove("hidden");
  [list, emptyState, errorState].forEach((element) =>
    element.classList.add("hidden"),
  );
  try {
    const response = await fetch("/api/orders", {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(LOAD_ERROR_MESSAGE);
    const result = await response.json();
    if (!Array.isArray(result.data)) throw new Error(LOAD_ERROR_MESSAGE);

    list.replaceChildren(...result.data.map(createOrderItem));
    (result.data.length ? list : emptyState).classList.remove("hidden");
  } catch (error) {
    console.error(error);
    document.getElementById("ordersErrorMessage").textContent =
      LOAD_ERROR_MESSAGE;
    errorState.classList.remove("hidden");
  } finally {
    loadingState.classList.add("hidden");
    content.setAttribute("aria-busy", "false");
    reloadBtn.disabled = false;
  }
}

reloadBtn.addEventListener("click", loadOrders);
document
  .getElementById("navMenuItemOrders")
  .setAttribute("aria-current", "page");
const loginInfo = await checkLogInStatus();
if (loginInfo.status) {
  await loadOrders();
}
