const db = require("../model/userModel");
const productDb = require("../model/productModel");
const cartDb = require("../model/cartModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const categoryDb = require("../model/categoryModel");
const addressDb = require("../model/useraddressModel");
const orderDb = require("../model/orderModel");
const bannerDB = require("../model/bannerModel");
const wishlistDb = require("../model/wishlistModel");
const walledDb = require("../model/walletModel");
const couponDb = require("../model/couponModel");
const ExcelJS = require("exceljs");

const { ObjectId } = require("mongodb");

const sortProduct = async (req, res) => {
  try {
    const value = Number(req.body.value);
    let products;
    if (req.body["checkedFilters[]"]) {
      let checkedFilters = req.body["checkedFilters[]"]; // Corrected the key here
      if (!Array.isArray(checkedFilters)) {
        checkedFilters = [checkedFilters];
      }
      products = await productDb.productCollection.aggregate([
        {
          $lookup: {
            from: "catogory_datas",
            localField: "category",
            foreignField: "_id",
            as: "category_info",
          },
        },
        { $unwind: "$category_info" },

        {
          $match: {
            $or: [
              {
                userType: {
                  $in: checkedFilters.map((val) => new RegExp(val, "i")),
                },
              },
              {
                brand: {
                  $in: checkedFilters.map((val) => new RegExp(val, "i")),
                },
              },

              {
                gear: {
                  $in: checkedFilters.map((val) => new RegExp(val, "i")),
                },
              },
            ],
          },
        },
        { $sort: { price: value } },
      ]);
      if (req.session.homeCat) {
        products = products.filter((element) => {
          return element.category_info.categoryName === req.session.homeCat;
        });
      }
    } else {
      products = await productDb.productCollection.aggregate([
        {
          $lookup: {
            from: "catogory_datas",
            localField: "category",
            foreignField: "_id",
            as: "category_info",
          },
        },
        { $unwind: "$category_info" },
        { $sort: { price: value } },
      ]);
      if (req.session.homeCat) {
        products = products.filter((element) => {
          return element.category_info.categoryName === req.session.homeCat;
        });
      }
    }
    if (products) {
      res.json({ products, success: true });
    }
  } catch (er) {
    console.log(er);
  }
};

const filterProduct = async (req, res) => {
  try {
    let products;
    const userFilter = req.body["user[]"];
    const brandFilter = req.body["brand[]"];
    const categoryFilter = req.body["category[]"];
    const speedFilter = req.body["speed[]"];

    if (
      userFilter == 1 &&
      brandFilter == 1 &&
      categoryFilter == "65a9657af65a86172eba479e" &&
      speedFilter == "z"
    ) {
      products = await productDb.productCollection.aggregate([
        {
          $lookup: {
            from: "catogory_datas",
            localField: "category",
            foreignField: "_id",
            as: "category_info",
          },
        },
        { $unwind: "$category_info" },
      ]);
      if (req.session.homeCat) {
        products = products.filter((element) => {
          return element.category_info.categoryName === req.session.homeCat;
        });

        res.json({ products });
      } else {
        res.json({ products });
      }
    } else {
      products = await productDb.productCollection.aggregate([
        {
          $lookup: {
            from: "catogory_datas",
            localField: "category",
            foreignField: "_id",
            as: "category_info",
          },
        },
        { $unwind: "$category_info" },
        {
          $match: {
            $or: [
              {
                userType: {
                  $in: Array.isArray(userFilter)
                    ? userFilter.map((val) => new RegExp(val, "i"))
                    : [new RegExp(userFilter, "i")],
                },
              },
              {
                brand: {
                  $in: Array.isArray(brandFilter)
                    ? brandFilter.map((val) => new RegExp(val, "i"))
                    : [new RegExp(brandFilter, "i")],
                },
              },
              {
                category: {
                  $in: Array.isArray(categoryFilter)
                    ? categoryFilter.map((val) => new ObjectId(val))
                    : [new ObjectId(categoryFilter)],
                },
              },
              {
                gear: {
                  $in: Array.isArray(speedFilter)
                    ? speedFilter.map((val) => new RegExp(val, "i"))
                    : [new RegExp(speedFilter, "i")],
                },
              },
            ],
          },
        },
      ]);

      if (products.length > 0) {
        if (req.session.homeCat) {
          products = products.filter((element) => {
            return element.category_info.categoryName === req.session.homeCat;
          });

          res.json({ products });
        } else {
          res.json({ products });
        }
      } else {
        res.json({
          notAvailable: true,
          message: "Product At this filter is not available at the moment",
        });
      }
    }
  } catch (er) {
    console.log(er);
  }
};

const searchProduct = async (req, res, next) => {
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/, "\\$&");
  };

  const searchProducts = async (searchTerm) => {
    const escapedTerm = escapeRegExp(searchTerm);

    const query = [
      {
        $lookup: {
          from: "catogory_datas",
          localField: "category",
          foreignField: "_id",
          as: "categoryInfo",
        },
      },
      {
        $unwind: "$categoryInfo",
      },
      {
        $match: {
          $or: [
            { productName: { $regex: new RegExp(escapedTerm, "i") } },
            { brand: { $regex: new RegExp(escapedTerm, "i") } },
            { color: { $regex: new RegExp(escapedTerm, "i") } },
            { gear: { $regex: new RegExp(escapedTerm, "i") } },
            { price: Number(escapedTerm) },
            { brakeType: { $regex: new RegExp(escapedTerm, "i") } },
            { frameMtr: { $regex: new RegExp(escapedTerm, "i") } },
            { suspension: { $regex: new RegExp(escapedTerm, "i") } },
            { userType: { $regex: new RegExp(escapedTerm, "i") } },
            {
              frameSize: {
                $elemMatch: { $regex: new RegExp(escapedTerm, "i") },
              },
            },
            {
              description: {
                $elemMatch: { $regex: new RegExp(escapedTerm, "i") },
              },
            },
            {
              "categoryInfo.categoryName": {
                $regex: new RegExp(escapedTerm, "i"),
              },
            },
          ],
        },
      },
    ];

    try {
      const result = await productDb.productCollection.aggregate(query);

      return result;
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  };

  // Example usage:
  const searchTerm = req.body.value;
  searchProducts(searchTerm)
    .then((products) => {
      if (products.length > 0) {
        if (req.session.homeCat) {
          products = products.filter((element) => {
            return element.categoryInfo.categoryName === req.session.homeCat;
          });
          res.json({ product: true, products });
        } else {
          res.json({ product: true, products });
        }
      } else {
        res.json({ notFound: true });
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

//to show product from the home page
const showProductFromHome = async (req, res, next) => {
  try {
    const coupon = await couponDb.couponCollection.find().lean();
    const product = await productDb.productCollection.aggregate([
      {
        $lookup: {
          from: "catogory_datas", // Ensure correct collection name here
          foreignField: "_id",
          localField: "category",
          as: "category_info",
        },
      },
      { $unwind: "$category_info" },
      {
        $match: {
          "category_info.categoryName": {
            $eq: req.query.catName,
            $regex: /^\w+$/, // Optional validation: Allow only word characters
          },
        },
      },
    ]);

    const totalProduct = await productDb.productCollection.aggregate([
      { $group: { _id: 0, totalProduct: { $sum: 1 } } },
    ]);
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

      let count;
      if (cart) {
        count = cart.products.length;
      } else {
        count = 0;
      }
      res.status(200).render("user/user_products", {
        user: true,
        bannerPage: true,
        userInfo: userInfo,
        product,
        category,
        totalProduct,
        count,
        banners,
        coupon,
      });
      req.session.homeCat = req.query.catName;
      req.session.save();
    } else {
      res.status(200).render("user/user_products", {
        user: true,
        product,
        totalProduct,
        bannerPage: true,
        banners,
        coupon,
      });
    }
  } catch (Er) {
    console.log(Er);
  }
};

const getGetTouchPage = async (req, res, next) => {
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

      res.status(200).render("user/get_in_touch_page", {
        user: true,
        bannerPage: true,
        userInfo: userInfo,
        partial: true,
        count,
        banners,
        coupon,
      });
    } else {
      res.status(200).render("user/get_in_touch_page", {
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

const submitGetintouchForm = async (req, res, next) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheetName = "GetInTouchData";
    let worksheet;

    try {
      await workbook.xlsx.readFile("getintouchdata.xlsx");
      worksheet = workbook.getWorksheet(sheetName);
    } catch (error) {
      worksheet = workbook.addWorksheet(sheetName);
      worksheet.addRow([
        "First Name",
        "Last Name",
        "Email",
        "Subject",
        "Message",
      ]);
    }

    const { firstName, lastName, email, subject, message } = req.body;

    worksheet.addRow([firstName, lastName, email, subject, message]);

    await workbook.xlsx.writeFile("getintouchdata.xlsx");

    console.log("Data appended to Excel sheet successfully.");
  } catch (Er) {
    next(Er);
  }
};

//filter wallet History
const filterWalletHistory = async (req, res, next) => {
  try {
    if (req.body.filterCriteria) {
      const filter = req.body.filterCriteria;
      console.log(filter);
      if (filter == "15DAYS") {
        const wallet = await getFilterWallet(
          Date.now() - 15 * 24 * 60 * 60 * 1000,
          req.params.id
        );

        res.json({ pass: true, history: wallet.history });
      } else if (filter == "30DAYS") {
        const wallet = await getFilterWallet(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
          req.params.id
        );
        res.json({ pass: true, history: wallet.history });
      } else if (filter == "6MONTH") {
        const wallet = await getFilterWallet(
          Date.now() - 6 * 30 * 24 * 60 * 60 * 1000,
          req.params.id
        );
        res.json({ pass: true, history: wallet.history });
      } else if (filter == "1YEAR") {
        const wallet = await getFilterWallet(
          Date.now() - 365 * 24 * 60 * 60 * 1000,
          req.params.id
        );
        res.json({ pass: true, history: wallet.history });
      }
    } else {
      const fromDate = new Date(req.body.fromDate);
      const toDate = new Date(req.body.toDate);

      const wallet = await walledDb.WalletCollection.aggregate([
        { $match: { userId: new ObjectId(req.params.id) } },
        {
          $project: {
            _id: 0,
            userId: 1,
            balance: 1,
            history: {
              $filter: {
                input: "$history",
                as: "item",
                cond: {
                  $and: [
                    { $gte: ["$$item.date", fromDate] },
                    { $lte: ["$$item.date", toDate] },
                  ],
                },
              },
            },
          },
        },
        { $unwind: "$history" }, // Unwind the history array
        { $sort: { "history.date": -1 } }, // Sort documents based on history.date field
        {
          $group: {
            _id: "$_id",
            userId: { $first: "$userId" },
            balance: { $first: "$balance" },
            history: { $push: "$history" }, // Group history array back together
          },
        },
      ]);

      wallet[0].history.forEach((element) => {
        element.date = element.date.toLocaleString();
      });

      res.json({ success: true, history: wallet[0].history });
    }
  } catch (er) {
    next(er);
  }
};

async function getFilterWallet(date, userId) {
  const wallet = await walledDb.WalletCollection.aggregate([
    { $match: { userId: new ObjectId(userId) } },
    {
      $project: {
        _id: 0,
        userId: 1,
        balance: 1,
        history: {
          $filter: {
            input: "$history",
            as: "item",
            cond: {
              $and: [
                {
                  $gte: ["$$item.date", new Date(date)],
                },
              ],
            },
          },
        },
      },
    },
    { $unwind: "$history" }, // Unwind the history array
    { $sort: { "history.date": -1 } }, // Sort documents based on history.date field
    {
      $group: {
        _id: "$_id",
        userId: { $first: "$userId" },
        balance: { $first: "$balance" },
        history: { $push: "$history" }, // Group history array back together
      },
    },
  ]);

  if (wallet) {
    wallet[0].history.forEach((element) => {
      element.date = element.date.toLocaleString();
    });
    return wallet[0];
  }
}

module.exports = {
  filterWalletHistory,
  submitGetintouchForm,
  getGetTouchPage,
  showProductFromHome,
  searchProduct,
  sortProduct,
  filterProduct,
};
