const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const cors=require('cors');
const jwt=require('jsonwebtoken');



app.use(cors());

// Assuming projectSchema.js exports a mongoose model
const Project = require("./Schema/projectSchema.js");
const User = require("./Schema/userSchema.js");

const PORT = process.env.PORT || 8000;

app.use(bodyParser.json());

// Connect to MongoDB using mongoose

const uri =
  "mongodb+srv://nsproject2:nsproject123@atlascluster.bm2arhf.mongodb.net/?retryWrites=true&w=majority";
// Note: You should have the database name at the end of your URI.

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connected to MongoDB!");
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

//signup and login
app.post("/api/register", async (req, res) => {
  console.log(req.body);
  try {
    await User.create({
      email: req.body.email,
      password: req.body.password,
    });
    res.json({ status: "ok" });
  } catch (err) {
    res.json({ status: "error", error: "Duplicate email" });
  }
});
app.post("/api/login", async (req, res) => {
  const user = await User.collection.findOne({
    email: req.body.email,
    password: req.body.password,
  });
  if (user) {
    const token=jwt.sign({
      email: user.email,

    },'secret123')
    return res.json({ status: "ok", user: token });
  } else {
    return res.json({ status: "error", user: false });
  }
});



app.post("/api/project", async (req, res) => {
  try {
    let project = await Project.create(req.body);
    console.log(project);
    res.status(201).send(project);
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/api/project", async (req, res) => {
  try {
    let projects = await Project.find();
    res.status(200).send(projects);
  } catch (err) {
    res.status(500).send(err);
  }
});

//count project
app.get("/api/projects/count", (req, res) => {
  ProjectModel.countDocuments({}, (err, count) => {
    if (err) {
      console.error("Error counting projects:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.json({ count });
  });
});

app.get("/api/projects/deptwise", async (req, res) => {
  let chartData = await Project.aggregate([
    {
      $match: {
        status: { $in: ["registered", "Completed"] },
      },
    },
    {
      $group: {
        _id: { dept: "$dept", status: "$status" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.dept",
        statuses: {
          $push: {
            status: "$_id.status",
            count: "$count",
          },
        },
      },
    },
  ]);

  res.status(200).send(chartData);
});

app.patch("/api/project/:id", (req, res) => {
  // Get the id from the request parameters
  const projectId = req.params.id;

  // Update the project with the provided data in req.body
  let project = Project.findOneAndUpdate({ id: projectId }, req.body, {
    new: true,
  });
  console.log(project);
  res.status(204).send("Update Successfull!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
