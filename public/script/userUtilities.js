//for the responsive design

const userSubfilter = document.querySelector(".user-filter");
const subfilter = document.querySelector(".user-subfilter");
const brandFilter = document.querySelector(".brand-filter");
const brandSubfilter = document.querySelector(".brand-subfilter");
const speedSubfilter = document.querySelector(".speed-sub-filter");
const speedFilter = document.querySelector(".speed-filter");
const catFilter = document.querySelector(".category-filter");
const catSubfilter = document.querySelector(".cat-sub-filter");
//for cart empty msg
const checkoutButton = document.querySelectorAll(".cart-empty-checkout");
const cartEmptyalert = document.querySelector(".cart-empty-alert");

catFilter.addEventListener("click", () => {
  catSubfilter.classList.toggle("user-sub-filter-visible");
  catFilter.classList.toggle("fa-plus");
  catFilter.classList.toggle("fa-minus");
});

brandFilter.addEventListener("click", () => {
  brandSubfilter.classList.toggle("user-sub-filter-visible");
  brandFilter.classList.toggle("fa-plus");
  brandFilter.classList.toggle("fa-minus");
});

userSubfilter.addEventListener("click", () => {
  subfilter.classList.toggle("user-sub-filter-visible");
  userSubfilter.classList.toggle("fa-plus");
  userSubfilter.classList.toggle("fa-minus");
});

speedFilter.addEventListener("click", () => {
  speedSubfilter.classList.toggle("user-sub-filter-visible");
  speedFilter.classList.toggle("fa-plus");
  speedFilter.classList.toggle("fa-minus");
});
