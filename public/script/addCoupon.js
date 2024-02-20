const couponCode = document.querySelector(".coupon-code");
const minAmount = document.querySelector(".min-amount");
const discount = document.querySelector(".discount");
const des = document.querySelector(".description");
const validFromDate = document.querySelector(".valid-from-date");
const validToDate = document.querySelector(".valid-to-date");
const addCouponAlert = document.querySelector(".addcoupon-alert");
const form = document.querySelector("form");

form.addEventListener("submit", (event) => {
  const fromDate = new Date(validFromDate.value);
  const toDate = new Date(validToDate.value);
  const currentDate = new Date();

  if (
    (couponCode.value.trim() !== "" &&
      minAmount.value.trim() !== "" &&
      des.value.trim() !== "" &&
      validFromDate.value.trim() !== "" &&
      validToDate.value.trim() !== "",
    discount.value.trim() !== "")
  ) {
    const descriptionRegex = /\S/;
    if (!descriptionRegex.test(des.value.trim())) {
      validateAddCoupon(addCouponAlert, "Description must contain text", event);
      return;
    }

    if (minAmount.value.trim() > 0 && discount.value.trim() > 0) {
      if (fromDate < toDate) {
        if (fromDate >= currentDate) {
          if (discount.value.trim() <= 100) {
            if (couponCode.value.length >= 10) {
            } else {
              validateAddCoupon(
                addCouponAlert,
                "Coupon must be more than 10 charecter long",
                event
              );
            }
          } else {
            validateAddCoupon(
              addCouponAlert,
              "Discount between the range 100 to 0",
              event
            );
          }
        } else {
          validateAddCoupon(
            addCouponAlert,
            "Fromdate must be greater than currentdate",
            event
          );
        }
      } else {
        validateAddCoupon(
          addCouponAlert,
          "Fromdate must be less than To date",
          event
        );
      }
    } else {
      validateAddCoupon(
        addCouponAlert,
        "All number fields should have positive numbers",
        event
      );
    }
  } else {
    validateAddCoupon(addCouponAlert, "Add Every Field", event);
  }
});

function validateAddCoupon(notvalid, message, event) {
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
