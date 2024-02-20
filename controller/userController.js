const db = require("../model/userModel");
const productDb = require("../model/productModel");
const cartDb = require("../model/cartModel");

const bcrypt = require("bcrypt");
const categoryDb = require("../model/categoryModel");
const addressDb = require("../model/useraddressModel");
const orderDb = require("../model/orderModel");
const bannerDB = require("../model/bannerModel");
const wishlistDb = require("../model/wishlistModel");
const walledDb = require("../model/walletModel");
const couponDb = require("../model/couponModel");
const { v4: uuidv4 } = require("uuid");
const Razorpay = require("razorpay");
const crypto = require("crypto");

//to generate invoice
const { generateInvoice, sendOtp, otpResend } = require("../utils/helpers");
//complex aggregation
const {
  placeOrderAggregation,
  checkOutAggregation,
  couponAggregation,
} = require("../utils/aggregation");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

//razorpay instance
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
//

//getting user signup page
const getUserSignup = (req, res, next) => {
  res.status(200).render("user/user_signup", { signupPage: true });
};
//user registration
const userRegistration = async (req, res, next) => {
  const data = {
    fname: req.body.fname,
    lname: req.body.lname,
    email: req.body.email,
    password: await bcrypt.hash(req.body.password, 10),
    phone: req.body.phone,
  };

  try {
    const existuser = await db.userCollection.findOne({ email: data.email });
    if (existuser) {
      res.status(400).render("user/user_signup", { userExist: true });
    } else {
      req.session.userdata = data;
      sendOtp(req.body.email, req.body.email)
        .then((msg) => {
          res.redirect("/submit_signup_otp");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (err) {
    next(err);
  }
};

//get signup submit otp
const getsubmitSignupotp = (req, res, next) => {
  res.status(200).render("user/signup_submit_otp");
};

//submit the signup otp

const submitSignupotp = async (req, res, next) => {
  try {
    const isOtp = await db.otpCollection.findOne({
      otpId: req.session.userdata.email,
    });
    const time = Date.now();
    if (req.body.otp == isOtp.otp) {
      if (isOtp.expireAt >= time) {
        const userInserted = await db.userCollection.insertMany(
          req.session.userdata
        );

        if (userInserted) {
          await walledDb.WalletCollection.updateOne(
            { userId: new ObjectId(userInserted[0]._id) },
            {
              $set: { userId: new ObjectId(userInserted[0]._id) },
            },
            { upsert: true }
          );
        }

        if (userInserted) {
          res.status(200).render("user/user_signup", { userRegistered: true });
          req.session.userdata = "";
        }
      } else {
        res.status(400).render("user/signup_submit_otp", { otpExpired: true });
      }
    } else {
      res.status(400).render("user/signup_submit_otp", { otpInvalid: true });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};
//signup resend otp
const signupResendOtp = async (req, res, next) => {
  const data = await otpResend(
    req.session.userdata.email,
    req.session.userdata.email
  );
  console.log(data);
  if (data) {
    res.status(200).json(data);
  }
};

//getting user login
const getUserLogin = (req, res, next) => {
  try {
    if (req.cookies.token) {
      const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
      if (user) {
        res.redirect("/home");
      }
    } else {
      req.session.destroy();
      res.status(200).render("user/user_login", { loginPage: true });
    }
  } catch (err) {
    res.status(500).send("internal server error");
  }
};
//user login
const userSignin = async (req, res, next) => {
  //if login using email
  if (req.body.Emailotp === "") {
    try {
      const existUser = await db.userCollection
        .findOne({
          email: req.body.email,
        })
        .lean();

      if (existUser) {
        const { _id } = existUser;
        const password = existUser.password;
        const truePassword = await bcrypt.compare(req.body.password, password);
        if (truePassword) {
          if (existUser.isBlocked) {
            res.status(400).render("user/user_login", { blockedUser: true });
          } else {
            const token = jwt.sign({ _id }, process.env.MY_SECRET);
            res.cookie("token", token, {
              httpOnly: true,
            });
            res.redirect("/home");
          }
        } else {
          res.status(400).render("user/user_login", { invalidUser: true });
        }
      } else {
        res.status(400).render("user/user_login", { userNotExist: true });
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  } else {
    //if login using phone number
    try {
      const userExist = await db.userCollection.findOne({
        email: req.body.Emailotp,
      });

      if (userExist) {
        sendOtp(req.body.Emailotp, userExist._id)
          .then((msg) => {
            console.log(msg);
            req.session.email = userExist.email;
            req.session.user = userExist._id;
            res.redirect("/submit_otp");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.status(400).render("user/user_login", { userNotExist: true });
      }
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
};

//submiting the otp to varify
const submitOtp = async (req, res, next) => {
  try {
    if (req.session.user) {
      const id = req.session.user;
      const userInfo = await db.userCollection
        .findOne({ _id: new ObjectId(req.session.user) })
        .lean();
      const { _id } = userInfo;
      const isOtp = await db.otpCollection.findOne({ otpId: id });

      //checking weather the otp is expired
      const date = new Date();
      if (isOtp.otp == req.body.otp) {
        if (isOtp.expireAt >= date) {
          if (userInfo.isBlocked) {
            res.status(400).render("user/user_login", { blockedUser: true });
          } else {
            const token = jwt.sign({ _id }, process.env.MY_SECRET);
            res.cookie("token", token, {
              httpOnly: true,
            });
            res.redirect("/home");
          }
        } else {
          res.status(400).render("user/submit_otp", {
            otpExpired: true,
          });
        }
      } else {
        res.status(400).render("user/submit_otp", { otpInvalid: true });
      }
    } else {
      console.log("session not found");
    }
  } catch (err) {
    next(err);
  }
};

//resend otp
const resendOtp = async (req, res, next) => {
  const data = await otpResend(req.session.email, req.session.user);
  if (data) {
    res.status(200).json(data);
  }
};
//forget otp
//to get to submit the registered phone number
const getsubmitRegisteremail = (req, res, next) => {
  res.render("user/send_otp");
};

const submitEmail = async (req, res, next) => {
  try {
    const userExist = await db.userCollection.findOne({
      email: req.body.Email,
    });
    if (userExist) {
      sendOtp(req.body.Email, userExist._id)
        .then((msg) => {
          console.log(msg);
          req.session.forgetUser = userExist._id;
          req.session.forgotUseremail = req.body.Email;
          res.redirect("/send_otp");
        })
        .catch((err) => {
          console.log("failed" + err);
        });
    } else {
      res.status(400).render("user/send_otp", { usernotExist: true });
    }
  } catch (err) {
    next(err);
  }
};

//to get submit otp page
const getSubmitOtp = (req, res, next) => {
  res.status(200).render("user/submit_otp");
};

//user forgot otp submit page
const getforgotOtp = (req, res, next) => {
  res.status(200).render("user/forget_submit_otp");
};

const submitforgetOtp = async (req, res, next) => {
  try {
    if (req.session.forgetUser) {
      const otpInfo = await db.otpCollection.findOne({
        otpId: req.session.forgetUser,
      });
      console.log(req.body.otp);
      if (otpInfo.otp == req.body.otp) {
        if (otpInfo.expireAt >= Date.now()) {
          res.redirect("/change_password");
        } else {
          res
            .status(400)
            .render("user/forget_submit_otp", { otpExpired: true });
        }
      } else {
        res.status(400).render("user/forget_submit_otp", { otpInvalid: true });
      }
    } else {
      console.log("session not found");
    }
  } catch (err) {
    next(err);
  }
};

const forgetResendotp = async (req, res, next) => {
  const data = await otpResend(
    req.session.forgotUseremail,
    req.session.forgetUser
  );
  if (data) {
    res.status(200).json(data);
  }
};
//to changepassword
const changePassword = (req, res, next) => {
  res.status(200).render("user/change_password");
};

const submitPassword = async (req, res, next) => {
  try {
    if (req.session.forgotUseremail) {
      const userExist = await db.userCollection.findOne({
        email: req.session.forgotUseremail,
      });
      const changedPassword = await bcrypt.hash(req.body.password, 10);
      const updatePassword = await db.userCollection.updateOne(
        { email: userExist.email },
        { $set: { password: changedPassword } }
      );

      res.redirect("/user_login");
    } else {
      console.log("session not found");
    }
  } catch (err) {
    next(err);
  }
};
//

//user side/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

//

//home page
const getHomePage = async (req, res, next) => {
  try {
    let count;
    const coupon = await couponDb.couponCollection.find().lean();
    const banners = await bannerDB.bannerCollection
      .find({ status: true, bannerCat: "MAIN" })
      .lean();
    const catBanners = await bannerDB.bannerCollection
      .find({ status: true, bannerCat: { $ne: "MAIN" } })
      .lean();

    if (req.cookies.token) {
      const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
      const userInfo = await db.userCollection.findById(user._id).lean();
      const cart = await cartDb.cartCollection.findOne({
        userId: new ObjectId(user._id),
      });

      if (cart) {
        count = cart.products.length;
      } else {
        count = 0;
      }
      if (userInfo) {
        res.status(200).render("user/home", {
          user: true,
          home: true,
          partial: true,
          userInfo,
          banners,
          catBanners,
          bannerPage: true,
          count,
          coupon,
        });
      }
    } else {
      res.status(200).render("user/home", {
        user: true,
        partial: true,
        banners,
        catBanners,
        home: true,
        bannerPage: true,
        coupon,
      });
    }
  } catch (err) {
    next(err);
  }
};
//get user profile
const showUserprofile = async (req, res, next) => {
  let count;
  const userId = req.params.id;
  const userInfo = await db.userCollection.findById(userId).lean();
  const cart = await cartDb.cartCollection
    .findOne({ userId: new ObjectId(userId) })
    .lean();
  const address = await addressDb.addressCollection
    .find({
      userId: new ObjectId(userId),
      isDeleted: false,
    })
    .lean();

  const wallet = await walledDb.WalletCollection.findOne(
    {
      userId: new ObjectId(userId),
    },
    { balance: 1, _id: 0 }
  ).lean();

  let walletBalance;
  if (wallet) {
    walletBalance = wallet;
  } else {
    balance = 0;
    walletBalance = { balance };
  }
  if (cart) {
    count = cart.products.length;
  } else {
    count = 0;
  }

  res.status(200).render("user/show_profile", {
    user: true,
    userInfo,
    partial: true,
    count,
    address,
    showProfile: true,
    walletBalance,
  });
};

//logout user

const userLogout = (req, res, next) => {
  res.clearCookie("token");
  res.json(200);
};
//get product listing page
const getProducts = async (req, res, next) => {
  try {
    req.session.destroy();
    const coupon = await couponDb.couponCollection.find().lean();

    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const limit = parseInt(req.query.limit) || 8; // Number of products per page, default to 10

    const skip = (page - 1) * limit;

    const productQuery = await productDb.productCollection
      .find({ isDeleted: false })
      .skip(skip)
      .limit(limit)
      .lean();

    const productCount = await productDb.productCollection.countDocuments({
      isDeleted: false,
    });
    const totalPages = Math.ceil(productCount / limit);

    const banners = await bannerDB.bannerCollection
      .find({ status: true, bannerCat: "MAIN" })
      .lean();

    if (req.cookies.token) {
      const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
      const userInfo = await db.userCollection.findById(user._id).lean();
      const category = await categoryDb.categoryCollection.find().lean();

      const cart = await cartDb.cartCollection
        .findOne({ userId: new ObjectId(user._id) })
        .lean();

      let count = 0;
      if (cart) {
        count = cart.products.length;
      }

      res.status(200).render("user/user_products", {
        user: true,
        bannerPage: true,
        userInfo: userInfo,
        product: productQuery,
        category,
        totalProduct: totalPages,
        productCount: productCount,
        currentPage: page,
        count,
        banners,
        coupon,
      });
    } else {
      res.status(200).render("user/user_products", {
        user: true,
        product: productQuery,
        totalProduct: totalPages,
        currentPage: page,
        bannerPage: true,
        banners,
        coupon,
      });
    }
  } catch (err) {
    next(err);
  }
};

const getPage = async (req, res, next) => {
  const product = await productDb.productCollection
    .find({ isDeleted: false })
    .lean();

  res.status(200).render("user/user_products", { user: true, product });
};

const getProductDetails = async (req, res, next) => {
  try {
    let count;
    const product = await productDb.productCollection
      .findById(req.params.id)
      .lean();
    if (req.cookies.token) {
      const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
      const userInfo = await db.userCollection.findById(user._id).lean();
      const cart = await cartDb.cartCollection
        .findOne({ userId: new ObjectId(user._id) })
        .lean();
      if (cart) {
        count = cart.products.length;
      } else {
        count = 0;
      }

      res.status(200).render("user/product_details", {
        user: true,
        partial: true,
        product,
        userInfo: userInfo,
        count,
      });
    } else {
      res.status(200).render("user/product_details", {
        user: true,
        partial: true,
        product,
      });
    }
  } catch (err) {
    next(err);
  }
};
//get cart page
const getCart = async (req, res, next) => {
  try {
    const userInfo = await db.userCollection.findById(req.params.id).lean();

    let cartData = await cartDb.cartCollection.aggregate([
      {
        $match: { userId: new ObjectId(userInfo._id) },
      },
      {
        $unwind: "$products",
      },
      {
        $lookup: {
          from: "product_datas",
          localField: "products.productId",
          foreignField: "_id",
          as: "Product",
        },
      },
      {
        $unwind: "$Product",
      },
      {
        $addFields: {
          grandTotal: { $multiply: ["$products.quantity", "$Product.price"] },
        },
      },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          grandTotal: { $sum: "$grandTotal" },

          products: {
            $push: {
              _id: "$products._id",
              productId: "$products.productId",
              quantity: "$products.quantity",
              totalPrice: "$grandTotal",
              frameSize: "$products.frameSize",
              color: "$products.color",
              Product: {
                _id: "$Product._id",
                productName: "$Product.productName",
                price: "$Product.price",
                inStock: "$Product.inStock",
                images: "$Product.images",
              },
            },
          },
        },
      },
    ]);

    let count;
    if (cartData[0]) {
      count = cartData[0].products.length;
    } else {
      count = 0;
    }
    cartData = cartData[0];

    res.status(200).render("user/user_cart", {
      user: true,
      userInfo: userInfo,
      partial: true,
      count,
      cartData,
    });
  } catch (err) {
    next(err);
  }
};

const addtoCart = async (req, res, next) => {
  try {
    if (req.cookies.token) {
      const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
      const userInfo = await db.userCollection.findById(user._id);
      const existingDocument = await cartDb.cartCollection.findOne({
        userId: new ObjectId(userInfo._id),
        "products.productId": new ObjectId(req.params.id),
        "products.frameSize": req.body.frameSizes,
        "products.color": req.body.colors,
      });

      if (existingDocument) {
        // If the document exists, increment the quantity by 1
        const index = existingDocument.products.findIndex((product) => {
          return (
            product.productId.equals(new ObjectId(req.params.id)) &&
            product.frameSize === req.body.frameSizes &&
            product.color === req.body.colors
          );
        });
        const added = await cartDb.cartCollection.updateOne(
          {
            userId: new ObjectId(userInfo._id),
            "products.productId": new ObjectId(req.params.id),
            "products.frameSize": req.body.frameSizes,
            "products.color": req.body.colors,
          },
          {
            $inc: { [`products.${index}.quantity`]: 1 },
          }
        );
        if (added) {
          console.log("added");
          res.sendStatus(200);
        }
      } else {
        // If the document doesn't exist, add a new document with the specified product
        const added = await cartDb.cartCollection.updateOne(
          {
            userId: new ObjectId(userInfo._id),
          },
          {
            $addToSet: {
              products: {
                productId: new ObjectId(req.params.id),
                frameSize: req.body.frameSizes,
                color: req.body.colors,
              },
            },
          },
          { upsert: true }
        );
        if (added) {
          res.sendStatus(201);
        }
      }
    }
  } catch (err) {
    next(err);
  }
};
//to remove the product from the cart
const removeFromthecart = async (req, res, next) => {
  try {
    const userInfo = jwt.verify(req.cookies.token, process.env.MY_SECRET);
    const updatedCart = await cartDb.cartCollection.updateOne(
      { userId: new ObjectId(userInfo._id) },
      { $pull: { products: { _id: new ObjectId(req.params.id) } } }
    );

    if (updatedCart) {
      res.sendStatus(200);
    }
  } catch (err) {
    next(err);
  }
};

//adding of quantity
const changeQuantity = async (req, res, next) => {
  try {
    const userInfo = jwt.verify(req.cookies.token, process.env.MY_SECRET);
    if (req.body.value == 1) {
      const product = await productDb.productCollection.findById(
        req.body.productId
      );
      const cartQuantity = await cartDb.cartCollection.aggregate([
        { $unwind: "$products" },
        {
          $group: {
            _id: "$products.productId",
            totalQuantity: { $sum: "$products.quantity" },
          },
        },
        { $match: { _id: new ObjectId(req.body.productId) } },
      ]);
      if (cartQuantity[0].totalQuantity + 1 <= product.quantity) {
        const updatedCart = await cartDb.cartCollection.updateOne(
          {
            userId: new ObjectId(userInfo._id),
            "products._id": new ObjectId(req.params.id),
          },
          {
            $inc: {
              "products.$.quantity": Number(req.body.value),
            },
          }
        );
        if (updatedCart) {
          res.sendStatus(200);
        }
      } else {
        res.sendStatus(304);
      }
    } else {
      const updatedCart = await cartDb.cartCollection.updateOne(
        {
          userId: new ObjectId(userInfo._id),
          "products._id": new ObjectId(req.params.id),
        },
        {
          $inc: {
            "products.$.quantity": Number(req.body.value),
          },
        }
      );
      if (updatedCart) {
        res.sendStatus(200);
      }
    }
    await cartDb.cartCollection.updateMany(
      { userId: userInfo._id, "products.quantity": 0 },
      { $pull: { products: { quantity: 0 } } }
    );
  } catch (err) {
    next(err);
  }
};

//user get edit Profile
const getuserProfileedit = async (req, res, next) => {
  try {
    let count;
    let userInfo;
    const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
    const addressDetails = await addressDb.addressCollection.aggregate([
      {
        $match: { _id: new ObjectId(req.params.id) },
      },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
    ]);
    const cart = await cartDb.cartCollection.find({
      userId: new ObjectId(user._id),
    });
    if (addressDetails.length > 0) {
      userInfo = addressDetails[0].userInfo;
      if (cart.length > 0) {
        count = cart[0].products.length;
      } else {
        count = 0;
      }
    } else {
      userInfo = await db.userCollection.findById(user._id).lean();
      count = 0;
    }

    res.status(200).render("user/user_address_edit", {
      user: true,
      partial: true,
      userInfo,
      count,
      address: addressDetails[0],
    });
  } catch (err) {
    next(err);
  }
};

//const editing the useraddrress
const editUserAddress = async (req, res, next) => {
  try {
    const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);

    await addressDb.addressCollection.findOneAndUpdate(
      {
        _id: new ObjectId(req.params.id),

        isDeleted: false,
      },
      {
        $set: {
          homeAddress: req.body.streetaddress,
          locality: req.body.locality,
          district: req.body.district,
          city: req.body.city,
          state: req.body.state,
          postalCode: req.body.postalcode,
          phone: req.body.phone,
        },
      },
      { upsert: true }
    );

    res.redirect("/user/show_profile/" + user._id);
  } catch (er) {
    next(er);
  }
};

//set primary address for user
const setPrimaryAddress = async (req, res, next) => {
  try {
    const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
    await addressDb.addressCollection.updateMany(
      {
        userId: new ObjectId(user._id),
      },
      { $set: { isPrimary: false } }
    );
    await addressDb.addressCollection.findByIdAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: { isPrimary: true } }
    );
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
};
//get add address page
const addUseraddress = async (req, res, next) => {
  try {
    let userInfo;
    let count;
    console.log(req.params.id);
    const cart = await cartDb.cartCollection.aggregate([
      { $match: { userId: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
    ]);

    if (cart.length > 0) {
      userInfo = cart[0].userInfo[0];
      count = cart[0].products.length;
    } else {
      userInfo = await db.userCollection.findById(req.params.id).lean();
      count = 0;
    }

    res.status(200).render("user/user_add_address", {
      user: true,
      partial: true,
      userInfo,
      count,
    });
  } catch (er) {
    next(er);
  }
};

//adding an address
const addAddres = async (req, res, next) => {
  try {
    const data = {
      userId: new ObjectId(req.params.id),
      homeAddress: req.body.streetaddress,
      locality: req.body.locality,
      district: req.body.district,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalcode,
      phone: req.body.phone,
    };

    const address = await addressDb.addressCollection.insertMany(data);
    if (address) {
      res.redirect("/user/show_profile/" + req.params.id);
    }
  } catch (err) {
    next(err);
  }
};
//
//deleting a adress
const deleteAddress = async (req, res, next) => {
  try {
    const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
    const deleted = await addressDb.addressCollection.findByIdAndUpdate(
      req.params.id,
      {
        $set: { isDeleted: true },
      }
    );
    if (deleted) {
      await addressDb.addressCollection.findOneAndUpdate(
        { userId: new ObjectId(user._id), isDeleted: false },
        { $set: { isPrimary: true } }
      );
      res.sendStatus(200);
    }
  } catch (err) {
    next(err);
  }
};

//edit user Profile
const edituserProfile = async (req, res, next) => {
  try {
    let userInfo;
    let count;
    const cart = await cartDb.cartCollection.aggregate([
      { $match: { userId: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
    ]);

    if (cart.length > 0) {
      userInfo = cart[0].userInfo[0];
      count = cart[0].products.length;
    } else {
      userInfo = await db.userCollection.findById(req.params.id).lean();
      count = 0;
    }

    req.session.destroy();
    res.status(200).render("user/user_edit_profile", {
      user: true,
      partial: true,
      userInfo,
      count,
    });
  } catch (err) {
    next(err);
  }
};

//edit the user
const editUser = async (req, res, next) => {
  try {
    const userInfo = await db.userCollection.findById(req.params.id);
    if (userInfo.email !== req.body.email) {
      res.json({
        emailChange: true,
        message: "Email Has changed Needs to Verify",
      });
      req.session.userDetails = req.body;
      req.session.userId = req.params.id;
      req.session.save();
    } else {
      const user = await db.userCollection.findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        {
          $set: {
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
          },
        },
        { returnDocument: "after" }
      );
      if (user) {
        res.json({ updated: true, message: "Profle Updated Successfully" });
      }
    }
  } catch (er) {
    next(er);
  }
};

//verify email
const getverifyEmail = async (req, res, next) => {
  try {
    let userInfo;
    let count;
    const cart = await cartDb.cartCollection.aggregate([
      { $match: { userId: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
    ]);
    if (cart.length > 0) {
      userInfo = cart[0].userInfo[0];
      count = cart[0].products.length;
    } else {
      count = 0;
      userInfo = await db.userCollection.findById(req.params.id).lean();
    }

    try {
      const msg = await sendOtp(
        req.session.userDetails.email,
        req.session.userId
      );
      if (msg) {
        res.status(200).render("user/user_email_verify", {
          user: true,
          partial: true,
          userInfo,
          count,
          userEmail: req.session.userDetails.email,
        });
      }
    } catch (er) {
      res.status(500).json({ message: er });
      console.log(er);
    }
  } catch (err) {
    next(err);
  }
};

const verifyEmailotp = async (req, res, next) => {
  try {
    console.log(req.body.otp);
    const otpInfo = await db.otpCollection.findOne({
      otpId: new ObjectId(req.session.userId),
    });

    const date = Date.now();
    if (otpInfo.otp == req.body.otp) {
      if (otpInfo.expireAt > date) {
        const user = await db.userCollection.findOneAndUpdate(
          {
            _id: new ObjectId(req.session.userId),
          },
          {
            $set: {
              email: req.session.userDetails.email,
              fname: req.session.userDetails.fname,
              lname: req.session.userDetails.lname,
            },
          },
          { returnDocument: "after" }
        );
        if (user) {
          res.json({
            success: true,
            message: "profile updated successfully",
            id: req.session.userId,
          });
          req.session.destroy();
        }
      } else {
        res.json({ otpExpired: true, message: "OTP Expired Hit Resend" });
      }
    } else {
      res.json({ otpNotvalid: true, message: "Invalid OTP" });
    }
  } catch (err) {
    next(err);
  }
};
const resendverifyOtp = async (req, res, next) => {
  try {
    const data = await otpResend(
      req.session.userDetails.email,
      req.session.userId
    );
    res.json({ resend: true, message: data.message });
  } catch (err) {
    console.log(err);
  }
};
//change_password
const userChangepassword = async (req, res, next) => {
  try {
    let userInfo;
    let count;
    const cart = await cartDb.cartCollection.aggregate([
      { $match: { userId: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
    ]);

    if (cart.length > 0) {
      userInfo = cart[0].userInfo[0];
      count = cart[0].products.length;
    } else {
      count = 0;
      userInfo = await db.userCollection.findById(req.params.id).lean();
    }

    res.status(200).render("user/profile_change_password", {
      user: true,
      partial: true,
      userInfo,
      count,
    });
  } catch (er) {
    next(er);
  }
};

const checkUserChangepassword = async (req, res, next) => {
  try {
    const userInfo = await db.userCollection.findById(req.params.id);
    const isSamepassword = await bcrypt.compare(
      req.body.oldpassword,
      userInfo.password
    );
    const isnewSame = await bcrypt.compare(
      req.body.newpassword,
      userInfo.password
    );
    if (!isSamepassword) {
      res.json({
        notValidpassword: true,
        message: "Old Password is invalid try changing with OTP",
      });
    } else if (isnewSame) {
      res.json({
        newPasswordsame: true,
        message: "Password is same as old password try different one",
      });
    } else {
      const updateUser = await db.userCollection.findByIdAndUpdate(
        req.params.id,
        {
          $set: { password: await bcrypt.hash(req.body.newpassword, 10) },
        },
        { returnDocument: "after" }
      );
      if (updateUser) {
        res.json({
          success: true,
          message: "Password has been successfully updated",
        });
      }
    }
  } catch (er) {
    next(er);
  }
};

const changePasswordWithOtp = async (req, res, next) => {
  try {
    const userInfo = await db.userCollection.findById(req.params.id);

    const isSame = await bcrypt.compare(
      req.body.newpassword,
      userInfo.password
    );
    if (isSame) {
      res.json({
        same: true,
        message: "Current Password Matches Old one try Different One",
      });
    } else {
      const updateUser = await db.userCollection.findByIdAndUpdate(
        req.params.id,
        { $set: { password: await bcrypt.hash(req.body.newpassword, 10) } }
      );
      if (updateUser) {
        res.clearCookie("changePassToken");
        req.session.destroy();
        res.json({ redirect: true, message: "Password Updated Succesfully" });
      }
    }
  } catch (err) {
    next(err);
  }
};

const OtpsendChangepassword = async (req, res, next) => {
  try {
    const userInfo = await db.userCollection.findById(req.params.id);
    req.session.userCredentials = userInfo._id;
    req.session.userEmail = userInfo.email;
    req.session.save();
    sendOtp(userInfo.email, userInfo._id)
      .then((data) => {
        console.log(data);
        res.json({
          otpsend: true,
          message: `Otp has send to email${userInfo.email}`,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (er) {
    next(er);
  }
};

const getChangepasswordSubmitotp = async (req, res, next) => {
  try {
    let userInfo;
    let count;
    const cart = await cartDb.cartCollection.aggregate([
      { $match: { userId: new ObjectId(req.session.userCredentials) } },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
    ]);
    if (cart.length > 0) {
      userInfo = cart[0].userInfo[0];
      count = cart[0].products.length;
    } else {
      userInfo = await db.userCollection
        .findById(req.session.userCredentials)
        .lean();
      count = 0;
    }
    res.status(200).render("user/user_change_password_otp.hbs", {
      user: true,
      partial: true,
      userInfo,
      count,
    });
  } catch (err) {
    next(err);
  }
};

const verifyPasswordChangeotp = async (req, res, next) => {
  try {
    const otpInfo = await db.otpCollection.findOne({ otpId: req.params.id });
    console.log(otpInfo);
    const id = otpInfo.otpId;
    const date = Date.now();

    if (otpInfo.otp == req.body.otp) {
      if (otpInfo.expireAt > date) {
        const changePassToken = jwt.sign(
          { id },
          process.env.CHANGE_PASSWORD_SECRET,
          { expiresIn: "3min" }
        );

        res.cookie("changePassToken", changePassToken, {
          httpOnly: true,
        });
        res.json({
          success: true,
          message: "You will redirected",
          id: otpInfo.otpId,
        });
        req.session.destroy();
      } else {
        res.json({ otpExpired: true, message: "OTP Expired Hit Resend" });
      }
    } else {
      res.json({ otpNotvalid: true, message: "Invalid OTP" });
    }
  } catch (er) {
    next(er);
  }
};
const resendPasschangeOtp = async (req, res, next) => {
  try {
    const data = await otpResend(
      req.session.userEmail,
      req.session.userCredentials
    );
    if (data) {
      res.json({ send: true, message: data.message });
    }
  } catch (er) {
    next(er);
  }
};

const getChangePasswithotp = async (req, res, next) => {
  try {
    let userInfo;
    let count;
    const cart = await cartDb.cartCollection.aggregate([
      { $match: { userId: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
    ]);
    if (cart.length > 0) {
      userInfo = cart[0].userInfo[0];
      count = cart[0].products.length;
    } else {
      userInfo = await db.userCollection.findById(req.params.id).lean();
      count = 0;
    }
    res.status(200).render("user/user_change_pass_otp", {
      user: true,
      partial: true,
      userInfo,
      count,
    });
  } catch (er) {
    next(er);
  }
};

// in this controller the token is assigned for the check out and an expiry time of 6 min
const assignCheckoutToken = async (req, res, next) => {
  try {
    const cartData = await cartDb.cartCollection.aggregate([
      {
        $match: { userId: new ObjectId(req.body.user) },
      },
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          quantity: { $sum: "$products.quantity" },
        },
      },
    ]);

    const stock = await checkProductQuantity(cartData);
    console.log(stock);
    if (stock == true) {
      const checkOutToken = jwt.sign({}, process.env.CHECKOUT_SECRET, {
        expiresIn: "7min",
      });
      console.log(checkOutToken);
      res.cookie("checkOutToken", checkOutToken, {
        httpOnly: true,
      });
      if (checkOutToken) {
        res.json({ redirect: true });
      } else {
        res.sendStatus(500);
      }
    } else if (stock.status == false) {
      res.json({
        message: `The product ${stock.product}  is not Available at the moment`,
        outofStock: true,
      });
    } else {
      res.json({
        message: `The product ${stock}  is not Available at this quantity`,
        outofStock: true,
      });
    }
  } catch (err) {
    next(err);
  }
};

async function checkProductQuantity(cartData) {
  for (const product of cartData) {
    const productData = await productDb.productCollection.findById(product._id);
    if (productData.inStock == false) {
      return { status: false, product: productData.productName };
    } else if (productData.quantity < product.quantity) {
      return productData.productName;
    }
  }

  return true;
}

//get user checkout page
const getcheckOut = async (req, res, next) => {
  let address;
  let count;
  let userInfo;
  let total;
  const wallet = await walledDb.WalletCollection.findOne({
    userId: new ObjectId(req.params.id),
  });
  cartData = await checkOutAggregation(req.params.id);

  if (cartData.length > 0) {
    userInfo = cartData[0].userinfo[0];
    address = cartData[0].addressInfo;
    count = cartData[0].count;
    total = cartData[0].grandTotal;
  } else {
    userInfo = await db.userCollection.findById(req.params.id);
    address = await addressDb.addressCollection.findOne({
      userId: new ObjectId(req.params.id),
    });
    count = 0;
  }

  res.status(200).render("user/user_checkout", {
    user: true,
    partial: true,
    userInfo,
    address,
    count,
    total,
    balance: wallet.balance,
  });
  req.session.destroy();
};

//add checkout address
const addcheckoutAddress = async (req, res, next) => {
  try {
    const data = new addressDb.addressCollection({
      userId: req.body.userId,
      homeAddress: req.body.homeAddress,
      locality: req.body.locality,
      state: req.body.state,
      city: req.body.city,
      district: req.body.district,
      postalCode: Number(req.body.postalCode),
      phone: req.body.phone,
    });
    const user = await db.userCollection.findById(req.body.userId);
    const address = await data.save();
    if (address) {
      res
        .status(200)
        .json({ address, user, message: "Addres Added Successfully" });
    }
  } catch (er) {
    next(er);
  }
};

//addin a coupon
const addCoupon = async (req, res, next) => {
  try {
    const cartData = await couponAggregation(req.body.userId);
    const isCouponValid = await couponDb.couponCollection.findOne({
      code: req.body.code,
      isActive: true,
    });

    if (!req.session.coupon) {
      if (isCouponValid) {
        if (cartData[0].grandTotal > isCouponValid.minimumPurchaseAmount) {
          if (isCouponValid.validFor == "ALL") {
            if (!req.session.orderTotal) {
              let couponDiscount = [];

              req.session.orderTotal = cartData[0].orderInfo.map(
                (ele, index) => {
                  couponDiscount.push(
                    Math.ceil(
                      (isCouponValid.discountPercentage / 100) * ele.totalPrice
                    )
                  );

                  return {
                    id: ele.id,
                    orderTotal: Math.ceil(
                      ele.totalPrice - couponDiscount[index]
                    ),
                  };
                }
              );

              req.session.couponTotal = couponDiscount;
              const couponDiscountAmount = couponDiscount.reduce(
                (total, currentValue) => total + currentValue,
                0
              );
              req.session.discountGrandTotal = Math.ceil(
                cartData[0].grandTotal - couponDiscountAmount
              );

              req.session.coupon = true;
              req.session.save();
              res.json({
                success: true,
                grandTotal: req.session.discountGrandTotal,
                couponDiscountAmount: couponDiscountAmount,
                message: "Coupon Added SuccessFully",
              });
            } else {
              let couponDiscount = [];
              req.session.orderTotal.map((ele, index) => {
                couponDiscount.push(
                  Math.ceil(
                    (isCouponValid.discountPercentage / 100) *
                      cartData[0].orderInfo[index].totalPrice
                  )
                );

                ele.orderTotal -= couponDiscount[index];
              });

              req.session.couponTotal = couponDiscount;
              const couponDiscountAmount = couponDiscount.reduce(
                (total, currentValue) => total + currentValue,
                0
              );
              req.session.discountGrandTotal = Math.ceil(
                req.session.discountGrandTotal - couponDiscountAmount
              );
              req.session.coupon = true;
              req.session.save();

              res.json({
                success: true,
                grandTotal: req.session.discountGrandTotal,
                couponDiscountAmount: couponDiscountAmount,
                message: "Coupon Added SuccessFully",
              });
            }
          } else {
            const isProductValid = cartData[0].orderInfo.filter((ele) => {
              if (ele.categoryName !== isCouponValid.validFor) {
                return ele.productName;
              }
            });
            if (isProductValid.length > 0) {
              res.json({
                notValid: true,
                message: `Products ${isProductValid.join(
                  ", "
                )} is not Applicable for this coupon`,
              });
            } else {
              if (!req.session.orderTotal) {
                let couponDiscount = [];

                req.session.orderTotal = cartData[0].orderInfo.map(
                  (ele, index) => {
                    couponDiscount.push(
                      Math.ceil(
                        (isCouponValid.discountPercentage / 100) *
                          ele.totalPrice
                      )
                    );

                    return {
                      id: ele.id,
                      orderTotal: Math.ceil(
                        ele.totalPrice - couponDiscount[index]
                      ),
                    };
                  }
                );

                req.session.couponTotal = couponDiscount;
                const couponDiscountAmount = couponDiscount.reduce(
                  (total, currentValue) => total + currentValue,
                  0
                );
                req.session.discountGrandTotal = Math.ceil(
                  cartData[0].grandTotal - couponDiscountAmount
                );

                req.session.coupon = true;
                req.session.save();
                res.json({
                  success: true,
                  grandTotal: req.session.discountGrandTotal,
                  couponDiscountAmount: couponDiscountAmount,
                  message: "Coupon Added SuccessFully",
                });
              } else {
                let couponDiscount = [];
                req.session.orderTotal.map((ele, index) => {
                  couponDiscount.push(
                    Math.ceil(
                      (isCouponValid.discountPercentage / 100) *
                        cartData[0].orderInfo[index].totalPrice
                    )
                  );

                  ele.orderTotal -= couponDiscount[index];
                });

                req.session.couponTotal = couponDiscount;
                const couponDiscountAmount = couponDiscount.reduce(
                  (total, currentValue) => total + currentValue,
                  0
                );
                req.session.discountGrandTotal = Math.ceil(
                  req.session.discountGrandTotal - couponDiscountAmount
                );
                req.session.coupon = true;
                req.session.save();

                res.json({
                  success: true,
                  grandTotal: req.session.discountGrandTotal,
                  couponDiscountAmount: couponDiscountAmount,
                  message: "Coupon Added SuccessFully",
                });
              }
            }
          }
        } else {
          res.json({
            notValid: true,
            message: `Coupon is only applicable for the orders above${isCouponValid.minimumPurchaseAmount} `,
          });
        }
      } else {
        res.json({ notValid: true, message: "Enter a Valid Coupon" });
      }
    } else {
      res.json({
        notValid: true,
        message: "Coupon Already Added hit Remove and proceed",
      });
    }
  } catch (er) {
    next(er);
  }
};

//remove coupon
const removeCoupon = async (req, res, next) => {
  try {
    const cartData = await couponAggregation(req.params.id);
    if (req.session.coupon) {
      if (req.session.orderTotal) {
        req.session.orderTotal.map((ele, index) => {
          ele.orderTotal += req.session.couponTotal[index];
        });

        const sum = req.session.couponTotal.reduce(
          (total, currentValue) => total + currentValue,
          0
        );
        delete req.session.couponTotal;
        delete req.session.coupon;
        console.log(req.session.orderTotal);

        res.json({
          success: true,
          grandTotal: Math.ceil((req.session.discountGrandTotal += sum)),
          message: `Coupon SuccessFully removed`,
        });
      } else {
        req.session.destroy();
        res.json({
          success: true,
          grandTotal: cartData[0].grandTotal,
          message: `Coupon SuccessFully removed`,
        });
      }
    } else {
      res.json({ notFound: true, message: "Coupon Not Applied" });
    }
  } catch (er) {
    next(er);
  }
};

//add wallet amount
const addWalletAmount = async (req, res, next) => {
  try {
    const cartData = await couponAggregation(req.params.id);
    const { value } = req.body;
    const wallet = await walledDb.WalletCollection.findOne({
      userId: new ObjectId(req.params.id),
    });

    if (!req.session.wallet) {
      if (req.body.value < cartData[0].grandTotal * 0.8) {
        if (wallet.balance > Number(value)) {
          if (req.session.orderTotal) {
            req.session.walletAmount = [];
            const orderTotalSum = req.session.orderTotal.reduce(
              (acc, item) => acc + item.orderTotal,
              0
            );

            if (orderTotalSum > 0) {
              const deductionPerUnit = value / orderTotalSum;

              req.session.orderTotal.forEach((item, index) => {
                req.session.walletAmount.push(
                  item.orderTotal * deductionPerUnit
                );
                item.orderTotal = Math.ceil(
                  item.orderTotal - req.session.walletAmount[index]
                );
              });
            }
            req.session.discountGrandTotal = Math.ceil(
              req.session.discountGrandTotal - value
            );
            req.session.wallet = true;
            req.session.save();

            res.json({
              success: true,
              grandTotal: req.session.discountGrandTotal,
              message: `Amount of ₹ ${value} Successfully Added`,
            });
          } else {
            const cartTotalSum = cartData[0].orderInfo.reduce(
              (acc, item) => acc + item.totalPrice,
              0
            );

            if (cartTotalSum > 0) {
              req.session.walletAmount = [];
              req.session.orderTotal = cartData[0].orderInfo.map(
                (element, index) => {
                  req.session.walletAmount.push(
                    Math.ceil((element.totalPrice / cartTotalSum) * value)
                  );

                  const adjustedOrderTotal = Math.max(
                    0,
                    element.totalPrice - req.session.walletAmount[index]
                  );

                  return {
                    id: element.id,
                    orderTotal: adjustedOrderTotal,
                  };
                }
              );
              req.session.discountGrandTotal = Math.ceil(
                cartData[0].grandTotal - value
              );
            }

            req.session.wallet = true;
            req.session.save();

            res.json({
              success: true,
              grandTotal: req.session.discountGrandTotal,
              message: `Amount ₹ ${value} Added Successfully`,
            });
          }
        } else {
          res.json({
            notApplied: true,
            message: "Insufficient Balance!",
          });
        }
      } else {
        res.json({
          notApplied: true,
          message: "You can use up to 80% of Grand Total",
        });
      }
    } else {
      res.json({
        notApplied: true,
        message: "Wallet Amount Already Added",
      });
    }
  } catch (er) {
    console.log(er);
    next(er);
  }
};

//remove wallet
const removeWallet = async (req, res, next) => {
  try {
    const cartData = await couponAggregation(req.params.id);
    if (req.session.wallet) {
      if (req.session.orderTotal) {
        req.session.orderTotal.map((ele, index) => {
          ele.orderTotal += req.session.walletAmount[index];
          req.session.discountGrandTotal += req.session.walletAmount[index];
        });
        delete req.session.wallet;
        delete req.session.walletAmount;

        res.json({
          success: true,
          grandTotal: req.session.discountGrandTotal,
          message: `Wallet Amount Removed`,
        });
      } else {
        req.session.destroy();
        res.json({
          success: true,
          message: `Wallet Amount Removed`,
          grandTotal: cartData[0].grandTotal,
        });
      }
    }
  } catch (er) {
    next(er);
  }
};

//placing an order
const placeOrder = async (req, res, next) => {
  try {
    const cartData = await placeOrderAggregation(req.body.userId);

    const stock = await checkProductQuantity(cartData[0].productQuantities);
    let data;
    let orders;
    let updatedProduct;
    const orderId = uuidv4();

    if (cartData[0].grandTotal > 5000 && req.body.paymentMethod == "COD") {
      res.json({
        codNot: true,
        message: "Orders Above ₹5000 Cannot be Done through Cash on Delivery",
      });
    } else {
      if (stock == true) {
        if (req.body.paymentMethod == "COD" && !req.body.wallet) {
          data = await makingOrder(cartData, res, req, orderId);
          orders = await orderDb.orderCollection.insertMany(data);
          updatedProduct = await updateStock(req.body.userId);

          res.status(200).json({ redirect: true });
        } else if (req.body.paymentMethod == "RAZORPAY" && !req.body.wallet) {
          data = await makingOrder(cartData, res, req, orderId);
          orders = await orderDb.orderCollection.insertMany(data);

          var options = {
            amount: data[0].grandTotal * 100,
            currency: "INR",
            receipt: `#${orderId}`,
          };
          instance.orders.create(options, function (err, order) {
            if (err) {
              console.log(err);
            } else {
              res.json({ order, user: cartData[0].userInfo });
            }
          });
        } else if (
          req.body.paymentMethod == "COD" &&
          req.body.wallet == "WALLET"
        ) {
          if (!req.session.walletAmount) {
            res.json({
              codNot: true,
              message: "Please apply the Wallet amount to proceed",
            });
          } else {
            data = await makingOrder(cartData, res, req, orderId);
            orders = await orderDb.orderCollection.insertMany(data);
            updatedProduct = await updateStock(req.body.userId);
            const walletSum = data.reduce((acc, item) => acc + item.wallet, 0);
            updateWallet(walletSum, "Withdrawal", req.body.userId);
            res.status(200).json({ redirect: true });
          }
        } else if (
          req.body.paymentMethod == "RAZORPAY" &&
          req.body.wallet == "WALLET"
        ) {
          if (!req.session.walletAmount) {
            res.json({
              codNot: true,
              message: "Please apply the Wallet amount to proceed",
            });
          } else {
            data = await makingOrder(cartData, res, req, orderId);
            orders = await orderDb.orderCollection.insertMany(data);
            const walletSum = data.reduce((acc, item) => acc + item.wallet, 0);
            var options = {
              amount: data[0].grandTotal * 100,
              currency: "INR",
              receipt: `#${orderId}`,
            };
            instance.orders.create(options, function (err, order) {
              if (err) {
                console.log(err);
              } else {
                res.json({ order, user: cartData[0].userInfo, walletSum });
              }
            });
          }
        }
      } else {
        res.json({
          outofStock: true,
          message: `${stock} is not Available at the moment Remove from the cart and Proceed`,
        });
      }
    }
  } catch (err) {
    next(err);
  }
};

async function makingOrder(cartData, res, req, orderId) {
  let data = [];
  let count = 0;
  for (const products of cartData[0].orderInfo) {
    const order = {
      orderId: `#${orderId}`,
      userId: new ObjectId(req.body.userId),
      addressId: new ObjectId(req.body.addressId),
      orderedAt: Date.now(),
      orderStatus: req.body.paymentMethod === "COD" ? "ACTIVE" : "PENDING",
      orderStage:
        req.body.paymentMethod === "RAZORPAY"
          ? "PAYMENT PENDING"
          : "PREPARING FOR DISPATCH",
      quantity: products.quantity,
      productId: new ObjectId(products.productId),
      orderTotal: Math.ceil(
        req.session.orderTotal
          ? req.session.orderTotal.find(
              (element) => element.id.toString() == products.id.toString()
            )?.orderTotal
          : products.totalPrice
      ),
      paymentMethod: req.body.paymentMethod,
      variant: { frameSize: products.frameSize, color: products.color },
      grandTotal: Math.ceil(
        req.session.discountGrandTotal
          ? req.session.discountGrandTotal
          : cartData[0].grandTotal
      ),
      wallet: Math.ceil(
        req.session.wallet ? req.session.walletAmount[count] : false
      ),
    };
    data.push(order);
    count++;
  }

  return data;
}

//function to update the wallet
async function updateWallet(amount, type, id) {
  try {
    await walledDb.WalletCollection.findOneAndUpdate(
      { userId: new ObjectId(id) },
      {
        $inc: { balance: -amount },
        $push: {
          history: {
            transactionType: type,
            amount: amount,
            date: Date.now(),
          },
        },
      }
    );
  } catch (er) {
    console.log(er);
  }
}

//function update stock and quantity
async function updateStock(userId) {
  let updatedProduct;
  let cart;

  cart = await cartDb.cartCollection.aggregate([
    {
      $match: { userId: new ObjectId(userId) },
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "product_datas",
        localField: "products.productId",
        foreignField: "_id",
        as: "Product",
      },
    },
    {
      $unwind: "$Product",
    },
    {
      $addFields: {
        grandTotal: { $multiply: ["$products.quantity", "$Product.price"] },
      },
    },
    {
      $group: {
        _id: "$_id",
        userId: { $first: "$userId" },
        grandTotal: { $sum: "$grandTotal" },

        products: {
          $push: {
            _id: "$products._id",
            productId: "$products.productId",
            quantity: "$products.quantity",
            totalPrice: "$grandTotal",
            frameSize: "$products.frameSize",
            color: "$products.color",
            Product: {
              _id: "$Product._id",
              productName: "$Product.productName",
              categoryId: "$Product.category",
              price: "$Product.price",
              inStock: "$Product.inStock",
              images: "$Product.images",
            },
          },
        },
      },
    },
  ]);

  for (const product of cart[0].products) {
    const productId = new ObjectId(product.productId);
    updatedProduct = await productDb.productCollection.findOneAndUpdate(
      { _id: productId },
      { $inc: { quantity: -product.quantity } },
      { returnDocument: "after" }
    );
    if (updatedProduct.quantity <= 0) {
      await productDb.productCollection.updateOne(
        { _id: productId },
        { $set: { inStock: false } }
      );
    }
    await categoryDb.categoryCollection.findOneAndUpdate(
      product.Product.categoryId,
      { $inc: { totalSale: product.totalPrice, soldProduct: product.quantity } }
    );
  }

  const updatedCart = await cartDb.cartCollection.updateOne(
    { userId: new ObjectId(userId) },
    { $set: { products: [] } }
  );

  if (updatedProduct && updatedCart) {
    return true;
  }
}

//
// To check the payment is successfull or not
const verifyPayment = async (req, res, next) => {
  try {
    let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(
      req.body["payment[razorpay_order_id]"] +
        "|" +
        req.body["payment[razorpay_payment_id]"]
    );
    hmac = hmac.digest("hex");
    if (hmac == req.body["payment[razorpay_signature]"]) {
      if (req.body["order[orderInfo][_id]"]) {
        console.log(req.body);
        const updateOrder = await orderDb.orderCollection.findOneAndUpdate(
          {
            _id: new ObjectId(req.body["order[orderInfo][_id]"]),
          },
          {
            $set: {
              orderStatus: "ACTIVE",
              orderStage: "PREPARING FOR DISPATCH",
              orderedAt: Date.now(),
            },
          },
          { returnDocument: "after" }
        );
        if (updateOrder.wallet) {
          updateWallet(
            updateOrder.wallet,
            "Withdrawal",
            req.body["order[user][_id]"]
          );
        }

        generateInvoice(
          req.body["order[orderInfo][_id]"],
          req.body["order[user][_id]"],
          true
        )
          .then(async (downloadLink) => {
            await orderDb.orderCollection.findOneAndUpdate(
              { _id: new ObjectId(req.body["order[orderInfo][_id]"]) },
              { $set: { invoiceDownload: downloadLink } }
            );
          })
          .catch((error) => {
            console.error("Error generating invoice or updating order:", error);
          });
        const checkOutToken = jwt.sign({}, process.env.CHECKOUT_SECRET, {
          expiresIn: "10s",
        });
        res.cookie("checkOutToken", checkOutToken, {
          httpOnly: true,
        });
        const productId = req.body["order[orderInfo][productId]"];
        const quantityToDecrement = req.body["order[orderInfo][quantity]"];

        const updatedProduct =
          await productDb.productCollection.findByIdAndUpdate(
            productId,
            { $inc: { quantity: -quantityToDecrement } },
            { new: true }
          );
        await categoryDb.categoryCollection.findByIdAndUpdate(
          updatedProduct.category,
          {
            $inc: {
              totalSale: updatedProduct.price * quantityToDecrement,
              soldProduct: quantityToDecrement,
            },
          }
        );

        if (updatedProduct.quantity <= 0) {
          await productDb.productCollection.findByIdAndUpdate(
            productId,
            { $set: { inStock: false } },
            { new: true }
          );
        }

        if (updatedProduct && updateOrder) {
          res.json({ paymentSuccess: true });
        }
      } else if (req.body["order[value]"]) {
        const wallet = await walledDb.WalletCollection.findOneAndUpdate(
          {
            userId: new ObjectId(req.body["order[user][_id]"]),
          },
          {
            $inc: { balance: Number(req.body["order[value]"]) },
            $push: {
              history: {
                transactionType: "Deposit",
                date: Date.now(),
                amount: Number(req.body["order[value]"]),
              },
            },
          },
          { returnDocument: "after" }
        );
        if (wallet) {
          res.json({
            amountAdded: true,
            message: `Amount of ₹${req.body["order[value]"]} has succesfully Added To Wallet`,
            balance: wallet.balance,
          });
        }
      } else if (req.body["order[buyNow]"]) {
        updateBuyNowStock(req);
        const updateOrder = await orderDb.orderCollection.updateOne(
          {
            orderId: req.body["order[order][receipt]"],
          },
          {
            $set: {
              orderStatus: "ACTIVE",
              orderStage: "PREPARING FOR DISPATCH",
            },
          }
        );

        if (req.body["order[walletSum]"]) {
          await updateWallet(
            Number(req.body["order[walletSum]"]),
            "Withdrawal",
            req.body["order[user][_id]"]
          );
        }
        generateInvoice(
          req.body["order[order][receipt]"],
          req.body["order[user][_id]"],
          false
        )
          .then(async (downloadLink) => {
            await orderDb.orderCollection.updateMany(
              { orderId: req.body["order[order][receipt]"] },
              { $set: { invoiceDownload: downloadLink } }
            );
          })
          .catch((error) => {
            console.error("Error generating invoice or updating order:", error);
          });

        if (updateOrder) {
          res.json({
            paymentSuccess: true,
            message: "Invoice has send to your Email",
          });
        }
      } else {
        await updateStock(req.body["order[user][_id]"]);
        const updateOrder = await orderDb.orderCollection.updateMany(
          {
            orderId: req.body["order[order][receipt]"],
          },
          {
            $set: {
              orderStatus: "ACTIVE",
              orderStage: "PREPARING FOR DISPATCH",
            },
          }
        );
        if (req.body["order[walletSum]"]) {
          await updateWallet(
            Number(req.body["order[walletSum]"]),
            "Withdrawal",
            req.body["order[user][_id]"]
          );
        }

        generateInvoice(
          req.body["order[order][receipt]"],
          req.body["order[user][_id]"],
          false
        )
          .then(async (downloadLink) => {
            await orderDb.orderCollection.updateMany(
              { orderId: req.body["order[order][receipt]"] },
              { $set: { invoiceDownload: downloadLink } }
            );
          })
          .catch((error) => {
            console.error("Error generating invoice or updating order:", error);
          });

        if (updateOrder) {
          res.json({
            paymentSuccess: true,
            message: "Invoice has send to your Email",
          });
        }
      }
    } else {
      if (req.body["order[orderInfo][_id]"]) {
        await orderDb.orderCollection.updateMany(
          {
            orderId: req.body["order[orderInfo][_id]"],
          },
          {
            $set: { orderStatus: "FAILED", orderStage: "PAYMENT FAILED" },
          }
        );
        res.json({ paymentUnsuccess: true });
      } else {
        await orderDb.orderCollection.updateMany(
          {
            orderId: req.body["order[order][receipt]"],
          },
          {
            $set: { orderStatus: "FAILED", orderStage: "PAYMENT FAILED" },
          }
        );
        res.json({ paymentUnsuccess: true });
      }
    }
  } catch (er) {
    next(er);
  }
};

async function checkQuantityCompletePayment(proId, qty) {
  const product = await productDb.productCollection.findById(proId);
  if (product.quantity < qty) {
    return product.productName;
  }
  return true;
}

//completing payment which is pending
const completePayment = async (req, res, next) => {
  try {
    const orders = await orderDb.orderCollection.aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
    ]);
    const stock = await checkQuantityCompletePayment(
      orders[0].productId,
      orders[0].quantity
    );
    if (stock == true) {
      var options = {
        amount: orders[0].orderTotal * 100,
        currency: "INR",
        receipt: `${orders[0].orderId}`,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
        } else {
          res.json({ order, orderInfo: orders[0], user: orders[0].userInfo });
        }
      });
    } else {
      res.json({
        outofStock: true,
        message: `Product ${stock} is not available At the moment`,
      });
    }
  } catch (er) {
    next(er);
  }
};
//
const getorderSuccessfull = (req, res, next) => {
  try {
    res.clearCookie("checkOutToken");
    const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
    res
      .status(200)
      .render("user/order_success", { orderSuccess: true, userId: user._id });
  } catch (er) {
    next(er);
  }
};
//to get myorders

const getMyorders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 6;
    const orderedOneDayBefore = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await orderDb.orderCollection.updateMany(
      {
        orderStatus: "PENDING",
        orderedAt: { $lt: orderedOneDayBefore },
      },
      {
        $set: {
          orderStatus: "CANCELLED",
          orderStage: "CANCELLED DUE TO PAYMENT NOT DONE",
        },
      }
    );
    const OrderCount = await orderDb.orderCollection.countDocuments({
      userId: new ObjectId(req.params.id),
    });
    const totalPages = Math.ceil(OrderCount / perPage);
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    const orders = await orderDb.orderCollection.aggregate([
      { $match: { userId: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "product_datas",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $lookup: {
          from: "catogory_datas",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $unwind: "$productInfo" },
      { $unwind: "$userInfo" },
      {
        $sort: {
          orderedAt: -1,
        },
      },
      { $skip: (page - 1) * perPage }, // Skip documents based on current page and perPage value
      { $limit: perPage }, // Limit results to perPage
    ]);

    for (const order of orders) {
      order.orderedAt = order.orderedAt.toDateString();
    }
    let count;
    const cart = await cartDb.cartCollection
      .find({
        userId: new ObjectId(req.params.id),
      })
      .lean();
    if (cart) {
      count = cart[0].products.length;
    } else {
      count = 0;
    }

    const userInfo =
      orders.length > 0
        ? orders[0].userInfo
        : await db.userCollection.findById(req.params.id).lean();

    res.status(200).render("user/user_myorders", {
      user: true,
      partial: true,
      count,
      totalPages,
      currentPage: page,
      userInfo,
      orders,
      pages,
    });
  } catch (err) {
    next(err);
  }
};

//viewing the order
const viewOrder = async (req, res, next) => {
  try {
    let count;
    const orders = await orderDb.orderCollection.aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "product_datas",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $lookup: {
          from: "address_datas",
          localField: "addressId",
          foreignField: "_id",
          as: "addressInfo",
        },
      },
      { $unwind: "$productInfo" },
      { $unwind: "$userInfo" },
      { $unwind: "$addressInfo" },
    ]);

    orders[0].orderedAt = orders[0].orderedAt.toLocaleString();
    const orderData = orders[0];
    const userInfo = orders[0].userInfo;
    const cart = await cartDb.cartCollection
      .find({
        userId: new ObjectId(userInfo._id),
      })
      .lean();

    if (cart.length > 0) {
      count = cart[0].products.length;
    } else {
      count = 0;
    }
    req.session.destroy();
    res.status(200).render("user/user_vieworder", {
      user: true,
      partial: true,
      orderData,
      userInfo,
      count,
    });
  } catch (er) {
    console.log(er);
    next(er);
  }
};

//track order
const trackOrder = async (req, res, next) => {
  try {
    const orders = await orderDb.orderCollection.aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "user_datas",
          foreignField: "_id",
          localField: "userId",
          as: "userInfo",
        },
      },
      {
        $lookup: {
          from: "product_datas",
          foreignField: "_id",
          localField: "productId",
          as: "productInfo",
        },
      },
      { $unwind: "$userInfo" },
      { $unwind: "$productInfo" },
    ]);
    orders[0].updatedAt = orders[0].updatedAt.toDateString();
    const cart = await cartDb.cartCollection.findOne({
      userId: new ObjectId(orders[0].userId),
    });
    console.log(orders);
    const count = cart.products.length;
    res.status(200).render("user/user-track-order", {
      user: true,
      partial: true,
      userInfo: orders[0].userInfo,
      count,
      orders: orders[0],
    });
  } catch (er) {
    next(er);
  }
};

const cancelProduct = async (req, res, next) => {
  try {
    const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
    const userInfo = await db.userCollection.findById(user._id);
    req.session.userEmail = userInfo.email;
    req.session.userId = userInfo._id;
    req.session.reason =
      req.body.formData !== "" ? req.body.formData : req.body.checkedValue;

    console.log(req.body);
    const order = await orderDb.orderCollection.findById(req.params.id);
    if (order.orderStage !== "OUT FOR DELIVERY") {
      req.session.orderId = req.params.id;
      const data = await otpResend(req.session.userEmail, req.session.userId);
      if (data) {
        res.status(200).json({ redirect: true, message: data.message });
      }
    } else {
      res.status(304).json({
        message: `Order Cancellation not available at this stage`,
        cancelNotAvailable: true,
      });
    }
  } catch (er) {
    next(er);
  }
};

const getcancelProductSubmitOtp = async (req, res, next) => {
  try {
    if (req.session.orderId) {
      let count;
      const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
      const userInfo = await db.userCollection.findById(user._id).lean();
      const cart = await cartDb.cartCollection.find({
        userId: new ObjectId(user._id),
      });
      if (cart.length > 0) {
        count = cart[0].products.length;
      } else {
        count = 0;
      }

      res.status(200).render("user/cancel_product_otp", {
        user: true,
        partial: true,
        userInfo,
        count,
      });
    } else {
      res.redirect("/list_products");
    }
  } catch (err) {
    next(err);
  }
};

//validating the cancel otp

const validateCancelotp = async (req, res, next) => {
  try {
    const isOtp = await db.otpCollection.findOne({
      otpId: req.session.userId,
    });

    //checking weather the otp is expired
    const date = new Date();
    if (isOtp.otp == req.body.otp) {
      if (isOtp.expireAt >= date) {
        const cancelledOrder = await orderDb.orderCollection.updateOne(
          {
            _id: new ObjectId(req.session.orderId),
          },
          {
            $set: {
              orderStage: "CANCELLATION REQUESTED",
              reason: req.body.reason,
            },
          }
        );
        if (cancelledOrder) {
          res.status(200).json({
            message: "Order Cancelled Success Fully ",
            id: req.session.userId,
            cancelled: true,
          });
          req.session.destroy();
        }
      } else {
        res.json({ message: "Otp Expired Hit resend Button" });
      }
    } else {
      res.json({ message: "Entered Otp is Invalid" });
    }
  } catch (err) {
    next(err);
  }
};

// resend cancel otp

const resendCancelOtp = async (req, res, next) => {
  try {
    const data = await otpResend(req.session.userEmail, req.session.userId);
    if (data) {
      res.status(200).json({ message: data.message });
    }
  } catch (er) {
    next(er);
  }
};

//user return order
const returnOrder = async (req, res, next) => {
  try {
    const reason =
      req.body.formData !== "" ? req.body.formData : req.body.checkedValue;

    const order = await orderDb.orderCollection.findByIdAndUpdate(
      req.params.id,
      { $set: { orderStage: "RETURN REQUESTED", reason: reason } }
    );
    if (order) {
      res.json({
        success: true,
        message: `Order ID: ${order.orderId} successfully Returned`,
      });
    }
  } catch (er) {
    next(er);
  }
};
////////////////////////////
/////////////////////////////
/////////////////////////////
//////////////////////////

//user whishlist
const getWishlist = async (req, res, next) => {
  try {
    let userInfo;
    let count;
    let wishlistCount;
    const cartData = await cartDb.cartCollection.aggregate([
      { $match: { userId: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "user_datas",
          foreignField: "_id",
          localField: "userId",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
    ]);
    const banners = await bannerDB.bannerCollection
      .find({ status: true, bannerCat: "MAIN" })
      .lean();
    const wishlist = await wishlistDb.wishlistCollection.aggregate([
      { $match: { userId: new ObjectId(req.params.id) } },

      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },

      { $unwind: "$products" },

      {
        $lookup: {
          from: "product_datas",
          localField: "products.productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },

      { $unwind: "$productInfo" },
      {
        $lookup: {
          from: "catogory_datas",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      { $unwind: "$userInfo" },
      { $unwind: "$categoryInfo" },
      {
        $group: {
          _id: "$_id",
          products: {
            $push: {
              $mergeObjects: [
                "$productInfo",
                { categoryInfo: "$categoryInfo" },
              ],
            },
          },
          userInfo: { $first: "$userInfo" },
        },
      },
    ]);

    if (wishlist.length > 0) {
      userInfo = wishlist[0].userInfo;
      if (cartData.length > 0) {
        count = cartData[0].products.length;
      } else {
        count = 0;
      }
    } else {
      if (cartData.length > 0) {
        userInfo = cartData[0].userInfo;
        count = cartData[0].products.length;
      } else {
        userInfo = await db.userCollection.findById(req.params.id).lean();
        count = 0;
      }
    }

    res.status(200).render("user/user_wishlist", {
      user: true,
      partial: true,
      banners,
      userInfo,
      count,
      wishlist: wishlist[0],
    });
  } catch (er) {
    next(er);
  }
};

//add to wishlist
const addtoWishlist = async (req, res, next) => {
  try {
    let isProductInWishlist;
    const productId = new ObjectId(req.params.id);
    const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
    const wishlist = await wishlistDb.wishlistCollection.findOne({
      userId: new ObjectId(user._id),
    });
    if (wishlist) {
      isProductInWishlist = wishlist.products.some((product) =>
        product.productId.equals(productId)
      );
    }

    if (!isProductInWishlist) {
      await wishlistDb.wishlistCollection.updateOne(
        { userId: new ObjectId(user._id) },
        { $push: { products: { productId: productId } } },
        { upsert: true }
      );

      res.json({ added: true });
    } else {
      res.json({ exist: true });
    }
  } catch (er) {
    next(er);
  }
};

//remove from wishlist
const removeFromwishlist = async (req, res, next) => {
  try {
    const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
    const updateWishlist = await wishlistDb.wishlistCollection.updateOne(
      { userId: new ObjectId(user._id) },
      { $pull: { products: { productId: new ObjectId(req.params.id) } } }
    );
    if (updateWishlist.modifiedCount) {
      res.json({ success: true, message: "Product Removed success Fully" });
    }
  } catch (er) {
    next(er);
  }
};

//get user wallet history

const getWalletHistory = async (req, res, next) => {
  try {
    console.log(req.params.id);
    const wallet = await walledDb.WalletCollection.aggregate([
      {
        $match: { userId: new ObjectId(req.params.id) },
      },
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      { $unwind: "$history" },
      { $sort: { "history.date": -1 } },
      {
        $group: {
          _id: "$_id",
          userId: { $first: "$userId" },
          balance: { $first: "$balance" },
          userInfo: { $first: "$userInfo" },
          history: { $push: "$history" }, // Group history array back together
        },
      },
    ]);
    const cart = await cartDb.cartCollection.findById(req.params.id).lean();
    let count;

    if (cart) {
      count = cart.products.length;
    } else {
      count = 0;
    }
    if (wallet[0].history.length > 0) {
      wallet[0].history.forEach((item) => {
        item.date = item.date.toLocaleString();
      });
    }
    res.status(200).render("user/user_wallet_history", {
      user: true,
      partial: true,
      count,
      userInfo: wallet[0].userInfo,
      walletHistory: wallet[0].history,
      balance: wallet[0].balance,
    });
  } catch (Er) {
    next(Er);
  }
};

//
//user Buy now button

const buyNowProduct = async (req, res, next) => {
  try {
    const product = await productDb.productCollection.aggregate([
      { $match: { _id: new ObjectId(req.params.id) } },
      {
        $lookup: {
          from: "catogory_datas",
          foreignField: "_id",
          localField: "category",
          as: "category_info",
        },
      },
      { $unwind: "$category_info" },
    ]);
    req.session.product = product[0];
    req.session.grandTotal = Math.ceil(
      product[0].price * Number(req.body.quantity)
    );
    req.session.realTotal = Math.ceil(
      product[0].price * Number(req.body.quantity)
    );
    req.session.data = req.body;

    req.session.save();
    if (product[0].inStock) {
      const checkOutToken = jwt.sign({}, process.env.CHECKOUT_SECRET, {
        expiresIn: "7min",
      });
      res.cookie("checkOutToken", checkOutToken, {
        httpOnly: true,
      });
      if (checkOutToken) {
        res.json({ redirect: true });
      }
    } else {
      res.json({ notAvail: true, message: "Product Is Currently UnAvailable" });
    }
  } catch (er) {
    next(er);
  }
};

const getCheckBuyNowCheckOut = async (req, res, next) => {
  try {
    let address;
    let count;
    let userInfo;
    let total;

    total = req.session.grandTotal;
    address = await addressDb.addressCollection
      .find({
        userId: new ObjectId(req.params.id),
        isDeleted: false,
      })
      .lean();

    let cart = await cartDb.cartCollection
      .findOne({
        userId: new ObjectId(req.params.id),
      })
      .lean();
    userInfo = await db.userCollection.findById(req.params.id).lean();
    const wallet = await walledDb.WalletCollection.findOne({
      userId: new ObjectId(req.params.id),
    }).lean();
    if (cart) {
      count = cart.products.length;
    } else {
      count = 0;
    }

    res.status(200).render("user/user_checkout", {
      user: true,
      partial: true,
      userInfo,
      address,
      count,
      total,
      balance: wallet.balance,
      buyNow: true,
    });
  } catch (Er) {
    next(Er);
  }
};

//add buy now wallet amount
const addWalletBuynow = async (req, res, next) => {
  try {
    const allowedAmount = Math.ceil(req.session.grandTotal * 0.8);
    const wallet = await walledDb.WalletCollection.findOne({
      userId: new ObjectId(req.params.id),
    });
    if (wallet.balance >= req.body.value) {
      if (req.session.buyNowWalletAmount) {
        res.json({
          notApplied: true,
          message:
            "Wallet Amount is Already added please uncheck to add new amount",
        });
      } else {
        if (req.body.value > allowedAmount) {
          res.json({
            notApplied: true,
            message: "You can Only use Upto 80% of you grand total",
          });
        } else {
          req.session.grandTotal -= req.body.value;
          req.session.buyNowWalletAmount = req.body.value;
          req.session.save();
          res.json({
            success: true,
            message: `Amount of ₹${req.body.value} is Successfully added`,
            grandTotal: req.session.grandTotal,
          });
        }
      }
    } else {
      res.json({
        notApplied: true,
        message: "Insufficient Balance!",
      });
    }
  } catch (Er) {
    next(Er);
  }
};

const removeWalletBuynow = async (req, res, next) => {
  try {
    req.session.grandTotal += Math.ceil(Number(req.session.buyNowWalletAmount));
    delete req.session.buyNowWalletAmount;
    res.json({ grandTotal: req.session.grandTotal });
  } catch (Er) {
    next(Er);
  }
};

const addCouponbuyNow = async (req, res, next) => {
  try {
    const coupon = await couponDb.couponCollection.findOne({
      code: req.body.code,
      isActive: true,
    });

    if (coupon) {
      if (!req.session.buyNowCouponAmount) {
        if (coupon.validFor == "ALL") {
          if (coupon.minimumPurchaseAmount < req.session.realTotal) {
            res.json({
              notValid: true,
              message: `Coupon Code is only Applicable for orders above ₹${coupon.minimumPurchaseAmount}`,
            });
          } else {
            const couponDiscount = Math.ceil(
              (coupon.discountPercentage / 100) * req.session.product.price
            );
            req.session.buyNowCouponAmount = couponDiscount;
            req.session.grandTotal -= couponDiscount;
            req.session.save();
            res.json({
              success: true,
              message: "Coupon Added Successfully",
              grandTotal: req.session.grandTotal,
              couponDiscountAmount: couponDiscount,
            });
          }
        } else {
          if (
            coupon.validFor == req.session.product.category_info.categoryName
          ) {
            if (coupon.minimumPurchaseAmount < req.session.realTotal) {
              res.json({
                notValid: true,
                message: `Coupon Code is only Applicable for orders above ₹${coupon.minimumPurchaseAmount}`,
              });
            } else {
              const couponDiscount = Math.ceil(
                (coupon.discountPercentage / 100) * req.session.product.price
              );
              req.session.buyNowCouponAmount = couponDiscount;
              req.session.grandTotal -= couponDiscount;
              req.session.save();
              res.json({
                success: true,
                message: "Coupon Added Successfully",
                grandTotal: req.session.grandTotal,
                couponDiscountAmount: couponDiscount,
              });
            }
          } else {
            res.json({
              notValid: true,
              message: "Coupon Code is not valid For this product",
            });
          }
        }
      } else {
        res.json({
          notValid: true,
          message: "Coupon Is Already Addded Hit Remove to Add new",
        });
      }
    } else {
      res.json({ notValid: true, message: "Coupon Code is not valid One" });
    }
  } catch (er) {
    next(er);
  }
};

const removeCouponBuynow = async (req, res, next) => {
  try {
    if (req.session.buyNowCouponAmount) {
      req.session.grandTotal += req.session.buyNowCouponAmount;
      delete req.session.buyNowCouponAmount;
      res.json({
        success: true,
        message: "Coupon Removed Succesfully",
        grandTotal: req.session.grandTotal,
      });
    } else {
      res.json({ notFound: true, message: "Coupon is Not Added" });
    }
  } catch (er) {
    next(er);
  }
};

const placeBuyNowOrder = async (req, res, next) => {
  try {
    const orderId = uuidv4();
    let orders;
    const userInfo = await db.userCollection.findById(req.body.userId);
    const product = await productDb.productCollection.findById(
      req.session.product._id
    );
    if (product.quantity > Number(req.session.data.quantity)) {
      if (req.body.paymentMethod == "COD" && req.session.grandTotal > 5000) {
        res.json({
          codNot: true,
          message: "Orders Above ₹ 5000 Cannot be done through COD",
        });
      } else {
        if (req.body.paymentMethod == "COD" && !req.body.wallet) {
          updateBuyNowStock(req);
          const data = makeBuynoworder(orderId, req);
          orders = await orderDb.orderCollection.insertMany(data);
          if (orders) {
            res.json({
              redirect: true,
            });
          }
        } else if (
          req.body.paymentMethod == "COD" &&
          req.body.wallet == "WALLET"
        ) {
          if (!req.session.buyNowWalletAmount) {
            res.json({
              codNot: true,
              message: "Please apply the Wallet amount to proceed",
            });
          } else {
            const data = makeBuynoworder(orderId, req);
            orders = await orderDb.orderCollection.insertMany(data);
            if (orders) {
              await updateWallet(
                req.session.buyNowWalletAmount,
                "Withdrawal",
                req.body.userId
              );
              res.json({
                redirect: true,
              });
            }
          }
        } else if (req.body.paymentMethod == "RAZORPAY" && !req.body.wallet) {
          const data = makeBuynoworder(orderId, req);
          orders = await orderDb.orderCollection.insertMany(data);
          var options = {
            amount: data.grandTotal * 100,
            currency: "INR",
            receipt: `#${orderId}`,
          };

          instance.orders.create(options, function (err, order) {
            if (err) {
              console.log(err);
            } else {
              res.json({
                order,
                user: userInfo,
                buyNow: true,
              });
            }
          });
        } else if (
          req.body.paymentMethod == "RAZORPAY" &&
          req.body.wallet == "WALLET"
        ) {
          if (!req.session.buyNowWalletAmount) {
            res.json({
              codNot: true,
              message: "Please apply the Wallet amount to proceed",
            });
          } else {
            const data = makeBuynoworder(orderId, req);
            orders = await orderDb.orderCollection.insertMany(data);
            var options = {
              amount: data.grandTotal * 100,
              currency: "INR",
              receipt: `#${orderId}`,
            };

            instance.orders.create(options, function (err, order) {
              if (err) {
                console.log(err);
              } else {
                res.json({
                  order,
                  user: userInfo,
                  walletSum: data.wallet,
                  buyNow: true,
                });
              }
            });
          }
        }
      }
    } else {
      res.json({
        outofStock: true,
        message: "This product Wont be available for this quantity",
      });
    }
  } catch (er) {
    next(er);
  }
};

async function updateBuyNowStock(req) {
  await categoryDb.categoryCollection.findByIdAndUpdate(
    req.session.product.category,
    {
      $inc: {
        totalSale: Number(req.session.grandTotal),
        soldProduct: req.session.product.quantity,
      },
    }
  );
  const updatedProduct = await productDb.productCollection.findByIdAndUpdate(
    req.session.product._id,
    {
      $inc: { quantity: -Number(req.session.data.quantity) },
    },
    { returnDocument: "after" }
  );
  if (updatedProduct.quantity <= 0) {
    await productDb.productCollection.updateOne(
      { _id: new ObjectId(updatedProduct._id) },
      { $set: { inStock: false } }
    );
  }
  return true;
}

function makeBuynoworder(orderId, req) {
  const order = {
    orderId: `#${orderId}`,
    userId: new ObjectId(req.body.userId),
    addressId: new ObjectId(req.body.addressId),
    orderedAt: Date.now(),
    orderStatus: req.body.paymentMethod === "COD" ? "ACTIVE" : "PENDING",
    orderStage:
      req.body.paymentMethod === "RAZORPAY"
        ? "PAYMENT PENDING"
        : "PREPARING FOR DISPATCH",
    quantity: Number(req.session.data.quantity),
    productId: new ObjectId(req.session.product._id),
    orderTotal: req.session.grandTotal,
    paymentMethod: req.body.paymentMethod,
    variant: {
      frameSize: req.session.data.frameSizes,
      color: req.session.data.colors,
    },
    grandTotal: req.session.grandTotal,
    wallet: req.session.buyNowWalletAmount
      ? Number(req.session.buyNowWalletAmount)
      : false,
  };

  return order;
}

const addMoneyToWallet = async (req, res, next) => {
  try {
    const userInfo = await db.userCollection.find({
      _id: new ObjectId(req.params.id),
    });
    if (Number(req.body.value) > 20000) {
      res.json({ notAllowed: true, message: "You can only add upto ₹20000" });
    } else {
      var options = {
        amount: req.body.value * 100,
        currency: "INR",
        receipt: userInfo[0]._id,
      };
      instance.orders.create(options, function (err, order) {
        if (err) {
          console.log(err);
          return res.status(500).json({ error: "Payment creation failed" });
        } else {
          res.json({
            success: true,
            user: userInfo[0],
            order: order,
            value: req.body.value,
          });
        }
      });
    }
  } catch (er) {
    next(er);
  }
};

//get about us page

const getAboutUs = async (req, res, next) => {
  try {
    const coupon = await couponDb.couponCollection
      .find({ isActive: true })
      .lean();
    const banners = await bannerDB.bannerCollection
      .find({ status: true, bannerCat: "MAIN" })
      .lean();
    if (req.cookies.token) {
      const user = jwt.verify(req.cookies.token, process.env.MY_SECRET);
      const userInfo = await db.userCollection.findById(user._id).lean();
      const cart = await cartDb.cartCollection
        .findOne({ userId: new ObjectId(user._id) })
        .lean();

      let count = 0;
      if (cart) {
        count = cart.products.length;
      }

      res.status(200).render("user/about_us", {
        user: true,
        bannerPage: true,
        userInfo: userInfo,
        partial: true,
        count,
        banners,
        coupon,
      });
    } else {
      res.status(200).render("user/about_us", {
        user: true,
        bannerPage: true,
        partial: true,
        banners,
        coupon,
      });
    }
  } catch (er) {
    next(er);
  }
};

module.exports = {
  getAboutUs,
  addMoneyToWallet,
  placeBuyNowOrder,
  removeCouponBuynow,
  addCouponbuyNow,
  removeWalletBuynow,
  addWalletBuynow,
  getCheckBuyNowCheckOut,
  buyNowProduct,
  trackOrder,
  removeWallet,
  addWalletAmount,
  getWalletHistory,
  removeCoupon,
  addCoupon,
  removeFromwishlist,
  addtoWishlist,
  getWishlist,
  getHomePage,
  returnOrder,
  changePasswordWithOtp,
  resendPasschangeOtp,
  getChangePasswithotp,
  verifyPasswordChangeotp,
  getChangepasswordSubmitotp,
  OtpsendChangepassword,
  checkUserChangepassword,
  userChangepassword,
  completePayment,
  verifyPayment,
  resendverifyOtp,
  verifyEmailotp,
  getverifyEmail,
  editUser,
  edituserProfile,
  addAddres,
  addUseraddress,
  resendCancelOtp,
  validateCancelotp,
  getcancelProductSubmitOtp,
  cancelProduct,
  assignCheckoutToken,
  viewOrder,
  getMyorders,
  getorderSuccessfull,
  placeOrder,
  getcheckOut,
  deleteAddress,
  setPrimaryAddress,
  editUserAddress,
  getuserProfileedit,
  addcheckoutAddress,
  changeQuantity,
  removeFromthecart,
  addtoCart,
  getCart,
  signupResendOtp,
  submitSignupotp,
  getsubmitSignupotp,
  getProductDetails,
  getPage,
  userLogout,
  showUserprofile,
  submitPassword,
  changePassword,
  submitEmail,
  getsubmitRegisteremail,
  forgetResendotp,
  submitforgetOtp,
  getforgotOtp,
  getUserSignup,
  userRegistration,
  getUserLogin,
  userSignin,
  getSubmitOtp,
  submitOtp,
  getProducts,
  resendOtp,
};
