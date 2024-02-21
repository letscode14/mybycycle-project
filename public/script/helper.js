document.addEventListener("DOMContentLoaded", function () {
  const currentURl = window.location.pathname;
  const href = window.location.href;

  if (currentURl.includes("/user/my-orders/")) {
    document.title = "My Orders";
  } else if (currentURl.includes("/user/show_profile/")) {
    document.title = "Show Profile";
  } else if (currentURl.includes("/list_products")) {
    document.title = "List product";
  } else if (currentURl.includes("/product/")) {
    document.title = "Product Details";
  } else if (currentURl.includes("/user_cart/")) {
    document.title = "Cart";
  } else if (currentURl.includes("/user/edit_address/")) {
    document.title = "Edit Address";
  } else if (currentURl.includes("/user/user_checkout/")) {
    document.title = "Check Out";
  } else if (href == "/admin_panel/user_management") {
    document.title = "User Management";
  } else if (href == "/admin_panel") {
    document.title = "Admin Dashboard";
  } else if (href == "/admin_panel/orders") {
    document.title = "Orders";
  } else if (href == "/admin_panel/products") {
    document.title = "Products";
  } else if (href == "/admin_panel/products/add_product") {
    document.title = "Add Products";
  } else if (
    href == "/admin_panel/products/specification"
  ) {
    document.title = "Product Specification";
  } else if (currentURl.includes("/admin_panel/products/edit_product/")) {
    document.title = "Edit Product";
  } else if (href == "/admin_panel/category") {
    document.title = "Category";
  } else if (href == "/admin_panel/add_category") {
    document.title = "Add Category";
  } else if (currentURl.includes("/admin_panel/category/edit_category/")) {
    document.title = "Edit Category";
  } else if (currentURl.includes("/user/view_order/")) {
    document.title = "View Order";
  } else if (currentURl.includes("/user/edit_profile/")) {
    document.title = "Edit Profile";
  } else if (currentURl.includes("/user/email_verify/")) {
    document.title = "Email Verify";
  } else if (currentURl.includes("/user_profile_change_password/")) {
    document.title = "Change Password";
  } else if (currentURl.includes("/user/user_change_password_submit")) {
    document.title = "Verify User";
  } else if (href == "/home") {
    document.title = "Home";
  } else if (currentURl.includes("/admin_panel/coupon/add_coupon")) {
    document.title = "Add Coupon";
  } else if (currentURl.includes("/user/wishlist/")) {
    document.title = "Wishlist";
  } else if (currentURl.includes("/about_us")) {
    document.title = "About Us";
  } else if (currentURl.includes("/admin_panel/coupon")) {
    document.title = "Coupon";
  } else if (currentURl.includes("/admin_panel/banner")) {
    document.title = "Banner";
  } else if (currentURl.includes("/admin_panel/add_banner")) {
    document.title = "Add banner";
  } else if (currentURl.includes("/user/wallet_history/")) {
    document.title = "Wallet History";
  } else if (currentURl.includes("/get_in_touch")) {
    document.title = "Get In Touch";
  } else if (currentURl.includes("/show_product")) {
    document.title = "List products";
  } else if (currentURl.includes("/user/buy_now_checkout/")) {
    document.title = "Checkout";
  } else if (currentURl.includes("/user_signup")) {
    document.title = "Signup";
  } else if (currentURl.includes("/submit_otp")) {
    document.title = "Submit Otp";
  } else if (currentURl.includes("/submit_email")) {
    document.title = "Submit Email";
  } else if (currentURl.includes("/send_otp")) {
    document.title = "Submit Otp";
  } else if (currentURl.includes("/change_password")) {
    document.title = "Change Password";
  }
});
