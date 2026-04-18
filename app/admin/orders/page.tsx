"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

// 1. Separate the main logic into its own component
function OrdersContent() {
  const router = useRouter();
  
  // --- HIGHLIGHT LOGIC ---
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- ADVANCED FILTER STATES ---
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- NEW: Date Range States ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [minDays, setMinDays] = useState('3');
  const [maxDays, setMaxDays] = useState('5');
  const [savingSettings, setSavingSettings] = useState(false);

  // STATUS OPTIONS
  const STATUS_OPTIONS = ["Processing", "Delivered", "Cancelled", "Rejected", "Pending"];

  useEffect(() => {
    fetchOrders();
    fetchDeliverySettings();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        
        // Sort Orders so the newest is always first
        const sortedData = data.sort((a: any, b: any) => 
            new Date(b.orderdate).getTime() - new Date(a.orderdate).getTime()
        );
        
        setOrders(sortedData);
      }
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliverySettings = async () => {
      try {
          const res = await fetch('/api/settings');
          if (res.ok) {
              const data = await res.json();
              setMinDays(data.min_delivery_days?.toString() || '3');
              setMaxDays(data.max_delivery_days?.toString() || '5');
          }
      } catch (error) {
          console.error("Failed to load delivery settings", error);
      }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      
      const min = parseInt(minDays);
      const max = parseInt(maxDays);
      
      if (min >= max) {
          alert("Maximum delivery days must be greater than Minimum delivery days.");
          return;
      }

      setSavingSettings(true);
      try {
          const res = await fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ min_days: min, max_days: max })
          });
          
          if (res.ok) {
              alert("Estimated delivery days updated successfully!");
              setShowSettings(false);
          } else {
              alert("Failed to save settings.");
          }
      } catch (error) {
          console.error("Save settings error:", error);
      } finally {
          setSavingSettings(false);
      }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setOrders(orders.map(o => o.orderid === orderId ? { ...o, status: newStatus } : o));

    try {
        await fetch('/api/admin/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, status: newStatus })
        });
    } catch (error) {
        console.error("Status update failed", error);
        fetchOrders(); // Revert on error
    }
  };

  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    setOrderItems([]); 

    try {
        const res = await fetch(`/api/admin/order-item?orderId=${order.orderid}`);
        if (res.ok) {
            const data = await res.json();
            setOrderItems(data);
        } else {
            console.error("API Error");
        }
    } catch (error) {
        console.error("Failed to load items", error);
    } finally {
        setLoadingItems(false);
    }
  };

  // --- MULTI-LAYER FILTERING LOGIC ---
  const filteredOrders = orders.filter(order => {
      // 1. Status Filter
      if (statusFilter !== 'All' && order.status !== statusFilter) return false;

      // 2. Search Term Filter (ID or Name)
      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchesId = String(order.orderid).toLowerCase().includes(term);
          const matchesName = String(order.shipping_name).toLowerCase().includes(term);
          if (!matchesId && !matchesName) return false;
      }

      // 3. Date Range Filter
      if (startDate || endDate) {
          const orderDateObj = new Date(order.orderdate);
          orderDateObj.setHours(0, 0, 0, 0); // Normalize time to midnight for accurate day comparison

          if (startDate) {
              const startObj = new Date(startDate);
              startObj.setHours(0, 0, 0, 0);
              if (orderDateObj < startObj) return false;
          }

          if (endDate) {
              const endObj = new Date(endDate);
              endObj.setHours(0, 0, 0, 0);
              if (orderDateObj > endObj) return false;
          }
      }

      return true;
  });

  const visibleTotal = filteredOrders.reduce((acc, order) => acc + parseFloat(order.totalamount || 0), 0);

  if (loading) return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-24">
      
      <AdminHeader />

      <div className="p-4 md:p-6 lg:p-10 max-w-[1500px] mx-auto relative z-10">
          
          {/* PAGE TITLE & SETTINGS BUTTON */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70"></div>
              
              <div className="relative z-10">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Order Management</h1>
                  <p className="text-sm text-slate-500 mt-2 font-medium">View, process, and update customer orders.</p>
              </div>
              <div className="relative z-10">
                  <button 
                      onClick={() => setShowSettings(true)} 
                      className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-full shadow-sm text-sm font-bold hover:bg-slate-50 hover:text-[#ff8a80] hover:border-[#FFAFA8] transition-all flex items-center gap-2"
                  >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Edit Delivery Time
                  </button>
              </div>
          </div>

          {/* --- ADVANCED FILTER BAR --- */}
          <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 mb-8 flex flex-col xl:flex-row gap-4 items-center justify-between">
              
              {/* Search */}
              <div className="relative w-full xl:w-96 shrink-0">
                  <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input 
                      type="text" 
                      placeholder="Search ID or Name..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-full shadow-inner text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all placeholder-slate-400 text-slate-800"
                  />
              </div>

              <div className="flex flex-col md:flex-row flex-wrap items-center w-full xl:w-auto gap-4">
                  
                  {/* Date Range */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-full px-5 py-2 shadow-inner focus-within:ring-2 focus-within:ring-[#FFAFA8] transition-all w-full md:w-auto">
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-transparent text-slate-700 text-xs font-bold outline-none cursor-pointer"
                      />
                      <span className="text-slate-400 text-xs font-bold shrink-0">to</span>
                      <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-transparent text-slate-700 text-xs font-bold outline-none cursor-pointer"
                      />
                      {(startDate || endDate) && (
                          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-slate-400 hover:text-rose-500 w-6 h-6 flex items-center justify-center rounded-full hover:bg-rose-50 transition-colors ml-1 shrink-0">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                      )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative w-full md:w-56 shrink-0">
                      <svg className="w-4 h-4 text-slate-400 absolute left-5 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      <select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full pl-11 pr-8 py-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-full shadow-inner text-sm font-bold hover:bg-slate-100 outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] cursor-pointer transition-all appearance-none"
                      >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Rejected">Rejected</option>
                      </select>
                      <svg className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
              </div>
          </div>

          {/* ORDERS TABLE */}
          <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-200">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-200 font-bold">
                            <th className="p-5 pl-8 whitespace-nowrap">Order ID</th>
                            <th className="p-5">Customer</th>
                            <th className="p-5 whitespace-nowrap">Date & Time</th>
                            <th className="p-5 whitespace-nowrap">Total (LKR)</th>
                            <th className="p-5">Method</th>
                            <th className="p-5">Status</th>
                            <th className="p-5 pr-8 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-16 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <p className="text-slate-800 font-bold text-xl tracking-tight mb-1">No orders found.</p>
                                    <p className="text-slate-500 text-sm font-medium">Try adjusting your search, date range, or status filters.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr 
                                  key={order.orderid} 
                                  className={`transition-all duration-300 ${
                                      String(order.orderid) === highlightId 
                                        ? 'bg-[#fff5f4] border-l-4 border-l-[#FFAFA8]' 
                                        : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                                  }`}
                                >
                                    <td className="p-5 pl-8 font-bold text-slate-800 tracking-wide whitespace-nowrap">
                                        #{order.orderid}
                                        {String(order.orderid) === highlightId && (
                                            <span className="ml-2 text-[9px] bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-2 py-0.5 rounded-full font-bold shadow-sm tracking-widest uppercase animate-pulse">New</span>
                                        )}
                                    </td>
                                    <td className="p-5 min-w-[180px]">
                                        <div className="font-bold text-slate-700">{order.shipping_name}</div>
                                        <div className="text-xs text-slate-400 mt-0.5 font-medium">{order.shipping_phone}</div>
                                    </td>
                                    
                                    <td className="p-5 whitespace-nowrap">
                                        <div className="font-bold text-slate-700 text-sm">
                                            {new Date(order.orderdate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-xs text-slate-400 font-medium mt-0.5">
                                            {new Date(order.orderdate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>

                                    <td className="p-5 font-bold text-slate-800 whitespace-nowrap tracking-wide">{parseFloat(order.totalamount).toLocaleString()}</td>
                                    <td className="p-5 text-sm">
                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm ${order.paymentmethod === 'COD' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
                                            {order.paymentmethod}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <div className="relative">
                                            <select 
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.orderid, e.target.value)}
                                                className={`pl-3 pr-8 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer transition-all shadow-sm appearance-none ${
                                                    order.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200 focus:ring-2 focus:ring-amber-200' :
                                                    order.status === 'Processing' ? 'bg-blue-50 text-blue-600 border-blue-200 focus:ring-2 focus:ring-blue-200' :
                                                    order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 focus:ring-2 focus:ring-emerald-200' :
                                                    'bg-rose-50 text-rose-600 border-rose-200 focus:ring-2 focus:ring-rose-200'
                                                }`}
                                            >
                                                {!STATUS_OPTIONS.includes(order.status) && (
                                                    <option value={order.status}>{order.status}</option>
                                                )}
                                                {STATUS_OPTIONS.map(status => (
                                                    <option key={status} value={status}>{status}</option>
                                                ))}
                                            </select>
                                            <svg className={`w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none ${
                                                    order.status === 'Pending' ? 'text-amber-500' :
                                                    order.status === 'Processing' ? 'text-blue-500' :
                                                    order.status === 'Delivered' ? 'text-emerald-500' : 'text-rose-500'
                                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </td>
                                    <td className="p-5 pr-8 text-center">
                                        <button onClick={() => handleViewDetails(order)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold shadow-sm hover:shadow-md hover:bg-slate-50 hover:text-[#ff8a80] hover:border-[#FFAFA8] transition-all whitespace-nowrap">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                
                {filteredOrders.length > 0 && (
                    <div className="bg-slate-50 p-5 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
                        <span className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">Showing {filteredOrders.length} Order(s)</span>
                        <span className="font-bold text-slate-800 bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm">Filtered Total: LKR {visibleTotal.toLocaleString()}</span>
                    </div>
                )}
            </div>
          </div>

          {/* DELIVERY SETTINGS MODAL */}
          {showSettings && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full relative">
                      <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Delivery Time</h2>
                      <p className="text-sm text-slate-500 mb-8 font-medium">Set the estimated working days for delivery.</p>
                      
                      <form onSubmit={handleSaveSettings} className="space-y-6">
                          <div className="flex items-center gap-4">
                              <div className="flex-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 block mb-1.5">Min Days</label>
                                  <input type="number" required min="1" value={minDays} onChange={e => setMinDays(e.target.value)} className="w-full p-3.5 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-slate-800 font-bold text-center shadow-sm transition-all" />
                              </div>
                              <div className="flex-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 block mb-1.5">Max Days</label>
                                  <input type="number" required min="1" value={maxDays} onChange={e => setMaxDays(e.target.value)} className="w-full p-3.5 rounded-xl border border-slate-200 outline-none bg-slate-50 focus:bg-white focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-slate-800 font-bold text-center shadow-sm transition-all" />
                              </div>
                          </div>
                          <button type="submit" disabled={savingSettings} className={`w-full py-3.5 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md tracking-wide transition-all ${savingSettings ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg hover:scale-[1.02]'}`}>
                              {savingSettings ? 'Saving...' : 'Save Settings'}
                          </button>
                      </form>
                  </div>
              </div>
          )}

          {/* DETAILS POPUP MODAL */}
          {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative border border-slate-100">
                    
                    <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm shrink-0 z-10">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight pr-12">Order #{selectedOrder.orderid}</h2>
                    
                    <div className="overflow-y-auto custom-scrollbar pr-2 pb-2">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8 flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <p className="text-sm mb-1.5"><strong className="text-slate-500 uppercase text-[10px] tracking-widest mr-2 inline-block w-16">Customer</strong> <span className="font-bold text-slate-800">{selectedOrder.shipping_name}</span></p>
                                <p className="text-sm mb-1.5"><strong className="text-slate-500 uppercase text-[10px] tracking-widest mr-2 inline-block w-16">Address</strong> <span className="font-medium text-slate-700">{selectedOrder.shipping_address}</span></p>
                                <p className="text-sm"><strong className="text-slate-500 uppercase text-[10px] tracking-widest mr-2 inline-block w-16">Phone</strong> <span className="font-bold text-slate-700">{selectedOrder.shipping_phone}</span></p>
                            </div>
                            <div className="sm:text-right w-full sm:w-auto pt-4 sm:pt-0 border-t border-slate-200 sm:border-0 mt-2 sm:mt-0">
                                <p className="font-bold text-slate-800">{new Date(selectedOrder.orderdate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{new Date(selectedOrder.orderdate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 ml-1">Ordered Items</h3>
                        
                        {loadingItems ? (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFAFA8]"></div>
                            </div>
                        ) : (
                            <div className="space-y-3 mb-8">
                                {orderItems.length > 0 ? (
                                    orderItems.map((item, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-[#FFAFA8] transition-all">
                                            <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                               {item.image ? (
                                                 <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                               ) : (
                                                 <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                               )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 text-sm truncate">{item.name || "Unknown Product"}</h4>
                                                <p className="text-[10px] text-slate-400 font-mono tracking-widest mt-1 mb-1">
                                                    ID: {item.productid || item.itemid || item.id || "N/A"}
                                                </p>
                                                <p className="text-xs text-slate-500 font-bold bg-slate-50 inline-block px-2 py-0.5 rounded-md border border-slate-100">
                                                    {item.quantity} x LKR {parseFloat(item.price || item.amount || 0).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="font-bold text-slate-900 text-base shrink-0">
                                                {parseFloat(item.total_price || (item.quantity * parseFloat(item.price || item.amount || 0))).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                     <div className="p-6 bg-amber-50 text-amber-600 text-sm font-bold rounded-2xl text-center border border-amber-100 flex flex-col items-center justify-center gap-2">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        No products found for this order. 
                                     </div>
                                )}
                            </div>
                        )}
                        
                        {selectedOrder.paymentslip && (
                            <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                    Attached Payment Slip
                                </h4>
                                <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shadow-inner group">
                                     <img 
                                        src={selectedOrder.paymentslip} 
                                        alt="Payment Slip" 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                     />
                                     <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <a href={selectedOrder.paymentslip} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-800 px-4 py-2 rounded-full text-xs font-bold shadow-md hover:scale-105 transition-transform">
                                             View Full Image
                                         </a>
                                     </div>
                                </div>
                                <div className="text-center mt-4">
                                    <a href={selectedOrder.paymentslip} download={`slip-${selectedOrder.orderid}`} className="inline-flex items-center gap-1.5 px-5 py-2 bg-white border border-slate-200 rounded-full text-xs text-slate-600 hover:text-[#ff8a80] hover:border-[#FFAFA8] hover:bg-[#fff5f4] font-bold transition-all shadow-sm">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Download Slip
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Total */}
                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center bg-gradient-to-r from-white to-[#fffafa] shrink-0 mt-4">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Order Total</span>
                         <span className="text-3xl font-bold tracking-tight text-slate-900">LKR {parseFloat(selectedOrder.totalamount).toLocaleString()}</span>
                    </div>
                </div>
            </div>
          )}
      </div>
    </div>
  );
}

// 2. Wrap the component with Suspense in the main export
export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
        </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}