import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export default function JobDetailRoute() {
  const { jobId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`${API_BASE}/status/${jobId}`);
        if (!response.ok) {
          throw new Error("Job not found");
        }
        const jobData = await response.json();
        setJob(jobData);
        setLoading(false);
      } catch (err) {
        setError("Failed to load job details: " + (err as Error).message);
        setLoading(false);
      }
    };

    let intervalId: NodeJS.Timeout | null = null;

    const startPolling = () => {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }
      // Start new polling interval
      intervalId = setInterval(fetchJob, 3000);
    };

    if (jobId) {
      // Initial fetch
      fetchJob().then(() => {
        // Start polling only if job is processing
        if (job?.status === "processing") {
          startPolling();
        }
      });
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId, job?.status]); // Add job.status as dependency to restart polling if status changes

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "processing":
        return "bg-blue-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "processing":
        return "⏳";
      case "failed":
        return "❌";
      default:
        return "❓";
    }
  };

  const formatDuration = (startTime: number) => {
    if (!startTime) return "Unknown";
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (duration < 60) return `${duration} seconds`;
    if (duration < 3600) return `${Math.round(duration / 60)} minutes`;
    return `${Math.round(duration / 3600)} hours`;
  };

  const getImageFilename = (path: string) => {
    if (!path) return null;
    return path.split(/[\\/]/).pop();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="ml-4 text-gray-600">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Job Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The requested job could not be found."}
            </p>
            <Link
              to="/jobs"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
          <Link
            to="/jobs"
            className="text-indigo-100 hover:text-white mb-4 inline-block text-sm"
          >
            ← Back to Jobs
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-light mb-2">Job #{jobId}</h1>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getStatusIcon(job.status)}</span>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium text-white ${getStatusColor(
                    job.status
                  )}`}
                >
                  {job.status}
                </span>
                {job.startTime && (
                  <span className="text-indigo-100 text-sm">
                    Started {formatDuration(job.startTime)} ago
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Job Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Job Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Status Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">
                      Current Status:
                    </span>
                    <div className="mt-1">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                  {job.startTime && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">
                        Duration:
                      </span>
                      <p className="text-gray-800">
                        {formatDuration(job.startTime)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-4">
                  Processing Output
                </h3>
                {job.output ? (
                  <div className="bg-white rounded p-3 text-sm font-mono text-gray-700 max-h-32 overflow-y-auto">
                    {job.output}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No output available</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Section */}
          {job.error && (
            <div className="mb-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="font-semibold text-red-800 mb-3">
                  Error Details
                </h3>
                <div className="bg-white rounded-lg p-4 text-sm font-mono text-red-700">
                  {job.error}
                </div>
              </div>
            </div>
          )}

          {/* Processing Status */}
          {job.status === "processing" && (
            <div className="mb-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                  <div>
                    <h3 className="font-semibold text-blue-800">
                      Processing in Progress
                    </h3>
                    <p className="text-blue-600 text-sm">
                      This page will automatically update when processing
                      completes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {job.status === "completed" && job.result && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Processing Results
              </h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-green-800">
                    ✅ Processing Completed Successfully
                  </h3>
                </div>

                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-medium text-gray-800 mb-4">
                    Processed Image
                  </h4>
                  <div className="text-center">
                    <img
                      src={`${API_BASE}/download/${getImageFilename(
                        job.result
                      )}`}
                      alt="Processed result"
                      className="max-w-full max-h-96 rounded-lg shadow-lg mx-auto mb-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const nextSibling = target.nextSibling as HTMLElement;
                        nextSibling.style.display = "block";
                      }}
                    />
                    <div className="hidden bg-gray-100 p-8 rounded-lg">
                      <p className="text-gray-500">
                        Image preview not available
                      </p>
                    </div>

                    <div className="flex justify-center gap-4 mt-6">
                      <a
                        href={`${API_BASE}/download/${getImageFilename(
                          job.result
                        )}`}
                        download
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center"
                      >
                        📥 Download Result
                      </a>
                      <Link
                        to="/jobs"
                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        Back to Jobs
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex justify-center gap-4">
            <Link
              to="/jobs"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              View All Jobs
            </Link>
            <Link
              to="/"
              className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Process New Image
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
