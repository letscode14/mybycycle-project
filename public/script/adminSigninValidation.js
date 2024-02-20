const form = document.querySelector("form");
const formEmpty = document.querySelector(".form-empty");
const email = document.getElementById("email-login");
const notValidEmail = document.querySelector(".notvalid-email");
const password = document.getElementById("password-login");
const notvalidPassword = document.querySelector(".notvalid-password");
//regex
const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/;

form.addEventListener("submit", (event) => {
  if (email.value.trim() !== "" && password.value.trim() !== "") {
    if (emailRegex.test(email.value.trim())) {
      if (passwordRegex.test(password.value.trim())) {
      } else {
        validateSignin(notValidEmail, event);
      }
    } else {
      validateSignin(notValidEmail, event);
    }
  } else {
    validateSignin(formEmpty, event);
  }
});
function validateSignin(notvalid, event) {
  event.preventDefault();
  notvalid.classList.add("valid");
  setTimeout(() => {
    notvalid.classList.remove("valid");
  }, 800);
}
