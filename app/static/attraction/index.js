// get images, information
// add images, information in the page

// Carousel
let currentImageIndex = 0;

function changeCarouselIndex(addNum) {
  showCarouselImage((currentImageIndex += addNum));
}

function showCarouselImage(imageNum) {
  const images = document.getElementsByClassName("carousel__images");

  if (imageNum > images.length - 1) {
    currentImageIndex = 0;
  }

  if (imageNum < 0) {
    currentImageIndex = images.length - 1;
  }
  for (let i = 0; i < images.length; i++) {
    images[i].style.display = "none";
  }

  images[currentImageIndex].style.display = "block";
  console.log(`show images: ${currentImageIndex}`);
}

showCarouselImage(currentImageIndex);
