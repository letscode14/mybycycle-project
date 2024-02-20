const mongoose = require("mongoose");
//connecting mongoose

const connect = () => {
  mongoose
    .connect(process.env.DB_URI)
    .then(() => {
      console.log("Database connected success fully");
    })
    .catch((err) => {
      console.log("Connection Fialed " + err);
    });
};

module.exports = { connect };
