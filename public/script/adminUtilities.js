//for the responsive design

function navigatetoPages(element) {
  const pageUrls = {
    dashboard: "http://localhost:3000/admin_panel",
    user: "http://localhost:3000/admin_panel/user_management",
    products: "http://localhost:3000/admin_panel/products",
    category: "http://localhost:3000/admin_panel/category",
    productsSpec: "http://localhost:3000/admin_panel/products/specification",
    orders: "http://localhost:3000/admin_panel/orders",
    banner: "http://localhost:3000/admin_panel/banner",
    coupon: "http://localhost:3000/admin_panel/coupon",
  };

  window.location.href = pageUrls[element];
}

$(document).ready(function () {
  $("#example").DataTable({ responsive: true });
});
