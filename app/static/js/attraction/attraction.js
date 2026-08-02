import {
  checkEmptyFields,
  getLastPathSegment,
  getNumFromStr,
  todayStr,
} from "../shared/utils.js";
import {
  checkLogInStatus,
  getAuthHeaders,
  showDialog,
} from "../shared/auth.js";
import { PLACEHOLDER_IMAGE } from "../shared/constants.js";

const dateInput = document.querySelector("#attractionFormDate > #date");
let loginInfo;

const ADD_BOOKING_ERROR_MESSAGES = {
  400: "加入購物車失敗，請稍後再試",
  500: "加入購物車失敗，請稍後再試",
  default: "加入購物車失敗，請稍後再試",
};

// Carousel
const carouselImageBlock = document.getElementById("carouselImageBlock");
const carouselPrevBtn = document.getElementById("carouselPrevBtn");
const carouselNextBtn = document.getElementById("carouselNextBtn");
let currentImageIndex = 0;
const carouselDotList = document.getElementById("carouselDotList");

function changeCarouselIndex(addNum) {
  showCarouselImage((currentImageIndex += addNum));
}

function showCarouselImage(imageNum) {
  const imageItems = document.getElementsByClassName("carousel__item");
  const dots = document.getElementsByClassName("carousel__dot");

  if (imageNum > imageItems.length - 1) {
    currentImageIndex = 0;
  }
  if (imageNum < 0) {
    currentImageIndex = imageItems.length - 1;
  }

  for (let i = 0; i < imageItems.length; i++) {
    imageItems[i].style.display = "none";
  }
  imageItems[currentImageIndex].style.display = "block";

  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active");
  }
  if (dots.length > 0) {
    dots[currentImageIndex].classList.add("active");
  }
}

function setCarouselControlsVisible(isVisible) {
  if (isVisible) {
    carouselPrevBtn.classList.remove("hidden");
    carouselNextBtn.classList.remove("hidden");
    carouselDotList.classList.remove("hidden");
  } else {
    carouselPrevBtn.classList.add("hidden");
    carouselNextBtn.classList.add("hidden");
    carouselDotList.classList.add("hidden");
  }
}

function fillCarouselPlaceholder(carouselItem) {
  carouselItem.classList.add("carousel__item--placeholder");

  const image = document.createElement("img");
  image.classList.add("carousel__image", "carousel__image--placeholder");
  image.setAttribute("src", PLACEHOLDER_IMAGE);
  image.setAttribute("alt", "attraction image");

  const text = document.createElement("div");
  text.classList.add("carousel__placeholder-text", "weight-bold");
  text.textContent = "暫無圖片";

  carouselItem.replaceChildren(image, text);
}

// price
const timeInputs = document.querySelectorAll(
  "#attractionFormTime > input[name='time']",
);
const timePrices = [
  { time: "beforenoon", price: 2000 },
  { time: "afternoon", price: 2500 },
];

function changeTimePrices() {
  const formPrice = document.getElementById("formPrice");

  timeInputs.forEach((input) => {
    if (input.checked) {
      let timeSelected = input.value;

      timePrices.forEach((timePrice) => {
        if (timePrice["time"] === timeSelected) {
          formPrice.textContent = `新台幣 ${timePrice["price"]} 元`;
        }
      });
    }
  });
}

async function getAttractionData() {
  let attractionId = getLastPathSegment(window.location.pathname);

  let apiUrl = `${window.location.origin}/api/attraction/${attractionId}`;
  try {
    const response = await fetch(apiUrl);

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      window.location.href = window.location.origin;
    }
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return false;
}

// add images, information in the page
async function displayAttractionData() {
  let attractionData = await getAttractionData();

  const attractionTitle = document.getElementById("attractionTitle");
  const attractionCategory = document.getElementById("attractionCategory");

  attractionTitle.textContent = attractionData["data"][0]["attraction_name"];

  let mrtText = "";
  if (attractionData["data"][0]["mrt"] !== null) {
    mrtText = `at ${attractionData["data"][0]["mrt"].join("/")}`;
  }

  attractionCategory.textContent = `${attractionData["data"][0]["category"]} ${mrtText}`;

  const infoDescription = document.getElementById("infoDescription");
  const infoAddress = document.getElementById("infoAddress");
  const infoTransport = document.getElementById("infoTransport");

  infoDescription.textContent = attractionData["data"][0]["description"];
  infoAddress.textContent = attractionData["data"][0]["address"];
  infoTransport.textContent = attractionData["data"][0]["transport"];

  const imageFragment = document.createDocumentFragment();
  const dotFragment = document.createDocumentFragment();

  if (attractionData["data"][0]["images"] !== null) {
    attractionData["data"][0]["images"].forEach((item, idx) => {
      const carouselItem = document.createElement("div");
      carouselItem.classList.add("carousel__item");

      const image = document.createElement("img");
      image.classList.add("carousel__image");
      image.setAttribute("src", item);
      image.setAttribute("alt", "attraction image");

      image.onerror = () => {
        image.onerror = null;
        fillCarouselPlaceholder(carouselItem);
      };

      carouselItem.appendChild(image);
      imageFragment.appendChild(carouselItem);

      const dot = document.createElement("span");
      dot.classList.add("carousel__dot");
      dotFragment.appendChild(dot);
    });
  } else {
    const carouselItem = document.createElement("div");
    carouselItem.classList.add("carousel__item");

    fillCarouselPlaceholder(carouselItem);

    imageFragment.appendChild(carouselItem);
  }
  carouselImageBlock.appendChild(imageFragment);
  carouselDotList.appendChild(dotFragment);

  setCarouselControlsVisible(
    attractionData["data"][0]["images"] &&
      attractionData["data"][0]["images"].length > 1,
  );
  showCarouselImage(currentImageIndex);
}

carouselPrevBtn.addEventListener("click", () => {
  changeCarouselIndex(-1);
});

carouselNextBtn.addEventListener("click", () => {
  changeCarouselIndex(1);
});

timeInputs.forEach((input) => {
  input.addEventListener("click", () => {
    changeTimePrices();
  });
});

function setDateInputMin() {
  dateInput.setAttribute("min", todayStr());
}

displayAttractionData();
setDateInputMin();

// booking in attraction page
const attractionBookBtn = document.getElementById("attractionBookBtn");
attractionBookBtn.addEventListener("click", async () => {
  if (loginInfo["status"] !== true) {
    showDialog();
  } else {
    let date = dateInput.value;
    let time = "";
    for (let i = 0; i < timeInputs.length; i++) {
      if (timeInputs[i].checked) {
        time = timeInputs[i].value;
        break;
      }
    }

    let priceText = document.querySelector(
      ".attraction__form #formPrice",
    ).textContent;
    let price = getNumFromStr(priceText);

    let attractionId = getNumFromStr(
      getLastPathSegment(window.location.pathname),
    );

    let requestBody = {
      attractionId: attractionId,
      date: date,
      time: time,
      price: price,
    };

    let checkEmptyResult = checkEmptyFields(requestBody);

    if (!checkEmptyResult["error"]) {
      try {
        await addBooking(requestBody);
        alert("成功加入購物車");
        window.location.href = `${window.location.origin}/cart`;
      } catch (error) {
        alert(error.message || ADD_BOOKING_ERROR_MESSAGES.default);
      }
    } else {
      alert(checkEmptyResult["message"]);
    }
  }
});

async function addBooking(requestBody) {
  let apiUrl = `/api/booking`;
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      const error = new Error(
        ADD_BOOKING_ERROR_MESSAGES[response.status] ||
          ADD_BOOKING_ERROR_MESSAGES.default,
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
    throw new Error(ADD_BOOKING_ERROR_MESSAGES.default);
  }
}

loginInfo = await checkLogInStatus();
