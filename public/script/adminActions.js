const alertButtonAdmin = document.getElementById("alert-button");

const alertBoxAdmin = document.querySelector(".modal-body-alert");
const msgButtonAdmin = document.getElementById("msg-button");
const modalMsgBodyAdmin = document.querySelector(".modal-body-msg");
var myModal = new bootstrap.Modal(document.getElementById("alertModal"));

function giveAlert(msg) {
  alertButtonAdmin.click();
  alertBoxAdmin.innerHTML = msg;
}

function giveMsg(msg, boolean) {
  msgButtonAdmin.click();
  modalMsgBodyAdmin.innerHTML = msg;
}

// ajax request to block user
$(document).ready(function () {
  $(document).on("click", ".block-button", function () {
    var userId = $(this).data("user-id");

    giveAlert("Are you sure ?you need to block the user");
    $(document).on("click", "#confirmAction", function () {
      giveAlert("");
      $.ajax({
        url: "/admin_panel/user_management/block_user/" + userId,

        method: "PATCH", //patch method to partially update the data
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

//ajax request to unblock the user

$(document).ready(function () {
  $(document).on("click", ".unblock-button", function () {
    var userId = $(this).data("user-id");

    giveAlert("Are you sure ?you need to unblock the user");
    $(document).on("click", "#confirmAction", function () {
      giveAlert("");
      $.ajax({
        url: "/admin_panel/user_management/unblock_user/" + userId,

        method: "PATCH", //patch method to partially update the data
        success: function (_, _, response) {
          if (response.status == 200) {
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

//request to edit the product
$(document).ready(function () {
  $(document).on("click", "#edit-product-button", function () {
    var productId = $(this).data("product-id");
    $.ajax({
      url: "/admin_panel/products/edit_product/" + productId,

      method: "GET", //method to get the the product data in the page

      success: function (_, _, response) {
        if (response.status === 200) {
          window.location.href =
            "http://localhost:3000/admin_panel/products/edit_product/" +
            productId;
        }
      },
      error: function (error) {
        console.error("Error updating user status:", error);
      },
    });
  });
});
//
//to delete the product
$(document).ready(function () {
  $(document).on("click", "#product-delete-icon", function () {
    var productId = $(this).data("product-id");
    giveAlert("Do you wish to continue");
    $(document).on("click", "#confirmAction", function () {
      $.ajax({
        url: "/admin_panel/products/delete_product/" + productId,

        method: "DELETE", //method to DELETE the product

        success: function (_, _, response) {
          if (response.status === 200) {
            window.location.reload();
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    });
  });
});

//to get edit page of category
$(document).ready(function () {
  $(document).on("click", "#edit-category-button", function () {
    var categoryId = $(this).data("category-id");

    $.ajax({
      url: "/admin_panel/category/edit_category/" + categoryId,

      method: "GET", //method to edit category

      success: function (_, _, response) {
        if (response.status === 200) {
          console.log(response.status);
          window.location.href =
            "http://localhost:3000/admin_panel/category/edit_category/" +
            categoryId;
        }
      },
      error: function (error) {
        console.error("Error updating user status:", error);
      },
    });
  });
});

//
// to delete thec category
$(document).ready(function () {
  $(document).on("click", "#category-delete-icon", function () {
    var categoryId = $(this).data("category-id");
    giveAlert("Do you wish to continue");
    $(document).on("click", "#confirmAction", function () {
      $.ajax({
        url: "/admin_panel/category/delete_category/" + categoryId,

        method: "DELETE", //method to delete category

        success: function (_, _, response) {
          if (response.status === 200) {
            window.location.reload();
          }
        },
        error: function (error) {
          console.error("Error updating user status:", error);
        },
      });
    });
  });
});
//to cancel the product as the user requested
$(document).ready(function () {
  $(document).on("click", "#admin-cancel-order", function () {
    var orderId = $(this).data("order-id");

    giveAlert("Do you wish to continue");
    $(document).on("click", "#confirmAction", function () {
      $.ajax({
        url: "/admin_panel/admin_cancel_order/" + orderId,
        method: "PATCH",
        success: function (response) {
          if (response.success) {
            giveMsg(response.message);
            myModal._element.addEventListener("hidden.bs.modal", function () {
              location.reload();
            });
          } else if (response.cancelled) {
            giveMsg(response.message);
          } else if (response.delivered) {
            giveMsg(response.message);
          } else if (response.returned) {
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
//
//updating the order stage
$(document).ready(function () {
  $(document).on("click", "#order-stage", function () {
    var orderStage = $(this).data("order-stage");
    var orderId = $(this).data("order-id");

    const data = {
      orderStage: orderStage,
    };

    giveAlert("Do you wish to continue");
    $(document).on("click", "#confirmAction", function () {
      $.ajax({
        url: "/update_order_stage/" + orderId,
        method: "PATCH",
        data: data,
        success: function (response) {
          if (response.userCancelled) {
            giveMsg(response.message);
          } else if (response.cancelled) {
            giveMsg(response.message);
          } else if (response.sameStage) {
            giveMsg(response.message);
          } else if (response.notvalidStage) {
            giveMsg(response.message);
          } else if (response.success) {
            giveMsg(response.message);
            myModal._element.addEventListener("hidden.bs.modal", function () {
              location.reload();
            });
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    });
  });
});
//

//ajax request to return order
$(document).ready(function () {
  $(document).on("click", "#return-order", function () {
    var orderId = $(this).data("order-id");
    giveAlert("Do you wish to continue");
    $(document).on("click", "#confirmAction", function () {
      $.ajax({
        url: "/return_product/" + orderId,
        method: "PATCH",
        success: function (response) {
          if (response.returned) {
            giveMsg(response.message);
            myModal._element.addEventListener("hidden.bs.modal", function () {
              location.reload();
            });
          }
        },
        error: function (error) {
          console.log(error);
        },
      });
    });
  });
});
//to crop images
const modelBody = document.querySelector(".modal-body-image");
const cropButton = document.getElementById("crop-image");
$(document).on("click", "#edit-image", function () {
  const modelButton = document.getElementById("model-button-crop");

  var proId = $(this).data("product-id");
  console.log(proId);
  giveAlert("Do you wish to continue");
  $(document).on("click", "#confirmAction", function () {
    $.ajax({
      url: "/product/edit-image/" + proId,
      method: "GET",
      success: function (response) {
        if (response) {
          modelBody.innerHTML = "";

          response.images.forEach(function (dataUrl, index) {
            modelBody.innerHTML += `<div class="image_div_${index}">
            <div class="p-1">
              <img src=${dataUrl} id='image-${index}' class="w-100"></img>
              </div>
              <div id="button-div-${index}">
              <button onclick = cropImage('${index}','${proId}') class="btn  btn-danger w-auto px-3 my-2" id="button-${index}">CROP </button>
              </div>
             </div>`;
          });
          modelButton.click();
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});
let cropper;
let index;
function cropImage(n, proId) {
  const img = document.getElementById("image-" + n);
  const cropButton = document.getElementById("button-div-" + n);

  cropButton.innerHTML = `<button  class="btn  btn-primary w-auto px-3 my-2" id="submit-${n}">SUBMIT </button>`;
  const cropButtonpre = document.getElementById("button-div-" + index);
  if (cropper) {
    cropper.destroy();
    cropButtonpre.innerHTML = "";
    cropButtonpre.innerHTML = `<button onclick = cropImage('${index}') class="btn  btn-danger w-auto px-3 my-2" id="button-${index}">CROP </button>`;
  }
  cropper = new Cropper(img, {
    aspectRatio: 16 / 9,
    viewMode: 0,
    dragMode: "move",
    responsive: true,
  });
  index = n;
  const modelButton = document.getElementById("model-button-crop");
  const submit = document.getElementById("submit-" + n);
  submit.addEventListener("click", () => {
    const croppedCanvas = cropper.getCroppedCanvas();

    const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg");

    const data = {
      images: croppedDataUrl,
      index: n,
      productId: proId,
    };
    fetch("/upload-cropped-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Error uploading image");
        }
        alert("image Updated SuccessFully");
      })
      .catch((error) => {
        console.error(error.message);
      });
  });
}

//delete a coupon
$(document).on("click", ".delete-coupon", function () {
  giveAlert("Are You sure you need to logout");
  var couponId = $(this).data("coupon-id");
  $(document).on("click", "#confirmAction", function () {
    giveAlert("");
    $.ajax({
      url: "/admin/delete_coupon/" + couponId,
      method: "PATCH",
      success: function (response) {
        if (response.success) {
          location.reload();
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});
//ajax request to logout the admin
$(document).on("click", ".logout-button", function () {
  giveAlert("Are You sure you need to logout");
  $(document).on("click", "#confirmAction", function () {
    $.ajax({
      url: "/admin_logout",
      method: "GET",
      success: function (_, _, response) {
        if (response.status === 200) {
          giveMsg("Logged Out SuccessFully");
          myModal._element.addEventListener("hidden.bs.modal", function () {
            window.location.href = "http://localhost:3000/admin_login";
          });
        } else {
          console.error("Logout failed:", response.message);
        }
      },
      error: function (error) {
        console.error("Error during logout:", error);
      },
    });
  });
});
