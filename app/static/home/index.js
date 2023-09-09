let attractionNextPageNum = 0;
const DEFAULT_PAGE_NUM = 0;
let isFetchingData = false;
const attractionContent = document.getElementById("attractionContent");
const footer = document.getElementById("footer");

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

const listBarList = document.getElementById("listBarList");
const listBarPrevBtn = document.getElementById("listBarPrevBtn");
const listBarNextBtn = document.getElementById("listBarNextBtn");

async function addAttractionItems(keyword) {
  let url = new URL(`${window.location.origin}/api/attractions?`);
  let urlParams = new URLSearchParams(url.search);
  let paramValues = {
    page: attractionNextPageNum,
    keyword: keyword,
  };

  // console.log(paramValues);

  urlParams.set("page", paramValues["page"]);
  if (keyword !== "") {
    urlParams.set("keyword", paramValues["keyword"]);
  }

  url += urlParams.toString();
  if (paramValues["page"] !== null) {
    try {
      isFetchingData = true;
      const response = await fetch(url);

      if (response.ok) {
        const result = await response.json();
        isFetchingData = false;

        // console.log(`get next page data : ${attractionNextPageNum}`);
        // console.log(result);

        attractionNextPageNum = result["nextPage"];
        const fragment = document.createDocumentFragment();

        if (result["data"].length > 0) {
          result["data"].forEach((attraction) => {
            const card = document.createElement("div");
            card.innerHTML = `
              <div class="card">
                <div class="card__image-block">
                  <img
                    class="card__img"
                    src=""
                    alt="attraction"
                  />
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
            const cardImg = card.querySelector(".card__image-block > img");
            if (attraction["images"] !== null) {
              cardImg.setAttribute("src", attraction["images"][0]);
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
        } else if (paramValues["page"] === 0) {
          const attractionNoResult = document.createElement("div");
          const styleList = ["content"];
          attractionNoResult.classList.add(...styleList);
          attractionNoResult.textContent = "找不到資料";

          attractionContent.appendChild(attractionNoResult);
        }
      }
    } catch (err) {
      isFetchingData = false;
      console.error(`Error: ${err}`);
    }
  }
}

// observer
function scrollAddAttractions(attractionKeyword) {
  attractionNextPageNum = 0;

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.5,
  };

  let observerScrollCallBack = (entries, observerScroll) => {
    entries.forEach((entry) => {
      if (
        entry.isIntersecting &&
        attractionNextPageNum !== null &&
        !isFetchingData
      ) {
        addAttractionItems(attractionKeyword);

        // console.log(`go to next page: ${attractionNextPageNum}`);
      } else if (attractionNextPageNum === null) {
        observerScroll.disconnect();
      }
    });
    // }
  };

  let observerScroll = new IntersectionObserver(
    observerScrollCallBack,
    observerOptions
  );
  observerScroll.observe(footer);
  // }
}

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    let contentRange = document.createRange();
    contentRange.selectNodeContents(attractionContent);
    contentRange.deleteContents();

    let inputKeyword = searchInput.value.trim();
    // console.log(`enter inputKeyword: ${inputKeyword}`);

    scrollAddAttractions(inputKeyword);
  }
});

searchBtn.addEventListener("click", () => {
  let contentRange = document.createRange();
  contentRange.selectNodeContents(attractionContent);
  contentRange.deleteContents();

  let inputKeyword = searchInput.value.trim();
  // console.log(`button inputKeyword: ${inputKeyword}`);

  scrollAddAttractions(inputKeyword);
});

async function addListBarItems() {
  const url = "/api/mrts";
  try {
    const response = await fetch(url);
    if (response.ok) {
      const result = await response.json();
      const styleClass = ["list-bar__item", "body"];
      const fragment = document.createDocumentFragment();

      result["data"].forEach((item) => {
        const listBarItem = document.createElement("button");
        listBarItem.classList.add(...styleClass);
        listBarItem.textContent = item;
        fragment.appendChild(listBarItem);
      });
      listBarList.appendChild(fragment);
    }
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

listBarPrevBtn.addEventListener("click", () => {
  listBarList.scrollLeft -= 800;
});

listBarNextBtn.addEventListener("click", () => {
  listBarList.scrollLeft += 800;
});

listBarList.addEventListener("click", (e) => {
  // console.dir(e.target);
  // console.dir(e.target.textContent);

  let contentRange = document.createRange();
  contentRange.selectNodeContents(attractionContent);
  contentRange.deleteContents();

  // searchInput.textContent = e.target.textContent;
  searchInput.value = e.target.textContent;

  // console.log(`item listBarList: ${searchInput.value}`);

  scrollAddAttractions(searchInput.value);
});

document.addEventListener("DOMContentLoaded", () => {
  scrollAddAttractions("");
  addListBarItems();
});
