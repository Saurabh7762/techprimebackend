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
app.get("/api/project/count", (req, res) => {
  ProjectModel.countDocuments({}, (err, count) => {
    if (err) {
      console.error("Error counting projects:", err);
      return res.status(500).send("Internal Server Error");
    }
    res.json({ count });
  });
});

//department wise total and closing deta
app.get("/api/department-data", async (req, res) => {
  try {
    const departmentData = await Project.aggregate([
      {
        $group: {
          _id: "$dept",
          totalData: { $sum: 1 }, // Calculate total data for each department
          totalClosed: {
            $sum: {
              $cond: [{ $eq: ["$status", "Closed"] }, 1, 0], // Calculate total closed data for each department
            },
          },
        },
      },
    ]);

    res.json(departmentData);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching department data",
        error: error.message,
      });
  }
});

//project stats
/*
app.get("/api/project/stats", async (req, res) => {
  try {
    const projects = await Project.find();
    const totalIds = projects.length;
    const totalClosedIds = projects.filter(
      (project) => project.status === "Closed"
    ).length;
    const totalRunningIds = projects.filter(
      (project) => project.status === "Running"
    ).length;
    const totalCancelIds = projects.filter(
      (project) => project.status === "Cancel"
    ).length;
    const closerIds = projects.filter(
      (project) =>
        project.status === "Running" && new Date(project.endDate) < new Date()
    ).length;

    res.json({
      totalIds,
      totalClosedIds,
      totalRunningIds,
      totalCancelIds,
      closerIds,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate project statistics" });
  }
});
*/
app.get("/api/project/stats", async (req, res) => {
  try {
    const pipeline = [
      
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ];

    const projectStats = await Project.aggregate(pipeline);

    // Calculate "Total" count by summing counts in projectStats
    const totalIds = projectStats.reduce(
      (total, stat) => total + stat.count,
      0
    );

    // Calculate "Closure Delay" count using the same aggregation pipeline
    const closerIds = projectStats
      .filter(
        (stat) =>
          stat.status === "Running" && new Date(stat.endDate) < new Date()
      )
      .reduce((total, stat) => total + stat.count, 0);

    // Replace "Total" and "Closure Delay" in projectStats
    projectStats.push({ status: "Total", count: totalIds });
    projectStats.push({ status: "Closure Delay", count: closerIds });

    res.json(projectStats);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate project statistics" });
  }
});








app.patch("/api/project/:id", async (req, res) => {
  try {
    // Get the id from the request parameters
    const projectId = req.params.id;

    // Update the project with the provided data in req.body
    const updatedProject = await Project.findOneAndUpdate(
      { _id: projectId },
      req.body,
      {
        new: true,
      }
    );

    if (!updatedProject) {
      // Project not found
      return res.status(404).send("Project not found");
    }

    console.log(updatedProject);
    res.status(204).send("Update Successful!");
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
