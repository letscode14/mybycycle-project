//for the responsive design

function navigatetoPages(element) {
  const pageUrls = {
    dashboard: "/admin_panel",
    user: "/admin_panel/user_management",
    products: "/admin_panel/products",
    category: "/admin_panel/category",
    productsSpec: "/admin_panel/products/specification",
    orders: "/admin_panel/orders",
    banner: "/admin_panel/banner",
    coupon: "/admin_panel/coupon",
  };

  window.location.href = pageUrls[element];
}

$(document).ready(function () {
  $("#example").DataTable({ responsive: true });
});
