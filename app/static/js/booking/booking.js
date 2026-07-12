import auth from "../shared/auth.js";

let loginInfo;
const bookingDisplayTime = {
  beforenoon: "08:00 - 11:00",
  afternoon: "13:00 - 16:00",
};

const demoData = {
  contact: {
    phone: "0912345678",
  },
  card: {
    number: "4242424242424242",
    expirationDate: "12/34",
    ccv: "123",
  },
};

const bookingDeleteBtn = document.getElementById("bookingDeleteBtn");
const fillDemoDataBtn = document.getElementById("fillDemoDataBtn");

async function getBookingData() {
  let apiUrl = `/api/booking`;
  let logInToken = localStorage.getItem("logInToken");
  try {
    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${logInToken}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

async function displayBookingData() {
  const mainContent = document.getElementById("mainContent");
  const messageEmptyState = document.getElementById("messageEmptyState");
  const footer = document.getElementById("footer");

  let bookingData = await getBookingData();
  localStorage.setItem("bookingData", JSON.stringify(bookingData));

  if (bookingData["data"]) {
    mainContent.classList.remove("hidden");
    footer.classList.remove("booking-footer--empty");
    messageEmptyState.classList.add("hidden");

    const bookingImg = document.querySelector(".attraction-list__image");
    const bookingAttractionName = document.querySelector(
      ".attraction-list__attraction",
    );
    const bookingDate = document.querySelector(".attraction-list__date");
    const bookingTime = document.querySelector(".attraction-list__time");
    const bookingPrice = document.querySelector(".attraction-list__price");
    const bookingAttractionAddress = document.querySelector(
      ".attraction-list__address",
    );
    const confirmTotal = document.querySelector(".confirm-info__total");

    bookingImg.setAttribute("src", bookingData["data"]["attraction"]["image"]);

    bookingAttractionName.textContent =
      bookingData["data"]["attraction"]["name"];
    bookingDate.textContent = bookingData["data"]["date"];
    bookingTime.textContent = "beforenoon"
      ? bookingDisplayTime["beforenoon"]
      : bookingDisplayTime["afternoon"]; // tmp
    bookingPrice.textContent = `新台幣 ${bookingData["data"]["price"]} 元`;
    bookingAttractionAddress.textContent =
      bookingData["data"]["attraction"]["address"];

    confirmTotal.textContent = `新台幣 ${bookingData["data"]["price"]} 元`; // tmp
  } else {
    mainContent.classList.add("hidden");
    footer.classList.add("booking-footer--empty");
    messageEmptyState.classList.remove("hidden");
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

async function deleteBookingData() {
  let apiUrl = `/api/booking`;
  let logInToken = localStorage.getItem("logInToken");
  try {
    const response = await fetch(apiUrl, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${logInToken}`,
      },
    });
    if (response.ok) {
      const result = await response.json();
      return result;
    }
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return false;
}

bookingDeleteBtn.addEventListener("click", async () => {
  let deleteResult = await deleteBookingData();
  deleteResult;
  if (deleteResult) {
    // displayBookingData();
    alert("刪除成功");
    location.reload();
  } else {
    // alert("Unknown Error. Please try again later.");
    alert("刪除失敗，請稍後再試 !");
  }
});

fillDemoDataBtn.addEventListener("click", () => {
  document.querySelector(".info-form__phone").value = demoData.contact.phone;
});

function displayCardDemoData() {
  document.getElementById("demo-card-number").textContent =
    demoData.card.number;
  document.getElementById("demo-card-expiration-date").textContent =
    demoData.card.expirationDate;
  document.getElementById("demo-card-ccv").textContent = demoData.card.ccv;
}

loginInfo = await auth.checkLogInStatus();
displayUserData();
displayBookingData();
displayCardDemoData();
