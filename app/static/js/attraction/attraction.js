import utils from "../shared/utils.js";
import auth from "../shared/auth.js";
let loginInfo;

// Carousel
const carouselPrevBtn = document.getElementById("carouselPrevBtn");
const carouselNextBtn = document.getElementById("carouselNextBtn");
let currentImageIndex = 0;

function changeCarouselIndex(addNum) {
  showCarouselImage((currentImageIndex += addNum));
}

function showCarouselImage(imageNum) {
  const images = document.getElementsByClassName("carousel__images");
  const dots = document.getElementsByClassName("carousel__dot");

  if (imageNum > images.length - 1) {
    currentImageIndex = 0;
  }

  if (imageNum < 0) {
    currentImageIndex = images.length - 1;
  }
  for (let i = 0; i < images.length; i++) {
    images[i].style.display = "none";
  }

  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove("active");
  }

  images[currentImageIndex].style.display = "block";
  dots[currentImageIndex].classList.add("active");
}

// price
const timeInputs = document.querySelectorAll(
  "#attractionFormTime > input[name='time']"
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
  let attractionId = utils.getUrlSourceNum(window.location.pathname);

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

  const carouselImageBlock = document.getElementById("carouselImageBlock");
  const imageFragment = document.createDocumentFragment();
  const carouselDotList = document.getElementById("carouselDotList");
  const dotFragment = document.createDocumentFragment();

  if (attractionData["data"][0]["images"].length > 0) {
    attractionData["data"][0]["images"].forEach((item, idx) => {
      const image = document.createElement("img");
      image.classList.add("carousel__images");
      image.setAttribute("src", item);
      image.setAttribute("alt", "attraction image");

      imageFragment.appendChild(image);

      const dot = document.createElement("span");
      dot.classList.add("carousel__dot");
      dotFragment.appendChild(dot);
    });
    carouselImageBlock.appendChild(imageFragment);
    carouselDotList.appendChild(dotFragment);
  }

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

displayAttractionData();

// booking in attraction page

const attractionBookBtn = document.getElementById("attractionBookBtn");
attractionBookBtn.addEventListener("click", async () => {
  if (loginInfo["status"] !== true) {
    auth.showDialog();
  } else {
    let date = document.querySelector("#attractionFormDate > #date").value;
    let time = "";
    for (let i = 0; i < timeInputs.length; i++) {
      if (timeInputs[i].checked) {
        time = timeInputs[i].value;
        break;
      }
    }

    let priceText = document.querySelector(
      ".attraction__form #formPrice"
    ).textContent;
    let price = utils.getNumFromStr(priceText);

    let attractionId = utils.getNumFromStr(
      utils.getUrlSourceNum(window.location.pathname)
    );

    let requestBody = {
      attractionId: attractionId,
      date: date,
      time: time,
      price: price,
    };
    console.log(requestBody);

    let isEmptyField = false;
    Object.keys(requestBody).forEach((item) => {
      if (requestBody[item] === "" || requestBody[item] === undefined) {
        isEmptyField = true;
      }
    });

    if (!isEmptyField) {
      let result = await addBooking(requestBody);
      console.log(result);

      if (result["ok"]) {
        window.location.href = `${window.location.origin}/booking`;
        alert("預定成功");
      } else {
        alert(result["message"]);
      }
    } else {
      alert("Please fill in all fields !");
    }
  }
});

async function addBooking(requestBody) {
  let apiUrl = `/api/booking`;
  let logInToken = localStorage.getItem("logInToken");
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${logInToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    return result;
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  return false;
}

loginInfo = await auth.checkLogInStatus();
