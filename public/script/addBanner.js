const form = document.querySelector(".add-banner-form");
const activeFrom = document.querySelector(".active-from");
const activeTo = document.querySelector(".active-to");
const fileInputs = document.querySelector(".banner-image");
const alerMsg = document.querySelector(".addbanner-msg");

form.addEventListener("submit", (event) => {
  const activeFromDate = new Date(activeFrom.value);
  const activeToDate = new Date(activeTo.value);
  const currentDate = new Date();

  if (activeFrom.value !== "" || activeTo.value !== "") {
    const fileName = fileInputs.files[0] ? fileInputs.files[0].name : null;

    if (fileName) {
      const isImage = isImageFile(fileName);
      if (isImage) {
        if (activeFromDate <= currentDate) {
          validateAddBanner(
            alerMsg,
            "Active From Date must be greater than the current date",
            event
          );
        } else {
          if (activeFromDate < activeToDate) {
          } else {
            validateAddBanner(
              alerMsg,
              "Active To Date must be greater than Active From date",
              event
            );
          }
        }
      } else {
        validateAddBanner(
          alerMsg,
          "Image should be in the form of [.png, .jppg, .webp, .jpeg]",
          event
        );
      }
    } else {
      validateAddBanner(alerMsg, "Please choose an image", event);
    }
  } else {
    validateAddBanner(alerMsg, "Select both dates", event);
  }
});

function isImageFile(filename) {
  const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
  const ext = filename.split(".").pop().toLowerCase();
  return allowedExtensions.includes(ext);
}

function validateAddBanner(notvalid, message, event) {
  event.preventDefault();
  notvalid.innerHTML = message;
  notvalid.classList.add("addbanner-msg-visible");
  setTimeout(() => {
    notvalid.classList.remove("addbanner-msg-visible");
  }, 2000);
  setTimeout(() => {
    notvalid.innerHTML = "All Contents Must Be Added";
  }, 2500);
}
