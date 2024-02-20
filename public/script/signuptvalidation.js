const form = document.querySelector("form");
const formEmpty = document.querySelector(".form-empty");
const notValidEmail = document.querySelector(".notvalid-email");
const notValidPassword = document.querySelector(".notvalid-password");
const passwordNotMatch = document.querySelector(".password-notmatch");
const notValidNumber = document.querySelector(".notvalid-number");
const fname = document.getElementById("fname");
const lname = document.getElementById("lname");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const phoneNumber = document.getElementById("phone-number");

//regex expression
const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/;

const hasSpecialCharacter = /[!@#$%^&*(),.?":{}|<>]/;

// Check for an alphabet character
const hasAlphabet = /[a-zA-Z]/;

// Check for a numeric character
const hasNumber = /\d/;

const hasCountryCode = /^\+\d+/;
const isPhoneNumberValid = /^\+\d{12}$/;

form.addEventListener("submit", (event) => {
  if (
    fname.value.trim() !== "" &&
    lname.value.trim() !== "" &&
    email.value.trim() !== "" &&
    password.value.trim() !== "" &&
    confirmPassword.value.trim() !== "" &&
    phoneNumber.value.trim() !== ""
  ) {
    if (emailRegex.test(email.value.trim())) {
      if (hasSpecialCharacter.test(password.value.trim())) {
        console.log("sep");
        if (hasAlphabet.test(password.value.trim())) {
          console.log("apl");
          if (hasNumber.test(password.value.trim())) {
            console.log("hun");
            if (password.value.length >= 8) {
              if (password.value === confirmPassword.value.trim()) {
                if (hasCountryCode.test(phoneNumber.value.trim())) {
                  if (
                    hasCountryCode.test(phoneNumber.value.trim()) &&
                    isPhoneNumberValid.test(phoneNumber.value.trim())
                  ) {
                  } else {
                    ValidPassword(
                      notValidNumber,
                      "Phone Number Must Be 10 Digit",
                      event
                    );
                  }
                } else {
                  ValidPassword(
                    notValidNumber,
                    "Phone Must Have A Country Code",
                    event
                  );
                }
              } else {
                validateSignup(passwordNotMatch, event);
              }
            } else {
              ValidPassword(
                notValidPassword,
                "Password Must Have 8 charecters",
                event
              );
            }
          } else {
            ValidPassword(
              notValidPassword,
              "Password Must have A number",
              event
            );
          }
        } else {
          ValidPassword(
            notValidPassword,
            "Password must have an alphabet",
            event
          );
        }
      } else {
        ValidPassword(
          notValidPassword,
          "Password must have Special Charecter",
          event
        );
      }
    } else {
      validateSignup(notValidEmail, event);
    }
  } else {
    validateSignup(formEmpty, event);
  }
});
function validateSignup(notvalid, event) {
  event.preventDefault();
  notvalid.classList.add("valid");
  setTimeout(() => {
    notvalid.classList.remove("valid");
  }, 800);
}
//
function ValidPassword(notvalid, message, event) {
  event.preventDefault();
  notvalid.innerHTML = message;
  notvalid.classList.add("valid");
  setTimeout(() => {
    notvalid.classList.remove("valid");
  }, 2000);
}
