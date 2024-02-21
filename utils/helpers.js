const db = require("../model/userModel");
const easyinvoice = require("easyinvoice");
const path = require("path");
const fs = require("fs");
const orderDb = require("../model/orderModel");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const { ObjectId } = require("mongodb");
const puppeteer = require("puppeteer");
const ExcelJS = require("exceljs");

//uses multer to upload files
const Storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "--" + file.originalname);
  },
});

const upload = multer({ storage: Storage });
////

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});
//function to send otp
async function sendOtp(email, id) {
  const Otp = generateOtp();

  const otpinfo = await db.otpCollection.updateOne(
    {
      otpId: id,
    },
    {
      $set: {
        otp: Otp,
        otpId: id,
        generatedAt: Date.now(),
        expireAt: Date.now() + 60 * 1000,
      },
    },
    { upsert: true }
  );

  const details = {
    from: "mycycle19@gmail.com",
    to: email,
    subject: Otp,
    text: `Your OTP (One-Time-Password) is :${Otp}`,
  };
  return new Promise((resolve, reject) => {
    transporter.sendMail(details, (err, info) => {
      if (err) {
        reject(err);
      } else {
        resolve("Email send" + info.response);
      }
    });
  });
}

//function to resend otp
async function otpResend(email, id) {
  try {
    const msg = await sendOtp(email, id);
    console.log(msg);
    return {
      message: `OTP has been resent to the email ${email}`,
    };
  } catch (err) {
    console.log("failed" + err);

    throw err;
  }
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}
function formatDate(timestamp) {
  const date = new Date(timestamp);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
function generateShortUuid() {
  const fullUuid = uuidv4();

  const shortUuid = fullUuid.substr(0, 10);

  return shortUuid;
}

async function generateInvoice(Id, userId, boolean) {
  try {
    const userInfo = await db.userCollection.findOne({
      _id: new ObjectId(userId),
    });

    let orders;
    if (boolean) {
      orders = await orderDb.orderCollection.aggregate([
        {
          $match: { _id: new ObjectId(Id) },
        },
        {
          $lookup: {
            from: "address_datas",
            localField: "addressId",
            foreignField: "_id",
            as: "addressInfo",
          },
        },
        {
          $lookup: {
            from: "product_datas",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        { $unwind: "$addressInfo" },
      ]);
    } else {
      orders = await orderDb.orderCollection.aggregate([
        {
          $match: { orderId: Id },
        },
        {
          $lookup: {
            from: "address_datas",
            localField: "addressId",
            foreignField: "_id",
            as: "addressInfo",
          },
        },
        {
          $lookup: {
            from: "product_datas",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
        { $unwind: "$productInfo" },
        { $unwind: "$addressInfo" },
      ]);
    }

    const ordersInfo = orders.map((items) => {
      return {
        quantity: items.quantity,
        description: `${items.productInfo.productName} (${items.variant.frameSize} , ${items.variant.color})`,
        price: items.orderTotal,
      };
    });

    const data = {
      apiKey: process.env.EASY_INVOICE_API_KEY,
      mode: "development",
      images: {
        logo: "https://mms.businesswire.com/media/20160502005310/en/475124/2/CB-Logo-RED.jpg",
      },
      sender: {
        company: "Mybycycle",
        address: "Palakkad",
        zip: "679456",
        city: "Chandranagar",
        country: "India",
      },
      client: {
        Name: `${userInfo.fname} ${userInfo.lname}`,
        address: `${orders[0].addressInfo.homeAddress}, ${orders[0].addressInfo.locality}, ${orders[0].addressInfo.district}`,
        zip: `${orders[0].addressInfo.postalCode}`,
        city: `${orders[0].addressInfo.city}`,
        state: `${orders[0].addressInfo.state}`,
      },
      information: {
        number: `#${generateShortUuid()}`,
        date: formatDate(Date.now()),
      },
      products: ordersInfo,
      bottomNotice:
        "Your satisfaction is our priority. Thank you for choosing Mybycle.com",
      settings: {
        currency: "INR",
      },
    };

    let downloadLink;

    const result = await easyinvoice.createInvoice(data);

    const pdfPth = "invoices/" + `${userInfo._id}-${Date.now()}-invoice.pdf`;
    const pdfBinaryData = Buffer.from(result.pdf, "base64");

    await fs.promises.writeFile(pdfPth, pdfBinaryData, "binary");

    downloadLink = `/${pdfPth}`;

    const mailOptions = {
      from: process.env.EMAIL,
      to: userInfo.email,
      subject: "Your Invoice",
      text: `Please download your invoice from the following link: ${downloadLink}`,
    };

    await transporter.sendMail(mailOptions);

    return downloadLink;
  } catch (error) {
    console.error("Error in generateInvoice:", error);
    throw error;
  }
}

//generate pdf salesreport

async function generatePDFReport(salesData, res, type) {
  let htmlContent;
  if (type == "daily") {
    htmlContent = `
    <html>
      <head>
        <style>
          /* Define CSS styles for your PDF */
          body { font-family: Arial, sans-serif; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Sales Report</h1>
        <p>Date: ${new Date().toDateString()}</p>
        <table>
          <tr>
            <th>Date</th>
            <th>Order Count</th>
            <th>Total Sale</th>
          </tr>
          ${salesData
            .map(
              ({ date, count, totalSale }) => `
            <tr>
              <td>${date}</td>
              <td>${count}</td>
              <td>${totalSale}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </body>
    </html>
  `;
  } else if (type == "weekly") {
    htmlContent = `
    <html>
      <head>
        <style>
          /* Define CSS styles for your PDF */
          body { font-family: Arial, sans-serif; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Sales Report</h1>
        <p>Date: ${new Date().toDateString()}</p>
        <table>
          <tr>
            <th>Week</th>
            <th>Year</th>
            <th>Total Sale</th>
          </tr>
          ${salesData
            .map(
              ({ week, year, totalSale }) => `
            <tr>
              <td>${week}</td>
              <td>${year}</td>
              <td>${totalSale}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </body>
    </html>
  `;
  } else if (type == "monthly") {
    const monthNameArray = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    htmlContent = `
    <html>
      <head>
        <style>
       
          body { font-family: Arial, sans-serif; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Sales Report</h1>
        <p>Date: ${new Date().toDateString()}</p>
        <p>Monthly Sale Of Each Month Of:${salesData[0].year} </p>
        <table>
          <tr>
            <th>Month</th>
            <th>count</th>
            <th>Total Sale</th>
          </tr>
          ${salesData
            .map(
              ({ month, count, totalSale }, index) => `
            <tr>
              <td>${monthNameArray[month - 1]}</td>
              <td>${count}</td>
              <td>${totalSale}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </body>
    </html>
  `;
  } else if (type == "yearly") {
    htmlContent = `
    <html>
      <head>
        <style>
       
          body { font-family: Arial, sans-serif; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Sales Report</h1>
        <p>Date: ${new Date().toDateString()}</p>
        <p>Monthly TotalSale of year From ${salesData[0].year} To ${
          salesData[salesData.length - 1].year
        } </p>
        <table>
          <tr>
            <th>Year</th>
           
            <th>Total Sale</th>
          </tr>
          ${salesData
            .map(
              ({ year, totalSale }, index) => `
            <tr>
              <td>${year}</td>
             
              <td>${totalSale}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </body>
    </html>
  `;
  }
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent);
  const pdfBuffer = await page.pdf();
  await browser.close();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=sales_report.pdf");
  res.send(pdfBuffer);
}

async function generateExcel(salesData, type, res) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");
    const monthNameArray = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    if (type == "daily") {
      worksheet.addRow(["Date", "Order Count", "Total Sale"]);
      salesData.forEach(({ date, count, totalSale }) => {
        worksheet.addRow([date, count, totalSale]);
      });
    } else if (type == "weekly") {
      worksheet.addRow(["Week", "Year", "Total Sale"]);
      salesData.forEach(({ week, year, totalSale }) => {
        worksheet.addRow([week, year, totalSale]);
      });
    } else if (type == "monthly") {
      worksheet.addRow(["Month", "Order Count", "Total Sale"]);
      salesData.forEach(({ month, count, totalSale }) => {
        worksheet.addRow([monthNameArray[month - 1], count, totalSale]);
      });
    } else if (type == "yearly") {
      worksheet.addRow(["Year", "Total Sale"]);
      salesData.forEach(({ year, totalSale }) => {
        worksheet.addRow([year, totalSale]);
      });
    }

    const excelBuffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_report.xlsx"
    );

    res.send(excelBuffer);
  } catch (error) {
    console.error("Error:", error);

    res
      .status(500)
      .json({ error: "An error occurred while generating the Excel file." });
  }
}

//

//
//

//////

module.exports = {
  generateExcel,
  generatePDFReport,
  generateInvoice,
  sendOtp,
  otpResend,
  upload,
};
