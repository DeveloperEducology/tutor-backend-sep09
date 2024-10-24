if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Database connection
const uri =
  "mongodb+srv://vijaymarka:admin123@cluster0.ivjiolu.mongodb.net/JuneTutor?retryWrites=true&w=majority";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Routes
require("./src/config/database");
const my_routes = require("./src/routes");

app.get("/", (req, res) => {
  res.send("Hello, Express");
});

app.get("/collections", async (req, res) => {
  try {
    // Fetch collections in parallel
    const categoriesPromise = db
      .collection("categories")
      .find({ status: true })
      .toArray();
    const classesPromise = db.collection("classes").find().toArray();
    const subjectsPromise = db.collection("subjects").find().toArray();
    const citiesPromise = db
      .collection("cities")
      .find({ status: true })
      .toArray();
    const daysPromise = db.collection("days").find().toArray();
    const pincodePromise = db.collection("pincodes").find().toArray();
    const areaPromise = db.collection("areas").find().toArray();
    const schoolPromise = db.collection("schools").find().toArray();
    const boardPromise = db.collection("boards").find().toArray();

    // Fetch locations with city details using an aggregation pipeline
    const locationsPromise = db
      .collection("locations")
      .aggregate([
        {
          $lookup: {
            from: "cities",
            localField: "cityId",
            foreignField: "_id",
            as: "city",
          },
        },
        {
          $unwind: "$city",
        },
      ])
      .toArray();

    // Wait for all promises to resolve
    const [
      categories,
      classes,
      subjects,
      cities,
      locations,
      days,
      pincodes,
      areas,
      boards,
      schools,
    ] = await Promise.all([
      categoriesPromise,
      classesPromise,
      subjectsPromise,
      citiesPromise,
      locationsPromise,
      daysPromise,
      pincodePromise,
      areaPromise,
      boardPromise,
      schoolPromise,
    ]);
console.log(schoolPromise, schools)
    // Send the combined results
    res.json({
      categories,
      classes,
      subjects,
      cities,
      locations,
      days,
      pincodes,
      areas,
      boards,
      schools,
    });
  } catch (error) {
    res
      .status(500)
      .send({ error: "An error occurred while fetching the collections" });
  }
});

app.use("/", my_routes);

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
