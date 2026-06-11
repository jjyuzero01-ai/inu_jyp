"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { COLLEGE_MAPPING } from "@/lib/constants";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  BarChart,
  LineChart,
  PieChart,
  Pie,
  Cell
} from "recharts";

const CHART_COLORS = ['#5c6ac4', '#4ade80', '#fbbf24', '#f87171', '#2dd4bf', '#a78bfa', '#f472b6', '#60a5fa'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const countPayload = payload.find((p: any) => p.dataKey === "count");
    const avgPayload = payload.find((p: any) => p.dataKey === "avgStudents");

    return (
      <div className="bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700">
        <p className="font-bold mb-2 border-b border-slate-700 pb-1">{label}</p>
        <p className="mb-1 text-blue-300">
          <span className="font-medium">강좌 수:</span> {countPayload?.value}개
        </p>
        <p className="text-emerald-300">
          <span className="font-medium">평균 수강인원:</span> {avgPayload?.value}명
        </p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700">
        <p className="font-bold mb-1">{data.name}</p>
        <p className="text-blue-300">
          <span className="font-medium">강좌 수:</span> {data.value}개
        </p>
      </div>
    );
  }
  return null;
};

const SimpleTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl border border-slate-700">
        <p className="font-bold mb-1 border-b border-slate-700 pb-1">{label}</p>
        <p className="text-blue-300">
          <span className="font-medium">개설 강좌 수:</span> {payload[0].value}개
        </p>
      </div>
    );
  }
  return null;
};

export default function Home() {
  // Selection state
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  // Pagination state for the grid
  const [currentPage, setCurrentPage] = useState(1);

  // Data states
  const [rawCourses, setRawCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Fetch all courses on mount from local server API
  useEffect(() => {
    const fetchAllCourses = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/courses");
        const json = await res.json();
        if (json.courses) {
          setRawCourses(json.courses);
        } else {
          console.error("Error from courses API:", json.error);
        }
      } catch (err) {
        console.error("Failed to fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllCourses();
  }, []);

  // Filter courses based on selections
  const filteredCourses = rawCourses.filter((course) => {
    // 1. Search matching
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const courseName = (course["교과목명"] || "").toLowerCase();
      const profName = (course["담당교수"] || "").toLowerCase();
      if (!courseName.includes(term) && !profName.includes(term)) {
        return false;
      }
    }

    // 2. College matching
    if (!selectedCollege) return true;

    const collegeMap = COLLEGE_MAPPING.find((c) => c.name === selectedCollege);
    if (!collegeMap) return true;

    // Match college
    const matchesCollege = course["대학(원)"]?.trim() === collegeMap.dbName;
    if (!matchesCollege) return false;

    // Match department if selected
    if (selectedDept) {
      const deptMap = collegeMap.departments.find((d) => d.name === selectedDept);
      if (!deptMap) return false;
      return course["학과(부)"]?.trim() === deptMap.dbName;
    }

    return true;
  });

  // Calculate KPI metrics
  const totalCourses = filteredCourses.length;

  const totalStudents = filteredCourses.reduce((sum, course) => {
    const val = parseInt(course["수강"], 10) || 0;
    return sum + val;
  }, 0);

  // Average Enrollment Rate
  let totalRate = 0;
  let validCoursesForRate = 0;
  filteredCourses.forEach((course) => {
    const sugang = parseInt(course["수강"], 10) || 0;
    const jungwon = parseInt(course["정원"], 10) || 0;
    if (jungwon > 0) {
      totalRate += (sugang / jungwon) * 100;
      validCoursesForRate++;
    }
  });
  const avgEnrollmentRate = validCoursesForRate > 0 ? totalRate / validCoursesForRate : 0;

  // English Lecture Ratio (원어강의 === 'Y')
  const englishLectures = filteredCourses.filter((course) => course["원어강의"] === "Y").length;
  const englishRatio = totalCourses > 0 ? (englishLectures / totalCourses) * 100 : 0;

  // AI Analysis Trigger
  const analyzeCourses = async () => {
    if (filteredCourses.length === 0) return;
    setAiLoading(true);
    setShowAiModal(true);
    setAiResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          college: selectedCollege,
          department: selectedDept,
          courses: filteredCourses
        })
      });
      const data = await res.json();
      if (data.analysis) {
        setAiResult(data.analysis);
      } else {
        setAiResult("분석 중 오류가 발생했습니다: " + (data.error || "알 수 없는 오류"));
      }
    } catch (err: any) {
      setAiResult("요청 실패: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (!aiResult) return;
    const blob = new Blob([aiResult], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileName = `${dashboardTitle}_AI분석보고서.md`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --------------------------------------------------------
  // Chart Data Calculation: 이수구분별 분석
  // --------------------------------------------------------
  const categoryMap = new Map<string, { count: number; totalStudents: number }>();

  filteredCourses.forEach((course) => {
    // Treat empty or missing category as '미분류'
    const category = course["이수구분"]?.trim() || "미분류";
    const students = parseInt(course["수강"], 10) || 0;

    if (!categoryMap.has(category)) {
      categoryMap.set(category, { count: 0, totalStudents: 0 });
    }
    const current = categoryMap.get(category)!;
    current.count += 1;
    current.totalStudents += students;
  });

  const chartData = Array.from(categoryMap.entries()).map(([name, data]) => {
    return {
      name,
      count: data.count,
      avgStudents: data.count > 0 ? parseFloat((data.totalStudents / data.count).toFixed(1)) : 0,
    };
  }).sort((a, b) => b.count - a.count); // Sort by count descending

  const avgChartData = [...chartData].sort((a, b) => b.avgStudents - a.avgStudents);

  // --------------------------------------------------------
  // Additional Chart Data: 수업방법, 학점, 요일, 교시
  // --------------------------------------------------------
  const methodMap = new Map<string, number>();
  const creditMap = new Map<string, number>();
  
  const daysList = ["월", "화", "수", "목", "금", "토"];
  const dayCounts: Record<string, number> = { "월": 0, "화": 0, "수": 0, "목": 0, "금": 0, "토": 0 };
  const periodCounts: Record<string, number> = {};

  filteredCourses.forEach((course) => {
    // 1. 수업방법
    const method = course["수업방법"]?.trim() || "기타/미기재";
    methodMap.set(method, (methodMap.get(method) || 0) + 1);

    // 2. 학점
    const credit = course["학점"]?.trim() || "미기재";
    const creditLabel = credit + "학점";
    creditMap.set(creditLabel, (creditMap.get(creditLabel) || 0) + 1);

    // 3. 요일 & 4. 교시
    const timeStr = course["시간표(교시)"] || "";
    
    // Day extraction
    const foundDays = new Set<string>();
    daysList.forEach(d => {
      // Look for format like 월( or space 월 or :월 or 월,
      if (timeStr.includes(d + "(") || timeStr.includes(" " + d) || timeStr.includes(":" + d) || timeStr.includes(d + ",")) {
        foundDays.add(d);
      }
    });
    // fallback check
    if (foundDays.size === 0) {
      daysList.forEach(d => {
        if (timeStr.includes(d)) foundDays.add(d);
      });
    }
    foundDays.forEach(d => {
      dayCounts[d]++;
    });

    // Period extraction
    const parens = timeStr.match(/\([^)]+\)/g);
    if (parens) {
      const foundPeriods = new Set<string>();
      parens.forEach((paren: string) => {
        if (paren.includes(":")) return; // skip real time (e.g. 18:00~19:15)
        
        // Find single digits or 야1, 야2
        const pMatches = paren.match(/(야?\d)/g);
        if (pMatches) {
          pMatches.forEach((p: string) => foundPeriods.add(p));
        }
      });
      foundPeriods.forEach(p => {
        periodCounts[p] = (periodCounts[p] || 0) + 1;
      });
    }
  });

  const methodData = Array.from(methodMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const creditData = Array.from(creditMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => parseInt(b.name) - parseInt(a.name)); // sort by number

  const dayData = daysList.map(day => ({ name: day, count: dayCounts[day] }));

  const periodData = Object.keys(periodCounts)
    .map(period => ({ name: period + "교시", count: periodCounts[period], raw: period }))
    .sort((a, b) => {
      const isA_Ya = a.raw.startsWith('야');
      const isB_Ya = b.raw.startsWith('야');
      if (isA_Ya && !isB_Ya) return 1;
      if (!isA_Ya && isB_Ya) return -1;
      const numA = parseInt(a.raw.replace('야', '')) || 0;
      const numB = parseInt(b.raw.replace('야', '')) || 0;
      return numA - numB;
    });

  // --------------------------------------------------------
  // Table Data: 요약 및 상세 (Pagination)
  // --------------------------------------------------------
  const summaryMap = new Map<string, { count: number; totalStudents: number }>();
  filteredCourses.forEach((course) => {
    let key = "기타";
    if (!selectedCollege) {
      key = course["대학(원)"]?.trim() || "기타";
    } else if (!selectedDept) {
      key = course["학과(부)"]?.trim() || "기타";
    } else {
      key = course["이수구분"]?.trim() || "기타";
    }

    const students = parseInt(course["수강"], 10) || 0;
    if (!summaryMap.has(key)) {
      summaryMap.set(key, { count: 0, totalStudents: 0 });
    }
    const current = summaryMap.get(key)!;
    current.count += 1;
    current.totalStudents += students;
  });

  const summaryData = Array.from(summaryMap.entries()).map(([name, data]) => ({
    name,
    count: data.count,
    avgStudents: data.count > 0 ? (data.totalStudents / data.count).toFixed(1) : "0.0",
  })).sort((a, b) => b.count - a.count);

  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const currentTableData = filteredCourses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Helper to handle college click
  const handleCollegeClick = (collegeName: string | null) => {
    if (selectedCollege === collegeName && collegeName !== null) {
      setSelectedCollege(null);
      setSelectedDept(null);
    } else {
      setSelectedCollege(collegeName);
      setSelectedDept(null);
    }
    setCurrentPage(1);
  };

  // Helper to handle department click
  const handleDeptClick = (collegeName: string, deptName: string) => {
    setSelectedCollege(collegeName);
    setSelectedDept(deptName);
    setCurrentPage(1);
  };

  // Format title for the dashboard
  const dashboardTitle = selectedDept ? selectedDept : selectedCollege ? selectedCollege : "전체 교과목";

  return (
    <div className="flex h-screen bg-[#f3f4f6] text-slate-800 font-sans antialiased overflow-hidden">
      {/* LEFT SIDEBAR */}
      <aside className="w-[280px] bg-[#f8fafc] flex flex-col h-full border-r border-slate-200 z-10 shrink-0">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-600/20">
            INU
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 text-sm tracking-tight leading-tight">INU 2026-1</h1>
            <p className="text-[10px] text-slate-500 font-semibold">전체 교과목 대시보드</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          
          <div className="space-y-1">
            <button
              onClick={() => handleCollegeClick(null)}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-[14px] font-bold transition-all duration-150 ${
                selectedCollege === null
                  ? "bg-slate-800 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-200/50"
              }`}
            >
              <span>전체 대시보드</span>
            </button>
          </div>

          <div className="space-y-2">
            <div className="px-2 mb-3 border-b border-slate-200/60 pb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">대학 / 학부</span>
            </div>

            <div className="space-y-1">
              {COLLEGE_MAPPING.map((college) => {
                const isExpanded = selectedCollege === college.name;

                return (
                  <div key={college.name} className="flex flex-col">
                    {/* College Accordion Header */}
                    <button
                      onClick={() => handleCollegeClick(college.name)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-bold transition-all duration-200 ${
                        isExpanded
                          ? "bg-[#eeebf8] text-indigo-700"
                          : "text-slate-700 hover:bg-slate-200/50"
                      }`}
                    >
                      <span className="truncate">{college.name}</span>
                      
                      {/* Chevron Arrow */}
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180 text-indigo-500" : "text-slate-400"}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Departments list (Collapsible) */}
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[800px] opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
                      <div className="py-2 flex flex-col gap-0.5 pl-4 pr-2">
                        {college.departments.map((dept) => {
                          const isDeptSelected = selectedDept === dept.name;

                          return (
                            <button
                              key={dept.name}
                              onClick={() => handleDeptClick(college.name, dept.name)}
                              className={`w-full text-left px-4 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-150 truncate ${
                                isDeptSelected
                                  ? "text-indigo-700 bg-white shadow-sm border border-slate-100 font-bold"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
                              }`}
                            >
                              {dept.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#eff1f5]">
        {/* TOP BREADCRUMB HEADER */}
        <header className="h-14 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm z-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span
              className="flex items-center gap-1 text-slate-400 font-medium hover:text-slate-600 transition-colors cursor-pointer"
              onClick={() => handleCollegeClick(null)}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              홈
            </span>
            <span className="text-slate-300 font-light">/</span>
            {selectedCollege ? (
              <>
                <span
                  className={`font-medium cursor-pointer hover:text-slate-700 transition-colors ${!selectedDept ? "text-slate-900 font-semibold" : ""}`}
                  onClick={() => handleCollegeClick(selectedCollege)}
                >
                  {selectedCollege}
                </span>
                {selectedDept && (
                  <>
                    <span className="text-slate-300 font-light">/</span>
                    <span className="text-slate-900 font-bold">{selectedDept}</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-slate-900 font-bold">전체 대시보드</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              Live
            </span>
          </div>
        </header>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          
          {/* Dashboard Title Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{dashboardTitle} 대시보드</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">전체 | {totalCourses.toLocaleString()}개 강좌</p>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* SEARCH BAR */}
              <div className="relative flex-1 md:w-64 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-indigo-500 text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="강좌명 또는 담당교수 검색..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all shadow-sm hover:shadow-md text-slate-700 placeholder:text-slate-400"
                />
              </div>

              {/* AI Button */}
              <button 
                onClick={analyzeCourses}
                disabled={aiLoading || totalCourses === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shrink-0"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4 text-indigo-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                AI 강의 분석
              </button>
            </div>
          </div>

          {/* AI Analysis Modal */}
          {showAiModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-inner">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg tracking-tight">AI 강의 분석 보고서</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Powered by Gemini 3.1 Flash-Lite</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAiModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  {aiLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium animate-pulse text-sm">
                        선택된 {dashboardTitle}의 데이터를 AI가 분석하고 있습니다...
                      </p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({node, ...props}) => <h1 className="text-xl font-extrabold text-slate-800 mt-6 mb-3 border-b pb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-lg font-bold text-slate-800 mt-5 mb-2 border-b pb-1" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-base font-bold text-slate-800 mt-4 mb-2" {...props} />,
                          p: ({node, ...props}) => <p className="text-[13px] text-slate-600 leading-relaxed mb-3" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 text-[13px] text-slate-600 space-y-1.5 marker:text-indigo-400" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 text-[13px] text-slate-600 space-y-1.5 marker:text-indigo-400" {...props} />,
                          li: ({node, ...props}) => <li {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-slate-800 bg-indigo-50 px-1 rounded" {...props} />,
                          a: ({node, ...props}) => <a className="text-indigo-600 hover:underline" {...props} />,
                          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-200 pl-4 italic text-slate-500 my-4 bg-slate-50 py-2 rounded-r" {...props} />
                        }}
                      >
                        {aiResult || ""}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                  <button 
                    onClick={handleDownloadResult}
                    disabled={!aiResult || aiLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    분석 결과 다운로드 (.md)
                  </button>
                  <button 
                    onClick={() => setShowAiModal(false)}
                    className="px-5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* KPI CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              // Loading Skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm animate-pulse flex flex-col justify-between h-[104px]">
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-6 bg-slate-200 rounded w-1/3 mt-3"></div>
                </div>
              ))
            ) : (
              <>
                {/* 1. 총 강좌 수 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between h-[104px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-semibold text-slate-500 mb-1">총 강좌 수</span>
                    <span className="text-[26px] leading-none font-extrabold text-slate-800">
                      {totalCourses.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>

                {/* 2. 총 수강인원 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between h-[104px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-semibold text-slate-500 mb-1">총 수강인원</span>
                    <span className="text-[26px] leading-none font-extrabold text-slate-800">
                      {totalStudents.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>

                {/* 3. 평균 수강률 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between h-[104px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-semibold text-slate-500 mb-1">평균 수강률</span>
                    <span className="text-[26px] leading-none font-extrabold text-slate-800">
                      {avgEnrollmentRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                    </svg>
                  </div>
                </div>

                {/* 4. 원어 강의 비율 */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between h-[104px] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="flex flex-col justify-center">
                    <span className="text-xs font-semibold text-slate-500 mb-1">원어강의 비율</span>
                    <span className="text-[26px] leading-none font-extrabold text-slate-800">
                      {englishRatio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SVG DEFINITIONS FOR GRADIENTS */}
          <svg style={{ height: 0, width: 0, position: 'absolute' }}>
            <defs>
              <linearGradient id="yellowGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>

          {/* ANALYSIS CHART AREA (이수구분별 분석) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* 1. 이수구분별 강좌 수 */}
            <div className="bg-[#f8fafc] p-7 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[340px]">
              <div className="mb-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <h3 className="text-[15px] font-extrabold text-slate-800">이수구분별 강좌 수</h3>
              </div>
              <div className="flex-1 w-full min-h-[250px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={80} />
                      <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="count" name="강좌 수" radius={[0, 10, 10, 0]} barSize={12}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#yellowGrad)' : 'url(#purpleGrad)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
                )}
              </div>
            </div>

            {/* 2. 이수구분별 평균 수강인원 */}
            <div className="bg-[#f8fafc] p-7 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[340px]">
              <div className="mb-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <h3 className="text-[15px] font-extrabold text-slate-800">이수구분별 평균 수강인원</h3>
              </div>
              <div className="flex-1 w-full min-h-[250px]">
                {avgChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart layout="vertical" data={avgChartData} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} width={80} />
                      <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'transparent' }} />
                      <Bar dataKey="avgStudents" name="평균 수강인원" radius={[0, 10, 10, 0]} barSize={12}>
                        {avgChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#yellowGrad)' : 'url(#purpleGrad)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
                )}
              </div>
            </div>

          </div>

          {/* 4 ADDITIONAL CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* 1. 수업방법 유형 분포 (도넛 차트) */}
            <div className="bg-[#f8fafc] p-7 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[340px]">
              <div className="mb-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <h3 className="text-[15px] font-extrabold text-slate-800">수업방법 유형 분포</h3>
              </div>
              <div className="flex-1 w-full flex items-center">
                {methodData.length > 0 ? (
                  <>
                    <div className="relative w-1/2 h-[220px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={methodData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {methodData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">TOTAL</span>
                        <span className="text-xl font-extrabold text-slate-800 leading-none">{totalCourses.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-1/2 pl-6 flex flex-col gap-3.5 justify-center">
                      {methodData.slice(0, 5).map((entry, index) => {
                        const pct = totalCourses > 0 ? ((entry.value / totalCourses) * 100).toFixed(1) : "0.0";
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                              <span className="text-slate-600 font-bold truncate text-[13px]">{entry.name}</span>
                            </div>
                            <span className="font-extrabold text-slate-800 text-[13px] shrink-0">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
                )}
              </div>
            </div>

            {/* 2. 학점 구성 비율 (도넛 차트) */}
            <div className="bg-[#f8fafc] p-7 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[340px]">
              <div className="mb-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <h3 className="text-[15px] font-extrabold text-slate-800">학점 구성 비율</h3>
              </div>
              <div className="flex-1 w-full flex items-center">
                {creditData.length > 0 ? (
                  <>
                    <div className="relative w-1/2 h-[220px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={creditData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {creditData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<PieTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider mb-0.5">COURSES</span>
                        <span className="text-xl font-extrabold text-slate-800 leading-none">{totalCourses.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-1/2 pl-6 flex flex-col gap-3.5 justify-center">
                      {creditData.slice(0, 5).map((entry, index) => {
                        const pct = totalCourses > 0 ? ((entry.value / totalCourses) * 100).toFixed(1) : "0.0";
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2.5 truncate pr-2">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></div>
                              <span className="text-slate-600 font-bold truncate text-[13px]">{entry.name}</span>
                            </div>
                            <span className="font-extrabold text-slate-800 text-[13px] shrink-0">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
                )}
              </div>
            </div>

            {/* 3. 요일별 수업 강좌 수 (막대 그래프) */}
            <div className="bg-[#f8fafc] p-7 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[340px]">
              <div className="mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <h3 className="text-[15px] font-extrabold text-slate-800">요일별 개설 강좌 수</h3>
              </div>
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip content={<SimpleTooltip />} cursor={{ fill: '#f1f5f9' }} />
                    <Bar dataKey="count" name="개설 강좌 수" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 4. 수업 시간별 강좌 수 (선 그래프) */}
            <div className="bg-[#f8fafc] p-7 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[340px]">
              <div className="mb-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <h3 className="text-[15px] font-extrabold text-slate-800">수업 시간(교시)별 개설 강좌 수</h3>
              </div>
              <div className="flex-1 w-full min-h-[220px]">
                {periodData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={periodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip content={<SimpleTooltip />} />
                      <Line type="monotone" dataKey="count" name="개설 강좌 수" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#ec4899', strokeWidth: 0 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm">데이터가 없습니다.</div>
                )}
              </div>
            </div>

          </div>

          {/* TABLES SECTION */}
          <div className="flex flex-col gap-6 mt-6 pb-6">
            
            {/* 1. 소속별 분석 요약 테이블 */}
            <div className="w-full bg-[#f8fafc] p-7 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[400px]">
              <div className="mb-6 flex items-center gap-2 shrink-0">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <h3 className="text-[15px] font-extrabold text-slate-800">
                  {!selectedCollege ? "대학(원)별 요약" : !selectedDept ? "소속 학과별 요약" : "이수구분별 요약"}
                </h3>
              </div>
              <div className="flex-1 w-full overflow-hidden flex flex-col">
                <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 h-full max-h-[450px]">
                  <table className="w-full text-left border-collapse relative">
                    <thead className="sticky top-0 bg-[#f8fafc] z-10">
                      <tr className="border-b-2 border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                        <th className="pb-3 font-bold">소속/분류</th>
                        <th className="pb-3 font-bold text-right">강좌 수</th>
                        <th className="pb-3 font-bold text-right">평균 수강</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {summaryData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 text-[13px] font-semibold text-slate-700">
                            <span className="inline-block w-5 h-5 text-center leading-5 bg-slate-100 rounded text-[10px] text-slate-500 mr-3">{i + 1}</span>
                            {row.name}
                          </td>
                          <td className="py-3 text-[13px] text-slate-600 text-right">{row.count.toLocaleString()}개</td>
                          <td className="py-3 text-[13px] text-slate-600 text-right font-bold">{row.avgStudents}명</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 2. 상세 강좌 정보 테이블 */}
            <div className="w-full bg-[#f8fafc] p-7 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[400px]">
              <div className="mb-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                  <h3 className="text-[15px] font-extrabold text-slate-800">상세 강좌 리스트</h3>
                </div>
                <div className="text-xs font-bold text-slate-400">
                  Total {filteredCourses.length.toLocaleString()}
                </div>
              </div>
              
              <div className="flex-1 w-full overflow-x-auto min-h-[450px]">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-100/50">
                    <tr className="border-b border-slate-200 text-[12px] text-slate-500">
                      <th className="px-4 py-3 font-bold rounded-tl-lg">학수번호</th>
                      <th className="px-4 py-3 font-bold">강좌명</th>
                      <th className="px-4 py-3 font-bold">담당교수</th>
                      <th className="px-4 py-3 font-bold">이수구분</th>
                      <th className="px-4 py-3 font-bold text-center">학점</th>
                      <th className="px-4 py-3 font-bold">시간(교시)</th>
                      <th className="px-4 py-3 font-bold text-right rounded-tr-lg">수강인원</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentTableData.length > 0 ? (
                      currentTableData.map((course, i) => (
                        <tr key={i} className="hover:bg-white transition-colors group">
                          <td className="px-4 py-3 text-[13px] font-medium text-slate-500">{course["학수번호"]}</td>
                          <td className="px-4 py-3 text-[13px] font-bold text-slate-800 truncate max-w-[180px] lg:max-w-[250px] group-hover:text-blue-600 transition-colors" title={course["교과목명"]}>
                            {course["교과목명"]}
                          </td>
                          <td className="px-4 py-3 text-[13px] font-medium text-slate-600">{course["담당교수"] || "-"}</td>
                          <td className="px-4 py-3 text-[13px] text-slate-500">
                            <span className="bg-slate-100 px-2 py-1 rounded text-[11px] font-semibold">{course["이수구분"]}</span>
                          </td>
                          <td className="px-4 py-3 text-[13px] text-slate-600 text-center font-semibold">{course["학점"]}</td>
                          <td className="px-4 py-3 text-[12px] text-slate-500 truncate max-w-[150px] lg:max-w-[200px]" title={course["시간표(교시)"]}>
                            {course["시간표(교시)"]}
                          </td>
                          <td className="px-4 py-3 text-[13px] font-bold text-slate-700 text-right">{course["수강"]}명</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">조회된 강좌가 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 shrink-0">
                  <div className="text-xs font-semibold text-slate-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      이전
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER SECTION */}
          <footer className="mt-8 border-t border-slate-200/80 pt-6 pb-2 flex flex-col md:flex-row items-center justify-between gap-4 text-sm shrink-0">
            <div className="font-medium text-slate-400">
              © 2026 INU Courses Dashboard. Created by <span className="font-bold text-slate-600">박주영</span>.
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-5 text-slate-500 font-semibold">
              <a href="https://www.inu.ac.kr" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
                인천대학교 홈페이지
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a href="https://portal.inu.ac.kr" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
                INU 포털
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
              <a href="https://cyber.inu.ac.kr" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 flex items-center gap-1 transition-colors">
                이러닝
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </footer>

        </main>
      </div>
    </div>
  );
}
