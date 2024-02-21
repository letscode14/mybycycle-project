//to send otp resent button
const otpResend = document.querySelector(".forgot-resend-msg");
const addtocartTag = document.querySelector(".add-to-cart-button");
const addLabel = document.querySelector(".add-label");
const addressNotAdded = document.getElementById("address-not-add");
const cancelProductmsg = document.getElementById("cancel-product-msg");
const alertButton = document.getElementById("alert-button");
const alertBox = document.querySelector(".modal-body-alert");
const loader = document.querySelector(".loader");
const confirmButton = document.getElementById("confirmAction");
const msgButton = document.getElementById("msg-button");
const modalMsgBody = document.querySelector(".modal-body-msg");
const cancelReasonmodalbutton = document.getElementById("cancel-reason");

var myModal = new bootstrap.Modal(document.getElementById("alertModal"));

function giveAlert(msg) {
  alertButton.click();
  alertBox.innerHTML = msg;
}

function giveMsg(msg, boolean) {
  msgButton.click();
  modalMsgBody.innerHTML = msg;
  if (boolean) {
    loader.innerHTML = `<div class="spinner-border text-danger mx-2" role="status">
                     <span class="visually-hidden">Loading...</span>
                     </div>`;
  }
  return true;
}
//shows cart empty
$(".cart-empty-checkout").on("click", function () {
  giveMsg("Cart is empty", false);
});

$(document).on("click", "#resendotp-button", function () {
  $.ajax({
    url: "/resend_otp",
    method: "GET",
    success: function (response) {
      console.log(response);
      if (response.message) {
        showMsg(response.message, otpResend);
      } else if (response.resendFailed) {
        otpResend.classList.add("valid");
        otpResend.innerHTML = `Resend Failed Try to  <a href="/user_login">login</a>`;
      }
    },
    error: function (error) {
      console.error("Error during logout:", error);
    },
  });
});

//forget password resend otp button

$(document).on("click", "#resend-forgot-button", function () {
  $.ajax({
    url: "/resend_forget_otp",
    method: "GET",
    success: function (response) {
      if (response.message) {
        showMsg(response.message, otpResend);
      }
      if (response.resendFailed) {
        otpResend.classList.add("valid");
        otpResend.innerHTML = `Resend Failed Try   <a href="/submit_phone">Forgot Password</a>`;
      }
    },
  });
});

//resend otp for signup
$(document).on("click", "#signup-resend-otp", function () {
  $.ajax({
    url: "/resend_signup_otp",
    method: "GET",
    success: function (response) {
      if (response.message) {
        showMsg(response.message, otpResend);
      }
      if (response.resendFailed) {
        otpResend.classList.add("valid");
        otpResend.innerHTML = `Resend Failed Try   <a href="/submit_phone">Forgot Password</a>`;
      }
    },
  });
});

//funtion to show resend msg in the page
function showMsg(response, element) {
  element.innerHTML = response;
  element.classList.add("valid", "text-success");

  setTimeout(() => {
    element.classList.remove("valid");
  }, 3000);
  setTimeout(() => {
    element.innerHTML = "Fill the form";
  }, 3500);
}
//user view profile
$(document).ready(function () {
  $(document).on("click", "#view-profile", function () {
    var userId = $(this).data("user-id");
    console.log(userId);
    $.ajax({
      url: "/user/show_profile/" + userId,

      method: "GET", //to view user details
      success: function (_, _, response) {
        if (response.status === 200) {
          window.location.href =
            "/user/show_profile/" + userId;
        }
      },
      error: function (error) {
        console.error("Error updating user status:", error);
      },
    });
  });
});

//get product  details
$(document).ready(function () {
  $(document).on("click", ".view-product", function () {
    var productId = $(this).data("product-id");
    console.log(productId);

    $.ajax({
      url: "/product/" + productId,

      method: "GET", //to view user details
      success: function (_, _, response) {
        if (response.status === 200) {
          window.location.href = "/product/" + productId;
        }
      },
      error: function (error) {
        console.error("Error updating user status:", error);
      },
    });
  });
});
//get user cart

$(document).ready(function () {
  $(document).on("click", "#view_cart", function () {
    var userId = $(this).data("user-id");

    $.ajax({
      url: "/user_cart/" + userId,

      method: "GET", //to view cart details
      success: function (_, _, response) {
        if (response.status === 200) {
          window.location.href = "/user_cart/" + userId;
        }
      },
      error: function (error) {
        console.error("Error updating user status:", error);
      },
    });
  });
});

//add product to cart
$(document).ready(function () {
  $(document).on("click", ".add-to-cart-button", function () {
    var productId = $(this).data("product-id");
    const selectedColors = $("input[name='color']:checked")
      .map(function () {
        return $(this).val();
      })
      .get()
      .join(",");

    const selectedFrameSizes = $("input[name='frameSize']:checked")
      .map(function () {
        return $(this).next().text();
      })
      .get()
      .join(",");
    console.log(selectedFrameSizes);
    console.log(selectedColors);

    const requestData = {
      colors: selectedColors,
      frameSizes: selectedFrameSizes,
    };
    addtoCart(productId, requestData, true);
  });
});
//function to add to cart
//////
function addtoCart(productId, requestData, boolean) {
  $.ajax({
    url: "/add_to_cart/" + productId,
    data: JSON.stringify(requestData),
    contentType: "application/json",
    method: "PUT",
    success: function (_, _, response) {
      if (response.status === 201) {
        if (boolean) {
          showAdded(addtocartTag, addLabel, "ADDED", "ADD TO CART");
        } else {
          giveMsg("Product Added Success Fully");
        }
        let count = $(".cart-count").html();
        count = parseInt(count) + 1;
        $(".cart-count").html(count);
      } else {
        if (boolean) {
          showAdded(addtocartTag, addLabel, "ADDED", "ADD TO CART");
        } else {
          giveMsg("Product Added Success Fully");
        }
      }
    },
    error: function (error) {
      console.error("Error updating user status:", error);
    },
  });
}
///
//add add to cart from wishlist
$(document).ready(function () {
  $(document).on("click", ".wishlist-addtocart-button", function () {
    var proId = $(this).data("product-id");
    var frameSize = $(this)
      .data("product-frame")
      .split(",")
      .filter((items) => {
        if (items !== "") {
          return items;
        }
      });
    var color = $(this)
      .data("product-color")
      .split(",")
      .filter((items) => {
        if (items !== "") {
          return items;
        }
      });
    var msg = "<div>";

    msg += "<h5>Frame Size:</h5><div  class='frame-size-wishlist-select'>";
    frameSize.forEach((size, index) => {
      msg += `
               <div class="form-check">
                   <input
                    class="form-check-input frame-checkbox"
                    type="radio"
                    name="frmsize"
                    value="${size}"
                    checked
                  />
                  <label class="form-check-label fs-6" for="radioOption1">
                    ${size}
                  </label>
              </div>  
        `;
    });
    msg += "</div>";

    msg += "<h5>Color:</h5><div class='color-wishlist-select'>";
    color.forEach((col, index) => {
      msg += `
    <div class="form-check">
      <input name='color' class="form-check-input color-checkbox" type="radio" value="${col}" checked>
      <label class="form-check-label fs-6" for="flexCheckChecked">
        ${col}
      </label>
    </div>
        `;
    });
    msg += "</div>";
    msg += "</div>";

    giveAlert(msg);

    $(document).on("click", "#confirmAction", function () {
      var checkedFrameSizes = $(
        `.frame-size-wishlist-select .frame-checkbox:checked`
      )
        .map(function () {
          return $(this).val();
        })
        .get()
        .join(", ");
      var checkedColors = $(`.color-wishlist-select .color-checkbox:checked`)
        .map(function () {
          return $(this).val();
        })
        .get()
        .join(", ");
      const requestData = {
        colors: checkedColors,
        frameSizes: checkedFrameSizes,
      };

      addtoCart(proId, requestData, false);
      giveAlert("");
    });
  });
});
//
function showAdded(element, label, addmsg, removemsg) {
  element.classList.toggle("btn-outline-dark");
  label.innerHTML = addmsg;
  element.classList.toggle("btn-success");
  setTimeout(() => {
    element.classList.toggle("btn-success");
    label.innerHTML = removemsg;
    element.classList.toggle("btn-outline-dark");
  }, 2500);
}
//
//removing from the cart
$(document).ready(function () {
  $(document).on("click", "#remove-cart-button", function () {
    var productId = $(this).data("product-id");

    alertButton.click();
    alertBox.innerHTML = "Are You sure need to Continue";
    $(document).on("click", "#confirmAction", function (params) {
      $.ajax({
        url: "/remove_cart/" + productId,

        method: "PATCH", //to remove the the product from the cart
        success: function (_, _, response) {
          if (response.status === 200) {
            location.reload();
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    });
  });
});

//changing the quantity

$(document).ready(function () {
  $(document).on("click", "#change_quantity", function () {
    var productId = $(this).data("product-id");
    var id = $(this).data("id");

    const value = $(this).attr("value");

    const data = {
      productId: id,
      value: value,
    };

    $.ajax({
      url: "/change_quantity/" + productId,
      data: JSON.stringify(data),
      contentType: "application/json",
      method: "PATCH", //to change the quantity
      success: function (msg, _, response) {
        if (response.status == 200) {
          location.reload();
        } else if (response.status == 304) {
          giveMsg("Product is not available for this quantity", false);
        }
      },
      error: function (error) {
        console.error("Error updating user status:", error);
      },
    });
  });
});

//get user edit edit adress
$(document).ready(async function () {
  $(document).on("click", "#edit-address", function () {
    var addressId = $(this).data("address-id");
    giveAlert("Do you wish to continue");
    $(document).on("click", "#confirmAction", function (params) {
      $.ajax({
        url: "/user/edit_address/" + addressId,

        method: "GET", //to get edit page of user
        success: function (_, _, response) {
          if (response.status == 200) {
            window.location.href =
              "/user/edit_address/" + addressId;
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    });
  });
});

//change the user passsword

$(document).ready(function () {
  $(document).on("click", "#user-profile-change-password", function () {
    var userId = $(this).data("user-id");
    giveAlert("Do you wish to continue");
    $(document).on("click", "#confirmAction", function (params) {
      $.ajax({
        url: "/user_profile_change_password/" + userId,
        method: "GET",
        success: function (_, _, response) {
          if (response.status) {
            window.location.href =
              "/user_profile_change_password/" + userId;
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    });
  });
});
//change password with otp
$(document).ready(function () {
  $(document).on("click", ".changepassword-with-otp", function () {
    var userId = $(this).data("user-id");
    giveAlert("Do You wish to continue");
    $(document).on("click", "#confirmAction", function (params) {
      giveMsg("Please wait you will be redirected ....", true);
      $.ajax({
        url: "/user_profile_change_password_otp/" + userId,
        method: "GET",
        success: function (response) {
          if (response.otpsend) {
            location.href =
              "/user/user_change_password_submit";
          }
        },

        error: function (error) {
          console.log(error);
        },
      });
    });
  });
});

function submitpassChangeotp(userId) {
  var otp = $("#changepassword-otp").val();
  if (!otp) {
    giveMsg("Enter a Valid OTP", false);
  } else {
    const data = {
      otp: otp,
    };
    $.ajax({
      url: "/verify_password_change_otp/" + userId,
      method: "POST",
      data: data,
      success: function (response) {
        if (response.otpNotvalid) {
          giveMsg(response.message, false);
        } else if (response.otpExpired) {
          giveMsg(response.message, false);
        } else if (response.success) {
          giveMsg(response.message, false);
          myModal._element.addEventListener("hidden.bs.modal", function () {
            window.location.href =
              "/user/change_password_otp/" + response.id;
          });
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  }
}
//resend pass change otp
function resendPassChangeotp() {
  $.ajax({
    url: "/resend_pass_change_otp",
    method: "GET",
    success: function (response) {
      if (response.send) {
        giveMsg(response.message, false);
      }
    },
    error: function () {},
  });
}

function submitOtpassChangeform(userId) {
  const formData = $("#user-profile-otp-change-password-form").serialize();
  $.ajax({
    url: "/user/change/password/" + userId,
    method: "POST",
    data: formData,
    success: function (response) {
      if (response.same) {
        giveMsg(response.message, false);
      } else if (response.redirect) {
        giveMsg(response.message, false);
        myModal._element.addEventListener("hidden.bs.modal", function () {
          window.location.href =
            "/user/show_profile/" + userId;
        });
      }
    },
    error: function () {},
  });
}

//sbumitting the form with necessary data
function profileChangePasswordForm(userId) {
  var formData = $("#user-profile-change-password-form").serialize();

  $.ajax({
    url: "/user/profile_change_password/" + userId,
    data: formData,
    method: "POST",
    success: function (response) {
      if (response.notValidpassword) {
        giveMsg(response.message, false);
      } else if (response.success) {
        giveMsg(response.message, false);
        myModal._element.addEventListener("hidden.bs.modal", function () {
          window.location.href =
            "/user/show_profile/" + userId;
        });
      } else if (response.newPasswordsame) {
        giveMsg(response.message, false);
      }
    },
    error: function () {},
  });
}

//setting the address as primary

function setAsprimary(id) {
  $.ajax({
    type: "PATCH",
    url: `/user/set_primary_address/${id}`,

    success: function (_, _, response) {
      if (response.status == 200) {
        console.log("changed");
      }
    },
    error: function (error) {
      console.error("Error:", error);
    },
  });
}
//
//add a new address
$(document).ready(function () {
  $(document).on("click", "#user-add-address", function () {
    var userId = $(this).data("user-id");
    console.log(userId);
    const data = {
      user: userId,
    };
    $.ajax({
      url: "/user/user_add_address/" + userId,
      data: data,
      method: "GET",
      success: function (response) {
        if (response) {
          window.location.href =
            "/user/user_add_address/" + userId;
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});
//
//to remove a address
$(document).ready(function () {
  $(document).on("click", "#remove-address", function () {
    var addressId = $(this).data("address-id");
    giveAlert("Are you sure that you need to remove the address");
    $(document).on("click", "#confirmAction", function (params) {
      $.ajax({
        url: "/user/delete_address/" + addressId,

        method: "PATCH", //to delete the address
        success: function (_, _, response) {
          if (response.status === 200) {
            location.reload();
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    });
  });
});

//proceed to checkout
$(document).ready(function () {
  $(document).on("click", "#proceed-to-checkout", function () {
    var userId = $(this).data("user-id");

    const data = {
      user: userId,
    };
    $.ajax({
      url: "/user/user_checkout",
      data: data,
      method: "POST", //to get checkout
      success: function (response) {
        if (response.redirect) {
          window.location.href =
            "/user/user_checkout/" + userId;
        } else if (response.status == 500) {
          giveMsg(response.message, false);
        } else if (response.outofStock) {
          giveMsg(response.message, false);
        }
      },
      error: function (error) {
        console.error("Error updating user status:", error);
      },
    });
  });
});

// for the user to add a new address during checkout
function submitcheckoutAddressForm() {
  var formData = $("#checkout-form").serialize();

  $.ajax({
    url: "/user/add_checkout_address",
    data: formData,
    method: "POST", // to add checkOut address
    success: function (response, _, status) {
      console.log(response);
      if (status.status == 200) {
        giveMsg(response.message, false);
        if (addressNotAdded) {
          addressNotAdded.innerHTML = "";
        }
        $("#checkout-form input").val("");

        var addressElement = $(
          '<input data-address-id="' +
            response.address._id +
            '" class="form-check-input" type="radio" name="flexRadioDefault" id="flexRadioDefault1"' +
            (response.address.isPrimary ? " checked" : "") +
            "/>" +
            '<label class="checkout-name">' +
            response.user.fname +
            " " +
            response.user.lname +
            "</label>" +
            '<label class="form-check-label checkout-address" for="flexRadioDefault1">' +
            response.address.homeAddress +
            ", " +
            response.address.locality +
            ", " +
            response.address.city +
            ", " +
            response.address.district +
            ", " +
            response.address.state +
            ", " +
            response.address.postalCode +
            "</label>" +
            '<div class="checkout-address">' +
            response.address.phone[0] +
            "</div>"
        );

        $("#form-checkout").append(addressElement);
      } else {
        console.log("Adding the address Failed");
      }
    },
    error: function (error) {
      console.error("Error updating user status:", error);
    },
  });
}

//adding the coupoon
$(document).ready(function () {
  $(document).on("click", "#add-coupon-button", function () {
    var code = $("#chekout-coupon-code").val();
    var userId = $(this).data("user-id");

    if (code) {
      $.ajax({
        url: "/add_coupon",
        method: "POST",
        data: { code, userId },
        success: function (response) {
          if (response.success) {
            giveMsg(response.message);
            $(".grand-total").html(`₹${response.grandTotal}`);
            $(".coupon-discount").html(`- ₹${response.couponDiscountAmount}`);
          } else if (response.notValid) {
            giveMsg(response.message);
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    } else {
      giveMsg("Provide a Coupon Code");
    }
  });
});

//remove coupon
$(document).ready(function () {
  $(document).on("click", "#remove-coupon-button", function () {
    $.ajax({
      url: "/remove_coupon",
      method: "PATCH",
      success: function (response) {
        console.log(response);
        if (response.success) {
          $(".grand-total").html(`₹ ${response.grandTotal}`);
          $(".coupon-discount").html(`₹ ${0}`);
          giveMsg(response.message);
        } else if (response.notFound) {
          giveMsg(response.message);
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});

const walletAmountCheckout = document.querySelector(".wallet-use-container");
$(document).ready(function () {
  $(document).on("change", "#wallet-checkout", function () {
    // Check if the checkbox is checked
    var userId = $(this).data("user-id");

    if ($(this).is(":checked")) {
      walletAmountCheckout.innerHTML = ` 
      <input type="number" id='wallet-checkout-amount-toapply' placeholder="Enter the amount" class="form-control"> 
      <button id='apply-wallet-amount' data-user-id=${userId} style="font-size: 12px; font-weight:500;" class="mt-1 btn btn-danger">APPLY</button>`;
      $("#apply-wallet-amount").on("click", function () {
        var userId = $(this).data("user-id");

        value = $("#wallet-checkout-amount-toapply").val();

        if (!value) {
          giveMsg("Give a specified amount");
        } else {
          $.ajax({
            url: "/add_wallet_amount/" + userId,
            method: "PATCH",
            data: { value },
            success: function (response) {
              if (response.success) {
                giveMsg(response.message);
                $(".grand-total").html(`₹${response.grandTotal}`);
                $("#wallet-checkout-detail").html(`<span>Wallet</span>
                <span > -₹${value}</span>`);
              } else if (response.notApplied) {
                giveMsg(response.message);
              }
            },
            error: function (error) {
              console.log(error);
            },
          });
        }
      });
    } else {
      walletAmountCheckout.innerHTML = "";
      $.ajax({
        url: "/remove_wallet_amount/" + userId,
        method: "PATCH",
        success: function (response) {
          if (response.grandTotal) {
            $(".grand-total").html(`₹${response.grandTotal}`);
            $("#wallet-checkout-detail").html("");
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    }
  });
});
//place order

$(document).ready(function () {
  $(document).on("click", "#place-order", function () {
    var selectedAddressId = $("input[name='flexRadioDefault']:checked").data(
      "address-id"
    );

    var selectedPaymentMethod = $("input[name='exampleRadios']:checked").val();

    var isWalletUsed = $("input[name='wallet']:checked").val();

    var userId = $(this).data("user-id");
    var formData = {
      addressId: selectedAddressId,
      paymentMethod: selectedPaymentMethod,
      userId: userId,
      wallet: isWalletUsed,
    };
    if (!selectedAddressId) {
      giveMsg("Select an Address", false);
    } else {
      $.ajax({
        url: "/user/place_order",
        method: "POST", //to delete the address
        data: formData,
        success: function (response) {
          if (response.redirect) {
            window.location.href =
              "/user/order_successfull";
          } else if (response.outofStock) {
            giveMsg(response.message, false);
          } else if (response.codNot) {
            giveMsg(response.message, false);
          } else {
            razorpayPayment(response);
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    }
  });
});

//function to complete the payment
function razorpayPayment(order) {
  var options = {
    key: "rzp_test_wJfLNTQmOYjqPY",
    amount: order.order.amount,
    currency: "INR",
    name: "Mybycylce Pvt limited",
    description: "Test Transaction",
    image: "/images/clipart1345268.png",
    order_id: order.order.id,
    handler: function (response) {
      verifyPayment(response, order);
    },
    prefill: {
      name: order.user.fname,
      email: order.user.email,
      contact: order.user.phone[0],
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#dc3545",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
}

function verifyPayment(payment, order) {
  $.ajax({
    url: "/verify_payment",
    data: {
      payment,
      order,
    },
    method: "POST",
    success: function (response) {
      if (response.paymentSuccess) {
        window.location.href = "/user/order_successfull";
      } else if (response.amountAdded) {
        giveMsg(response.message);
        $("#wallet-balance-amount").html(`₹${response.balance}`);
      }
    },
    error: function (error) {
      console.log(error);
    },
  });
}

//to do payment after if the payment is not being done

$(document).ready(function () {
  $(document).on("click", "#complete-payment-button", function () {
    var orderId = $(this).data("order-id");
    giveAlert("Do You Wish To continue");
    $(document).on("click", "#confirmAction", function (params) {
      giveAlert("");
      $.ajax({
        url: "/user/complete_payment/" + orderId,
        method: "GET",
        success: function (response) {
          if (response.outofStock) {
            giveMsg(response.message, false);
          } else {
            razorpayPayment(response);
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    });
  });
});

//to get my orders

$(document).ready(function () {
  $(document).on("click", "#my-orders", function () {
    var userId = $(this).data("user-id");
    console.log(userId);
    $.ajax({
      url: "/user/my-orders/" + userId,
      method: "GET",
      success: function (_, _, response) {
        if (response.status == 200) {
          location.href = "/user/my-orders/" + userId;
        } else if (response.paymentUnsuccess) {
          giveMsg("Payment Failed", false);
        }
      },
      error: function (err) {
        console.log(err);
      },
    });
  });
});
//view order
$(document).ready(function () {
  $(document).on("click", ".order-view", function () {
    var orderId = $(this).data("order-id");
    $.ajax({
      url: "/user/view_order/" + orderId,
      method: "GET",
      success: function (_, _, response) {
        if (response.status == 200) {
          window.location.href =
            "/user/view_order/" + orderId;
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});

//track order

$(document).ready(function () {
  $(document).on("click", "#track-product-button", function () {
    var orderId = $(this).data("order-id");
    $.ajax({
      url: "/track_product/" + orderId,
      method: "GET",
      success: function (_, _, res) {
        if (res.status == 200) {
          location.href = "/track_product/" + orderId;
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});

//to cancel the order
$(document).ready(function () {
  $(document).on("click", "#cancel-product-button", function () {
    var orderId = $(this).data("order-id");

    giveAlert("Are you sure you need to cancel the order");
    $(document).on("click", "#confirmAction", function (params) {
      $(document).on("click", "#flexRadioDefault7", function () {
        $(".text-box").css("display", "block");
      });
      $(document).on("click", function (event) {
        if (!$(event.target).closest("#flexRadioDefault7, .text-box").length) {
          $(".text-box").hide();
        }
      });
      cancelReasonmodalbutton.click();
      $(document).on("click", "#confirm-reason-button", function () {
        let checkedValue = $('input[name="reason"]:checked').val();
        let formData = $("#message-text").val();
        checkedValue = !checkedValue ? "" : checkedValue;
        formData = formData == "" ? "" : formData;

        if (checkedValue !== "on" || formData !== "") {
          giveMsg("Please wait you will  be redirected......", true);
          $.ajax({
            url: "/user/cancel_order/" + orderId,
            method: "PATCH",
            data: { formData, checkedValue },
            success: function (response) {
              if (response.redirect) {
                giveMsg("", false);
                myModal._element.addEventListener(
                  "hidden.bs.modal",
                  function () {
                    window.location.href =
                      "/cancel_product";
                  }
                );
              } else if (response.cancelNotAvailable) {
                giveMsg(response.message, false);
              }
            },
            error: function (error) {
              console.log(error);
            },
          });
        } else {
          $(".cancel-reason-alert").css("opacity", "1");
          setTimeout(() => {
            $(".cancel-reason-alert").css("opacity", "0");
          }, 2000);
        }
      });
    });
  });
});

//submit otp to cancel product
function submitOtp() {
  var otp = $("#otp-cancel-product").val();
  const data = {
    otp: otp,
  };
  if (otp) {
    $.ajax({
      url: "/submit_cancel_otp",
      data: data,
      method: "POST",

      success: function (response) {
        if (response.cancelled) {
          giveMsg(response.message, false);
          myModal._element.addEventListener("hidden.bs.modal", function () {
            window.location.href =
              "/user/my-orders/" + response.id;
          });
        } else {
          modalMsgBody.innerHTML = response.message;
          msgButton.click;
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  } else {
  }
}
//to resend otp for the cancellation
function cancelResendotp() {
  $.ajax({
    url: "/resend_cancel_otp",
    method: "GET",
    success: function (response, _, status) {
      if (response) {
        giveMsg(response.message, false);
      }
    },
    error: function (error) {
      console.log(error);
    },
  });
}

//return user Order

$(document).ready(function () {
  $(document).on("click", "#return-product-button", function () {
    var orderId = $(this).data("order-id");
    giveAlert("Do you wish to continue");
    $(document).on("click", "#confirmAction", function () {
      $(document).on("click", "#flexRadioDefault7", function () {
        $(".text-box").css("display", "block");
      });
      $(document).on("click", function (event) {
        if (!$(event.target).closest("#flexRadioDefault7, .text-box").length) {
          $(".text-box").hide();
        }
      });
      cancelReasonmodalbutton.click();
      $(document).on("click", "#confirm-reason-button", function () {
        let checkedValue = $('input[name="reason"]:checked').val();
        let formData = $("#message-text").val();
        checkedValue = !checkedValue ? "" : checkedValue;
        formData = formData == "" ? "" : formData;

        if (checkedValue !== "on" || formData !== "") {
          $.ajax({
            url: "/user/return_product/" + orderId,
            method: "PATCH",
            data: { formData, checkedValue },
            success: function (response) {
              if (response.success) {
                giveMsg(response.message);
                myModal._element.addEventListener(
                  "hidden.bs.modal",
                  function () {
                    location.reload();
                  }
                );
              }
            },
            error: function (error) {
              console.log(error);
            },
          });
        } else {
          $(".cancel-reason-alert").css("opacity", "1");
          setTimeout(() => {
            $(".cancel-reason-alert").css("opacity", "0");
          }, 2000);
        }
      });
    });
  });
});

//edit user details
$(document).ready(function () {
  $(document).on("click", "#edit-profile", function () {
    var userId = $(this).data("user-id");
    console.log(userId);
    $.ajax({
      url: "/user/edit_profile/" + userId,
      method: "GET",
      success: function (response) {
        if (response) {
          window.location.href =
            "/user/edit_profile/" + userId;
        }
      },
      error: function (err) {
        console.log(err);
      },
    });
  });
});

function submitForm(userId) {
  const formData = $("#edit-user-form").serialize();

  $.ajax({
    url: "/edit_user/" + userId,
    method: "PATCH",
    data: formData,
    success: function (response) {
      if (response.emailChange) {
        giveAlert(response.message);
        $(document).on("click", "#confirmAction", function () {
          giveMsg("Please wait you will be redirected ....", true);
          window.location.href =
            "/user/email_verify/" + userId;
        });
      } else if (response.updated) {
        giveMsg(response.message, false);
        myModal._element.addEventListener("hidden.bs.modal", function () {
          window.location.href =
            "/user/show_profile/" + userId;
        });
      }
    },
    error: function (er) {
      console.log(er);
    },
  });
}

//change user password otp submit
function submitVerifyOtp() {
  const otp = $("#otp-verify-email").val();
  console.log(otp);
  const data = {
    otp: otp,
  };
  if (!otp) {
    giveMsg("Enter A valid OTP", false);
  } else {
    $.ajax({
      url: "/submit_email_verify_otp",
      data: data,
      method: "POST",

      success: function (response) {
        if (response.otpNotvalid) {
          giveMsg(response.message, false);
        } else if (response.otpExpired) {
          giveMsg(response.message, false);
        } else if (response.success) {
          giveMsg(response.message, false);
          myModal._element.addEventListener("hidden.bs.modal", function () {
            window.location.href =
              "/user/show_profile/" + response.id;
          });
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  }
}

function verifyResendotp() {
  $.ajax({
    url: "/resend_email_verify_otp",
    method: "GET",
    success: function (response) {
      if (response.resend) {
        giveMsg(response.message, false);
      }
    },
    error: function (error) {
      console.log(error);
    },
  });
}
//

//user log out
$(document).on("click", "#logout", function () {
  giveAlert("Are you sure? you need to logout");
  $(document).on("click", "#confirmAction", function () {
    $.ajax({
      url: "/user/user_logout",
      method: "POST",
      success: function (_, _, response) {
        console.log(response.status);
        if (response.status === 200) {
          window.location.href = "/user_login";
        }
      },
    });
  });
});

//user actions like filter search
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
////////////////////////////////////////////////////
$(document).ready(function () {
  $(document).on("click", "#price-filter-button", function () {
    var value = $(this).data("criteria-value");
    var checkedFilters = [];
    $(".filter-checkbox:checked").each(function () {
      checkedFilters.push($(this).val());
    });

    $.ajax({
      url: "/user/filter/product",
      method: "POST",
      data: { value, checkedFilters },
      success: function (response) {
        if (response.success) {
          $("#productInfoContainer").empty();
          response.products.forEach((items) => {
            var descriptionHtml = "";
            items.description.forEach((des) => {
              descriptionHtml += ` 
              <label>
               <i class="fa-regular fa-circle"></i>
                ${des}
              </label>`;
            });
            var productHtml = `<div class="col-lg-3 col-md-6 col-sm-12 product">
            <div
              class="bg-white mb-4 product-container"
              
            >
              <div class="d-flex justify-content-between align-items-center">
                <label
                  class="fs-5"
                  style="font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                >${items.productName}</label>
                <i data-product-id=${items._id} class="fs-4 wishlist-button  fa-regular fa-heart"></i>
              </div>
              <div
                style="height:130px;"
                class="d-flex mt-2 justify-content-center view-product"
                data-product-id=${items._id}
              >

                <img
                  src="/uploads/${items.images[0]}"
                  style="height: 100%;"
                />

              </div>
              <div class="product-description" style="height: 100px;">
                ${descriptionHtml}
              </div>
              <div
                style="margin-top:30px; margin-right: 12px; margin-left:12px; border: 0.6px solid #bdbdbd;"
              ></div>
              <div class="mt-3">
                <div>
                  <label class="d-flex align-items-end">
                    <div class="original-price">Price:</div>
                    <span class="discount-price">${items.price}</span>
                  </label>

                </div>
                <div class="d-flex justify-content-end mt-2">
                  <button
                    id="buynow-button"
                    class="btn btn-danger d-flex align-items-center justify-content-center"
                  >
                    <span class="buy-now">BUY NOW</span>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
            $("#productInfoContainer").append(productHtml);
          });
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});

//filter according to the needs

$(document).ready(function () {
  let brandFilter = [];
  let userFilter = [];
  let speedFilter = [];
  let categoryFilter = [];

  function updateFilterArray(container, filterArray) {
    filterArray.length = 0;
    $(container)
      .find(".filter-checkbox:checked")
      .each(function () {
        const value = $(this).val();
        filterArray.push(value);
      });
  }

  function sendDataToServer() {
    const data = {
      brand: brandFilter.length > 0 ? brandFilter : [1],
      user: userFilter.length > 0 ? userFilter : [1],
      speed: speedFilter.length > 0 ? speedFilter : ["z"],
      category:
        categoryFilter.length > 0
          ? categoryFilter
          : ["65a9657af65a86172eba479e"],
    };

    $.ajax({
      type: "POST",
      url: "/user/filter/product_subfilter",
      data: data,
      success: function (response) {
        if (response.notAvailable) {
          giveMsg(response.message, false);
        } else {
          $("#productInfoContainer").empty();
          response.products.forEach((items) => {
            var descriptionHtml = "";
            items.description.forEach((des) => {
              descriptionHtml += ` 
              <label class="text-truncate">
               <i class="fa-regular fa-circle"></i>
                ${des}
              </label>`;
            });
            var productHtml = `<div class="col-lg-3 col-md-4 col-sm-6 col-12 product">
            <div
              class="bg-white mb-4 product-container"
              
            >
              <div class="d-flex justify-content-between align-items-center">
                <label
                  class="fs-5"
                  style="font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                >${items.productName}</label>
                <i  data-product-id=${items._id} class="whishlist-button fs-4 fa-regular fa-heart"></i>
              </div>
              <div
               
                class="d-flex mt-2 justify-content-center view-product product-image"
                data-product-id=${items._id}
              >

                <img
                  src="/uploads/${items.images[0]}"
                  style="height: 100%;  object-fit:cover;"
                />

              </div>
              <div class="product-description" style="height: 100px;">
                ${descriptionHtml}
              </div>
              <div
                style="margin-top:30px; margin-right: 12px; margin-left:12px; border: 0.6px solid #bdbdbd;"
              ></div>
              <div class="mt-3">
                <div>
                  <label class="d-flex align-items-end">
                    <div class="original-price">Price:</div>
                    <span class="discount-price">${items.price}</span>
                  </label>

                </div>
                <div class="d-flex justify-content-end mt-2">
                  <button
                    id="buynow-button"
                    class="btn btn-danger d-flex align-items-center justify-content-center"
                  >
                    <span class="buy-now">BUY NOW</span>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
            $("#productInfoContainer").append(productHtml);
          });
        }
      },
      error: function (error) {
        console.error("Error sending data:", error);
      },
    });
  }

  $(".user-sub-filter .filter-checkbox").change(function () {
    const isChecked = $(this).is(":checked");
    updateFilterArray(".user-sub-filter", userFilter);
    if (isChecked) {
      sendDataToServer();
    } else {
      const valueToRemove = $(this).val();
      const index = userFilter.indexOf(valueToRemove);
      if (index !== -1) {
        userFilter.splice(index, 1);
      }
      sendDataToServer();
    }
  });

  $(".brand-sub-filter .filter-checkbox").change(function () {
    const isChecked = $(this).is(":checked");
    updateFilterArray(".brand-sub-filter", brandFilter);
    if (isChecked) {
      sendDataToServer();
    } else {
      const valueToRemove = $(this).val();
      const index = brandFilter.indexOf(valueToRemove);
      if (index !== -1) {
        brandFilter.splice(index, 1);
      }
      sendDataToServer();
    }
  });

  $(".speed-subfilter .filter-checkbox").change(function () {
    const isChecked = $(this).is(":checked");
    updateFilterArray(".speed-subfilter", speedFilter);
    if (isChecked) {
      sendDataToServer();
    } else {
      const valueToRemove = $(this).val();
      const index = speedFilter.indexOf(valueToRemove);
      if (index !== -1) {
        speedFilter.splice(index, 1);
      }
      sendDataToServer();
    }
  });

  $(".category-subfilter .filter-checkbox").change(function () {
    const isChecked = $(this).is(":checked");
    updateFilterArray(".category-subfilter", categoryFilter);
    if (isChecked) {
      sendDataToServer();
    } else {
      const valueToRemove = $(this).val();
      const index = categoryFilter.indexOf(valueToRemove);
      if (index !== -1) {
        categoryFilter.splice(index, 1);
      }
      sendDataToServer();
    }
  });
  $(document).on("click", ".filter-reset", function () {
    brandFilter = [];
    categoryFilter = [];
    speedFilter = [];
    userFilter = [];
    sendDataToServer();
  });
});

//get to wishlist
$(document).ready(function () {
  $(document).on("click", "#view-wishlist", function () {
    console.log("bhjbhj");
    var userId = $(this).data("user-id");
    $.ajax({
      url: "/user/wishlist/" + userId,
      method: "GET",
      success: function (_, _, response) {
        if (response.status) {
          window.location.href =
            "/user/wishlist/" + userId;
        }
      },
      error: function (error) {
        console.log(error);
        location.href = "/user_login";
      },
    });
  });
});

//user add to wishlist
$(document).ready(function () {
  $(document).on("click", ".whishlist-button", function () {
    var productId = $(this).data("product-id");
    const $clickedIcon = $(this);
    $.ajax({
      url: "/user/add_to_wishlist/" + productId,
      method: "POST",
      success: function (response) {
        if (response.added) {
          $clickedIcon.removeClass("fa-regular").addClass("fa-solid");
          $clickedIcon.css("color", "red");
          $clickedIcon.css("transform", "scale(1.5)");
          setTimeout(function () {
            $clickedIcon.css("transform", "scale(1)");
            $clickedIcon.removeClass("fa-solid").addClass("fa-regular");
            $clickedIcon.css("color", "black");
          }, 1000);
        } else if (response.exist) {
          giveMsg("Already Exist in the wishlist !", false);
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});

//user remove from the wishlist
$(document).ready(function () {
  $(document).on("click", ".wishlist-remove-button", function () {
    var proId = $(this).data("product-id");
    $.ajax({
      url: "/user/remove_from_wishlist/" + proId,
      method: "PATCH",
      success: function (response) {
        if (response.success) {
          giveMsg(response.message);
          $(`.box-${proId}`).empty();
        }
      },
      error: function (response) {},
    });
  });
});

//search for the user

$(document).ready(function () {
  $("#search-bar").on("input", function () {
    var value = $("#search-bar").val();
    $.ajax({
      url: "/user/search_products",
      method: "POST",
      data: { value },
      success: function (response) {
        if (response.product) {
          $("#productInfoContainer").empty();
          response.products.forEach((items) => {
            var descriptionHtml = "";
            items.description.forEach((des) => {
              descriptionHtml += ` 
              <label class="text-truncate">
               <i class="fa-regular fa-circle"></i>
                ${des}
              </label>`;
            });
            var productHtml = `<div class="col-lg-3 col-md-4 col-sm-6 col-12 product">
            <div
              class="bg-white mb-4 product-container"
              
            >
              <div class="d-flex justify-content-between align-items-center">
                <label
                  class="fs-5"
                  style="font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                >${items.productName}</label>
                <i  data-product-id=${items._id} class="whishlist-button fs-4 fa-regular fa-heart"></i>
              </div>
              <div
               
                class="d-flex mt-2 justify-content-center view-product product-image"
                data-product-id=${items._id}
              >

                <img
                  src="/uploads/${items.images[0]}"
                  style="height: 100%;  object-fit:cover;"
                />

              </div>
              <div class="product-description" style="height: 100px;">
                ${descriptionHtml}
              </div>
              <div
                style="margin-top:30px; margin-right: 12px; margin-left:12px; border: 0.6px solid #bdbdbd;"
              ></div>
              <div class="mt-3">
                <div>
                  <label class="d-flex align-items-end">
                    <div class="original-price">Price:</div>
                    <span class="discount-price">${items.price}</span>
                  </label>

                </div>
                <div class="d-flex justify-content-end mt-2">
                  <button
                    id="buynow-button"
                    class="btn btn-danger d-flex align-items-center justify-content-center"
                  >
                    <span class="buy-now">BUY NOW</span>
                  </button>
                </div>
              </div>
            </div>
          </div>`;
            $("#productInfoContainer").append(productHtml);
          });
        } else if (response.notFound) {
          $("#productInfoContainer").empty();
          const productHtml = `<div class="d-flex py-4 align-items-center justify-content-center">
            <div class="fs-5">Search Not Found</div>
          </div>`;
          $("#productInfoContainer").append(productHtml);
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});

//get wallet history

$(document).ready(function () {
  $(document).on("click", "#wallet-history", function () {
    var userId = $(this).data("user-id");

    $.ajax({
      url: "/user/wallet_history/" + userId,
      method: "GET",
      success: function (_, _, response) {
        if (response.status == 200) {
          location.href = "/user/wallet_history/" + userId;
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});

function submitGetTouchForm() {
  var formData = {
    firstName: $("#firstName").val(),
    lastName: $("#lastName").val(),
    email: $("#email").val(),
    subject: $("#subject").val(),
    message: $("#message").val(),
  };

  $.ajax({
    url: "/submit_get_in_touch_form",
    method: "POST",
    contentType: "application/json",
    data: JSON.stringify(formData),
    success: function (response) {
      if (response.success) {
      }
    },
    error: function (error) {
      console.log(error);
    },
  });
}
//place order using buy now button
$(document).ready(function () {
  $(document).on("click", "#buynow-button , #buy-now-button", function () {
    var proId = $(this).data("product-id");
    var userId = $(this).data("user-id");
    var quantity = $(this).data("product-quantity");
    var frameSize = $(this)
      .data("product-frame")
      .split(",")
      .filter((items) => {
        if (items !== "") {
          return items;
        }
      });
    var color = $(this)
      .data("product-color")
      .split(",")
      .filter((items) => {
        if (items !== "") {
          return items;
        }
      });
    var msg = "<div>";
    msg +=
      '<span class="text-dark fw-bold fs-5 mb-2">SELECT VARIANT</span></br>';
    msg += `<span class="fs-6 fw-bold">Frame Size </span><div  class='frame-size-wishlist-select'>`;
    frameSize.forEach((size, index) => {
      msg += `
               <div class="form-check">
                   <input
                    class="form-check-input frame-checkbox"
                    type="radio"
                    name="frmsize"
                    value="${size}"
                    checked
                  />
                  <label class="form-check-label fs-6" for="radioOption1">
                    ${size}
                  </label>
              </div>  
        `;
    });
    msg += "</div>";

    msg += `<span class="fs-6 fw-bold">Color </span><div class='color-wishlist-select my-2'>`;
    color.forEach((col, index) => {
      msg += `
    <div class="form-check">
      <input name='color' class="form-check-input color-checkbox" type="radio" value="${col}" checked>
      <label class="form-check-label fs-6" for="flexCheckChecked">
        ${col}
      </label>
    </div>
        `;
    });
    msg += `<div class="text-dark fw-bold fs-6 my-3">CHOOSE QUANTITY</div>`;
    msg += `<div>`;
    if (quantity !== 0) {
      msg += `<select id="quantity-dropdown" class="form-select" aria-label="Default select example">`;

      for (let i = 1; i <= quantity; i++) {
        msg += `<option value='${i}'>${i}</option>`;
      }
      msg += "</select>";
    } else {
      msg += `<span class="fw-bold mt-2 text-danger fs-6">Out Of Stock</span>`;
    }

    msg += "</div>";
    msg += "</div>";
    msg += "</div>";

    giveAlert(msg);
    $(document).on("click", "#confirmAction", function () {
      var checkedFrameSizes = $(
        `.frame-size-wishlist-select .frame-checkbox:checked`
      )
        .map(function () {
          return $(this).val();
        })
        .get()
        .join(", ");
      var checkedColors = $(`.color-wishlist-select .color-checkbox:checked`)
        .map(function () {
          return $(this).val();
        })
        .get()
        .join(", ");
      var selectedQuantity = $("#quantity-dropdown").val();
      const requestData = {
        colors: checkedColors,
        frameSizes: checkedFrameSizes,
        quantity: selectedQuantity,
      };
      $.ajax({
        url: "/user/buy_now/" + proId,
        method: "POST",

        data: requestData,
        success: function (response) {
          if (response.redirect) {
            location.href =
              "/user/buy_now_checkout/" + userId;
          } else if (response.notAvail) {
            giveMsg(response.message);
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    });
  });
});

//place order using buy now
$(document).ready(function () {
  $(document).on("click", "#place-order-buynow", function () {
    var selectedAddressId = $("input[name='flexRadioDefault']:checked").data(
      "address-id"
    );

    var selectedPaymentMethod = $("input[name='exampleRadios']:checked").val();

    var isWalletUsed = $("input[name='wallet']:checked").val();

    var userId = $(this).data("user-id");
    var formData = {
      addressId: selectedAddressId,
      paymentMethod: selectedPaymentMethod,
      userId: userId,
      wallet: isWalletUsed,
    };
    console.log(formData);
    if (!selectedAddressId) {
      giveMsg("Select an Address", false);
    } else {
      $.ajax({
        url: "/user/place_order_buy_now",
        method: "POST",
        data: formData,
        success: function (response) {
          if (response.redirect) {
            window.location.href =
              "/user/order_successfull";
          } else if (response.outofStock) {
            giveMsg(response.message, false);
          } else if (response.codNot) {
            giveMsg(response.message, false);
          } else {
            razorpayPayment(response);
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    }
  });
});

$(document).ready(function () {
  $(document).on("change", "#wallet-checkout-buynow", function () {
    // Check if the checkbox is checked
    var userId = $(this).data("user-id");

    if ($(this).is(":checked")) {
      walletAmountCheckout.innerHTML = ` 
      <input type="number" id='wallet-checkout-amount-toapply' placeholder="Enter the amount" class="form-control"> 
      <button id='apply-wallet-amount' data-user-id=${userId} style="font-size: 12px; font-weight:500;" class="mt-1 btn btn-danger">APPLY</button>`;
      $("#apply-wallet-amount").on("click", function () {
        var userId = $(this).data("user-id");

        value = $("#wallet-checkout-amount-toapply").val();

        if (!value || value <= 0) {
          giveMsg("Give a valid amount");
        } else {
          $.ajax({
            url: "/add_wallet_amount_buy_now/" + userId,
            method: "PATCH",
            data: { value },
            success: function (response) {
              if (response.success) {
                giveMsg(response.message);
                $(".grand-total").html(`₹${response.grandTotal}`);
                $("#wallet-checkout-detail").html(`<span>Wallet</span>
                <span class="coupon-discount"> -₹${value}</span>`);
              } else if (response.notApplied) {
                giveMsg(response.message);
              }
            },
            error: function (error) {
              console.log(error);
            },
          });
        }
      });
    } else {
      walletAmountCheckout.innerHTML = "";
      $.ajax({
        url: "/remove_wallet_amount_buy_now/" + userId,
        method: "PATCH",
        success: function (response) {
          if (response.grandTotal) {
            $(".grand-total").html(`₹${response.grandTotal}`);
            $("#wallet-checkout-detail").html("");
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    }
  });
});

//adding the coupoon
$(document).ready(function () {
  $(document).on("click", "#add-coupon-button-buynow", function () {
    var code = $("#chekout-coupon-code").val();
    var userId = $(this).data("user-id");

    if (code) {
      $.ajax({
        url: "/add_coupon_buynow",
        method: "POST",
        data: { code, userId },
        success: function (response) {
          if (response.success) {
            giveMsg(response.message);
            $(".grand-total").html(`₹${response.grandTotal}`);
            $(".coupon-discount").html(`- ₹${response.couponDiscountAmount}`);
          } else if (response.notValid) {
            giveMsg(response.message);
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    } else {
      giveMsg("Provide a Coupon Code");
    }
  });
});

//remove coupon
$(document).ready(function () {
  $(document).on("click", "#remove-coupon-button-buynow", function () {
    $.ajax({
      url: "/remove_coupon_buynow",
      method: "PATCH",
      success: function (response) {
        console.log(response);
        if (response.success) {
          $(".grand-total").html(`₹ ${response.grandTotal}`);
          $(".coupon-discount").html(`₹ ${0}`);
          giveMsg(response.message);
        } else if (response.notFound) {
          giveMsg(response.message);
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});

function walleEnterMoney() {
  giveAlert(`<div><div class="fs-6 mb-2 fw-bold text-dark">ENTER THE AMOUNT</div>
  <div><input type="number" id="amount-input" class="form-control">
  </div>
  <div class="fw-bold mt-1" style="font-size:13px; color:gray;">You can add Upto ₹20000</div>
  </div>`);
}

$(document).ready(function () {
  $(document).on("click", "#add-money-button", function () {
    var userId = $(this).data("user-id");
    walleEnterMoney();
    $(document).on("click", "#confirmAction", function () {
      var value = $("#amount-input").val();
      if (!value || value <= 0) {
        giveMsg("Enter a specified Amount");
      } else if (value < 20) {
        giveMsg("Minimum ₹20 is Needed");
      } else {
        $.ajax({
          url: "/add_wallet_money/" + userId,
          method: "POST",
          data: { value },
          success: function (response) {
            if (response.success) {
              AddMoneyrazorpayPayment(response);
            } else if (response.notAllowed) {
              giveMsg(response.message);
              myModal._element.addEventListener("hidden.bs.modal", function () {
                walleEnterMoney();
              });
            }
          },
          error: function (error) {
            console.log(error);
          },
        });
      }
    });
  });
});
//function to add money to the wallet
function AddMoneyrazorpayPayment(order) {
  var options = {
    key: "rzp_test_wJfLNTQmOYjqPY",
    amount: order.order.amount,
    currency: "INR",
    name: "Mybycylce Pvt limited",
    description: "Test Transaction",
    image: "/images/clipart1345268.png",
    order_id: order.order.id,
    handler: function (response) {
      verifyPayment(response, order);
    },
    prefill: {
      name: order.user.fname,
      email: order.user.email,
      contact: order.user.phone[0],
    },
    notes: {
      address: "Razorpay Corporate Office",
    },
    theme: {
      color: "#dc3545",
    },
  };
  var rzp1 = new Razorpay(options);
  rzp1.open();
}

function showDates() {
  giveAlert(`
        <div>
        <div class="mb-2 text-dark fs-6 fw-bold">SELECT DATES</div>
        <div class="mb-3">
          <label class="form-label">From Date</label>
          <input type="date" class="form-control wallet-from-date" id="exampleInputEmail1" aria-describedby="emailHelp">
        </div>
        <div class="mb-3">
          <label class="form-label">To Date</label>
          <input type="date" class="form-control wallet-to-date" id="exampleInputEmail1" aria-describedby="emailHelp">
        </div>
       </div>`);
}

$(document).ready(function () {
  $(document).on("click", "#wallet-history-filter", function () {
    var userId = $(this).data("user-id");
    var filterCriteria = $(this).data("criteria-value");
    if (filterCriteria == "FILTER") {
      showDates();
      $(document).on("click", "#confirmAction", function () {
        var toDate = $(".wallet-to-date").val();
        var fromDate = $(".wallet-from-date").val();
        if (toDate == "" || fromDate == "") {
          giveMsg("Select Dates");
          myModal._element.addEventListener("hidden.bs.modal", function () {
            showDates();
          });
        } else {
          var valid = checkDateIsValid(fromDate, toDate);

          if (valid.boolean == false) {
            giveMsg(valid.message);
            myModal._element.addEventListener("hidden.bs.modal", function () {
              showDates();
            });
          } else if (valid == true) {
            $.ajax({
              url: "/filter_wallet_history/" + userId,
              method: "POST",
              data: { fromDate, toDate },
              success: function (response) {
                giveAlert();
                if (response.success) {
                  if (response.history.length == 0) {
                    $(".wallet-hisory-list").empty();
                    let data = `<div class="border"></div>
                    <div class="d-flex justify-content-center align-items-center mt-2">
                     <span class="text-secondary fs-5">No Results Found<i class="ms-2 fa-solid fa-face-sad-tear"></i></span>
                    </div>`;
                    $(".wallet-hisory-list").append(data);
                  } else {
                    let data = "";

                    $(".wallet-hisory-list").empty();
                    response.history.forEach((items) => {
                      data += `<div class="border"></div>
                      <div class="d-flex justify-content-between py-3">
                        <div class="wallet-details">
                          <span>
                     ${
                       items.transactionType === "Deposit"
                         ? ` <i
                              class="text-success fa-solid fa-angles-down withdrawal-wallet"
                            ></i>`
                         : `<i
                            class="text-danger fa-solid fa-angles-up withdrawal-wallet"
                          ></i>`
                     }
                              </span>
                            <span class="date-tag-deposit">${items.date}</span>
                            <span class="wallet-trans-type">${
                              items.transactionType
                            }</span>
                          </div>
                          <div class="wallet-details">
                            ${
                              items.transactionType == "Deposit"
                                ? `<span class="text-success">+ ₹${items.amount}</span>`
                                : `<span class="text-danger">- ₹${items.amount}</span>`
                            }
                            </div>
                        </div>`;
                    });
                    $(".wallet-hisory-list").append(data);
                  }
                }
              },
              error: function (error) {
                console.log(error);
              },
            });
          }
        }
      });
    } else {
      $.ajax({
        url: "/filter_wallet_history/" + userId,
        method: "POST",
        data: { filterCriteria },
        success: function (response) {
          if (response.pass) {
            let data = "";

            $(".wallet-hisory-list").empty();
            response.history.forEach((items) => {
              data += `<div class="border"></div>
              <div class="d-flex justify-content-between py-3">
                <div class="wallet-details">
                  <span>
                     ${
                       items.transactionType === "Deposit"
                         ? ` <i
                     class="text-success fa-solid fa-angles-down withdrawal-wallet"
                   ></i>`
                         : `<i
                   class="text-danger fa-solid fa-angles-up withdrawal-wallet"
                 ></i>`
                     }
                     </span>
                  <span class="date-tag-deposit">${items.date}</span>
                  <span class="wallet-trans-type">${
                    items.transactionType
                  }</span>
                </div>
                <div class="wallet-details">
                  ${
                    items.transactionType == "Deposit"
                      ? `<span class="text-success">+ ₹${items.amount}</span>`
                      : `<span class="text-danger">- ₹${items.amount}</span>`
                  }
                  </div>
              </div>`;
            });
            $(".wallet-hisory-list").append(data);
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    }
  });
});

function checkDateIsValid(fromDate, toDate) {
  const fromDateObj = new Date(fromDate);
  const toDateObj = new Date(toDate);
  const currentDate = new Date();
  if (!fromDate || !toDate) {
    return { boolean: false, message: "Select Dates" };
  }

  if (fromDateObj > currentDate || toDateObj > currentDate) {
    return { boolean: false, message: "Date must not be Future Dates" };
  }

  if (toDateObj <= fromDateObj) {
    return { boolean: false, message: "From Date must be less than toDate" };
  }
  if (toDateObj == fromDateObj) {
    return { boolean: false, message: "Select Different Dates" };
  }

  return true;
}
