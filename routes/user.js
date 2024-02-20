const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const filterController = require("../controller/filterController");
const auth = require("../middleware/authentication");

router.get(
  "/user_signup",

  userController.getUserSignup
);

router.post("/user_registration", userController.userRegistration);
router.get("/user_login", userController.getUserLogin);

router.post("/user_signin", userController.userSignin);

router.get("/submit_otp", auth.isotpAuth, userController.getSubmitOtp);

router.post("/user_login", userController.submitOtp);
router.get("/resend_otp", userController.resendOtp);

//get home page
router.get("/home", userController.getHomePage);
//
router.get("/list_products", userController.getProducts);
router.get("/", userController.getPage);

//user forget otp submit
router.get("/send_otp", auth.isforgetAuth, userController.getforgotOtp);
router.post("/submit_otp", userController.submitforgetOtp);
router.get("/resend_forget_otp", userController.forgetResendotp);
//
//to submit registered phone number for password change

router.get("/submit_email", userController.getsubmitRegisteremail);
router.post("/submit_email", userController.submitEmail);

//change password
router.get(
  "/change_password",
  auth.isforgetAuth,
  userController.changePassword
);
router.patch("/submit_password", userController.submitPassword);
//get signup otp page
router.get(
  "/submit_signup_otp",
  auth.signupAuth,
  userController.getsubmitSignupotp
);

//resend signup otp
router.get("/resend_signup_otp", userController.signupResendOtp);
//user side
router.post("/signup_submit_otp", userController.submitSignupotp);
//show profile

router.get(
  "/user/show_profile/:id",
  auth.isuserAuthenticated,
  userController.showUserprofile
);

//get product Details
router.get("/product/:id", userController.getProductDetails);

//get user cart
router.get("/user_cart/:id", auth.isuserAuthenticated, userController.getCart);
//add product to cart
router.put(
  "/add_to_cart/:id",
  auth.isuserAuthenticated,
  userController.addtoCart
);

//remove product from the cart
router.patch(
  "/remove_cart/:id",
  auth.isuserAuthenticated,
  userController.removeFromthecart
);
//change quantity

router.patch(
  "/change_quantity/:id",
  auth.isuserAuthenticated,
  userController.changeQuantity
);

//get user edit profile

router.get(
  "/user/edit_address/:id",
  auth.isuserAuthenticated,
  userController.getuserProfileedit
);
//edit user
router.patch(
  "/edit_user/:id",
  auth.isuserAuthenticated,
  userController.editUser
);
//get verify email
router.get(
  "/user/email_verify/:id",
  auth.isuserAuthenticated,
  auth.iseditProfileAuth,
  userController.getverifyEmail
);
//change user password
router.get(
  "/user_profile_change_password/:id",
  auth.isuserAuthenticated,
  userController.userChangepassword
);
//
//check user change password
router.post(
  "/user/profile_change_password/:id",
  auth.isuserAuthenticated,
  userController.checkUserChangepassword
);

router.get(
  "/user_profile_change_password_otp/:id",
  auth.isuserAuthenticated,
  userController.OtpsendChangepassword
);
//submit otp
router.get(
  "/user/user_change_password_submit",
  auth.isOtpPasschange,
  auth.isuserAuthenticated,
  userController.getChangepasswordSubmitotp
);

router.post(
  "/verify_password_change_otp/:id",
  auth.isuserAuthenticated,
  userController.verifyPasswordChangeotp
);
//resend pass change otp
router.get(
  "/resend_pass_change_otp",
  auth.isuserAuthenticated,
  userController.resendPasschangeOtp
);
//change password using otp
router.post(
  "/user/change/password/:id",
  auth.isuserAuthenticated,
  userController.changePasswordWithOtp
);
//
router.get(
  "/user/change_password_otp/:id",
  auth.isChangePass,
  auth.isuserAuthenticated,
  userController.getChangePasswithotp
);

//edit the user addres
router.put(
  "/edit_address/:id",
  auth.isuserAuthenticated,
  userController.editUserAddress
);
//get add user Address
router.get(
  "/user/user_add_address/:id",
  auth.isuserAuthenticated,
  userController.addUseraddress
);
//add user address
router.post(
  "/user_add_address/:id",
  auth.isuserAuthenticated,
  userController.addAddres
);
//edit user profile

router.get(
  "/user/edit_profile/:id",
  auth.isuserAuthenticated,
  userController.edituserProfile
);
//verify email

router.post(
  "/submit_email_verify_otp",
  auth.isuserAuthenticated,
  auth.iseditProfileAuth,
  userController.verifyEmailotp
);
//resend verifyemail otp
router.get(
  "/resend_email_verify_otp",
  auth.isuserAuthenticated,
  auth.iseditProfileAuth,
  userController.resendverifyOtp
);

//set a primary address
router.patch(
  "/user/set_primary_address/:id",
  auth.isuserAuthenticated,
  userController.setPrimaryAddress
);

//delete the user address

router.patch(
  "/user/delete_address/:id",
  auth.isuserAuthenticated,
  userController.deleteAddress
);
//asign authentication
router.post(
  "/user/user_checkout",
  auth.isuserAuthenticated,
  userController.assignCheckoutToken
);
//get user checkout

router.get(
  "/user/user_checkout/:id",
  auth.isuserAuthenticated,
  auth.isCheckOut,
  userController.getcheckOut
);
//add user checkout address
router.post(
  "/user/add_checkout_address",
  auth.isuserAuthenticated,
  userController.addcheckoutAddress
);

//user adding a coupon
router.post(
  "/add_coupon",
  auth.isuserAuthenticated,
  auth.isCheckOut,
  userController.addCoupon
);
//user removing coupon
router.patch(
  "/remove_coupon",
  auth.isuserAuthenticated,
  userController.removeCoupon
);
//userPlace Order
router.post(
  "/user/place_order",
  auth.isuserAuthenticated,
  userController.placeOrder
);
//verify payment
router.post(
  "/verify_payment",
  auth.isuserAuthenticated,
  userController.verifyPayment
);

//to complete pending payments
router.get(
  "/user/complete_payment/:id",
  auth.isuserAuthenticated,
  userController.completePayment
);
//get order success ful page
router.get(
  "/user/order_successfull",
  auth.isuserAuthenticated,
  auth.isCheckOut,
  userController.getorderSuccessfull
);
//get user myorders
router.get(
  "/user/my-orders/:id",
  auth.isuserAuthenticated,
  userController.getMyorders
);

//view the order
router.get(
  "/user/view_order/:id",
  auth.isuserAuthenticated,
  userController.viewOrder
);
//get cancel product
router.patch(
  "/user/cancel_order/:id",
  auth.isuserAuthenticated,
  userController.cancelProduct
);
//router submitting the otp for cancel product

router.get(
  "/cancel_product",
  auth.isuserAuthenticated,
  userController.getcancelProductSubmitOtp
);

//to validat cancel otp
router.post(
  "/submit_cancel_otp",
  auth.isuserAuthenticated,
  userController.validateCancelotp
);
//resending the cancel product otp

router.get(
  "/resend_cancel_otp",
  auth.isuserAuthenticated,
  userController.resendCancelOtp
);

//user return product
router.patch(
  "/user/return_product/:id",
  auth.isuserAuthenticated,
  userController.returnOrder
);

//track the order
router.get(
  "/track_product/:id",
  auth.isuserAuthenticated,
  userController.trackOrder
);

//sort product
router.post("/user/filter/product", filterController.sortProduct);

//filter product
router.post("/user/filter/product_subfilter", filterController.filterProduct);

//get user whishLIst
router.get(
  "/user/wishlist/:id",
  auth.isuserAuthenticated,
  userController.getWishlist
);

//add to wishlist
router.post(
  "/user/add_to_wishlist/:id",
  auth.isuserAuthenticated,
  userController.addtoWishlist
);

//remove from wishlist
router.patch(
  "/user/remove_from_wishlist/:id",
  auth.isuserAuthenticated,
  userController.removeFromwishlist
);
//sort product
router.post("/user/filter/product", filterController.sortProduct);

//filter product
router.post("/user/filter/product_subfilter", filterController.filterProduct);
//search for product

router.post("/user/search_products", filterController.searchProduct);

//get user wallet history
router.get(
  "/user/wallet_history/:id",
  auth.isuserAuthenticated,
  userController.getWalletHistory
);

//add wallet amount
router.patch(
  "/add_wallet_amount/:id",
  auth.isuserAuthenticated,
  auth.isCheckOut,
  userController.addWalletAmount
);

//remove wallet
router.patch(
  "/remove_wallet_amount/:id",
  auth.isuserAuthenticated,
  userController.removeWallet
);
router.get(
  "/show_product",
  auth.isuserAuthenticated,
  filterController.showProductFromHome
);

//to get getIn touch with page
router.get("/get_in_touch", filterController.getGetTouchPage);

//to submit get in touch form
router.post("/submit_get_in_touch_form", filterController.submitGetintouchForm);
//user logout
router.post("/user/user_logout", userController.userLogout);

router.post(
  "/user/buy_now/:id",
  auth.isuserAuthenticated,
  userController.buyNowProduct
);

router.get(
  "/user/buy_now_checkout/:id",
  auth.isuserAuthenticated,
  auth.isCheckOut,
  userController.getCheckBuyNowCheckOut
);

//to add wallet amount in buy now
router.patch(
  "/add_wallet_amount_buy_now/:id",
  auth.isuserAuthenticated,
  auth.isCheckOut,
  userController.addWalletBuynow
);

router.patch(
  "/remove_wallet_amount_buy_now/:id",
  auth.isuserAuthenticated,
  auth.isCheckOut,
  userController.removeWalletBuynow
);
//add coupon buy now
router.post(
  "/add_coupon_buynow",
  auth.isuserAuthenticated,
  auth.isCheckOut,
  userController.addCouponbuyNow
);

router.patch(
  "/remove_coupon_buynow",
  auth.isuserAuthenticated,
  auth.isCheckOut,
  userController.removeCouponBuynow
);
router.post(
  "/user/place_order_buy_now",
  auth.isCheckOut,
  auth.isuserAuthenticated,
  userController.placeBuyNowOrder
);

router.post(
  "/add_wallet_money/:id",
  auth.isuserAuthenticated,
  userController.addMoneyToWallet
);

//to filter the wallet history
router.post(
  "/filter_wallet_history/:id",
  auth.isuserAuthenticated,
  filterController.filterWalletHistory
);

//about us page
router.get("/about_us", userController.getAboutUs);
//
module.exports = router;
