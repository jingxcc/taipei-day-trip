import { checkLogInStatus } from "../shared/auth.js";
import { PLACEHOLDER_IMAGE } from "../shared/constants.js";

const DEFAULT_PAGE_NUM = 0;
const ATTRACTION_ERROR_MESSAGES = {
  default: "景點資料載入失敗，請稍後再試",
};

let attractionNextPageNum = DEFAULT_PAGE_NUM;
let isFetchingData = false;
const attractionContent = document.getElementById("attractionContent");
const footer = document.getElementById("footer");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const listBarList = document.getElementById("listBarList");
const listBarPrevBtn = document.getElementById("listBarPrevBtn");
const listBarNextBtn = document.getElementById("listBarNextBtn");
const listBar = document.querySelector(".list-bar");
const hero = document.querySelector(".hero");
let listBarScrollWidth = window.innerWidth * 0.5;

async function addAttractionItems(keyword) {
  let url = new URL(`${window.location.origin}/api/attractions?`);
  const urlParams = new URLSearchParams(url.search);
  const paramValues = {
    page: attractionNextPageNum,
    keyword: keyword,
  };
  const isFirstPage = paramValues.page === DEFAULT_PAGE_NUM;

  urlParams.set("page", paramValues["page"]);
  if (keyword !== "") {
    urlParams.set("keyword", paramValues["keyword"]);
  }

  url += urlParams.toString();
  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok) {
      const error = new Error(ATTRACTION_ERROR_MESSAGES.default);
      error.status = response.status;
      throw error;
    }

    attractionNextPageNum = result["nextPage"];
    const fragment = document.createDocumentFragment();

    if (result["data"].length > 0) {
      result["data"].forEach((attraction) => {
        const card = document.createElement("div");

        card.innerHTML = `
              <a class="card" href="/attraction/${attraction.id}">
                <div class="card__image-block">
                  <img class="card__img" src="" alt="attraction" />
                  <div class="card__img-overlay weight-bold">
                    <span class="card__img-text">暫無圖片</span>
                  </div>
                  <div class="card__title body weight-bold">
                    <p 
                      class="card__title-text" 
                      title=""
                    >
                    </p>
                  </div>
                </div>
                <div class="card__info body">
                    <span></span>
                    <span></span>
                </div>
              
            `;
        const cardImgBlock = card.querySelector(".card__image-block");
        const cardImg = cardImgBlock.querySelector(".card__img");

        if (attraction["images"] !== null) {
          cardImg.onerror = () => {
            showPlaceholder(cardImgBlock);
          };

          cardImg.setAttribute("src", attraction["images"][0]);
        } else {
          showPlaceholder(cardImgBlock);
        }

        const cardTitleText = card.querySelector(".card__title-text");
        cardTitleText.setAttribute("title", attraction["attraction_name"]);
        cardTitleText.textContent = attraction["attraction_name"];

        const cardInfoSpans = card.querySelectorAll(".card__info > span");
        cardInfoSpans.forEach((cardInfoSpan, idx) => {
          if (idx === 0 && attraction["mrt"] !== null) {
            cardInfoSpan.textContent = attraction["mrt"].join("/");
          } else if (idx === 1) {
            cardInfoSpan.textContent = attraction["category"];
          }
        });
        fragment.appendChild(card);
      });

      attractionContent.appendChild(fragment);
    } else if (isFirstPage) {
      const attractionNoResult = document.createElement("div");
      const styleList = ["content"];
      attractionNoResult.classList.add(...styleList);
      attractionNoResult.textContent = "找不到資料";

      attractionContent.appendChild(attractionNoResult);
    }
  } catch (err) {
    console.error(`Error: ${err}`);

    if (err.status) {
      throw err;
    }

    throw new Error(ATTRACTION_ERROR_MESSAGES.default);
  }
}

async function addAttractions(attractionKeyword) {
  if (attractionNextPageNum !== null && !isFetchingData) {
    isFetchingData = true;

    try {
      await addAttractionItems(attractionKeyword);
    } catch (err) {
      attractionContent.textContent = err.message;
    } finally {
      isFetchingData = false;
    }
  }
}

function showPlaceholder(imageBlock) {
  imageBlock.classList.add("card__image-block--placeholder");

  imageBlock.querySelector(".card__img").src = PLACEHOLDER_IMAGE;
  imageBlock.querySelector(".card__img-overlay").classList.add("show");
}

// observer
let attractionObserver = null;
async function scrollAddAttractions(attractionKeyword) {
  attractionObserver?.disconnect();

  attractionNextPageNum = DEFAULT_PAGE_NUM;
  await addAttractions(attractionKeyword);

  if (attractionNextPageNum === null) {
    return;
  }

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.5,
  };

  const observerScrollCallBack = async (entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        await addAttractions(attractionKeyword);
      }
      if (attractionNextPageNum === null) {
        observer.disconnect();
      }
    }
  };

  attractionObserver = new IntersectionObserver(
    observerScrollCallBack,
    observerOptions,
  );
  attractionObserver.observe(footer);
}

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    let contentRange = document.createRange();
    contentRange.selectNodeContents(attractionContent);
    contentRange.deleteContents();

    let inputKeyword = searchInput.value.trim();

    scrollAddAttractions(inputKeyword);
  }
});

searchBtn.addEventListener("click", () => {
  let contentRange = document.createRange();
  contentRange.selectNodeContents(attractionContent);
  contentRange.deleteContents();

  let inputKeyword = searchInput.value.trim();

  scrollAddAttractions(inputKeyword);
});

async function addListBarItems() {
  const url = "/api/mrts";
  try {
    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok) {
      const error = new Error("捷運站資料載入失敗");
      error.status = response.status;
      throw error;
    }

    if (!Array.isArray(result.data) || result.data.length === 0) {
      hideListBar();
      return;
    }

    const styleClass = ["list-bar__item", "body"];
    const fragment = document.createDocumentFragment();

    result.data.forEach((item) => {
      const listBarItem = document.createElement("button");
      listBarItem.classList.add(...styleClass);
      listBarItem.textContent = item;
      fragment.appendChild(listBarItem);
    });
    listBarList.appendChild(fragment);

    listBarScrollWidth = listBarList.clientWidth * 0.7;
  } catch (err) {
    console.error(`Error: ${err}`);
    hideListBar();
  }
}

function hideListBar() {
  listBar.classList.add("list-bar--hidden");
  hero.classList.replace("mb-40", "mb-20");
}

listBarPrevBtn.addEventListener("click", () => {
  listBarList.scrollLeft -= listBarScrollWidth;
});

listBarNextBtn.addEventListener("click", () => {
  listBarList.scrollLeft += listBarScrollWidth;
});

listBarList.addEventListener("click", (e) => {
  let contentRange = document.createRange();
  contentRange.selectNodeContents(attractionContent);
  contentRange.deleteContents();

  searchInput.value = e.target.textContent;

  scrollAddAttractions(searchInput.value);
});

checkLogInStatus();

addListBarItems();
scrollAddAttractions("");
