const loader = document.querySelector(".bouncing-loader");

function showLoader() {
  loader.classList.remove("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

export default { showLoader: showLoader, hideLoader: hideLoader };
