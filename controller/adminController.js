const db = require("../model/adminModel");
const userDb = require("../model/userModel");
const productDb = require("../model/productModel");
const categoryDb = require("../model/categoryModel");
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const orderDb = require("../model/orderModel");
const bannerDb = require("../model/bannerModel");
const walletdDb = require("../model/walletModel");
const couponDb = require("../model/couponModel");
const {
  generateInvoice,
  generatePDFReport,
  generateExcel,
} = require("../utils/helpers");
const { printSalesAggregation } = require("../utils/aggregation");

//get admin login page
const getAdminLogin = (req, res, next) => {
  try {
    if (req.cookies.adminToken) {
      const token = req.cookies.adminToken;
      const admin = jwt.verify(token, process.env.ADMIN_SECRET);
      if (admin) {
        res.redirect("/admin_panel");
        console.log("hi");
      }
    } else {
      res.status(200).render("admin/admin_login", { adminLogin: true });
    }
  } catch (err) {
    next(err);
  }
};

//admin login
const adminLoggedin = async (req, res, next) => {
  try {
    const admin = await db.adminCollection.findOne({ email: req.body.email });
    if (admin) {
      const passwordValid = await bcrypt.compare(
        req.body.password,
        admin.password
      );
      const { _id } = admin;
      if (passwordValid) {
        const adminToken = jwt.sign({ _id }, process.env.ADMIN_SECRET);
        res.cookie("adminToken", adminToken, { httpOnly: true });
        console.log("hi");
        res.redirect("/admin_panel");
      } else {
        res.status(404).render("admin/admin_login", {
          adminLogin: true,
          invalidAdmin: true,
        });
      }
    } else {
      res
        .status(404)
        .render("admin/admin_login", { adminLogin: true, adminNotvalid: true });
    }
  } catch (err) {
    next(err);
  }
};
//admin user panel
const userManagement = async (req, res, next) => {
  try {
    const users = await userDb.userCollection.find({}).lean();
    const userData = convertDate(users);

    res.status(200).render("admin/admin_user_panel", {
      adminUser: true,
      userData,
      users: true,
    });
  } catch (err) {
    next(err);
  }
};
//to convert date in to a readable form

function convertDate(users) {
  users.forEach((element) => {
    element.createdAt = new Date(element.createdAt).toLocaleString();
    element.updatedAt = new Date(element.updatedAt).toLocaleString();
  });

  return users;
}
//

const blockUser = async (req, res, next) => {
  try {
    const id = new ObjectId(req.params.id);
    const user = await userDb.userCollection.updateOne(
      { _id: id },
      { $set: { isBlocked: true } }
    );
    if (user.modifiedCount) {
      res.sendStatus(200);
    }
  } catch (err) {
    next(err);
  }
};
//block user
const unblockUser = async (req, res, next) => {
  try {
    const id = new ObjectId(req.params.id);
    const user = await userDb.userCollection.updateOne(
      { _id: id },
      { $set: { isBlocked: false } }
    );
    if (user.modifiedCount) {
      res.sendStatus(200);
    }
  } catch (err) {
    next(err);
  }
};
//get admin dashboard
const getadminDashboard = async (req, res) => {
  const productCount = await productDb.productCollection.find().count();
  const user = await userDb.userCollection.aggregate([
    {
      $group: {
        _id: null,
        allUsers: { $push: "$$ROOT" },
        notBlockedUsers: {
          $push: {
            $cond: {
              if: { $eq: ["$isBlocked", false] },
              then: "$$ROOT",
              else: "$$REMOVE",
            },
          },
        },
        blockedUsers: {
          $push: {
            $cond: {
              if: { $eq: ["$isBlocked", true] },
              then: "$$ROOT",
              else: "$$REMOVE",
            },
          },
        },
      },
    },
  ]);
  const order = await orderDb.orderCollection.aggregate([
    {
      $group: {
        _id: null,
        allOrder: { $push: "$$ROOT" },
        deliveredOrder: {
          $push: {
            $cond: {
              if: { $eq: ["$orderStatus", "DELIVERED"] },
              then: "$$ROOT",
              else: "$$REMOVE",
            },
          },
        },
        cancelledOrder: {
          $push: {
            $cond: {
              if: { $eq: ["$orderStatus", "CANCELLED"] },
              then: "$$ROOT",
              else: "$$REMOVE",
            },
          },
        },
        activeOrder: {
          $push: {
            $cond: {
              if: { $eq: ["$orderStatus", "ACTIVE"] },
              then: "$$ROOT",
              else: "$$REMOVE",
            },
          },
        },
        returnedOrder: {
          $push: {
            $cond: {
              if: { $eq: ["$orderStatus", "RETURNED"] },
              then: "$$ROOT",
              else: "$$REMOVE",
            },
          },
        },
        totalSale: {
          $sum: {
            $cond: {
              if: { $in: ["$orderStatus", ["ACTIVE", "DELIVERED"]] },
              then: { $multiply: ["$orderTotal", "$quantity"] },
              else: 0,
            },
          },
        },
      },
    },
  ]);
  const categoryCount = await categoryDb.categoryCollection.find().count();
  res.status(200).render("admin/admin_dashboard", {
    adminUser: true,
    dashboard: true,
    productCount,
    userCount: user[0].allUsers.length,
    activeUser: user[0].notBlockedUsers.length,
    blockedUsers: user[0].blockedUsers.length,
    categoryCount,
    activeOrder: order[0].activeOrder.length ? order[0].activeOrder.length : 0,
    allOrder: order[0].allOrder.length ? order[0].allOrder.length : 0,
    cancelledOrder: order[0].cancelledOrder.length
      ? order[0].cancelledOrder.length
      : 0,
    returnedOrder: order[0].returnedOrder.length
      ? order[0].returnedOrder.length
      : 0,
    deliveredOrder: order[0].deliveredOrder.length
      ? order[0].returnedOrder.length
      : 0,
    totalSale: order[0].totalSale ? order[0].totalSale : 0,
  });
};

// route to fetch data

const fetchCategorysale = async (req, res, next) => {
  try {
    const categorySale = await categoryDb.categoryCollection.find().lean();
    console.log("hvhjhvhj");
    if (req.body.type == "daily") {
      console.log(req.body);
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      const datesArray = [];
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        datesArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

      const dailySale = await orderDb.orderCollection.aggregate([
        {
          $match: {
            orderedAt: {
              $gte: startDate,
              $lt: adjustedEndDate,
            },
            orderStatus: { $in: ["ACTIVE", "DELIVERED"] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$orderedAt" },
              month: { $month: "$orderedAt" },
              day: { $dayOfMonth: "$orderedAt" },
            },
            count: { $sum: 1 },
            totalSale: { $sum: { $multiply: ["$orderTotal", "$quantity"] } },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            day: "$_id.day",
            count: 1,
            totalSale: 1,
          },
        },
        {
          $facet: {
            sales: [
              {
                $sort: { year: 1, month: 1, day: 1 },
              },
            ],
          },
        },
        {
          $unwind: {
            path: "$sales",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            date: {
              $dateFromParts: {
                year: "$sales.year",
                month: "$sales.month",
                day: "$sales.day",
              },
            },
            count: { $ifNull: ["$sales.count", 0] },
            totalSale: { $ifNull: ["$sales.totalSale", 0] },
          },
        },
        {
          $group: {
            _id: "$date",
            count: { $max: "$count" },
            totalSale: { $max: "$totalSale" },
          },
        },
        {
          $project: {
            _id: 0,
            date: { $dateToString: { format: "%Y-%m-%d", date: "$_id" } },
            count: 1,
            totalSale: 1,
          },
        },
      ]);

      if (dailySale[0].date == null) {
        res.json({
          categorySale,
          noSale: true,
          message: "No sales On specified Dates",
        });
      } else {
        const filledDates = datesArray.map((date) => {
          const matchingSale = dailySale.find(
            (sale) => sale.date === date.toISOString().slice(0, 10)
          );
          return {
            date: date.toISOString().slice(0, 10),
            count: matchingSale ? matchingSale.count : 0,
            totalSale: matchingSale ? matchingSale.totalSale : 0,
          };
        });

        res.json({ categorySale, type: "daily", Sales: filledDates });
      }
    } else if (req.body.type == "monthly") {
      const monthlySales = await orderDb.orderCollection.aggregate([
        {
          $match: {
            orderedAt: {
              $gte: new Date(`${Number(req.body.year)}-01-01`),
              $lt: new Date(`${Number(req.body.year) + 1}-01-01`),
            },
            orderStatus: { $in: ["ACTIVE", "DELIVERED"] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$orderedAt" },
              month: { $month: "$orderedAt" },
            },
            count: { $sum: 1 },
            totalSale: { $sum: { $multiply: ["$orderTotal", "$quantity"] } },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id.year",
            month: "$_id.month",
            count: 1,
            totalSale: 1,
          },
        },
        {
          $group: {
            _id: "$year",
            monthlySales: {
              $push: {
                month: "$month",
                count: "$count",
                totalSale: "$totalSale",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            year: "$_id",
            monthlySales: {
              $map: {
                input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                as: "month",
                in: {
                  $cond: {
                    if: { $in: ["$$month", "$monthlySales.month"] },
                    then: {
                      month: "$$month",
                      count: {
                        $let: {
                          vars: {
                            matchedMonth: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$monthlySales",
                                    cond: { $eq: ["$$this.month", "$$month"] },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: { $ifNull: ["$$matchedMonth.count", 0] },
                        },
                      },
                      totalSale: {
                        $let: {
                          vars: {
                            matchedMonth: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$monthlySales",
                                    cond: { $eq: ["$$this.month", "$$month"] },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: { $ifNull: ["$$matchedMonth.totalSale", 0] },
                        },
                      },
                    },
                    else: {
                      month: "$$month",
                      count: 0,
                      totalSale: 0,
                    },
                  },
                },
              },
            },
          },
        },
        {
          $sort: {
            year: 1,
          },
        },
      ]);
      if (monthlySales.length > 0) {
        res.json({ categorySale, type: "monthly", Sales: monthlySales[0] });
      } else {
        res.json({
          categorySale,
          noSale: true,
          message: `No sales On year ${req.body.year}`,
        });
      }
    } else if (req.body.type == "yearly") {
      const yearlySales = await orderDb.orderCollection.aggregate([
        {
          $match: {
            orderedAt: {
              $gte: new Date(`${Number(req.body.startYear)}-01-01`),
              $lte: new Date(`${Number(req.body.endYear) + 1}-01-01`),
            },
            orderStatus: { $in: ["ACTIVE", "DELIVERED"] },
          },
        },
        {
          $group: {
            _id: { $year: "$orderedAt" },
            totalSale: { $sum: { $multiply: ["$orderTotal", "$quantity"] } },
          },
        },
        {
          $group: {
            _id: null,
            yearlySales: {
              $push: {
                year: "$_id",
                totalSale: "$totalSale",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            yearlySales: {
              $map: {
                input: {
                  $range: [
                    Number(req.body.startYear),
                    Number(req.body.endYear) + 1,
                  ],
                },
                as: "year",
                in: {
                  year: "$$year",
                  totalSale: {
                    $let: {
                      vars: {
                        matchedYear: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$yearlySales",
                                cond: { $eq: ["$$this.year", "$$year"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: { $ifNull: ["$$matchedYear.totalSale", 0] },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $unwind: "$yearlySales",
        },
        {
          $replaceRoot: { newRoot: "$yearlySales" },
        },
        {
          $sort: {
            year: 1,
          },
        },
      ]);

      if (yearlySales.length > 0) {
        res.json({ categorySale, Sales: yearlySales, type: "yearly" });
      } else {
        res.json({
          categorySale,
          noSale: true,
          message: `No Sales Between year ${req.body.startYear} to${req.body.endYear}`,
        });
      }
    } else if (req.body.type == "weekly") {
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      const weeksArray = [];
      let currentDate = new Date(startDate);

      while (currentDate < endDate) {
        const dayOfYear =
          (currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 86400000;

        const weekNumber = Math.ceil((dayOfYear + 1) / 7);

        const year = currentDate.getFullYear();

        weeksArray.push({ week: weekNumber, year: year, totalSale: 0 });

        currentDate.setDate(currentDate.getDate() + 7);
      }

      const salesData = await orderDb.orderCollection.aggregate([
        {
          $match: {
            orderedAt: {
              $gte: startDate,
              $lt: endDate,
            },
            orderStatus: { $in: ["ACTIVE", "DELIVERED"] },
          },
        },
        {
          $group: {
            _id: {
              week: { $week: "$orderedAt" },
              year: { $year: "$orderedAt" },
            },
            totalSale: { $sum: { $multiply: ["$orderTotal", "$quantity"] } },
          },
        },
        {
          $project: {
            week: { $add: ["$_id.week", 1] },
            year: "$_id.year",
            totalSale: 1,
            _id: 0,
          },
        },
        {
          $sort: {
            year: 1,
            week: 1,
          },
        },
      ]);
      console.log(salesData);
      weeksArray.forEach((weekObj1) => {
        salesData.forEach((weekObj2) => {
          if (
            weekObj1.week === weekObj2.week &&
            weekObj1.year === weekObj2.year
          ) {
            weekObj1.totalSale = weekObj2.totalSale;
          }
        });
      });
      console.log(weeksArray);
      if (salesData.length > 0 && weeksArray) {
        res.json({
          type: "weekly",
          Sales: weeksArray,
          categorySale,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
        });
      } else {
        res.json({
          categorySale,
          message: "No Weekly Sales on selected Month",
          noSale: true,
        });
      }
    }
  } catch (er) {
    console.log(er);
    next(er);
  }
};
//print sales in excel or pdf
const printSales = async (req, res, next) => {
  try {
    const salesData = await printSalesAggregation(req);
    console.log(req.body);
    if (!salesData) {
      res.status(404).json({
        salesNotFound: true,
        message: "No sales found on specified dates",
      });
    } else {
      console.log(salesData);
      if (req.body.format == "PDF") {
        generatePDFReport(salesData, res, req.body.type);
      } else {
        generateExcel(salesData, req.body.type, res);
      }
    }
  } catch (Er) {
    next(Er);
  }
};
//admin add product
const adminaddProduct = async (req, res, next) => {
  try {
    const category = await categoryDb.categoryCollection.find().lean();
    res.status(200).render("admin/admin_addproduts", {
      adminUser: true,
      addProducts: true,
      category,
    });
  } catch (er) {
    next(er);
  }
};

//add product

const addProduct = async (req, res, next) => {
  try {
    const category = await categoryDb.categoryCollection.findOne({
      categoryName: { $regex: req.body.category, $options: "i" },
    });

    const data = {
      productName: req.body.productname,
      price: req.body.price,
      category: category._id,
      description: req.body.description,
      quantity: req.body.quantity,
      frameSize: req.body.framesize,
      images: req.files.map((file) => file.filename),
      brand: req.body.brand,
      brakeType: req.body.brake,
      frameMtr: req.body.framemtr,
      gear: req.body.gear,
      suspension: req.body.suspension,
      weight: req.body.weight,
      color: req.body.color,
      userType: req.body.usertype,
    };

    const product = await productDb.productCollection.insertMany(data);

    res.redirect("/admin_panel/products");
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//admin product panel
const getadminProduct = async (req, res, next) => {
  try {
    const products = await productDb.productCollection.aggregate([
      { $match: { isDeleted: false } },
      {
        $lookup: {
          from: "catogory_datas",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ]);

    const productsData = convertDate(products);

    res.status(200).render("admin/admin_product_panel", {
      adminUser: true,
      products: true,
      productsData,
    });
  } catch (err) {
    next(err);
  }
};

//admin edit product page
const geteditProduct = async (req, res, next) => {
  try {
    const categoryData = await categoryDb.categoryCollection.find({}).lean();

    const id = new ObjectId(req.params.id);
    const product = await productDb.productCollection.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: "catogory_datas",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ]);

    res.status(200).render("admin/admin_edit_product", {
      adminUser: true,
      editProduct: true,
      categoryData,
      product,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//get product specification page
const getProductSpecification = async (req, res, next) => {
  try {
    const product = await productDb.productCollection
      .find({ isDeleted: false })
      .lean();
    const productsData = convertDate(product);
    res.status(200).render("admin/admin_product_spec", {
      adminUser: true,
      spec: true,
      productsData,
    });
  } catch (err) {
    console.log(err);
  }
};
//editin the product
const editProduct = async (req, res, next) => {
  try {
    console.log(req.body);
    console.log(req.files);
    const id = new ObjectId(req.params.id);
    const product = await productDb.productCollection.aggregate([
      { $match: { _id: id } },
      {
        $lookup: {
          from: "catogory_datas",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ]);

    const updateProduct = await productDb.productCollection.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          productName: req.body.productname,
          price: req.body.price,
          description: req.body.description,
          inStock: req.body.quantity > 0 ? true : false,
          quantity: req.body.quantity,
          frameSize: req.body.framesize,
          brand: req.body.brand,
          brakeType: req.body.brake,
          frameMtr: req.body.framemtr,
          gear: req.body.gear,
          suspension: req.body.suspension,
          weight: req.body.weight,
          color: req.body.color,
          userType: req.body.usertype,
          updatedAt: Date.now(),
        },
      },
      { returnDocument: "after" }
    );

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.filename);
      for (const image of updateProduct.images) {
        const imagePath = path.join("uploads", image);
        await fs.unlink(imagePath, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
      await productDb.productCollection.findOneAndUpdate(
        { _id: id },
        { $set: { images: newImages } },
        { returnDocument: "after" }
      );
    }

    if (req.body.category) {
      if (req.body.category !== product[0].category.categoryName) {
        const category = await categoryDb.categoryCollection.findOne({
          categoryName: { $regex: req.body.category, $options: "i" },
        });

        const updateProduct =
          await productDb.productCollection.findOneAndUpdate(
            { _id: id },
            {
              $set: {
                category: category._id,
              },
            },
            { returnDocument: "after" }
          );
      }
    }
    res.redirect("/admin_panel/products");
  } catch (err) {
    console.log(err);
    next(err);
  }
};
//deletting the product
const deleteProduct = async (req, res, next) => {
  try {
    const deleteProduct = await productDb.productCollection.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } }
    );

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    next(err);
  }
};
const encodeImageToBase64 = (filename) => {
  return new Promise((resolve, reject) => {
    const imagePath = path.join("uploads", filename);
    fs.readFile(imagePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const base64Image = Buffer.from(data).toString("base64");
        resolve(`data:image/jpeg;base64,${base64Image}`);
      }
    });
  });
};

// Function to fetch all images and encode them
const fetchAndEncodeImages = async (imageFilenames) => {
  try {
    const encodedImages = await Promise.all(
      imageFilenames.map(encodeImageToBase64)
    );
    return encodedImages;
  } catch (error) {
    throw error;
  }
};

//croping the product images
const fetchProductImage = async (req, res, next) => {
  try {
    const product = await productDb.productCollection.findById(req.params.id);

    let images = await fetchAndEncodeImages(product.images);
    res.json({ images });
  } catch (er) {
    console.log(er);
    next(er);
  }
};
const uploadCropImage = async (req, res, next) => {
  try {
    const product = await productDb.productCollection.findById(
      req.body.productId
    );
    const index = Number(req.body.index);

    const imageData = req.body.images;
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    const filename = `cropped_image_${Date.now()}.webp`;
    const imagePath = path.join("uploads", filename);

    await fs.promises.writeFile(imagePath, imageBuffer);

    await productDb.productCollection.findByIdAndUpdate(req.body.productId, {
      $pull: { images: { $eq: product.images[index] } },
    });

    await productDb.productCollection.findByIdAndUpdate(req.body.productId, {
      $push: { images: { $each: [filename], $position: index } },
    });

    const originalImagePath = path.join("uploads", product.images[index]);
    await fs.promises.unlink(originalImagePath);

    res.status(200).send("Image uploaded successfully");
  } catch (err) {
    console.error("Error:", err);

    res.status(500).send("Internal Server Error");
  }
};

//get category page
const getCategory = async (req, res, next) => {
  try {
    const category = await categoryDb.categoryCollection
      .find({ isDeleted: false })
      .lean();

    res.status(200).render("admin/admin_category", {
      adminUser: true,
      category: true,
      category,
    });
  } catch (er) {
    next(er);
  }
};

//get add category page
const getaddCategory = (req, res, next) => {
  try {
    res.status(200).render("admin/admin_add_category", {
      adminUser: true,
      addCategory: true,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
//add the category
const addCategory = async (req, res, next) => {
  try {
    const category = await categoryDb.categoryCollection.find({
      categoryName: { $regex: req.body.categoryName, $options: "i" },
      isDeleted: false,
    });
    if (category.length > 0) {
      res.status(200).render("admin/admin_add_category", {
        adminUser: true,
        addCategory: true,
        categoryExist: true,
      });
    } else {
      const data = {
        categoryName: req.body.categoryName.toUpperCase(),
      };
      const addCategory = await categoryDb.categoryCollection.insertMany(data);
      res.redirect("/admin_panel/category");
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};
//edit category page
const getEditcategory = async (req, res, next) => {
  try {
    const category = await categoryDb.categoryCollection
      .findById(req.params.id)
      .lean();

    res.status(200).render("admin/admin_edit_category", {
      adminUser: true,
      editCategory: true,
      categoryInfo: category,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
//editing the category

const editCategory = async (req, res, next) => {
  try {
    const category = await categoryDb.categoryCollection.find({
      categoryName: { $regex: req.body.categoryName, $options: "i" },
      isDeleted: false,
    });
    if (category.length > 0) {
      res.status(400).render("admin/admin_edit_category", {
        adminUser: true,
        editCategory: true,
        categoryExist: true,
      });
    } else {
      const updatedCat = await categoryDb.categoryCollection.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            categoryName: req.body.categoryName.toUpperCase(),
          },
        }
      );
      res.redirect("/admin_panel/category");
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//deleting the category
const deleteCategory = async (req, res, next) => {
  try {
    const deletedProduct =
      await categoryDb.categoryCollection.findByIdAndUpdate(req.params.id, {
        isDeleted: true,
      });
    if (deletedProduct) {
      res.sendStatus(200);
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//get order page
const getOrders = async (req, res, next) => {
  try {
    const orders = await orderDb.orderCollection.aggregate([
      {
        $lookup: {
          from: "user_datas",
          localField: "userId",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $lookup: {
          from: "product_datas",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
    ]);
    res
      .status(200)
      .render("admin/admin_orders", { adminUser: true, orders: true, orders });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

// to update categpry  and product quanity if the product get cancelled
async function updateData(orderId, msg) {
  try {
    const order = await orderDb.orderCollection.aggregate([
      { $match: { _id: new ObjectId(orderId) } },
      {
        $lookup: {
          from: "product_datas",
          localField: "productId",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      { $unwind: "$productInfo" },
    ]);
    const updateCategory =
      await categoryDb.categoryCollection.findByIdAndUpdate(
        order[0].productInfo.category,
        {
          $inc: {
            totalSale: -order[0].orderTotal,
            soldProduct: -order[0].quantity,
          },
        }
      );
    if (msg == "CANCEL") {
      const updateOrder = await orderDb.orderCollection.updateOne(
        {
          _id: new ObjectId(orderId),
        },
        {
          $set: {
            updatedAt: Date.now(),
            orderStage: "CANCELLED",
            orderStatus: "CANCELLED",
          },
        }
      );
      const productUpdate = await productDb.productCollection.updateOne(
        {
          _id: new ObjectId(order[0].productId),
        },
        { $inc: { quantity: order[0].quantity } }
      );
      if (productUpdate && updateOrder && updateCategory) {
        return true;
      }
    } else if (msg == "RETURN") {
      const updateOrder = await orderDb.orderCollection.updateOne(
        {
          _id: new ObjectId(orderId),
        },
        {
          $set: {
            updatedAt: Date.now(),
            orderStage: "RETURNED",
            orderStatus: "RETURNED",
          },
        }
      );
      const productUpdate = await productDb.productCollection.updateOne(
        {
          _id: new ObjectId(order[0].productId),
        },
        { $inc: { quantity: order[0].quantity } }
      );
      if (productUpdate && updateOrder && updateCategory) {
        return true;
      }
    }
  } catch (er) {
    console.log(er);
  }
}
//to cancel product as per the request from user
const cancelOrder = async (req, res, next) => {
  try {
    const orders = await orderDb.orderCollection.findById(req.params.id);
    if (orders.orderStatus !== "CANCELLED") {
      if (orders.orderStatus !== "DELIVERED") {
        if (orders.orderStatus !== "RETURNED") {
          const success = await updateData(req.params.id, "CANCEL");

          if (success) {
            if (orders.paymentMethod !== "COD") {
              const amount = orders.wallet
                ? Math.ceil(orders.wallet + orders.orderTotal)
                : orders.orderTotal;
              await walletdDb.WalletCollection.updateOne(
                {
                  userId: new ObjectId(orders.userId),
                },
                {
                  $inc: { balance: amount },
                  $push: {
                    history: {
                      transactionType: "Deposit",
                      amount: amount,
                      date: Date.now(),
                    },
                  },
                },
                { upsert: true }
              );
            }
            res.status(200).json({
              success: true,
              message: `Order ID:${orders.orderId} is SuccessFully Cancelled`,
            });
          }
        } else {
          res.json({
            returned: true,
            message: `Returned product cannot be cancelled`,
          });
        }
      } else {
        res.json({
          delivered: true,
          message: `Delivered product cannot be cancelled`,
        });
      }
    } else {
      res.json({
        cancelled: true,
        message: ` The Order is Already Cancelled`,
      });
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//to update the order stage

const updateOrderstage = async (req, res, next) => {
  try {
    let updateorderStage;

    const order = await orderDb.orderCollection.findById(req.params.id);

    if (order.orderStage !== "CANCELLATION REQUESTED") {
      if (order.orderStage !== "CANCELLED") {
        if (order.orderStage !== "PAYMENT PENDING") {
          if (order.orderStage !== "CANCELLED DUE TO PAYMENT NOT DONE") {
            if (order.orderStage !== req.body.orderStage) {
              const isStageValid = checkOrderTransition(
                order.orderStage,
                req.body.orderStage
              );
              console.log(isStageValid);
              if (!isStageValid) {
                res.json({
                  notvalidStage: true,
                  message: `Invalid Order Stage Update`,
                });
              } else {
                updateorderStage =
                  await orderDb.orderCollection.findOneAndUpdate(
                    { _id: new ObjectId(req.params.id) },

                    {
                      $set: {
                        updatedAt: Date.now(),
                        orderStage: req.body.orderStage,
                        orderStatus:
                          req.body.orderStage == "DELIVERED"
                            ? "DELIVERED"
                            : "ACTIVE",
                      },
                    },
                    { returnDocument: "after" }
                  );
                if (
                  req.body.orderStage == "DELIVERED" &&
                  updateorderStage.paymentMethod == "COD"
                ) {
                  generateInvoice(
                    updateorderStage._id,
                    updateorderStage.userId,
                    true
                  )
                    .then(async (downloadLink) => {
                      await orderDb.orderCollection.updateMany(
                        { _id: new ObjectId(updateorderStage._id) },
                        { $set: { invoiceDownload: downloadLink } }
                      );
                    })
                    .catch((error) => {
                      console.error(
                        "Error generating invoice or updating order:",
                        error
                      );
                    });
                }

                if (updateorderStage) {
                  res.json({
                    success: true,
                    message: "Successfully updated the OrderStage",
                  });
                }
              }
            } else {
              res.json({
                sameStage: true,
                message: "This order is Already in the Same Stage",
              });
            }
          } else {
            res.json({
              cancelled: true,
              message: "This order is Already Cancelled",
            });
          }
        } else {
          res.json({
            sameStage: true,
            message: "This Order is under process cannot change the Stage",
          });
        }
      } else {
        res.json({
          cancelled: true,
          message: "This order is Already Cancelled",
        });
      }
    } else {
      res.json({
        userCancelled: true,
        message: "This order is cancelled By user",
      });
    }
  } catch (er) {
    console.log(er);
    next(er);
  }
};

//return order
const returnOrder = async (req, res, next) => {
  try {
    const orders = await orderDb.orderCollection.findById(req.params.id);
    const amount = orders.wallet
      ? Math.ceil(orders.wallet + orders.orderTotal)
      : orders.orderTotal;
    await walletdDb.WalletCollection.updateOne(
      {
        userId: new ObjectId(orders.userId),
      },
      {
        $inc: { balance: amount },
        $push: {
          history: {
            transactionType: "Deposit",
            amount: amount,
            date: Date.now(),
          },
        },
      },
      { upsert: true }
    );

    const success = await updateData(req.params.id, "RETURN");
    if (success) {
      res.status(200).json({
        returned: true,
        message: `Order ID:${orders.orderId} is SuccessFully Returned`,
      });
    }
  } catch (er) {
    console.log(er);
    next(er);
  }
};
// to check the stages are updated correctly
function checkOrderTransition(currentStage, requestedStage) {
  const allowedStages = [
    "PREPARING FOR DISPATCH",
    "DISPATCHED",
    "ORDER SHIPPED",
    "OUT FOR DELIVERY",
    "DELIVERED",
    "RETURN REQUESTED",
    "RETURNED",
  ];

  if (!allowedStages.includes(requestedStage)) {
    return false;
  }

  const currentIndex = allowedStages.indexOf(currentStage);
  const requestedIndex = allowedStages.indexOf(requestedStage);

  if (requestedIndex <= currentIndex) {
    return false;
  }

  return true;
}
//

//admin  banner

const adminBanner = async (req, res, next) => {
  try {
    let banners = await bannerDb.bannerCollection.find({ status: true }).lean();

    banners.forEach((items) => {
      items.activeFrom = items.activeFrom.toLocaleString();
      items.activeTo = items.activeTo.toLocaleString();
    });
    await bannerDb.bannerCollection.updateMany(
      { status: true, activeTo: { $lte: new Date() } },
      { $set: { status: false } }
    );

    res.status(200).render("admin/admin_banner", {
      banners,
      adminUser: true,
      banner: true,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
//get add banner page
const getaddBanner = async (req, res, next) => {
  try {
    const category = await categoryDb.categoryCollection.find().lean();
    res.status(200).render("admin/admin_add_banner", {
      category,
      adminUser: true,
      addBanner: true,
    });
  } catch (er) {
    console.log(er);
    next(er);
  }
};
//add banner
const addBanner = async (req, res, next) => {
  try {
    if (req.body.bannerCat !== "MAIN") {
      const { activeFrom, activeTo, bannerCat } = req.body;
      const data = {
        activeFrom: new Date(activeFrom),
        activeTo: new Date(activeTo),
        image: req.file.filename,
        bannerCat: bannerCat,
      };
      const updatedBanner = await bannerDb.bannerCollection.findOneAndUpdate(
        { bannerCat: bannerCat },
        data,
        { upsert: true, returnOriginal: true }
      );
      if (updatedBanner !== null) {
        const imagePath = path.join("uploads", updatedBanner.image);
        await fs.unlink(imagePath, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
    } else {
      const { activeFrom, activeTo, bannerCat } = req.body;
      const data = {
        activeFrom: new Date(activeFrom),
        activeTo: new Date(activeTo),
        image: req.file.filename,
        bannerCat: bannerCat,
      };
      await bannerDb.bannerCollection.insertMany(data);
    }

    res.redirect("/admin_panel/banner");
  } catch (er) {
    console.log(er);
    next(er);
  }
};

//get coupn page
const getCouponPage = async (req, res, next) => {
  try {
    const coupon = await couponDb.couponCollection.find().lean();
    console.log(coupon);
    coupon.forEach((items) => {
      items.validityFrom = items.validityFrom.toLocaleString();
      items.validTo = items.validTo.toLocaleString();
    });
    await couponDb.couponCollection.updateMany(
      { validTo: { $lt: new Date() } },
      { $set: { isActive: false } }
    );
    res
      .status(200)
      .render("admin/admin_coupon", { adminUser: true, coupon: true, coupon });
  } catch (er) {
    console.log(er);
    next(er);
  }
};

const getAddcouponPage = async (req, res, next) => {
  try {
    const category = await categoryDb.categoryCollection.find().lean();

    res.status(200).render("admin/admin_add_coupon", {
      adminUser: true,
      addCoupon: true,
      category,
    });
  } catch (er) {
    next(er);
  }
};
//
//addin the coupon
const addCoupon = async (req, res, next) => {
  try {
    const {
      couponCode,
      minAmount,
      discount,
      des,
      validFrom,
      validTo,
      applicableT0,
    } = req.body;
    const existCoupon = await couponDb.couponCollection.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });
    if (!existCoupon) {
      const coupon = await couponDb.couponCollection.insertMany({
        code: couponCode.toUpperCase(),
        description: des,
        validTo: validTo,
        validFor: applicableT0,
        discountPercentage: discount,
        validityFrom: validFrom,
        minimumPurchaseAmount: minAmount,
      });
      if (coupon) {
        res.redirect("/admin_panel/coupon");
      }
    } else {
      const category = await categoryDb.categoryCollection.find();
      res.status(200).render("admin/admin_add_coupon", {
        adminUser: true,
        addCoupon: true,
        category,
        alreadyExist: true,
      });
    }
  } catch (Er) {
    next(Er);
  }
};

//delete a coupon
const deleteCoupon = async (req, res, next) => {
  try {
    await couponDb.couponCollection.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (er) {
    next(er);
  }
};
//admin logout
const adminLogout = (req, res, next) => {
  try {
    res.clearCookie("adminToken");
    res.redirect("/admin_login");
  } catch (er) {
    next(er);
  }
};

const unlistCategory = async (req, res, next) => {
  try {
    const product = await productDb.productCollection.updateMany(
      {
        category: new ObjectId(req.params.id),
      },
      { $set: { isDeleted: false } }
    );
    if (product) {
      res.json({ success: true, message: "Category unlisted SuccessFully" });
    }
  } catch (er) {
    next(er);
  }
};

module.exports = {
  unlistCategory,
  printSales,
  deleteCoupon,
  addCoupon,
  getAddcouponPage,
  getCouponPage,
  addBanner,
  getaddBanner,
  adminBanner,
  uploadCropImage,
  fetchProductImage,
  returnOrder,
  fetchCategorysale,
  updateOrderstage,
  cancelOrder,
  getOrders,
  deleteCategory,
  editCategory,
  getEditcategory,
  addCategory,
  getaddCategory,
  getProductSpecification,
  deleteProduct,
  editProduct,
  getCategory,
  getAdminLogin,
  adminLoggedin,
  userManagement,
  blockUser,
  unblockUser,
  getadminDashboard,
  adminLogout,
  adminaddProduct,
  addProduct,
  getadminProduct,
  geteditProduct,
};
