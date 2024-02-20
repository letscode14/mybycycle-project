const { ObjectId } = require("mongodb");
const cartDb = require("../model/cartModel");
const orderDb = require("../model/orderModel");

async function couponAggregation(userId) {
  const cartData = await cartDb.cartCollection.aggregate([
    { $match: { userId: new ObjectId(userId) } },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "product_datas",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    {
      $lookup: {
        from: "catogory_datas",
        localField: "productDetails.category",
        foreignField: "_id",
        as: "categoryDetails",
      },
    },
    { $unwind: "$categoryDetails" },
    {
      $addFields: {
        totalPrice: {
          $multiply: ["$products.quantity", "$productDetails.price"],
        },
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
    { $unwind: "$userInfo" },
    {
      $group: {
        _id: "$_id",
        userId: { $first: "$userId" },
        userInfo: { $first: "$userInfo" },
        orderInfo: {
          $push: {
            productId: "$products.productId",
            quantity: "$products.quantity",
            frameSize: "$products.frameSize",
            productName: "$productDetails.productName",
            color: "$products.color",
            totalPrice: "$totalPrice",
            categoryName: "$categoryDetails.categoryName",
            id: "$products._id",
          },
        },
        grandTotal: { $sum: "$totalPrice" },
        productQuantities: {
          $push: {
            _id: "$products.productId",
            quantity: "$products.quantity",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        orderInfo: 1,
        grandTotal: 1,
        userInfo: 1,
        productQuantities: {
          $reduce: {
            input: "$productQuantities",
            initialValue: [],
            in: {
              $cond: {
                if: { $in: ["$$this._id", "$$value._id"] },
                then: {
                  $map: {
                    input: "$$value",
                    as: "v",
                    in: {
                      _id: "$$v._id",
                      quantity: {
                        $cond: {
                          if: { $eq: ["$$v._id", "$$this._id"] },
                          then: { $add: ["$$v.quantity", "$$this.quantity"] },
                          else: "$$v.quantity",
                        },
                      },
                    },
                  },
                },
                else: { $concatArrays: ["$$value", ["$$this"]] },
              },
            },
          },
        },
      },
    },
  ]);
  return cartData;
}

async function placeOrderAggregation(userId) {
  const cartData = await cartDb.cartCollection.aggregate([
    { $match: { userId: new ObjectId(userId) } },
    { $unwind: "$products" },
    {
      $lookup: {
        from: "product_datas",
        localField: "products.productId",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    { $unwind: "$productDetails" },
    {
      $addFields: {
        totalPrice: {
          $multiply: ["$products.quantity", "$productDetails.price"],
        },
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
    { $unwind: "$userInfo" },
    {
      $group: {
        _id: "$_id",
        userId: { $first: "$userId" },
        userInfo: { $first: "$userInfo" },
        orderInfo: {
          $push: {
            productId: "$products.productId",
            quantity: "$products.quantity",
            frameSize: "$products.frameSize",
            color: "$products.color",
            totalPrice: "$totalPrice",
            id: "$products._id",
          },
        },
        grandTotal: { $sum: "$totalPrice" },
        productQuantities: {
          $push: {
            _id: "$products.productId",
            quantity: "$products.quantity",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        orderInfo: 1,
        grandTotal: 1,
        userInfo: 1,
        productQuantities: {
          $reduce: {
            input: "$productQuantities",
            initialValue: [],
            in: {
              $cond: {
                if: {
                  $in: ["$$this._id", "$$value._id"],
                },
                then: {
                  $map: {
                    input: "$$value",
                    as: "v",
                    in: {
                      _id: "$$v._id",
                      quantity: {
                        $cond: {
                          if: { $eq: ["$$v._id", "$$this._id"] },
                          then: {
                            $add: ["$$v.quantity", "$$this.quantity"],
                          },
                          else: "$$v.quantity",
                        },
                      },
                    },
                  },
                },
                else: { $concatArrays: ["$$value", ["$$this"]] },
              },
            },
          },
        },
      },
    },
  ]);
  return cartData;
}

async function checkOutAggregation(userId) {
  let cartData = await cartDb.cartCollection.aggregate([
    {
      $match: { userId: new ObjectId(userId) },
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "user_datas",
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$_id", new ObjectId(userId)] }],
              },
            },
          },
        ],
        as: "userInfo",
      },
    },
    {
      $lookup: {
        from: "address_datas",
        let: { userId: new ObjectId(userId) },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", "$$userId"] },
                  { $eq: ["$isDeleted", false] },
                ],
              },
            },
          },
        ],
        as: "userAddress",
      },
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
        productInfo: {
          $push: { qty: "$products.quantity", id: "$products.productId" },
        },
        userId: { $first: "$userId" },
        userinfo: { $first: "$userInfo" },
        grandTotal: { $sum: "$grandTotal" },
        addressInfo: { $first: "$userAddress" },
        count: { $sum: 1 },
      },
    },
  ]);
  return cartData;
}

//print sales aggregation
async function printSalesAggregation(req) {
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
      return false;
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

      return filledDates;
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

    if (salesData.length > 0 && weeksArray) {
      return weeksArray;
    } else {
      return false;
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
      return monthlySales[0];
    } else {
      return false;
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
      return yearlySales;
    } else {
      return false;
    }
  }
}

module.exports = {
  printSalesAggregation,
  couponAggregation,
  placeOrderAggregation,
  checkOutAggregation,
};
