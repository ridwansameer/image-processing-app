// backend/server.js
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const app = express();
const uploadsDir = path.join(__dirname, "..", "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Cors - allow all origins in production for now
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? true : '*',
  credentials: true
}));
// Store for tracking jobs
const jobs = new Map();

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Image Processing API" });
});

app.get("/api", (req, res) => {
  res.json({ status: "ok", endpoints: ["/api/upload", "/api/process", "/api/status/:jobId", "/api/jobs", "/api/download/:filename"] });
});

// Upload endpoint
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log("req.file", req.file);

  const imageId = req.file.filename;
  const originalPath = req.file.path;

  // Rename file to include original extension
  const ext = path.extname(req.file.originalname);
  const newPath = originalPath + ext;
  fs.renameSync(originalPath, newPath);

  res.json({
    imageId,
    imageName: `${imageId}${ext}`,
    filename: req.file.originalname,
    path: newPath,
  });
});

// Process endpoint
app.post("/api/process", (req, res) => {
  const { imageId, light, heavy } = req.body;
  const imagePath = path.join(uploadsDir, `${imageId}`);

  // Set working directory to parent
  const cwd = path.join(__dirname, "..");

  // Check if file exists relative to cwd
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: "Image not found" });
  }

  const jobId = Date.now().toString();

  // Build Python command arguments
  const args = ["main.py", imagePath];
  if (light) args.push("--light");
  if (heavy) args.push("--heavy");

  // Track job status
  jobs.set(jobId, {
    id: jobId,
    status: "processing",
    startTime: Date.now(),
  });

  // Spawn Python process using uv from parent directory
  const pythonProcess = spawn("uv", ["run", "python", ...args], {
    cwd, // Use parent directory to find main.py and uploads folder
  });

  let output = "";
  let error = "";

  pythonProcess.stdout.on("data", (data) => {
    output += data.toString();
    console.log(`Python output: ${data}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    error += data.toString();
    console.error(`Python error: ${data}`);
  });

  pythonProcess.on("close", (code) => {
    if (code === 0) {
      // Success - find the processed image
      const processedName = imageId.replace(
        /\.(jpg|jpeg|png)$/i,
        "_Processed.$1"
      );
      // const processedPath = imagePath.replace(
      //   /\.(jpg|jpeg|png)$/i,
      //   "_Processed.$1"
      // );
      jobs.set(jobId, {
        id: jobId,
        status: "completed",
        result: processedName,
        output,
      });
    } else {
      // Error
      jobs.set(jobId, {
        id: jobId,
        status: "failed",
        error: error || "Processing failed",
      });
    }
  });

  res.json({ jobId, status: "processing" });
});

// Status check endpoint
app.get("/api/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json(job);
});

// Download processed image
app.get("/api/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath);
});

// List of jobs
app.get("/api/jobs", (req, res) => {
  res.json(Array.from(jobs.values()));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
