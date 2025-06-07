import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { reportAPI } from "../../services/reportService";

function Report() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState("bar");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectDetailData, setSubjectDetailData] = useState(null);
  const [loadingSubject, setLoadingSubject] = useState(false);

  // Available subject codes
  const subjectCodes = [
    "toan",
    "ngu_van",
    "ngoai_ngu",
    "vat_li",
    "hoa_hoc",
    "sinh_hoc",
    "lich_su",
    "dia_li",
    "gdcd",
  ];

  useEffect(() => {
    fetchChartData();
  }, []);

  useEffect(() => {
    if (selectedSubject && selectedView === "pie") {
      fetchSubjectDetail(selectedSubject);
    }
  }, [selectedSubject, selectedView]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportAPI.getStatisticsChart();
      if (result.success) {
        setChartData(result.data);
      } else {
        throw new Error(result.message || "Failed to fetch chart data");
      }
    } catch (error) {
      setError(error.message);
      console.error("Error fetching chart data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectDetail = async (subjectCode) => {
    try {
      setLoadingSubject(true);
      const result = await reportAPI.getSubjectStatistics(subjectCode);
      if (result.success) {
        setSubjectDetailData(result.data);
      }
    } catch (error) {
      console.error("Error fetching subject detail:", error);
    } finally {
      setLoadingSubject(false);
    }
  };

  const prepareBarChartData = () => {
    if (!chartData) return [];

    return chartData.data.map((subject) => ({
      name: subject.name,
      shortName:
        subject.name.length > 8
          ? subject.name.substring(0, 8) + "..."
          : subject.name,
      icon: subject.icon,
      excellent: subject.levels.excellent.count,
      good: subject.levels.good.count,
      average: subject.levels.average.count,
      poor: subject.levels.poor.count,
      total: subject.total_students,
    }));
  };

  const preparePieChartData = () => {
    if (!subjectDetailData) return [];

    return subjectDetailData.levels.map((level) => ({
      name: `${level.level_info.name} (${level.min_score}-${level.max_score})`,
      value: level.student_count,
      color: level.level_info.color,
      percentage: level.percentage,
      icon: level.level_info.icon,
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum, item) => sum + item.value, 0);
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          <p className="text-sm text-gray-600 mb-2">Total Students: {total}</p>
          {payload.map((item, index) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.dataKey === "excellent" && "Excellent (≥8.0): "}
              {item.dataKey === "good" && "Good (6.0-7.99): "}
              {item.dataKey === "average" && "Average (4.0-5.99): "}
              {item.dataKey === "poor" && "Poor (<4.0): "}
              {item.value} students ({((item.value / total) * 100).toFixed(1)}%)
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 flex items-center">
            <span className="mr-2">{data.icon}</span>
            {data.name}
          </p>
          <p className="text-sm text-gray-600">
            Students: {data.value} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const handleCalculateStatistics = async () => {
    try {
      await reportAPI.calculateStatistics();
      // Refresh data after calculation
      await fetchChartData();
      alert("Statistics calculated successfully!");
    } catch (error) {
      console.error("Error calculating statistics:", error);
      alert("Failed to calculate statistics");
    }
  };

  const handleInitializeReports = async () => {
    try {
      await reportAPI.initializeReports();
      alert("Reports initialized successfully!");
    } catch (error) {
      console.error("Error initializing reports:", error);
      alert("Failed to initialize reports");
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading chart data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-8">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">Error: {error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-8">
        {/* Chart Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                Score Statistics Chart
              </h3>
              <p className="text-gray-600">
                Student performance analysis across subjects and score levels
              </p>
            </div>
            <button
              onClick={handleCalculateStatistics}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Recalculate Stats
            </button>
          </div>

          {/* Chart Controls */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedView("bar")}
                className={`px-4 py-2 rounded-lg ${
                  selectedView === "bar"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Bar Chart
              </button>
              <button
                onClick={() => setSelectedView("pie")}
                className={`px-4 py-2 rounded-lg ${
                  selectedView === "pie"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Pie Chart
              </button>
            </div>

            {selectedView === "pie" && (
              <select
                value={selectedSubject || ""}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Subject</option>
                {chartData?.data.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.icon} {subject.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Chart Display */}
          <div className="h-96">
            {selectedView === "bar" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prepareBarChartData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="shortName"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="excellent"
                    stackId="a"
                    fill="#10B981"
                    name="Excellent (≥8.0)"
                  />
                  <Bar
                    dataKey="good"
                    stackId="a"
                    fill="#3B82F6"
                    name="Good (6.0-7.99)"
                  />
                  <Bar
                    dataKey="average"
                    stackId="a"
                    fill="#F59E0B"
                    name="Average (4.0-5.99)"
                  />
                  <Bar
                    dataKey="poor"
                    stackId="a"
                    fill="#EF4444"
                    name="Poor (<4.0)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : selectedSubject ? (
              <div className="flex flex-col items-center h-full">
                {loadingSubject ? (
                  <div className="text-gray-500">
                    Loading subject details...
                  </div>
                ) : subjectDetailData ? (
                  <>
                    <h4 className="text-base md:text-lg font-semibold mb-2 text-center px-2">
                      {subjectDetailData.subject.icon}{" "}
                      {subjectDetailData.subject.name} Performance
                    </h4>
                    <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-4">
                      Total Students: {subjectDetailData.total_students}
                    </p>
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={preparePieChartData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percentage }) => {
                              // Make labels responsive
                              const isMobile = window.innerWidth < 768;
                              if (isMobile) {
                                return `${value}`;
                              }
                              return `${value} (${percentage}%)`;
                            }}
                            outerRadius={window.innerWidth < 768 ? 80 : 120}
                            innerRadius={window.innerWidth < 768 ? 30 : 0}
                            fill="#8884d8"
                            dataKey="value"
                            style={{
                              fontSize:
                                window.innerWidth < 768 ? "10px" : "12px",
                            }}
                          >
                            {preparePieChartData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                          <Legend
                            wrapperStyle={{
                              fontSize:
                                window.innerWidth < 768 ? "10px" : "12px",
                              paddingTop: "10px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div className="text-red-500 text-sm text-center px-4">
                    Failed to load subject details
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm text-center px-4">
                Please select a subject to view pie chart
              </div>
            )}
          </div>

          {/* Legend for Score Levels */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {chartData?.levels.map((level) => (
              <div
                key={level.code}
                className="flex items-center p-3 rounded-lg"
                style={{ backgroundColor: level.bgColor }}
              >
                <span className="text-lg mr-2">{level.icon}</span>
                <div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: level.color }}
                  >
                    {level.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {level.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Management Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Report Management
          </h3>
          <p className="text-gray-600 mb-6">
            Manage and initialize report system
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Initialize Reports
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Set up the report system and database tables
              </p>
              <button
                onClick={handleInitializeReports}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Initialize
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Recalculate Statistics
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Update all statistics based on current data
              </p>
              <button
                onClick={handleCalculateStatistics}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Calculate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;
