"use client";
import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/AdminHeader';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ReportsPage() {
  const [filter, setFilter] = useState('This Month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Track which specific report is downloading
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  
  const [data, setData] = useState({
      totalSales: 0,
      totalOrderCount: 0,
      totalUsers: 0,
      statusCounts: { Delivered: 0, Active: 0, Cancelled: 0 },
      trendData: [] as { label: string, value: number }[]
  });

  useEffect(() => {
      const fetchReportData = async () => {
          setLoading(true);
          try {
              let url = `/api/admin/reports?filter=${filter}`;
              if (filter === 'Custom Range') {
                  if (startDate) url += `&startDate=${startDate}`;
                  if (endDate) url += `&endDate=${endDate}`;
              }

              const res = await fetch(url);
              if (res.ok) {
                  setData(await res.json());
              }
          } catch (error) {
              console.error("Failed to load reports", error);
          } finally {
              setLoading(false);
          }
      };

      if (filter !== 'Custom Range' || (filter === 'Custom Range' && startDate && endDate)) {
          fetchReportData();
      }
  }, [filter, startDate, endDate]);

  // --- SPECIFIC PDF GENERATION LOGIC ---
  const downloadSpecificReport = async (elementId: string, reportName: string) => {
      const element = document.getElementById(elementId);
      if (!element) return;

      setDownloadingReport(elementId);

      try {
          // Take the screenshot of the specific card
          const canvas = await html2canvas(element, {
              scale: 2,
              backgroundColor: '#FDF9FB', // Use a solid color, avoid transparent backgrounds
              logging: false,
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const margin = 10;
          const printWidth = pdfWidth - (margin * 2);
          const printHeight = (canvas.height * printWidth) / canvas.width;
          
          // Add the title to the PDF
          pdf.setFontSize(16);
          pdf.text(`Norma Beauti - ${reportName.replace('_', ' ')}`, margin, margin + 5);
          pdf.setFontSize(10);
          pdf.text(`Date Range: ${filter}`, margin, margin + 12);
          
          // Add the chart image below the title
          pdf.addImage(imgData, 'PNG', margin, margin + 20, printWidth, printHeight);
          pdf.save(`NormaBeauti_${reportName}_${filter.replace(' ', '_')}.pdf`);
          
      } catch (error) {
          console.error("PDF Error:", error);
          alert("Failed to generate PDF. Please try again.");
      } finally {
          setDownloadingReport(null);
      }
  };

  // Calculations for dynamic charts
  const maxSales = data.trendData.length > 0 ? Math.max(...data.trendData.map(d => d.value)) : 0;
  const totalChartOrders = data.statusCounts.Delivered + data.statusCounts.Active + data.statusCounts.Cancelled;
  const delPct = totalChartOrders > 0 ? Math.round((data.statusCounts.Delivered / totalChartOrders) * 100) : 0;
  const actPct = totalChartOrders > 0 ? Math.round((data.statusCounts.Active / totalChartOrders) * 100) : 0;
  const canPct = totalChartOrders > 0 ? Math.round((data.statusCounts.Cancelled / totalChartOrders) * 100) : 0;

  const donutGradient = `conic-gradient(
      #10B981 0% ${delPct}%, 
      #F59E0B ${delPct}% ${delPct + actPct}%, 
      #EF4444 ${delPct + actPct}% 100%
  )`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46] pb-20">
      <AdminHeader />

      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 mt-4">

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-bold font-serif text-[#4A1D46]">Reports & Analytics</h1>
                <p className="text-sm text-[#7B2C62] mt-1">Download specific performance data securely.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
                {filter === 'Custom Range' && (
                    <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-white">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[#4A1D46] text-xs font-bold outline-none" />
                        <span className="text-[#7B2C62] text-xs font-bold">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[#4A1D46] text-xs font-bold outline-none" />
                    </div>
                )}

                <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-full shadow-sm border border-white">
                    <span className="text-xs font-bold text-[#7B2C62] uppercase">Range:</span>
                    <select 
                        value={filter} 
                        onChange={(e) => {
                            setFilter(e.target.value);
                            if (e.target.value !== 'Custom Range') {
                                setStartDate('');
                                setEndDate('');
                            }
                        }}
                        className="bg-transparent text-[#4A1D46] font-bold outline-none cursor-pointer text-sm"
                    >
                        <option>Today</option>
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>Last 3 Months</option>
                        <option>This Year</option>
                        <option>Custom Range</option>
                    </select>
                </div>
            </div>
        </div>

        {/* --- KPI SUMMARY REPORT --- */}
        <div id="report-kpi" className="bg-[#FDF9FB] p-6 rounded-[2rem] border border-[#EACDE0] mb-8 shadow-sm relative">
            <div className="flex justify-between items-start mb-6">
                <h3 className="font-bold text-xl text-[#4A1D46]">Executive Summary</h3>
                <button 
                    onClick={() => downloadSpecificReport('report-kpi', 'KPI_Summary')} 
                    disabled={downloadingReport === 'report-kpi'}
                    className="text-xs font-bold text-[#880e4f] bg-[#FCE4EC] px-4 py-1.5 rounded-full hover:bg-[#F8BBD0] transition border border-[#F8BBD0]"
                >
                    {downloadingReport === 'report-kpi' ? '⏳...' : '📄 PDF'}
                </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#10B981] flex items-center justify-center text-white text-2xl">💰</div>
                    <div>
                        <p className="text-xs font-bold text-[#9E668B] uppercase tracking-wider">Total Revenue</p>
                        <p className="text-2xl font-bold text-[#4A1D46]">LKR {data.totalSales.toLocaleString()}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#3B82F6] flex items-center justify-center text-white text-2xl">📦</div>
                    <div>
                        <p className="text-xs font-bold text-[#9E668B] uppercase tracking-wider">Total Orders</p>
                        <p className="text-2xl font-bold text-[#4A1D46]">{data.totalOrderCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#9B5DE5] flex items-center justify-center text-white text-2xl">👥</div>
                    <div>
                        <p className="text-xs font-bold text-[#9E668B] uppercase tracking-wider">Registered Users</p>
                        <p className="text-2xl font-bold text-[#4A1D46]">{data.totalUsers}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* --- REVENUE TREND REPORT --- */}
            <div id="report-revenue" className="bg-[#FDF9FB] p-8 rounded-[2.5rem] border border-[#EACDE0] flex flex-col justify-between shadow-sm relative">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="font-bold text-xl mb-1 text-[#4A1D46]">Revenue Trend</h3>
                        <p className="text-xs text-[#9E668B]">Sales generated over {filter.toLowerCase()}.</p>
                    </div>
                    <button 
                        onClick={() => downloadSpecificReport('report-revenue', 'Revenue_Trend')} 
                        disabled={downloadingReport === 'report-revenue'}
                        className="text-xs font-bold text-[#880e4f] bg-[#FCE4EC] px-4 py-1.5 rounded-full hover:bg-[#F8BBD0] transition border border-[#F8BBD0]"
                    >
                        {downloadingReport === 'report-revenue' ? '⏳...' : '📄 PDF'}
                    </button>
                </div>
                
                {loading ? (
                    <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9B5DE5]"></div></div>
                ) : data.trendData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm italic border-b border-[#EACDE0]">No sales data for this period.</div>
                ) : (
                    <>
                        <div className="h-56 flex items-end gap-2 sm:gap-6 justify-around px-2 sm:px-6 pb-4 border-b border-[#EACDE0]">
                            {data.trendData.map((point, index) => {
                                const heightPct = maxSales > 0 ? (point.value / maxSales) * 100 : 0;
                                return (
                                    <div key={index} className="w-8 sm:w-12 bg-[#9B5DE5] rounded-t-xl transition-all relative group" style={{ height: `${Math.max(heightPct, 5)}%` }}>
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#4A1D46] text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                            LKR {point.value.toLocaleString()}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-around mt-4 text-[10px] sm:text-xs font-bold text-[#9E668B] px-2 sm:px-6">
                            {data.trendData.map((point, index) => (
                                <span key={index} className="text-center w-8 sm:w-12 truncate">{point.label}</span>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* --- ORDER STATUS REPORT --- */}
            <div id="report-status" className="bg-[#FDF9FB] p-8 rounded-[2.5rem] border border-[#EACDE0] shadow-sm relative">
                 <div className="flex justify-between items-start mb-6">
                     <div>
                         <h3 className="font-bold text-xl mb-1 text-[#4A1D46]">Fulfillment Status</h3>
                         <p className="text-xs text-[#9E668B]">Breakdown of order statuses.</p>
                     </div>
                     <button 
                        onClick={() => downloadSpecificReport('report-status', 'Fulfillment_Status')} 
                        disabled={downloadingReport === 'report-status'}
                        className="text-xs font-bold text-[#880e4f] bg-[#FCE4EC] px-4 py-1.5 rounded-full hover:bg-[#F8BBD0] transition border border-[#F8BBD0]"
                    >
                        {downloadingReport === 'report-status' ? '⏳...' : '📄 PDF'}
                    </button>
                 </div>
                 
                 {loading ? (
                    <div className="h-56 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9B5DE5]"></div></div>
                 ) : totalChartOrders === 0 ? (
                    <div className="h-56 flex items-center justify-center text-gray-400 text-sm italic">No orders to display.</div>
                 ) : (
                     <>
                         <div className="flex items-center justify-center h-56 relative">
                            <div 
                                className="w-40 h-40 rounded-full flex items-center justify-center transition-all duration-1000"
                                style={{ background: donutGradient }}
                            >
                                <div className="w-28 h-28 bg-[#FDF9FB] rounded-full flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="block text-2xl font-bold text-[#4A1D46]">{totalChartOrders}</span>
                                        <span className="text-[10px] font-bold text-[#9E668B] uppercase tracking-wider">Orders</span>
                                    </div>
                                </div>
                            </div>
                         </div>
                         <div className="flex flex-wrap justify-center gap-4 mt-6 text-sm font-bold">
                            <div className="flex items-center gap-2 bg-[#F5E6EE] px-3 py-1 rounded-full">
                                <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                                <span className="text-[#4A1D46] text-xs">Delivered ({delPct}%)</span>
                            </div>
                            <div className="flex items-center gap-2 bg-[#F5E6EE] px-3 py-1 rounded-full">
                                <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                                <span className="text-[#4A1D46] text-xs">Active ({actPct}%)</span>
                            </div>
                            <div className="flex items-center gap-2 bg-[#F5E6EE] px-3 py-1 rounded-full">
                                <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
                                <span className="text-[#4A1D46] text-xs">Cancelled ({canPct}%)</span>
                            </div>
                         </div>
                     </>
                 )}
            </div>

            {/* --- USER DEMOGRAPHICS REPORT --- */}
            <div id="report-demographics" className="bg-[#FDF9FB] p-8 rounded-[2.5rem] border border-[#EACDE0] shadow-sm relative md:col-span-2 max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-start mb-6">
                     <h3 className="font-bold text-xl text-[#4A1D46]">User Demographics</h3>
                     <button 
                        onClick={() => downloadSpecificReport('report-demographics', 'User_Demographics')} 
                        disabled={downloadingReport === 'report-demographics'}
                        className="text-xs font-bold text-[#880e4f] bg-[#FCE4EC] px-4 py-1.5 rounded-full hover:bg-[#F8BBD0] transition border border-[#F8BBD0]"
                    >
                        {downloadingReport === 'report-demographics' ? '⏳...' : '📄 PDF'}
                    </button>
                 </div>
                 <div className="flex flex-col sm:flex-row items-center justify-around h-56 relative gap-8">
                    <div className="w-40 h-40 rounded-full border-[12px] border-[#9B5DE5] border-t-[#D883B7] border-l-[#D883B7] flex items-center justify-center bg-[#FDF9FB]">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-[#4A1D46]">{data.totalUsers}</span>
                            <span className="text-xs text-[#9E668B]">Users</span>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center gap-4 mt-4 sm:mt-0 text-sm font-bold">
                        <div className="flex items-center gap-3 bg-[#F5E6EE] px-4 py-2 rounded-xl w-48">
                            <span className="w-4 h-4 rounded-full bg-[#D883B7]"></span>
                            <span className="text-[#4A1D46]">Female (70%)</span>
                        </div>
                        <div className="flex items-center gap-3 bg-[#F5E6EE] px-4 py-2 rounded-xl w-48">
                            <span className="w-4 h-4 rounded-full bg-[#9B5DE5]"></span>
                            <span className="text-[#4A1D46]">Male (30%)</span>
                        </div>
                    </div>
                 </div>
            </div>

        </div>
      </div>
    </div>
  );
}