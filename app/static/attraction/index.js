// get images, information
// add images, information in the page

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
