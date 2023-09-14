async function getAttractionData() {
  let urlPathName = window.location.pathname;
  let pathNameSegments = urlPathName.split("/");
  let attractionId = pathNameSegments[pathNameSegments.length - 1];

  // page num is over then existing data

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
  console.log(attractionData);
}

// Carousel
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
  console.log(`show images: ${currentImageIndex}`);
}

showCarouselImage(currentImageIndex);
displayAttractionData();
