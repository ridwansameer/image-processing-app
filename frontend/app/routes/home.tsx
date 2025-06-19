import type { Route } from "./+types/home";
import { useState, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Image Processor" },
    { name: "description", content: "Image Processor" },
  ];
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processingType, setProcessingType] = useState<
    "light" | "heavy" | null
  >("light");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (event: any) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setProcessedImage(null);
      setJobStatus(null);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Upload image
  const uploadImage = async () => {
    if (!selectedFile) return null;
    console.log("selectedFile", selectedFile);

    const formData = new FormData();
    formData.append("image", selectedFile);
    console.log("formData", formData);

    try {
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      console.log("response", response);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const result = await response.json();
      console.log("result", result);
      setUploadedImage(result);
      return result;
    } catch (err) {
      setError("Failed to upload image: " + (err as Error).message);
      return null;
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE}/status/${jobId}`);
      if (!response.ok) {
        throw new Error("Failed to get job status");
      }

      const status = await response.json();
      setJobStatus(status);

      if (status.status === "completed") {
        setIsProcessing(false);
        setProcessedImage(status.result);
      } else if (status.status === "failed") {
        setIsProcessing(false);
        setError("Processing failed: " + (status.error || "Unknown error"));
      } else if (status.status === "processing") {
        // Continue polling after 2 seconds
        setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (err) {
      setIsProcessing(false);
      setError("Failed to check job status: " + (err as Error).message);
    }
  };

  // Process image
  const processImage = async () => {
    setError(null);
    setProcessedImage(null);
    setJobStatus(null);

    // Upload image first if not already uploaded
    let imageData = uploadedImage;
    if (!imageData) {
      imageData = await uploadImage();
      if (!imageData) return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch(`${API_BASE}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageId: imageData.imageName,
          light: processingType === "light",
          heavy: processingType === "heavy",
        }),
      });

      if (!response.ok) {
        throw new Error("Processing failed");
      }

      const result = await response.json();

      // Start polling for job status
      pollJobStatus(result.jobId);
    } catch (err) {
      setIsProcessing(false);
      setError("Failed to start processing: " + (err as Error).message);
    }
  };

  // Reset form
  const resetForm = () => {
    setSelectedFile(null);
    setUploadedImage(null);
    setPreviewUrl(null);
    setProcessingType("light");
    setIsProcessing(false);
    setProcessedImage(null);
    setError(null);
    setJobStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Get processing time estimate
  const getEstimatedTime = () => {
    if (processingType === "heavy") return "~60 seconds";
    if (processingType === "light") return "~1 second";
    return "No processing selected";
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Image Processor</h1>

        {/* File Upload Section */}
        <div className="upload-section">
          <h2>1. Select Image</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />

          {previewUrl && (
            <div className="preview">
              <h3>Preview:</h3>
              <img src={previewUrl} alt="Preview" className="preview-image" />
              <p className="file-info">
                File: {selectedFile?.name} (
                {(selectedFile?.size ?? 0 / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}
        </div>

        {/* Processing Options */}
        {selectedFile && (
          <div className="options-section">
            <h2>2. Processing Options</h2>
            <div className="radio-buttons">
              <label className="radio-label">
                <input
                  type="radio"
                  name="processingType"
                  value="light"
                  checked={processingType === "light"}
                  onChange={(e) =>
                    setProcessingType(e.target.value as "light" | "heavy")
                  }
                  disabled={isProcessing}
                />
                <span className="radio-text">
                  Light Processing (Blur effect - ~1 second)
                </span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="processingType"
                  value="heavy"
                  checked={processingType === "heavy"}
                  onChange={(e) =>
                    setProcessingType(e.target.value as "light" | "heavy")
                  }
                  disabled={isProcessing}
                />
                <span className="radio-text">
                  Heavy Processing (Contour effect - ~60 seconds)
                </span>
              </label>
            </div>

            <div className="estimate">
              Estimated time: <strong>{getEstimatedTime()}</strong>
            </div>
          </div>
        )}

        {/* Process Button */}
        {selectedFile && processingType && (
          <div className="process-section">
            <h2>3. Process Image</h2>
            <button
              onClick={processImage}
              disabled={isProcessing}
              className={`process-button ${isProcessing ? "processing" : ""}`}
            >
              {isProcessing ? "Processing..." : "Start Processing"}
            </button>
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="status-section">
            <div className="loading-spinner"></div>
            <h3>Processing in progress...</h3>
            {jobStatus && (
              <div className="status-details">
                <p>
                  Status: <strong>{jobStatus.status}</strong>
                </p>
                {jobStatus.startTime && (
                  <p>
                    Started:{" "}
                    {new Date(jobStatus.startTime).toLocaleTimeString()}
                  </p>
                )}
                {processingType === "heavy" && (
                  <div className="progress-note">
                    Heavy processing takes about 60 seconds. Please wait...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-section">
            <h3>Error</h3>
            <p className="error-message">{error}</p>
            <button onClick={resetForm} className="reset-button">
              Try Again
            </button>
          </div>
        )}

        {/* Processed Image */}
        {processedImage && (
          <div className="result-section">
            <h2>4. Processed Image</h2>
            <div className="result-container">
              <div className="image-comparison">
                <div className="image-side">
                  <h3>Original</h3>
                  <img
                    src={previewUrl ?? ""}
                    alt="Original"
                    className="result-image"
                  />
                </div>
                <div className="image-side">
                  <h3>Processed</h3>
                  <img
                    src={`${API_BASE}/download/${processedImage}`}
                    alt="Processed"
                    className="result-image"
                  />
                </div>
              </div>

              <div className="result-actions">
                <a
                  href={`${API_BASE}/download/${processedImage}`}
                  download
                  className="download-button"
                >
                  Download Processed Image
                </a>
                <button onClick={resetForm} className="reset-button">
                  Process Another Image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
