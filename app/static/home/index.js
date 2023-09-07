// tmp
let keyword = "";

let attractionPageNum = 0;
const DEFAULT_PAGE_NUM = 0;
const API_DELAY = 600;
const attractionContent = document.getElementById("attractionContent");
const footer = document.getElementById("footer");
const listBarList = document.getElementById("listBarList");
const listBarPrevBtn = document.getElementById("listBarPrevBtn");
const listBarNextBtn = document.getElementById("listBarNextBtn");

async function addListAttractionItems(page = DEFAULT_PAGE_NUM, keyword) {
  let url = new URL(`${window.location.origin}/api/attractions?`);
  let urlParams = new URLSearchParams(url.search);
  let paramValues = {
    page: page,
    keyword: keyword,
  };

  for (const key in paramValues) {
    if (paramValues[key] !== undefined) {
      urlParams.set(key, paramValues[key]);
    }
  }
  url += urlParams.toString();

  try {
    const response = await fetch(url);
    if (response.ok) {
      const result = await response.json();
      const fragment = document.createDocumentFragment();
      attractionPageNum = result["nextPage"];

      console.log(`get next page data : ${page}`);

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
    }
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

// observer
const observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: 0.5,
};

// function debounceScroll(func, delay) {
//   let timeId;
//   return () => {
//     const context = this;
//     const args = arguments;

//     console.log(context);
//     console.log(args);
//     console.log(func);
//     clearTimeout(timeId);
//     timeId = setTimeout(() => {
//       func.apply(context, args);
//     }, delay);
//   };
// }

// function throttle(func, delay) {
//   let previousTime = 0;
//   return function (...args) {
//     const nowTime = new Date().getDate();

//     if (nowTime - previousTime > delay) {
//       func.apply(this, args);
//       previousTime = nowTime;
//     }
//   };
// }

let observerScrollCallBack = (entries, observerScroll) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && attractionPageNum !== null) {
      setTimeout(() => {
        addListAttractionItems(attractionPageNum);
      }, API_DELAY);

      console.log(`go to next page: ${attractionPageNum}`);
    } else if (attractionPageNum === null) {
      observerScroll.disconnect();
    }
  });
};

let observerScroll = new IntersectionObserver(
  observerScrollCallBack,
  observerOptions
);

observerScroll.observe(footer);

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

addListAttractionItems();
addListBarItems();
