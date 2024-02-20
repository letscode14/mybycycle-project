const jwt = require("jsonwebtoken");

//for otp pages and forgetuser pages
const isforgetAuth = (req, res, next) => {
  if (req.session.forgotUseremail) {
    next();
  } else {
    res.redirect("/user_login");
  }
};

const isotpAuth = (req, res, next) => {
  if (req.session.email) {
    next();
  } else {
    res.redirect("/user_login");
  }
};

const signupAuth = (req, res, next) => {
  if (req.session.userdata) {
    next();
  } else {
    res.redirect("/user_signup");
  }
};
//for session
const isuserAuthenticated = (req, res, next) => {
  try {
    if (req.cookies.token) {
      const token = req.cookies.token;
      const user = jwt.verify(token, process.env.MY_SECRET);
      next();
    } else {
      res.redirect("/user_login");
    }
  } catch (err) {
    console.log(err);
  }
};

const isadminAuthenticated = (req, res, next) => {
  try {
    if (req.cookies.adminToken) {
      const token = req.cookies.adminToken;
      const admin = jwt.verify(token, process.env.ADMIN_SECRET);
      if (admin) {
        next();
      }
    } else {
      res.redirect("/admin_login");
    }
  } catch (err) {
    console.log(err);
  }
};

const isCheckOut = (req, res, next) => {
  try {
    jwt.verify(
      req.cookies.checkOutToken,
      process.env.CHECKOUT_SECRET,
      (err, decoded) => {
        if (err) {
          res.redirect("/list_products");
        } else {
          next();
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
};
const iseditProfileAuth = (req, res, next) => {
  try {
    if (req.session.userDetails) {
      next();
    } else {
      res.redirect("/list_products");
    }
  } catch (err) {
    console.log(err);
  }
};

const isChangePass = (req, res, next) => {
  try {
    jwt.verify(
      req.cookies.changePassToken,
      process.env.CHANGE_PASSWORD_SECRET,
      (err, decoded) => {
        if (err) {
          res.redirect("/list_products");
        } else {
          next();
        }
      }
    );
  } catch (er) {
    console.log(er);
  }
};
const isOtpPasschange = (req, res, next) => {
  try {
    if (req.session.userCredentials) {
      next();
    } else {
      res.redirect("/list_products");
    }
  } catch (er) {}
};

module.exports = {
  isOtpPasschange,
  isChangePass,
  iseditProfileAuth,
  isCheckOut,
  signupAuth,
  isforgetAuth,
  isotpAuth,
  isuserAuthenticated,
  isadminAuthenticated,
};
