import auth from "../shared/auth.js";
import utils from "../shared/utils.js";
import { DISPLAY_TIME_SLOT, PLACEHOLDER_IMAGE } from "../shared/constants.js";

let loginInfo;

const DEMO_DATA = {
  contact: {
    phone: "0912345678",
  },
  card: {
    number: "4242424242424242",
    expirationDate: "12/34",
    ccv: "123",
  },
};

const BOOKING_ERROR_MESSAGES = {
  404: "找不到這筆預訂，請返回購物車重新選擇。",
  500: "預訂資料取得失敗，請稍後再試。",
  default: "無法取得預訂資料，請稍後再試。",
};

const fillDemoDataBtn = document.getElementById("fillDemoDataBtn");

async function fetchBookingById() {
  const bookingId = utils.getLastPathSegement(window.location.pathname);
  let apiUrl = `/api/booking/${bookingId}`;
  let logInToken = localStorage.getItem("logInToken");
  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${logInToken}`,
      },
    });
    const result = await response.json();

    if (!response.ok) {
      const error = new Error(
        result.message || BOOKING_ERROR_MESSAGES["default"],
      );
      error.status = response.status;
      throw error;
    }
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);
    throw err;
  }
}

async function displayBookingData() {
  const mainContent = document.getElementById("mainContent");
  const bookingErrorState = document.getElementById("bookingErrorState");
  const footer = document.getElementById("footer");

  try {
    let bookingData = await fetchBookingById();
    localStorage.setItem("bookingData", JSON.stringify(bookingData));

    if (bookingData["data"]) {
      mainContent.classList.remove("hidden");
      footer.classList.remove("booking-footer--empty");
      bookingErrorState.classList.add("hidden");

      const bookingImg = document.querySelector(".attraction-list__image");
      const bookingAttractionName = document.querySelector(
        ".attraction-list__attraction",
      );
      const bookingAttractionLink = document.querySelector(
        ".attraction-list__link",
      );
      const bookingDate = document.querySelector(".attraction-list__date");
      const bookingTime = document.querySelector(".attraction-list__time");
      const bookingPrice = document.querySelector(".attraction-list__price");
      const bookingAttractionAddress = document.querySelector(
        ".attraction-list__address",
      );
      const confirmTotal = document.querySelector(".confirm-info__total");

      bookingImg.setAttribute(
        "src",
        bookingData["data"]["attraction"]["image"] || PLACEHOLDER_IMAGE,
      );
      bookingImg.parentElement.classList.toggle(
        "attraction-list__image-block--placeholder",
        !bookingData["data"]["attraction"]["image"],
      );

      bookingAttractionName.textContent =
        bookingData["data"]["attraction"]["name"];
      bookingAttractionLink.href = `/attraction/${bookingData["data"]["attraction"]["id"]}`;
      bookingDate.textContent = bookingData["data"]["date"];
      bookingTime.textContent =
        DISPLAY_TIME_SLOT[bookingData["data"]["time"]] ||
        bookingData["data"]["time"];
      bookingPrice.textContent = `新台幣 ${bookingData["data"]["price"]} 元`;
      bookingAttractionAddress.textContent =
        bookingData["data"]["attraction"]["address"];

      confirmTotal.textContent = `新台幣 ${bookingData["data"]["price"]} 元`; // tmp
    } else {
      mainContent.classList.add("hidden");
      footer.classList.add("booking-footer--empty");
      bookingErrorState.classList.add("hidden");
    }
  } catch (error) {
    console.error(error);
    mainContent.classList.add("hidden");
    bookingErrorState.classList.remove("hidden");
    footer.classList.add("booking-footer--empty");
    document.getElementById("headlineMessage").textContent =
      " 您好，目前無法載入預訂資訊：";
    document.getElementById("bookingErrorMessage").textContent =
      BOOKING_ERROR_MESSAGES[error.status] || BOOKING_ERROR_MESSAGES["default"];
  }
}

async function displayUserData() {
  if (loginInfo["status"] === true) {
    let result = loginInfo["userInfo"];

    const bookingUsername = document.querySelector(".header__username");
    const contactName = document.querySelector(
      ".contact-form .info-form__name",
    );
    const contactEmail = document.querySelector(
      ".contact-form .info-form__email",
    );

    bookingUsername.textContent = result["data"]["name"];
    contactName.value = result["data"]["name"];
    contactEmail.value = result["data"]["email"];
  }
}

fillDemoDataBtn.addEventListener("click", () => {
  document.querySelector(".info-form__phone").value = DEMO_DATA.contact.phone;
});

function displayCardDemoData() {
  document.getElementById("demo-card-number").textContent =
    DEMO_DATA.card.number;
  document.getElementById("demo-card-expiration-date").textContent =
    DEMO_DATA.card.expirationDate;
  document.getElementById("demo-card-ccv").textContent = DEMO_DATA.card.ccv;
}

loginInfo = await auth.checkLogInStatus();
displayUserData();
displayBookingData();
displayCardDemoData();
