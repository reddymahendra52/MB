const express = require("express");
const mysql = require("mysql");
// const mysql = require('mysql2');
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const uuid = require("uuid");
const cors = require("cors");
const app = express();
app.use(cors());
const port = process.env.PORT || 8080;

// Connection to MySQL Database
// const connection = mysql.createConnection({
//   host: "127.0.0.1",
//   user: "root",
//   password: "root123",
//   database: "maid",
// });

const connection = mysql.createConnection({
  host: "sql6.freesqldatabase.com",
  user: "sql6632620",
  password: "iNfeu3AYIc",
  database: "sql6632620",
});

// Checking the connection
connection.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database!");
});

// Use body-parser middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ----------------------- BOOKINGs APIs-----------------------------------//

// POST API to add data to database
app.post("/api/add/bookings", (req, res) => {
  const data = req.body;
  console.log(data);

  const booking_id = uuid.v4();
  const insertQuery =
    "INSERT INTO bookings (booking_id, worker_id, worker_name, worker_email, worker_phone, customer_id, customer_name, customer_email, customer_phone, location, type_of_work, area, date, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const insertValues = [
    booking_id,
    data.worker_id,
    data.worker_name,
    data.worker_email,
    data.worker_phone,
    data.customer_id,
    data.customer_name,
    data.customer_email,
    data.customer_phone,
    data.to_location,
    data.type_of_work,
    data.area,
    data.date,
    data.amount,
    data.status,
  ];

  connection.query(insertQuery, insertValues, (err, result) => {
    if (err) {
      res.status(500).send({
        message: "Server Unavailable",
      });
    } else {
      res.status(200).send({
        message: "Data Inserted Successfully",
      });
    }
  });
});

//gatAll
app.get("/api/getAll/bookings", (req, res) => {
  const query = "SELECT * FROM bookings ORDER BY id DESC";
  connection.query(query, (err, result) => {
    if (err) {
      res.status(500).send({
        message: "Server Unavailable",
      });
    } else if (result.length === 0) {
      res.status(200).send({
        message: "No data found",
      });
    } else {
      res.status(200).json(result);
    }
  });
});

//GetBy customer Id
app.get("/api/get/bookings/:customer_id", (req, res) => {
  const customer_id = req.params.customer_id;
  const query = "SELECT * FROM bookings WHERE customer_id = ?";
  connection.query(query, customer_id, (error, results) => {
    if (error) {
      res.status(500).json({ error: "Error fetching users" });
    } else {
      res.json(results);
    }
  });
});

//getBy worker id
app.get("/api/getAll/bookings/:worker_id", (req, res) => {
  const worker_id = req.params.worker_id;
  const query = "SELECT * FROM bookings WHERE worker_id = ?";
  connection.query(query, worker_id, (err, result) => {
    if (err) {
      res.status(500).send("Error retrieving data");
    } else if (result.length === 0) {
      res.status(404).send("No data found");
    } else {
      res.status(200).json(result);
    }
  });
});

// PUT API to update Booking Data in database
app.put("/api/updateRatings/bookings/:id", (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const query = "UPDATE bookings SET ratings = ? WHERE id = ?";
  const values = [data.ratings, id];

  connection.query(query, values, (err, result) => {
    if (err) {
      res.status(500).send("Error updating data");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to update");
    } else {
      res.status(200).json(result);
    }
  });
});

app.put("/api/updateStatus/bookings/:id", (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const query = "UPDATE bookings SET status = ? WHERE id = ?";
  const values = [data.status, id];

  connection.query(query, values, (err, result) => {
    if (err) {
      res.status(500).send("Error updating data");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to update");
    } else {
      res.status(200).json(result);
    }
  });
});

// ------------------------------ Worker APIs -----------------------------------

// POST API to insert data into database
app.post("/api/create/worker", (req, res) => {
  const data = req.body;
  const checkQuery = "SELECT * FROM worker WHERE phone = ?";
  const checkValues = [data.phone];

  connection.query(checkQuery, checkValues, (err, result) => {
    if (err) {
      res.status(500).send("Error checking for existing data");
    } else if (result.length > 0) {
      res.status(409).send({
        message: "This phone number is already registered.",
      });
    } else {
      const emailQuery = "SELECT * FROM worker WHERE email = ?";
      const emailValues = [data.email];

      connection.query(emailQuery, emailValues, (err, result) => {
        if (err) {
          throw err;
        } else if (result.length > 0) {
          res.status(409).send({
            message: "This email is already registered.",
          });
        } else {
          const saltRounds = 10;
          const hash = bcrypt.hash(
            data.password,
            saltRounds,
            function (err, hashedpassword) {
              if (err) {
                throw err;
              }
              const worker_id = uuid.v4();
              const insertQuery =
                "INSERT INTO worker (worker_id, name, email, phone, type, password) VALUES (?, ?, ?, ?, ?, ?)";
              const insertValues = [
                worker_id,
                data.name,
                data.email,
                data.phone,
                data.type,
                hashedpassword,
              ];

              connection.query(insertQuery, insertValues, (err, result) => {
                if (err) {
                  res.status(500).send({
                    message: "Server Unavailable",
                  });
                } else {
                  res.status(200).send({
                    message: "Data Inserted Successfully",
                  });
                }
              });
            }
          );
        }
      });
    }
  });
});

// POST API to Login
app.post("/api/login/worker", (req, res) => {
  const data = req.body;
  const checkQuery = "SELECT * FROM worker WHERE phone = ?";
  const checkValues = [data.phone];
  connection.query(checkQuery, checkValues, (err, result) => {
    if (err) {
      res.status(500).send({
        message: "Server Unavailable",
      });
    } else if (result.length == 0) {
      const apiResponseNoDataFound = {
        status: true,
        message: "No data found",
      };
      res.status(200).send(apiResponseNoDataFound);
    } else {
      const hashedpwd = result[0]["password"];
      bcrypt
        .compare(data.password, hashedpwd.replace(/['"]+/g, ""))
        .then((resData) => {
          if (resData) {
            const apiResponse = {
              status: true,
              message: "Data Fetch Successfully",
              id: result[0]["id"],
              worker_id: result[0]["worker_id"],
              name: result[0]["name"],
              email: result[0]["email"],
              phone: result[0]["phone"],
            };
            res.send(apiResponse);
          } else {
            res.send({
              message: "Invalid Password!",
            });
          }
        })
        .catch((err) => {
          res.send({
            message: "Server Error!",
          });
        });
    }
  });
});

// GET API to retrieve all data from database
app.get("/api/getAll/worker", (req, res) => {
  const query = "SELECT * FROM worker";
  connection.query(query, (err, result) => {
    if (err) {
      res.status(500).send("Error retrieving data");
    } else {
      res.status(200).json(result);
    }
  });
});

// PUT API to update data in database
app.put("/api/update/worker/:id", (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const query = "UPDATE worker SET name = ?, email = ?, phone = ? WHERE id = ?";
  const values = [data.name, data.email, data.phone, id];

  connection.query(query, values, (err, result) => {
    if (err) {
      res.status(500).send("Error updating data");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to update");
    } else {
      res.status(200).json(result);
    }
  });
});

// Get Profile By ID
app.put("/api/getByID/worker/:id", (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const query = "SELECT * FROM worker WHERE id = ?";
  const values = [id];

  connection.query(query, values, (err, result) => {
    if (err) {
      res.status(500).send("Server Unavailable");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to update");
    } else {
      res.status(200).json(result);
    }
  });
});

// ------------------------------ Customer APIs ---------------------------------

// POST API to insert data into database
app.post("/api/create/customers", (req, res) => {
  const data = req.body;
  const checkQuery = "SELECT * FROM customers WHERE phone = ?";
  const checkValues = [data.phone];
  connection.query(checkQuery, checkValues, (err, result) => {
    if (err) {
      res.status(500).send("Error checking for existing data");
    } else if (result.length > 0) {
      res.status(409).send({
        message: "This phone no. is already registered",
      });
    } else {
      const emailQuery = `SELECT * FROM customers WHERE email = ?`;
      const emailValues = [data.email];

      connection.query(emailQuery, emailValues, (err, result) => {
        if (err) {
          throw err;
        } else if (result.length > 0) {
          res.status(409).send({
            message: "This email ID is already registered",
          });
        } else {
          const saltRounds = 10;
          const hash = bcrypt.hash(
            data.password,
            saltRounds,
            function (err, hashedpassword) {
              if (err) {
                throw err;
              }
              const c_id = uuid.v4();
              const insertQuery =
                "INSERT INTO customers (customer_id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)";
              const insertValues = [
                c_id,
                data.name,
                data.email,
                data.phone,
                hashedpassword,
              ];

              connection.query(insertQuery, insertValues, (err, result) => {
                if (err) {
                  res.status(500).send({
                    message: "Error inserting data",
                  });
                } else {
                  // Send confirmation email
                  // const transporter = nodemailer.createTransport({
                  // service: 'gmail',
                  // auth: {
                  //  user: process.env.SMTP_USER,
                  //  pass: process.env.SMTP_PASSWORD,
                  // },
                  // });

                  // const mailOptions = {
                  // from: process.env.SMTP_USER,
                  // to: 'email',
                  // subject: 'Registration confirmation',
                  // text: `Dear ${'name'},\n\nThank you for registering!`,
                  // };

                  res.status(200).send({
                    message: "Data inserted successfully",
                  });
                }
              });
            }
          );
        }
      });
    }
  });
});

// POST API to Login
app.post("/api/login/customers", (req, res) => {
  const data = req.body;
  const checkQuery = "SELECT * FROM customers WHERE phone = ?";
  const checkValues = [data.phone];
  connection.query(checkQuery, checkValues, (err, result) => {
    if (err) {
      res.status(500).send("Server Unavailable");
    } else if (result.length == 0) {
      const apiResponseNoDataFound = {
        status: true,
        message: "No data found",
      };
      res.status(200).send(apiResponseNoDataFound);
    } else {
      const hashedpwd = result[0]["password"];
      bcrypt
        .compare(data.password, hashedpwd.replace(/['"]+/g, ""))
        .then((resData) => {
          if (resData) {
            const apiResponse = {
              status: true,
              message: "Data Fetch Successfully",
              id: result[0]["id"],
              customer_id: result[0]["customer_id"],
              name: result[0]["name"],
              email: result[0]["email"],
              phone: result[0]["phone"],
            };
            res.send(apiResponse);
          } else {
            res.send({
              message: "Invalid Password!",
            });
          }
        })
        .catch((err) => {
          res.send({
            message: "Server Error!",
          });
        });
    }
  });
});

// PUT API to update data in database
app.put("/api/update/customers/:id", (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const query =
    "UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?";
  const values = [data.name, data.email, data.phone, id];

  connection.query(query, values, (err, result) => {
    if (err) {
      res.status(500).send("Error updating data");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to update");
    } else {
      res.status(200).send("Data updated successfully");
    }
  });
});

// DELETE API to delete data from database
app.delete("/api/delete/customers/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM customers WHERE id = ?";

  connection.query(query, id, (err, result) => {
    if (err) {
      res.status(500).send("Error deleting data");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to delete");
    } else {
      res.status(200).send("Data deleted successfully");
    }
  });
});

// Get Profile By ID
app.put("/api/getByID/customers/:id", (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const query = "SELECT * FROM customers WHERE id = ?";
  const values = [id];

  connection.query(query, values, (err, result) => {
    if (err) {
      res.status(500).send("Server Unavailable");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to update");
    } else {
      res.status(200).json(result);
    }
  });
});

// -------------- Customer APIs Ends Here --------------------

//----------------- Bookings APIs ----------------------------
app.post("/api/create/bookings", (req, res) => {
  const data = req.body;
  const b_id = uuid.v4();

  const insertQuery =
    "INSERT INTO bookings (bookings_id, driver_id, customer_id, b_date, type_of_load, from_location, to_location, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  const insertValues = [
    b_id,
    data.driver_id,
    data.customer_id,
    data.b_date,
    data.type_of_load,
    data.from_location,
    data.to_location,
    data.amount,
    data.status,
  ];
  connection.query(insertQuery, insertValues, (err, result) => {
    if (err) {
      res.status(500).send({
        message: "Error inserting data",
      });
    } else {
      res.status(200).send({
        message: "Your booking is now confirmed.",
      });
    }
  });
});

//GetAll bookings
app.get("/api/getAll/bookings", (req, res) => {
  const query = "SELECT * FROM bookings";
  connection.query(query, (err, result) => {
    if (err) {
      res.status(500).send("Error retrieving data");
    } else {
      res.status(200).json(result);
    }
  });
});

// GET API to retrieve data by ID from database
app.get("/api/getAll/bookings/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM bookings WHERE id = ?";

  connection.query(query, id, (err, result) => {
    if (err) {
      res.status(500).send("Error retrieving data");
    } else if (result.length === 0) {
      res.status(404).send("No data found");
    } else {
      res.status(200).json(result[0]);
    }
  });
});

//GET API for GET Booking BY CustomerID
app.get("/api/getByCustomerId/:customer_id", (req, res) => {
  const customer_id = req.params.customer_id;
  const query = "SELECT * FROM bookings where customer_id =?";

  connection.query(query, customer_id, (err, result) => {
    if (err) {
      res.status(500).send("Error retrieving data");
    } else if (result.length === 0) {
      res.status(404).send("No data found");
    }
    res.status(200).json(result);
  });
});

//GET API for GET Booking By DriverID
app.get("/api/getByDriverId/:driver_id", (req, res) => {
  const driver_id = req.params.driver_id;
  const query = "SELECT * FROM bookings where driver_id =?";

  connection.query(query, driver_id, (err, result) => {
    if (err) {
      res.status(500).send("Error retrieving data!..");
    } else if (result.length === 0) {
      res.status(404).send("No Data found!..");
    }
    res.status(200).json(result);
  });
});

//UPDATE bookings
app.put("/api/update/bookings/:id", (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const query =
    "UPDATE bookings SET from_location = ?, to_location = ?, amount = ?, status = ? WHERE id = ?";
  const values = [
    data.from_location,
    data.to_location,
    data.amount,
    data.status,
    id,
  ];

  connection.query(query, values, (err, result) => {
    if (err) {
      res.status(500).send("Error updating data");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to update");
    } else {
      res.status(200).send("Data updated successfully");
    }
  });
});

//DELETE bookings
app.delete("/api/delete/bookings/:id", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM bookings WHERE id = ?";
  connection.query(query, id, (err, result) => {
    if (err) {
      res.status(500).send("Error deleting data");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to delete");
    } else {
      res.status(200).send("Data deleted successfully");
    }
  });
});

// PUT API to update data in database
app.put("/api/update/bookings/:id", (req, res) => {
  const data = req.body;
  const id = req.params.id;
  const query = "UPDATE bookings SET status = ? WHERE id = ?";
  const values = [data.status, id];

  connection.query(query, values, (err, result) => {
    if (err) {
      res.status(500).send("Error updating data");
    } else if (result.affectedRows === 0) {
      res.status(404).send("No data found to update");
    } else {
      res.status(200).send("Data updated successfully");
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
