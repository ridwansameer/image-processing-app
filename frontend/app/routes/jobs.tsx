import React, { useState, useEffect } from "react";
import { Link } from "react-router";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export default function JobsRoute() {
  const [jobs, setJobs] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(`${API_BASE}/jobs`);
        if (!response.ok) {
          throw new Error("Failed to fetch jobs");
        }
        const jobsData = await response.json();

        // Sort jobs by start time (newest first)
        const sortedJobs = jobsData.sort(
          (a: any, b: any) => (b.startTime || 0) - (a.startTime || 0)
        );

        setJobs(sortedJobs);
        setLoading(false);
      } catch (err) {
        setError("Failed to load jobs: " + (err as Error).message);
        setLoading(false);
      }
    };

    fetchJobs();

    // Refresh jobs every 5 seconds to catch processing updates
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const formatDuration = (startTime: number) => {
    if (!startTime) return "Unknown";
    const duration = Math.round((Date.now() - startTime) / 1000);
    if (duration < 60) return `${duration}s ago`;
    if (duration < 3600) return `${Math.round(duration / 60)}m ago`;
    return `${Math.round(duration / 3600)}h ago`;
  };

  const getJobId = (job: any, index: number) => {
    // Try to extract job ID from various possible sources
    return job.jobId || job.id || `job-${index}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            <p className="ml-4 text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Error Loading Jobs
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/"
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-light mb-2">Processing Jobs</h1>
              <p className="text-indigo-100">
                Track your image processing tasks
              </p>
            </div>
            <Link
              to="/"
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-medium transition-colors border border-white/30"
            >
              New Job
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 text-8xl mb-6">📸</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                No jobs yet
              </h2>
              <p className="text-gray-600 mb-8">
                Start by processing your first image!
              </p>
              <Link
                to="/"
                className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-lg font-medium transition-colors inline-block"
              >
                Process Your First Image
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  {jobs.length} Job{jobs.length !== 1 ? "s" : ""}
                </h2>
                <div className="text-sm text-gray-500">
                  Auto-refreshing every 5 seconds
                </div>
              </div>

              {jobs.map((job, index) => {
                const jobId = getJobId(job, index);
                return (
                  <div
                    key={jobId}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">
                            Job #{jobId}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(
                              job.status
                            )}`}
                          >
                            {job?.status || "unknown"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Started:</span>{" "}
                            {job.startTime
                              ? formatDuration(job.startTime)
                              : "Unknown"}
                          </div>
                          {job.output && (
                            <div>
                              <span className="font-medium">Output:</span>{" "}
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {job.output.substring(0, 50)}...
                              </span>
                            </div>
                          )}
                          {job.error && (
                            <div className="col-span-full">
                              <span className="font-medium text-red-600">
                                Error:
                              </span>{" "}
                              <span className="text-red-500 text-xs bg-red-50 px-2 py-1 rounded">
                                {job.error.substring(0, 100)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="ml-6">
                        {job.status === "completed" ? (
                          <Link
                            to={`/jobs/${jobId}`}
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                          >
                            View Result
                          </Link>
                        ) : job.status === "processing" ? (
                          <div className="flex items-center text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            <span className="text-sm font-medium">
                              Processing...
                            </span>
                          </div>
                        ) : job.status === "failed" ? (
                          <span className="text-red-500 font-medium text-sm">
                            Failed
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium text-sm">
                            Unknown
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
