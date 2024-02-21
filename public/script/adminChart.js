const alertButtonchart = document.getElementById("alert-button");
const alertBoxchart = document.querySelector(".modal-body-alert");
const msgButtonchart = document.getElementById("msg-button");
const modalMsgBodychart = document.querySelector(".modal-body-msg");

var myModal = new bootstrap.Modal(document.getElementById("alertModal"));

function giveAlert(msg) {
  alertButtonchart.click();
  alertBoxchart.innerHTML = msg;
}

function giveMsg(msg, boolean) {
  msgButtonchart.click();
  modalMsgBodychart.innerHTML = msg;
}

const saleType = document.getElementById("saleType");
const dateInputs = document.getElementById("dateInputs");
const choose = document.getElementById("choose");

saleType.addEventListener("change", function () {
  let selectedOption = this.value;
  dateInputs.innerHTML = "";

  if (selectedOption === "Daily") {
    dateInputs.innerHTML = `
    <div class="row">
    <div class="col-md-6 mb-1">
      <label for="startDate">Select Date:</label>
      <input class="form-control" type="date" id="startDate" name="startDate" />
    </div>
    <div class="col-md-6 mb-1">
      <label for="startDate">End Date:</label>
      <input class="form-control" type="date" id="EndDate" name="EndDate" />
    </div>
    </div>
    <div class="mb-3"> 
    <button type="button" id="apply-date" style="width: auto;" class="btn btn-danger btn-sm">APPLY CHANGES</button>
    </div>
    
    `;
    const applyChangesButton = document.getElementById("apply-date");
    applyChangesButton.addEventListener("click", function () {
      let startDate = document.getElementById("startDate").value;
      let endDate = document.getElementById("EndDate").value;

      const stDate = new Date(startDate);
      const enDate = new Date(endDate);
      const currentDate = new Date();

      const Milliseconds = enDate - stDate;
      const diffInDays = Math.floor(Milliseconds / (1000 * 60 * 60 * 24));

      if (stDate > currentDate || enDate > currentDate) {
        giveMsg("Future Dates are not allowed");
      } else if (startDate == "" || endDate == "") {
        giveMsg("Select the Dates");
      } else if (stDate > enDate) {
        giveMsg("Start date must be before the end date");
      } else if (startDate == endDate) {
        giveMsg("Select Different Date");
      } else if (diffInDays > 20) {
        giveMsg("Maximum allowed is 20 days");
      } else {
        fetchData({ type: "daily", startDate, endDate });
        dateInputs.innerHTML = "";
        choose.selected = true;
      }
    });
  } else if (selectedOption === "Weekly") {
    dateInputs.innerHTML = `
    <div class="row">
    <div class="col-md-6 mb-1">
      <label for="startDate">Select Date:</label>
      <input class="form-control" type="date" id="startDate" name="startDate" />
    </div>
    <div class="col-md-6 mb-1">
      <label for="startDate">End Date:</label>
      <input class="form-control" type="date" id="EndDate" name="EndDate" />
    </div>
    <div class="my-3"> 
    <button type="button" id="apply-date" style="width: auto;" class="btn btn-danger btn-sm">APPLY CHANGES</button>
    </div>
  </div>`;

    const applybutton = document.getElementById("apply-date");
    applybutton.addEventListener("click", () => {
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("EndDate").value;
      const stDate = new Date(startDate);
      const enDate = new Date(endDate);
      const currentDate = new Date();
      if (stDate > currentDate || enDate > currentDate) {
        giveMsg("Future Dates are not allowed");
      } else if (startDate == "" || endDate == "") {
        giveMsg("Select the Dates");
      } else if (stDate > enDate) {
        giveMsg("Start date must be before the end date");
      } else if (startDate == endDate) {
        giveMsg("Select Different Date");
      } else {
        fetchData({ type: "weekly", startDate: startDate, endDate: endDate });
        dateInputs.innerHTML = "";
        choose.selected = true;
      }
    });
  } else if (selectedOption === "Monthly") {
    dateInputs.innerHTML = `
    <div class='col-md-4 mb-3'> 
    <label for="yearSelect">Select Year:</label>
    <select id="yearSelect" class='form-select'>
     
    </select>
    <div class="mb-3 mt-2"> 
    <button type="button" id="apply-date" style="width: auto;" class="btn btn-danger btn-sm">APPLY CHANGES</button>
    </div>
    </div>
     `;
    const currentYear = new Date().getFullYear();
    const Year = currentYear - 5;
    const yearSelect = document.getElementById("yearSelect");
    for (let year = Year; year <= Year + 10; year++) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
    const applybutton = document.getElementById("apply-date");
    applybutton.addEventListener("click", () => {
      if (yearSelect.value > currentYear) {
        giveMsg("Select a Valid year");
      } else {
        fetchData({ type: "monthly", year: yearSelect.value });
        dateInputs.innerHTML = "";
        choose.selected = true;
      }
    });
  } else if (selectedOption === "Year") {
    dateInputs.innerHTML = `
    <div class="row">
          <div class="col-md-6">
            <label for="yearSelect">Start Year:</label>
            <select id="yearSelect" class="form-select">

            </select>
          </div>
          <div class="col-md-6">
            <label for="yearSelect">End Year:</label>
            <select id="yearSelectend" class="form-select">

            </select>
          </div>
          <div class="my-3">
            <button
              type="button"
              id="apply-date"
              style="width: auto;"
              class="btn btn-danger btn-sm"
            >APPLY CHANGES</button>
          </div>
        </div>
    
    `;
    const currentYear = new Date().getFullYear();
    const Year = currentYear - 5;
    const yearSelect = document.getElementById("yearSelect");
    const yearSelectend = document.getElementById("yearSelectend");

    for (let year = Year; year <= Year + 10; year++) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
    for (let year = Year; year <= Year + 10; year++) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelectend.appendChild(option);
    }
    const applybutton = document.getElementById("apply-date");
    applybutton.addEventListener("click", () => {
      if (yearSelect.value > currentYear || yearSelectend.value > currentYear) {
        giveMsg("Select a Valid year");
      } else if (yearSelect.value > yearSelectend.value) {
        giveMsg("Start Year must be before end date");
      } else if (yearSelect.value == yearSelectend.value) {
        giveMsg("Select different dates");
      } else {
        fetchData({
          type: "yearly",
          startYear: yearSelect.value,
          endYear: yearSelectend.value,
        });
        dateInputs.innerHTML = "";
        choose.selected = true;
      }
    });
  }
});

let myDoughnutChart;
let myLineChart;
function createDoughnutChart(data) {
  const ctx = document.getElementById("myChart").getContext("2d");

  if (myDoughnutChart) {
    myDoughnutChart.destroy();
  }

  const categoryName = data.map((items) => items.categoryName);
  const categorySale = data.map((items) => items.totalSale);

  myDoughnutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categoryName,
      datasets: [
        {
          label: "Total saleAmount",
          data: categorySale,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function monthName(n) {
  const arrayOfmonth = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return arrayOfmonth[n - 1];
}

function createLineChart(data) {
  const months = data.monthlySales.map((items) => monthName(items.month));
  const totalSale = data.monthlySales.map((items) => items.totalSale);
  makelineChart(months, totalSale, `Monthly Sale of Year ${data.year}`);
}

function createLineChartMonth(data) {
  const date = data.map((items) => items.date);
  const totalSale = data.map((items) => items.totalSale);
  makelineChart(
    date,
    totalSale,
    `Daily Sales from ${date[0]} to ${date[date.length - 1]}`
  );
}
function createLineChartYear(data) {
  const year = data.map((items) => items.year);
  const totalSale = data.map((items) => items.totalSale);
  makelineChart(
    year,
    totalSale,
    `Yearly Sale From ${data[0].year} to ${data[data.length - 1].year}`
  );
}
function createLineChartWeekly(data, dates) {
  const week = data.map((items) => `${items.week}/${items.year}`);
  const totalSale = data.map((items) => items.totalSale);
  makelineChart(
    week,
    totalSale,
    `Weekly Sales from ${dates.startDate} To ${dates.endDate}`
  );
}

function makelineChart(xAxis, sales, type) {
  const ctx = document.getElementById("myLinechart").getContext("2d");
  if (myLineChart) {
    myLineChart.destroy();
  }
  var data = {
    labels: xAxis,
    datasets: [
      {
        label: type,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 2,
        data: sales,
      },
    ],
  };

  // Configuration options
  var options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };
  myLineChart = new Chart(ctx, {
    type: "line",
    data: data,
    options: options,
  });
}
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentURl = window.location.pathname;
if (currentURl.includes("/admin_panel")) {
  fetchData({ type: "monthly", year: currentYear });
}

function fetchData(requestBody) {
  fetch("/fetch_data", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => response.json())
    .then((data) => {
      createDoughnutChart(data.categorySale);
      if (data.type == "monthly") {
        createLineChart(data.Sales);
      } else if (data.type == "daily") {
        createLineChartMonth(data.Sales);
      } else if (data.noSale) {
        giveMsg(data.message);
      } else if (data.type == "yearly") {
        createLineChartYear(data.Sales);
      } else if (data.type == "weekly") {
        createLineChartWeekly(data.Sales, data);
      }
    })
    .catch((er) => {
      console.log(er);
    });
}

const printSales = document.getElementById("print-sales-report");
const salesPrintPut = document.querySelector(".sales-report-print");
const salesPrintDateInput = document.getElementById("salesPrintDateInput");
printSales.addEventListener("click", () => {
  salesPrintPut.style.display = "block";
  const choose = document.getElementById("sale-download-choose");
  salesPrintPut.addEventListener("change", () => {
    let selectedOption = salesPrintPut.value;
    salesPrintDateInput.innerHTML = "";

    if (selectedOption === "Daily") {
      salesPrintDateInput.innerHTML = `
      <div class="row">
      <div class="col-md-6 mb-1">
        <label for="startDate">Select Date:</label>
        <input class="form-control" type="date" id="startDate" name="startDate" />
      </div>
      <div class="col-md-6 mb-1">
        <label for="startDate">End Date:</label>
        <input class="form-control" type="date" id="EndDate" name="EndDate" />
      </div>
      </div>
      <div class="d-flex my-2">
              <div class="form-check me-2">
                <input
                  class="form-check-input"
                  type="radio"
                  value="PDF"
                  name="pdfFormat"
                  id="flexRadioDefault1"
                />
                <label class="form-check-label" for="flexRadioDefault1">
                  PDF
                </label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  value="EXCEL"
                  name="pdfFormat"
                  id="flexRadioDefault2"
                  checked
                />
                <label class="form-check-label" for="flexRadioDefault2">
                  EXCEL
                </label>
              </div>

            </div>
          </div>
      <div class="mb-3 mt-2 download-button"> 
      <button type="button" id="download-sales" style="width: auto;" class="btn btn-danger btn-sm">DOWNLOAD</button>
      </div>
      
      `;
      const applyChangesButton = document.getElementById("download-sales");
      applyChangesButton.addEventListener("click", function () {
        let startDate = document.getElementById("startDate").value;
        let endDate = document.getElementById("EndDate").value;

        const stDate = new Date(startDate);
        const enDate = new Date(endDate);
        const currentDate = new Date();

        const Milliseconds = enDate - stDate;
        const diffInDays = Math.floor(Milliseconds / (1000 * 60 * 60 * 24));

        if (stDate > currentDate || enDate > currentDate) {
          giveMsg("Future Dates are not allowed");
        } else if (startDate == "" || endDate == "") {
          giveMsg("Select the Dates");
        } else if (stDate > enDate) {
          giveMsg("Start date must be before the end date");
        } else if (startDate == endDate) {
          giveMsg("Select Different Date");
        } else if (diffInDays > 20) {
          giveMsg("Maximum allowed is 20 days");
        } else {
          let format = "";
          const radioButtons = document.querySelectorAll(
            'input[name="pdfFormat"]'
          );
          radioButtons.forEach((radioButton) => {
            if (radioButton.checked) {
              format = radioButton.value;
            }
          });

          printSalesData({ type: "daily", startDate, endDate, format });

          salesPrintDateInput.innerHTML = "";
          salesPrintPut.style.display = "none";
          choose.selected = true;
        }
      });
    } else if (selectedOption === "Weekly") {
      salesPrintDateInput.innerHTML = `
      <div class="row">
      <div class="col-md-6 mb-1">
        <label for="startDate">Select Date:</label>
        <input class="form-control" type="date" id="startDate" name="startDate" />
      </div>
      <div class="col-md-6 mb-1">
        <label for="startDate">End Date:</label>
        <input class="form-control" type="date" id="EndDate" name="EndDate" />
      </div>
      <div class="d-flex my-2">
              <div class="form-check me-2">
                <input
                  class="form-check-input"
                  type="radio"
                  value="PDF"
                  name="pdfFormat"
                  id="flexRadioDefault1"
                />
                <label class="form-check-label" for="flexRadioDefault1">
                  PDF
                </label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  value="EXCEL"
                  name="pdfFormat"
                  id="flexRadioDefault2"
                  checked
                />
                <label class="form-check-label" for="flexRadioDefault2">
                  EXCEL
                </label>
              </div>

            </div>
          </div>
    <div class="mb-3 mt-2 download-button"> 
      <button type="button" id="download-sales" style="width: auto;" class="btn btn-danger btn-sm">Download</button>
      </div>
      
    </div>`;
      const applyChangesButton = document.getElementById("download-sales");
      applyChangesButton.addEventListener("click", () => {
        const startDate = document.getElementById("startDate").value;
        const endDate = document.getElementById("EndDate").value;
        const stDate = new Date(startDate);
        const enDate = new Date(endDate);
        const currentDate = new Date();
        if (stDate > currentDate || enDate > currentDate) {
          giveMsg("Future Dates are not allowed");
        } else if (startDate == "" || endDate == "") {
          giveMsg("Select the Dates");
        } else if (stDate > enDate) {
          giveMsg("Start date must be before the end date");
        } else if (startDate == endDate) {
          giveMsg("Select Different Date");
        } else {
          let format = "";
          const radioButtons = document.querySelectorAll(
            'input[name="pdfFormat"]'
          );
          radioButtons.forEach((radioButton) => {
            if (radioButton.checked) {
              format = radioButton.value;
            }
          });
          printSalesData({
            type: "weekly",
            startDate: startDate,
            endDate: endDate,
            format,
          });
          salesPrintDateInput.innerHTML = "";
          choose.selected = true;
          salesPrintPut.style.display = "none";
        }
      });
    } else if (selectedOption === "Monthly") {
      salesPrintDateInput.innerHTML = `
      <div class='col-md-4 mb-3'> 
      <label for="yearSelect">Select Year:</label>
      <select id="yearSelect" class='form-select'>
       
      </select>
      
      </div>
      <div class="d-flex my-2">
              <div class="form-check me-2">
                <input
                  class="form-check-input"
                  type="radio"
                  value="PDF"
                  name="pdfFormat"
                  id="flexRadioDefault1"
                />
                <label class="form-check-label" for="flexRadioDefault1">
                  PDF
                </label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  value="EXCEL"
                  name="pdfFormat"
                  id="flexRadioDefault2"
                  checked
                />
                <label class="form-check-label" for="flexRadioDefault2">
                  EXCEL
                </label>
              </div>

            </div>
          </div>
      <div class="mb-3 mt-2 download-button"> 
      <button type="button" id="download-sales" style="width: auto;" class="btn btn-danger btn-sm">Download</button>
      </div>
       `;
      const currentYear = new Date().getFullYear();
      const Year = currentYear - 5;
      const yearSelect = document.getElementById("yearSelect");
      for (let year = Year; year <= Year + 10; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      }
      const applybutton = document.getElementById("download-sales");
      applybutton.addEventListener("click", () => {
        if (yearSelect.value > currentYear) {
          giveMsg("Select a Valid year");
        } else {
          let format = "";
          const radioButtons = document.querySelectorAll(
            'input[name="pdfFormat"]'
          );
          radioButtons.forEach((radioButton) => {
            if (radioButton.checked) {
              format = radioButton.value;
            }
          });

          printSalesData({ type: "monthly", year: yearSelect.value, format });
          salesPrintDateInput.innerHTML = "";
          choose.selected = true;
        }
      });
    } else if (selectedOption === "Year") {
      salesPrintDateInput.innerHTML = `
      <div class="row">
            <div class="col-md-6">
              <label for="yearSelect">Start Year:</label>
              <select id="yearSelect" class="form-select">
  
              </select>
            </div>
            <div class="col-md-6">
              <label for="yearSelect">End Year:</label>
              <select id="yearSelectend" class="form-select">
  
              </select>
            </div>
            
          </div>
          <div class="d-flex my-2">
              <div class="form-check me-2">
                <input
                  class="form-check-input"
                  type="radio"
                  value="PDF"
                  name="pdfFormat"
                  id="flexRadioDefault1"
                />
                <label class="form-check-label" for="flexRadioDefault1">
                  PDF
                </label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  value="EXCEL"
                  name="pdfFormat"
                  id="flexRadioDefault2"
                  checked
                />
                <label class="form-check-label" for="flexRadioDefault2">
                  EXCEL
                </label>
              </div>

            </div>
          </div>
      <div class="mb-3 mt-2 download-button"> 
      <button type="button" id="download-sales" style="width: auto;" class="btn btn-danger btn-sm">Download</button>
      </div>
      
      `;
      const currentYear = new Date().getFullYear();
      const Year = currentYear - 5;
      const yearSelect = document.getElementById("yearSelect");
      const yearSelectend = document.getElementById("yearSelectend");

      for (let year = Year; year <= Year + 10; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      }
      for (let year = Year; year <= Year + 10; year++) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelectend.appendChild(option);
      }
      const applybutton = document.getElementById("download-sales");
      applybutton.addEventListener("click", () => {
        if (
          yearSelect.value > currentYear ||
          yearSelectend.value > currentYear
        ) {
          giveMsg("Select a Valid year");
        } else if (yearSelect.value > yearSelectend.value) {
          giveMsg("Start Year must be before end date");
        } else if (yearSelect.value == yearSelectend.value) {
          giveMsg("Select different dates");
        } else {
          let format = "";
          const radioButtons = document.querySelectorAll(
            'input[name="pdfFormat"]'
          );
          radioButtons.forEach((radioButton) => {
            if (radioButton.checked) {
              format = radioButton.value;
            }
          });

          printSalesData({
            type: "yearly",
            startYear: yearSelect.value,
            endYear: yearSelectend.value,
            format,
          });
          salesPrintDateInput.innerHTML = "";
          choose.selected = true;
          salesPrintPut.style.display = "none";
        }
      });
    }
  });
});

//print salesdata

function printSalesData(requestBody) {
  fetch("/print_sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })
    .then((response) => {
      if (response.ok) {
        const contentType = response.headers.get("Content-Type");
        if (contentType.includes("application/pdf")) {
          return response.blob().then((blob) => ({ type: "pdf", blob }));
        } else if (
          contentType.includes(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          )
        ) {
          return response.blob().then((blob) => ({ type: "excel", blob }));
        } else {
          throw new Error("Unsupported file format");
        }
      } else {
        throw new Error("Failed to download file");
      }
    })
    .then(({ type, blob }) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      if (type === "pdf") {
        a.download = "sales_report.pdf";
      } else if (type === "excel") {
        a.download = "sales_report.xlsx";
      }
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    })
    .catch((error) => {
      giveMsg("No sales Found ");
    });
}
