const productName = document.querySelector(".product-name");
const price = document.querySelector(".price");
const quantity = document.querySelector(".quantity");
const frameMtr = document.querySelector(".frame-mtr");
const brake = document.querySelector(".brake");
const suspension = document.querySelector(".suspension");
const weight = document.querySelector(".weight");
const gear = document.querySelector(".gear");
const brand = document.querySelector(".brand");
const user = document.querySelector(".user-type");
const form = document.querySelector("form");
const contentnotAdded = document.querySelector(".addproducts-msg");
const allInputs = document.querySelectorAll('input:not([type="file"])');

const colorInputs = document.querySelectorAll('input[name="color"]');
const frameSizeInputs = document.querySelectorAll('input[name="framesize"]');
const descriptionInputs = document.querySelectorAll(
  'input[name="description"]'
);
const fileInputs = document.querySelectorAll(".formFileMultiple");

const numberInputs = document.querySelectorAll('input[type="number"]');
const regex = /^[A-Za-z0-9\s.]+$/;

function validateInput() {
  for (const input of allInputs) {
    if (regex.test(input.value.trim())) {
      return true;
    } else {
      return false;
    }
  }
}
form.addEventListener("submit", (event) => {
  const hasNonEmptyColor = Array.from(colorInputs).some(
    (input) => input.value.trim() !== ""
  );
  const hasColorvalid = Array.from(colorInputs).some((input) =>
    regex.test(input.value.trim())
  );
  const hasFrameSizevalid = Array.from(frameSizeInputs).some((input) =>
    regex.test(input.value.trim())
  );
  const hasdescriptionValid = Array.from(descriptionInputs).some((input) =>
    regex.test(input.value.trim())
  );
  const hasNonEmptyFrameSize = Array.from(frameSizeInputs).some(
    (input) => input.value.trim() !== ""
  );
  const hasNonEmptyDescription = Array.from(descriptionInputs).some(
    (input) => input.value.trim() !== ""
  );
  const areNumbersPositive = Array.from(numberInputs).every(
    (input) => !isNaN(input.value) && parseFloat(input.value) >= 0
  );

  const hasAtLeastOneImage = Array.from(fileInputs).some((fileInput) => {
    const files = fileInput.files;
    return (
      files.length > 0 &&
      Array.from(files).every((file) => isImageFile(file.name))
    );
  });

  if (
    productName.value.trim() === "" ||
    price.value.trim() === "" ||
    quantity.value.trim() === "" ||
    frameMtr.value.trim() === "" ||
    brake.value.trim() === "" ||
    suspension.value.trim() === "" ||
    weight.value.trim() === "" ||
    gear.value.trim() === "" ||
    brand.value.trim() === "" ||
    user.value.trim() === ""
  ) {
    validateAddproducts(contentnotAdded, "All contents must be added", event);
  } else {
    if (validateInput()) {
      if (hasNonEmptyColor) {
        if (hasNonEmptyFrameSize) {
          if (hasNonEmptyDescription) {
            if (hasColorvalid) {
              if (hasFrameSizevalid) {
                if (hasdescriptionValid) {
                  if (areNumbersPositive) {
                    if (hasAtLeastOneImage) {
                    } else {
                      validateAddproducts(
                        contentnotAdded,
                        "Needed Atleast One Image with [.png, .jppg , .webp, .jpeg] Format",
                        event
                      );
                    }
                  } else {
                    validateAddproducts(
                      contentnotAdded,
                      "Ensure All Number Fields are Positive Numbers",
                      event
                    );
                  }
                } else {
                  validateAddproducts(
                    contentnotAdded,
                    "Give Specific description",
                    event
                  );
                }
              } else {
                validateAddproducts(
                  contentnotAdded,
                  "Give Specific Frame Sizes",
                  event
                );
              }
            } else {
              validateAddproducts(
                contentnotAdded,
                "Give Specific color Names",
                event
              );
            }
          } else {
            validateAddproducts(
              contentnotAdded,
              "Give At least add 1 (color, description, frame)",
              event
            );
          }
        } else {
          validateAddproducts(
            contentnotAdded,
            "Give At least add 1 (color, description, frame)",
            event
          );
        }
      } else {
        validateAddproducts(
          contentnotAdded,
          "Give At least add 1 (color, description, frame)",
          event
        );
      }
    } else {
      validateAddproducts(
        contentnotAdded,
        "Field Should Include Number Or Characters",
        event
      );
    }
  }
});

function isImageFile(filename) {
  const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
  const ext = filename.split(".").pop().toLowerCase();
  return allowedExtensions.includes(ext);
}

function validateAddproducts(notvalid, message, event) {
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
