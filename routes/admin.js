const express = require("express");
const adminController = require("../controller/adminController");
const router = express.Router();
const auth = require("../middleware/authentication");
const { upload } = require("../utils/helpers");

router.get("/admin_login", adminController.getAdminLogin);
router.post("/admin_login", adminController.adminLoggedin);

router.get(
  "/admin_panel/user_management",
  auth.isadminAuthenticated,
  adminController.userManagement
);

router.patch(
  "/admin_panel/user_management/block_user/:id",
  adminController.blockUser
);

router.patch(
  "/admin_panel/user_management/unblock_user/:id",
  adminController.unblockUser
);
//admin dashboard
router.get(
  "/admin_panel",
  auth.isadminAuthenticated,
  adminController.getadminDashboard
);

router.post(
  "/fetch_data",
  auth.isadminAuthenticated,
  adminController.fetchCategorysale
);

router.post(
  "/print_sales",
  auth.isadminAuthenticated,
  adminController.printSales
);

router.get(
  "/admin_panel/products/add_product",
  auth.isadminAuthenticated,
  adminController.adminaddProduct
);

router.post(
  "/add_product",
  upload.array("files", 3),
  adminController.addProduct
);
//get product dashboard
router.get(
  "/admin_panel/products",
  auth.isadminAuthenticated,
  adminController.getadminProduct
);
//get edit product
router.get(
  "/admin_panel/products/edit_product/:id",
  auth.isadminAuthenticated,
  adminController.geteditProduct
);
//product specification page
router.get(
  "/admin_panel/products/specification",
  auth.isadminAuthenticated,
  adminController.getProductSpecification
);
//edit product
router.put(
  "/admin_panel/products/edit_products/:id",
  upload.array("files", 3),
  adminController.editProduct
);
//delete product
router.delete(
  "/admin_panel/products/delete_product/:id",
  adminController.deleteProduct
);

//crop images
router.get(
  "/product/edit-image/:id",
  auth.isadminAuthenticated,
  adminController.fetchProductImage
);
//upload crop image
router.post(
  "/upload-cropped-image",
  auth.isadminAuthenticated,
  adminController.uploadCropImage
);
//get admin category page
router.get(
  "/admin_panel/category",
  auth.isadminAuthenticated,
  adminController.getCategory
);
//add category page
router.get(
  "/admin_panel/add_category",
  auth.isadminAuthenticated,
  adminController.getaddCategory
);

//add category
router.post(
  "/add_category",
  auth.isadminAuthenticated,
  adminController.addCategory
);
//edit category page
router.get(
  "/admin_panel/category/edit_category/:id",
  auth.isadminAuthenticated,
  adminController.getEditcategory
);
//editing the category
router.put(
  "/edit_category/:id",
  auth.isadminAuthenticated,
  adminController.editCategory
);
//deleting the category
router.delete(
  "/admin_panel/category/delete_category/:id",
  auth.isadminAuthenticated,
  adminController.deleteCategory
);
//
//get admin orders page
router.get(
  "/admin_panel/orders",
  auth.isadminAuthenticated,
  adminController.getOrders
);
//

//to cancel product according to the request
router.patch(
  "/admin_panel/admin_cancel_order/:id",
  auth.isadminAuthenticated,
  adminController.cancelOrder
);
//to update the order stage
router.patch(
  "/update_order_stage/:id",
  auth.isadminAuthenticated,
  adminController.updateOrderstage
);
//return order
router.patch(
  "/return_product/:id",
  auth.isadminAuthenticated,
  adminController.returnOrder
);
//get admin banner
router.get(
  "/admin_panel/banner",
  auth.isadminAuthenticated,
  adminController.adminBanner
);
//get admin add banenr
router.get(
  "/admin_panel/add_banner",
  auth.isadminAuthenticated,
  adminController.getaddBanner
);
//add banner
router.post(
  "/add-banner",
  auth.isadminAuthenticated,
  upload.single("files"),
  adminController.addBanner
);
//get coupon manage page
router.get(
  "/admin_panel/coupon",
  auth.isadminAuthenticated,
  adminController.getCouponPage
);

router.get(
  "/admin_panel/coupon/add_coupon",
  auth.isadminAuthenticated,
  adminController.getAddcouponPage
);
//addinf the coupon
router.post(
  "/add-coupon",
  auth.isadminAuthenticated,
  adminController.addCoupon
);
//delete the coupon
router.patch(
  "/admin/delete_coupon/:id",
  auth.isadminAuthenticated,
  adminController.deleteCoupon
);
//admin logout route
router.get("/admin_logout", adminController.adminLogout);
module.exports = router;
