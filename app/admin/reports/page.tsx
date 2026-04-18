"use client";
import React, { useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('All Reports');
  const [filter, setFilter] = useState('This Month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  
  // States for limit functionality
  const [limit, setLimit] = useState('5');
  const [customLimit, setCustomLimit] = useState('');
  
  const [isGenerated, setIsGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  
  const [data, setData] = useState({
      totalSales: 0, totalOrderCount: 0, totalUsers: 0,
      statusCounts: { Delivered: 0, Active: 0, Cancelled: 0 },
      trendData: [] as { label: string, value: number }[],
      topProducts: [] as { id: string, name: string, qtySold: number, revenue: number, type: string }[],
      lowSelling: [] as { id: string, name: string, qtySold: number, revenue: number, type: string }[], 
      fullSalesReport: [] as { id: string, name: string, qtySold: number, revenue: number, type: string }[],
      recentTransactions: [] as { id: string, customer: string, date: string, amount: number, status: string }[] 
  });

  const handleGenerate = async () => {
      if (filter === 'Custom Range' && (!startDate || !endDate)) {
          alert("Please select both start and end dates.");
          return;
      }
      
      setLoading(true);
      setIsGenerated(true);
      
      try {
          const actualLimit = limit === 'custom' ? (customLimit || '5') : limit;
          let url = `/api/admin/reports?filter=${filter}&categoryFilter=${categoryFilter}&limit=${actualLimit}`;
          
          if (filter === 'Custom Range') {
              url += `&startDate=${startDate}&endDate=${endDate}`;
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

  // --- PDF GENERATION FIX FOR 'lab' COLORS ---
  const downloadSpecificReport = async (elementId: string, reportName: string) => {
      const element = document.getElementById(elementId);
      if (!element) return;

      setDownloadingReport(elementId);

      try {
          const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              scrollY: -window.scrollY, 
              backgroundColor: '#FFFFFF',
              logging: false,
              onclone: (clonedDoc) => {
                  const elements = clonedDoc.querySelectorAll('*');
                  elements.forEach((el: any) => {
                      if (el.classList) {
                          el.classList.remove('shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-inner', 'drop-shadow-sm', 'shadow-2xl');
                      }
                      const style = window.getComputedStyle(el);
                      if (style.color && (style.color.includes('lab') || style.color.includes('oklch'))) el.style.color = '#333333';
                      if (style.backgroundColor && (style.backgroundColor.includes('lab') || style.backgroundColor.includes('oklch'))) el.style.backgroundColor = '#ffffff';
                      if (style.borderColor && (style.borderColor.includes('lab') || style.borderColor.includes('oklch'))) el.style.borderColor = '#e2e8f0';
                  });
              }
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const margin = 10;
          const printWidth = pdfWidth - (margin * 2);
          const printHeight = (canvas.height * printWidth) / canvas.width;
          
          pdf.setFontSize(16);
          pdf.text(`Norma Beauti - ${reportName.replace(/_/g, ' ')}`, margin, margin + 5);
          pdf.setFontSize(10);
          pdf.text(`Period: ${filter} | Category: ${categoryFilter}`, margin, margin + 12);
          
          pdf.addImage(imgData, 'PNG', margin, margin + 20, printWidth, printHeight);
          pdf.save(`NormaBeauti_${reportName}_${new Date().getTime()}.pdf`);
      } catch (error) {
          console.error("PDF Error:", error);
          alert("Failed to generate PDF due to a rendering issue.");
      } finally {
          setDownloadingReport(null);
      }
  };

  const maxSales = data.trendData?.length > 0 ? Math.max(...data.trendData.map(d => d.value)) : 0;
  const totalChartOrders = (data.statusCounts?.Delivered || 0) + (data.statusCounts?.Active || 0) + (data.statusCounts?.Cancelled || 0);
  const delPct = totalChartOrders > 0 ? Math.round(((data.statusCounts?.Delivered || 0) / totalChartOrders) * 100) : 0;
  const actPct = totalChartOrders > 0 ? Math.round(((data.statusCounts?.Active || 0) / totalChartOrders) * 100) : 0;
  const canPct = totalChartOrders > 0 ? Math.round(((data.statusCounts?.Cancelled || 0) / totalChartOrders) * 100) : 0;
  
  const displayLimit = limit === 'custom' ? (customLimit || '5') : limit;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
      <AdminHeader />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 py-10">

        {/* --- REPORT CONFIGURATION PANEL --- */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-md border border-slate-200 mb-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70"></div>
            
            <div className="relative z-10 mb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Report Generator</h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">Select your preferences below to generate specific reports.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative z-10 mb-8">
                {/* 1. Report Type */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Report Type</label>
                    <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-700 outline-none focus:border-[#FFAFA8] focus:ring-2 focus:ring-[#FFAFA8] cursor-pointer">
                        <option value="All Reports">All Reports</option>
                        <option value="KPI Summary">KPI Summary</option>
                        <option value="Revenue Trend">Revenue Trend</option>
                        <option value="Fulfillment Status">Fulfillment Status</option>
                        <option value="Top Selling">Top Selling Products</option>
                        <option value="Low Selling">Low Selling Products</option>
                        <option value="Detailed Sales">Detailed Sales Report</option>
                        <option value="Recent Transactions">Recent Transactions</option>
                        <option value="User Demographics">User Demographics</option>
                    </select>
                </div>

                {/* 2. Time Period */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Time Period</label>
                    <select value={filter} onChange={e => { setFilter(e.target.value); if(e.target.value !== 'Custom Range'){ setStartDate(''); setEndDate(''); } }} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-700 outline-none focus:border-[#FFAFA8] focus:ring-2 focus:ring-[#FFAFA8] cursor-pointer">
                        <option>Today</option><option>This Week</option><option>This Month</option><option>Last 3 Months</option><option>This Year</option><option>Custom Range</option>
                    </select>
                </div>

                {/* 3. Category Filter */}
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Category Filter</label>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-700 outline-none focus:border-[#FFAFA8] focus:ring-2 focus:ring-[#FFAFA8] cursor-pointer">
                        <option>All Categories</option>
                        <option>Individual Products</option>
                        <option>Ready Made Gift Boxes</option>
                        <option>Customizable Gift Boxes</option>
                    </select>
                </div>

                {/* 4. Display Limit */}
                <div className={['All Reports', 'Top Selling', 'Low Selling', 'Recent Transactions'].includes(reportType) ? '' : 'opacity-40 pointer-events-none'}>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">List Limit</label>
                    <div className="flex gap-2">
                        <select value={limit} onChange={e => setLimit(e.target.value)} className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm font-bold text-slate-700 outline-none focus:border-[#FFAFA8] focus:ring-2 focus:ring-[#FFAFA8] cursor-pointer w-full">
                            <option value="5">Top 5 Items</option>
                            <option value="10">Top 10 Items</option>
                            <option value="20">Top 20 Items</option>
                            <option value="50">Top 50 Items</option>
                            <option value="custom">Custom...</option>
                        </select>
                        {limit === 'custom' && (
                            <input 
                                type="number" min="1" placeholder="Qty" value={customLimit} 
                                onChange={e => setCustomLimit(e.target.value)} 
                                className="w-20 px-3 py-3 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 outline-none focus:border-[#FFAFA8] focus:ring-2 focus:ring-[#FFAFA8] shadow-sm transition-all" 
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Dates Row */}
            {filter === 'Custom Range' && (
                <div className="flex flex-wrap items-center gap-4 mb-8 relative z-10 bg-slate-50 p-4 rounded-2xl border border-slate-100 inline-flex">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-bold outline-none" />
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">To</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border border-slate-200 px-4 py-2 rounded-full text-sm font-bold outline-none" />
                </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-6 relative z-10">
                <button onClick={handleGenerate} className="bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-10 py-3.5 rounded-full shadow-md font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 tracking-wide">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Generate Report
                </button>
            </div>
        </div>

        {/* --- DISPLAY REPORTS --- */}
        {!isGenerated ? (
            <div className="bg-white/50 border border-slate-200 border-dashed rounded-[3rem] h-64 flex flex-col items-center justify-center text-slate-400">
                <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <p className="font-medium">Configure your report above and click Generate.</p>
            </div>
        ) : loading ? (
            <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div></div>
        ) : (
            <div className="space-y-8 animate-fade-in">
                
                {/* 1. KPI SUMMARY */}
                {(reportType === 'All Reports' || reportType === 'KPI Summary') && (
                    <div id="report-kpi" className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <h3 className="font-bold text-2xl tracking-tight text-slate-900">Executive Summary</h3>
                            <button onClick={() => downloadSpecificReport('report-kpi', 'KPI_Summary')} disabled={downloadingReport === 'report-kpi'} className="text-xs font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors border border-blue-200 shadow-sm flex items-center gap-2">
                                {downloadingReport === 'report-kpi' ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> Gen...</span> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download PDF</>}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex items-center gap-5 shadow-inner">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-500 shrink-0"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p><p className="text-2xl font-bold text-slate-800">LKR {data.totalSales.toLocaleString()}</p></div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex items-center gap-5 shadow-inner">
                                <div className="w-14 h-14 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-500 shrink-0"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Orders</p><p className="text-2xl font-bold text-slate-800">{data.totalOrderCount}</p></div>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 flex items-center gap-5 shadow-inner">
                                <div className="w-14 h-14 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-500 shrink-0"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
                                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registered Users</p><p className="text-2xl font-bold text-slate-800">{data.totalUsers}</p></div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 2. REVENUE TREND */}
                    {(reportType === 'All Reports' || reportType === 'Revenue Trend') && (
                        <div id="report-revenue" className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 flex flex-col justify-between shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div><h3 className="font-bold text-2xl tracking-tight text-slate-900 mb-1">Revenue Trend</h3><p className="text-xs text-slate-500 font-medium">Sales generated over {filter.toLowerCase()}.</p></div>
                                <button onClick={() => downloadSpecificReport('report-revenue', 'Revenue_Trend')} disabled={downloadingReport === 'report-revenue'} className="text-xs font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 hover:text-blue-700 border border-blue-200 flex items-center gap-2 shrink-0">
                                    {downloadingReport === 'report-revenue' ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></span> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> PDF</>}
                                </button>
                            </div>
                            {data.trendData?.length === 0 ? <div className="h-56 flex items-center justify-center text-slate-400 text-sm italic border-b border-slate-100 font-medium">No sales data.</div> : (
                                <div>
                                    <div className="h-56 flex items-end gap-2 sm:gap-6 justify-around px-2 sm:px-6 pb-4 border-b border-slate-100">
                                        {data.trendData?.map((point, index) => {
                                            const heightPct = maxSales > 0 ? (point.value / maxSales) * 100 : 0;
                                            return (
                                                <div key={index} className="w-8 sm:w-12 rounded-t-xl relative group/bar" style={{ height: `${Math.max(heightPct, 5)}%`, backgroundColor: '#ff8a80' }}>
                                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2.5 rounded-md opacity-0 group-hover/bar:opacity-100 whitespace-nowrap">LKR {point.value.toLocaleString()}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                    <div className="flex justify-around mt-4 text-[10px] sm:text-xs font-bold text-slate-400 px-2 sm:px-6">{data.trendData?.map((point, index) => <span key={index} className="text-center w-8 sm:w-12 truncate">{point.label}</span>)}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. ORDER STATUS */}
                    {(reportType === 'All Reports' || reportType === 'Fulfillment Status') && (
                        <div id="report-status" className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div><h3 className="font-bold text-2xl tracking-tight text-slate-900 mb-1">Fulfillment Status</h3><p className="text-xs text-slate-500 font-medium">Breakdown of order statuses.</p></div>
                                <button onClick={() => downloadSpecificReport('report-status', 'Fulfillment_Status')} disabled={downloadingReport === 'report-status'} className="text-xs font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 hover:text-blue-700 border border-blue-200 flex items-center gap-2 shrink-0">
                                    {downloadingReport === 'report-status' ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></span> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> PDF</>}
                                </button>
                            </div>
                            {totalChartOrders === 0 ? <div className="h-56 flex items-center justify-center text-slate-400 text-sm italic font-medium">No orders to display.</div> : (
                                <div>
                                    <div className="flex items-center justify-center h-56 relative">
                                        <div className="relative w-48 h-48 flex items-center justify-center">
                                            <svg width="192" height="192" viewBox="0 0 100 100" className="absolute inset-0 transform -rotate-90">
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10B981" strokeWidth="20" strokeDasharray={`${delPct > 0 ? (delPct / 100) * 251.327 : 0} 251.327`} strokeDashoffset="0" />
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#F59E0B" strokeWidth="20" strokeDasharray={`${actPct > 0 ? (actPct / 100) * 251.327 : 0} 251.327`} strokeDashoffset={`-${(delPct / 100) * 251.327}`} />
                                                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#EF4444" strokeWidth="20" strokeDasharray={`${canPct > 0 ? (canPct / 100) * 251.327 : 0} 251.327`} strokeDashoffset={`-${((delPct + actPct) / 100) * 251.327}`} />
                                            </svg>
                                            <div className="relative z-10 w-36 h-36 bg-white rounded-full flex items-center justify-center border border-slate-100">
                                                <div className="text-center"><span className="block text-3xl font-bold text-slate-800">{totalChartOrders}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">Orders</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm font-bold">
                                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full"><span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span><span className="text-slate-600 text-xs">Delivered ({delPct}%)</span></div>
                                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full"><span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span><span className="text-slate-600 text-xs">Active ({actPct}%)</span></div>
                                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-full"><span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span><span className="text-slate-600 text-xs">Cancelled ({canPct}%)</span></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 4. TOP SELLING */}
                    {(reportType === 'All Reports' || reportType === 'Top Selling') && (
                        <div id="report-top-products" className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div><h3 className="font-bold text-2xl tracking-tight text-slate-900 mb-1">Top {displayLimit} Selling</h3><p className="text-xs text-slate-500 font-medium">Highest revenue generators.</p></div>
                                <button onClick={() => downloadSpecificReport('report-top-products', 'Top_Selling')} disabled={downloadingReport === 'report-top-products'} className="text-xs font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 hover:text-blue-700 border border-blue-200 flex items-center gap-2 shrink-0">
                                    {downloadingReport === 'report-top-products' ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></span> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> PDF</>}
                                </button>
                            </div>
                            {data.topProducts?.length === 0 ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic font-medium">No sales data.</div> : (
                                <div className="flex flex-col gap-4 relative z-10">
                                    {data.topProducts?.map((product, index) => (
                                        <div key={index} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs">{index + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {product.type.includes('Product') ? 'Product' : 'Item'} ID-{product.id} • {product.type} • {product.qtySold} Units
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0"><p className="text-sm font-bold text-[#D94452]">LKR {product.revenue.toLocaleString()}</p></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. LOW SELLING */}
                    {(reportType === 'All Reports' || reportType === 'Low Selling') && (
                        <div id="report-low-selling" className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div><h3 className="font-bold text-2xl tracking-tight text-slate-900 mb-1">Bottom {displayLimit} Selling</h3><p className="text-xs text-slate-500 font-medium">Needs attention.</p></div>
                                <button onClick={() => downloadSpecificReport('report-low-selling', 'Low_Selling')} disabled={downloadingReport === 'report-low-selling'} className="text-xs font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 hover:text-blue-700 border border-blue-200 flex items-center gap-2 shrink-0">
                                    {downloadingReport === 'report-low-selling' ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></span> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> PDF</>}
                                </button>
                            </div>
                            {data.lowSelling?.length === 0 ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic font-medium">No sales data.</div> : (
                                <div className="flex flex-col gap-4 relative z-10">
                                    {data.lowSelling?.map((product, index) => (
                                        <div key={index} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs">{index + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{product.name}</p>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {product.type.includes('Product') ? 'Product' : 'Item'} ID-{product.id} • {product.type} • {product.qtySold} Units
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0"><p className="text-sm font-bold text-amber-500">LKR {product.revenue.toLocaleString()}</p></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 6. DETAILED SALES REPORT */}
                {(reportType === 'All Reports' || reportType === 'Detailed Sales') && (
                    <div id="report-detailed-sales" className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div><h3 className="font-bold text-2xl tracking-tight text-slate-900 mb-1">Detailed Sales Report</h3><p className="text-xs text-slate-500 font-medium">Complete list of items sold in the selected period.</p></div>
                            <button onClick={() => downloadSpecificReport('report-detailed-sales', 'Detailed_Sales_Report')} disabled={downloadingReport === 'report-detailed-sales'} className="text-xs font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 hover:text-blue-700 border border-blue-200 flex items-center gap-2 shrink-0">
                                {downloadingReport === 'report-detailed-sales' ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> Generating...</span> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download PDF</>}
                            </button>
                        </div>
                        {data.fullSalesReport?.length === 0 ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic font-medium">No sales records found.</div> : (
                            <div className="relative z-10 overflow-x-auto border border-slate-100 rounded-2xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Product / Item Name</th>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-center border-b border-slate-200">Type</th>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-center border-b border-slate-200">Qty Sold</th>
                                            <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-widest text-right border-b border-slate-200">Total Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {data.fullSalesReport?.map((item, index) => (
                                            <tr key={index} className="border-b border-slate-100 hover:bg-slate-50/50">
                                                <td className="py-4 px-6 text-sm font-bold text-slate-800">
                                                    {item.name}
                                                    <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                                                        {item.type.includes('Product') ? 'Product' : 'Item'} ID-{item.id}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center"><span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border ${item.type === 'Ready Made Gift Boxes' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : item.type === 'Customizable Gift Boxes' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>{item.type}</span></td>
                                                <td className="py-4 px-6 text-sm font-bold text-slate-600 text-center">{item.qtySold}</td>
                                                <td className="py-4 px-6 text-sm font-bold text-[#D94452] text-right">LKR {item.revenue.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 7. RECENT TRANSACTIONS */}
                    {(reportType === 'All Reports' || reportType === 'Recent Transactions') && (
                        <div id="report-transactions" className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div><h3 className="font-bold text-2xl tracking-tight text-slate-900 mb-1">Recent {displayLimit} Transactions</h3><p className="text-xs text-slate-500 font-medium">Latest order log.</p></div>
                                <button onClick={() => downloadSpecificReport('report-transactions', 'Recent_Transactions')} disabled={downloadingReport === 'report-transactions'} className="text-xs font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 hover:text-blue-700 border border-blue-200 flex items-center gap-2 shrink-0">
                                    {downloadingReport === 'report-transactions' ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></span> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> PDF</>}
                                </button>
                            </div>
                            {data.recentTransactions?.length === 0 ? <div className="h-48 flex items-center justify-center text-slate-400 text-sm italic font-medium">No transactions found.</div> : (
                                <div className="flex flex-col gap-3 relative z-10">
                                    {data.recentTransactions?.map((txn, index) => (
                                        <div key={index} className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{txn.customer}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-slate-400 font-mono">Order ID-{txn.id}</p>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <p className="text-[10px] text-slate-500 font-medium">{txn.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-800">LKR {txn.amount.toLocaleString()}</p>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 block ${txn.status === 'Delivered' ? 'text-emerald-500' : txn.status === 'Cancelled' ? 'text-rose-500' : 'text-amber-500'}`}>{txn.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 8. DEMOGRAPHICS */}
                    {(reportType === 'All Reports' || reportType === 'User Demographics') && (
                        <div id="report-demographics" className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <h3 className="font-bold text-2xl tracking-tight text-slate-900">User Demographics</h3>
                                <button onClick={() => downloadSpecificReport('report-demographics', 'User_Demographics')} disabled={downloadingReport === 'report-demographics'} className="text-xs font-bold text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full hover:bg-blue-100 hover:text-blue-700 border border-blue-200 flex items-center gap-2 shrink-0">
                                    {downloadingReport === 'report-demographics' ? <span className="flex items-center gap-2"><div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></span> : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> PDF</>}
                                </button>
                            </div>
                            <div className="flex flex-col items-center justify-around h-48 relative gap-6 py-2 z-10">
                                <div className="text-center">
                                    <span className="block text-5xl font-bold text-slate-800 tracking-tight">{data.totalUsers}</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 block">Total Active Users</span>
                                </div>
                                <div className="flex justify-center gap-5 text-sm font-bold w-full">
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl w-1/2 justify-center"><span className="w-3 h-3 rounded-full bg-[#FFAFA8]"></span><span className="text-slate-700 text-xs">Female (70%)</span></div>
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-2xl w-1/2 justify-center"><span className="w-3 h-3 rounded-full bg-indigo-200"></span><span className="text-slate-700 text-xs">Male (30%)</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        )}

      </div>
    </div>
  );
}