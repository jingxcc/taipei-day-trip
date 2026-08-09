import { checkLogInStatus, getAuthHeaders } from "../shared/auth.js";
import { DISPLAY_TIME_SLOT, PLACEHOLDER_IMAGE } from "../shared/constants.js";

const CART_ERROR_MESSAGES = {
  get: {
    500: "購物車資料取得失敗，請稍後再試。",
    default: "無法取得購物車資料，請稍後再試。",
  },
  delete: {
    404: "找不到這筆預訂，可能已被刪除，請重新整理頁面",
    500: "刪除購物車資料失敗，請稍後再試",
    default: "無法刪除購物車資料，請稍後再試",
  },
};

const deleteDialog = document.getElementById("cartDeleteDialog");
const deleteDialogMask = document.getElementById("cartDeleteDialogMask");
let pendingDeleteBookingId = null;

function openDeleteDialog(bookingId) {
  pendingDeleteBookingId = bookingId;
  deleteDialog.classList.add("block");
  deleteDialogMask.classList.add("block");
}

function closeDeleteDialog() {
  pendingDeleteBookingId = null;
  deleteDialog.classList.remove("block");
  deleteDialogMask.classList.remove("block");
}

async function fetchBooking() {
  const apiUrl = `/api/bookings`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const result = await response.json();

    if (!response.ok) {
      const error = new Error(
        CART_ERROR_MESSAGES.get[response.status] ||
          CART_ERROR_MESSAGES.get.default,
      );
      error.status = response.status;
      throw error;
    }
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);

    if (err.status) {
      throw err;
    }
    throw new Error(CART_ERROR_MESSAGES.get.default);
  }
}

async function deleteBooking(bookingId) {
  const apiUrl = `/api/booking/${bookingId}`;

  try {
    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    const result = await response.json();

    if (!response.ok) {
      const error = new Error(
        CART_ERROR_MESSAGES.delete[response.status] ||
          CART_ERROR_MESSAGES.delete.default,
      );
      error.status = response.status;
      throw error;
    }
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);

    if (err.status) {
      throw err;
    }
    throw new Error(CART_ERROR_MESSAGES.delete.default);
  }
}

function showEmptyCart() {
  document.getElementById("cartContent").classList.add("hidden");
  document.getElementById("cartEmptyState").classList.remove("hidden");
  document.getElementById("cartErrorState").classList.add("hidden");
  document.getElementById("footer").classList.add("booking-footer--empty");
}

function createCartItem(booking) {
  const fragment = document.getElementById("cartItemTemplate");
  const item = fragment.content.cloneNode(true);

  const imageBlock = item.querySelector(".attraction-list__image-block");
  imageBlock.querySelector(".attraction-list__image").src =
    booking.attraction.image || PLACEHOLDER_IMAGE;
  imageBlock.classList.toggle(
    "attraction-list__image-block--placeholder",
    !booking.attraction.image,
  );
  item.querySelector(".attraction-list__attraction").textContent =
    booking.attraction.name;
  item.querySelector(".attraction-list__link").href =
    `/attraction/${booking.attraction.id}`;
  item.querySelector(".attraction-list__date").textContent = booking.date;
  item.querySelector(".attraction-list__time").textContent =
    DISPLAY_TIME_SLOT[booking.time] || booking.time;
  item.querySelector(".attraction-list__price").textContent =
    `新台幣 ${booking.price} 元`;
  item.querySelector(".attraction-list__address").textContent =
    booking.attraction.address;

  const bookingSelect = item.querySelector(".attraction-list__select");
  bookingSelect.value = booking.id;
  bookingSelect.dataset.price = booking.price;
  item.querySelector(".attraction-list__delete-btn").dataset.bookingId =
    booking.id;
  return item;
}

function showCart(bookings) {
  document.getElementById("cartContent").classList.remove("hidden");
  document.getElementById("cartEmptyState").classList.add("hidden");
  document.getElementById("cartErrorState").classList.add("hidden");
  document.getElementById("footer").classList.remove("booking-footer--empty");

  const cartList = document.getElementById("cartList");
  cartList.replaceChildren(...bookings.map(createCartItem));
  const firstBookingSelect = cartList.querySelector(".attraction-list__select");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cartTotal = document.getElementById("cartTotal");
  firstBookingSelect.checked = true;
  checkoutBtn.disabled = false;
  cartTotal.textContent = `新台幣 ${firstBookingSelect.dataset.price} 元`;
}

function showCartError(message) {
  document.getElementById("cartContent").classList.add("hidden");
  document.getElementById("cartEmptyState").classList.add("hidden");
  document.getElementById("cartErrorState").classList.remove("hidden");
  document.querySelector("#cartErrorState p").textContent = message;
  document.getElementById("footer").classList.add("booking-footer--empty");
  document.getElementById("cartHeadlineMessage").textContent =
    " 您好，目前無法載入購物車。";
}

async function loadCart() {
  try {
    const result = await fetchBooking();
    result.data.length > 0 ? showCart(result.data) : showEmptyCart();
  } catch (error) {
    console.error(error);
    showCartError(error.message || CART_ERROR_MESSAGES.get.default);
  }
}

document.getElementById("cartList").addEventListener("change", (event) => {
  if (event.target.matches(".attraction-list__select")) {
    document.getElementById("cartTotal").textContent =
      `新台幣 ${event.target.dataset.price} 元`;
    document.getElementById("checkoutBtn").disabled = false;
  }
});

document.getElementById("cartList").addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".attraction-list__delete-btn");
  if (!deleteButton) return;

  openDeleteDialog(deleteButton.dataset.bookingId);
});

document
  .getElementById("cartDeleteConfirmBtn")
  .addEventListener("click", async () => {
    if (!pendingDeleteBookingId) return;

    const bookingId = pendingDeleteBookingId;
    try {
      await deleteBooking(bookingId);
      closeDeleteDialog();
      await loadCart();
    } catch (error) {
      console.error(error);
      closeDeleteDialog();

      alert(error.message || CART_ERROR_MESSAGES.delete.default);
    }
  });

document
  .getElementById("cartDeleteCancelBtn")
  .addEventListener("click", closeDeleteDialog);
deleteDialog
  .querySelector(".dialog__close-btn")
  .addEventListener("click", closeDeleteDialog);
deleteDialogMask.addEventListener("click", closeDeleteDialog);

document.getElementById("checkoutBtn").addEventListener("click", () => {
  const selectedBooking = document.querySelector(
    'input[name="booking-selection"]:checked',
  );
  if (selectedBooking) {
    window.location.href = `/checkout/${selectedBooking.value}`;
  }
});

const loginInfo = await checkLogInStatus();
if (loginInfo.status) {
  document.querySelector(".header__username").textContent =
    loginInfo.userInfo.data.name;
  await loadCart();
}
