const email = document.getElementById("email-login");
const password = document.getElementById("password-login");
const emailOtp = document.getElementById("emailotp-login");
const formEmpty = document.querySelector(".form-empty-login");
const chooseMethod = document.querySelector(".choose-method");
const notvalidEmail = document.querySelector(".notvalid-email-login");
const notvalidPassword = document.querySelector(".notvalid-password-login");
const notvalidemailotp = document.querySelector(".notvalid-emailotp-login ");
const form = document.querySelector("form");

const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;
const passwordRegex =
  /^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-])(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

form.addEventListener("submit", (event) => {
  if (
    password.value.trim() === "" &&
    email.value.trim() === "" &&
    emailOtp.value.trim() === ""
  ) {
    validateSignin(formEmpty, event);
  } else {
    if (email.value.trim() !== "" && emailOtp.value.trim() !== "") {
      validateSignin(chooseMethod, event);
    } else {
      if (password.value.trim() !== "" && emailOtp.value.trim() !== "") {
        validateSignin(chooseMethod, event);
      } else {
        if (emailOtp.value.trim() !== "") {
          if (emailRegex.test(emailOtp.value)) {
          } else {
            validateSignin(notvalidemailotp, event);
          }
        } else {
          if (emailRegex.test(email.value.trim())) {
            if (passwordRegex.test(password.value.trim())) {
            } else {
              validateSignin(notvalidPassword, event);
            }
          } else {
            validateSignin(notvalidEmail, event);
          }
        }
      }
    }
  }
});

function validateSignin(notvalid, event) {
  event.preventDefault();
  notvalid.classList.add("valid");
  setTimeout(() => {
    notvalid.classList.remove("valid");
  }, 800);
}
