const requireInputs = document.querySelector(".add-category");
const emptyMsg = document.querySelector(".addcategory-msg");
const addCategoryForm = document.querySelector("form");

const regex = /^[A-Za-z0-9\s]+$/;

addCategoryForm.addEventListener("submit", (event) => {
  if (requireInputs.value.trim() === "") {
    validateAddcategory(emptyMsg, "All Contents Must Be Added", event);
  } else {
    if (regex.test(requireInputs.value.trim())) {
    } else {
      validateAddcategory(emptyMsg, "Give Valid Names For the Category", event);
    }
  }
});

function validateAddcategory(notvalid, message, event) {
  event.preventDefault();
  notvalid.innerHTML = message;
  notvalid.classList.add("addproducts-msg-visible");
  setTimeout(() => {
    notvalid.classList.remove("addproducts-msg-visible");
  }, 2000);
  setTimeout(() => {
    notvalid.innerHTML = "All Contents Must Be Added";
  }, 2500);
}
