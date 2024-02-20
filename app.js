const express = require("express");
const app = express();
const session = require("express-session");
const hbs = require("express-handlebars");
const path = require("path");
const mongo = require("./config/db_connection");
const multer = require("multer");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const Handlebars = require("handlebars");

// requiring dotenv variables
require("dotenv").config();
//
Handlebars.registerHelper("unlessEquals", function (arg1, arg2, options) {
  return arg1 !== arg2 ? options.fn(this) : options.inverse(this);
});
//registering handle bar helpers
Handlebars.registerHelper("ifEquals", function (arg1, arg2, options) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});
Handlebars.registerHelper("arrayIndex", function (array, index) {
  return array && array[index];
});
Handlebars.registerHelper("filterEmptyStrings", function (array) {
  // Filter out empty strings from the array
  return array.filter((item) => item.trim() !== "");
});
Handlebars.registerHelper("eachPages", function (totalPages, options) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  return pages.map(options.fn).join("");
});

Handlebars.registerHelper("ifCond", function (v1, v2, options) {
  if (v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});
//
app.use(express.json({ limit: "50mb" }));

//middleware to overide method
app.use(methodOverride("_method"));
//

app.use(cookieParser());

app.use(express.urlencoded({ extended: false }));

// requiring routes
const adminRoute = require("./routes/admin");
const userRoute = require("./routes/user");
//

//view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: path.join(__dirname, "/views/layout/"),
    partialsDir: path.join(__dirname, "/views/partials"),
  })
);

//viewing static pages
app.use(express.static(path.join(__dirname, "public")));
app.use("/invoices", express.static(path.join(__dirname, "invoices")));
app.use("/uploads", express.static("uploads"));
//
app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate");
  next();
});

//handing the session

app.use(
  session({
    secret: "abdchabsjvcadsjvhjcvadsj",
    saveUninitialized: true,
    resave: false,
  })
);
//connecting database
mongo.connect();

//routes
app.use("/", adminRoute);
app.use("/", userRoute);
//
//404
app.use((req, res) => {
  res.status(404).render("404");
});
//error handling middleware
app.use((err, req, res, next) => {
  res.status(500).send(err.stack);
});

app.listen(process.env.PORT, () => {
  console.log("server is running");
});
