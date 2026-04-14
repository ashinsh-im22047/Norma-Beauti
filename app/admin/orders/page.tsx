"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader'; // Imported your new Admin Header!

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#880e4f]">Loading Orders...</div>;

  return (
    <div className="min-h-screen bg-[#fff0f5] font-sans text-[#4a1d46] pb-24">
      
      {/* --- REPLACED WITH YOUR NEW ADMIN HEADER --- */}
      <AdminHeader />

      <div className="p-6 md:p-12">
          {/* PAGE TITLE & SETTINGS BUTTON */}
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 mt-4">
            <div>
                <h1 className="text-3xl font-serif font-bold text-[#880e4f]">Order Management</h1>
                <p className="text-sm text-gray-500">View and update customer orders.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <button 
                    onClick={() => setShowSettings(true)} 
                    className="px-6 py-2 bg-pink-100 text-[#880e4f] border border-pink-200 rounded-full shadow-sm text-sm font-bold hover:bg-pink-200 transition flex items-center gap-2"
                >
                    ⏱️ Edit Delivery Time
                </button>
            </div>
          </div>

          {/* --- ADVANCED FILTER BAR --- */}
          <div className="max-w-7xl mx-auto bg-white/60 backdrop-blur-md p-4 rounded-[2rem] shadow-sm border border-white/60 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
              
              <div className="relative w-full md:flex-1 md:max-w-[16rem]">
                  <span className="absolute left-4 top-2.5 text-sm">🔍</span>
                  <input 
                      type="text" 
                      placeholder="Search ID or Name..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-pink-100 rounded-full shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all placeholder-gray-400"
                  />
              </div>

              <div className="flex flex-wrap items-center w-full md:w-auto gap-3">
                  <div className="flex items-center gap-2 bg-white border border-pink-100 rounded-full px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-pink-300 transition-all w-full sm:w-auto overflow-hidden">
                      <span className="text-sm text-gray-400">📅</span>
                      <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-transparent text-[#880e4f] text-xs font-bold outline-none cursor-pointer"
                      />
                      <span className="text-gray-300 text-xs font-bold">to</span>
                      <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="bg-transparent text-[#880e4f] text-xs font-bold outline-none cursor-pointer"
                      />
                      {(startDate || endDate) && (
                          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-gray-400 hover:text-red-500 text-sm font-bold ml-1">✕</button>
                      )}
                  </div>

                  <div className="relative flex-1 sm:flex-none">
                      <span className="absolute left-4 top-2.5 text-sm">🔖</span>
                      <select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full pl-10 pr-8 py-2.5 bg-white text-[#880e4f] border border-pink-100 rounded-full shadow-sm text-sm font-bold hover:bg-pink-50 outline-none cursor-pointer transition appearance-none"
                      >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="Rejected">Rejected</option>
                      </select>
                  </div>
              </div>
          </div>

          {/* ORDERS TABLE */}
          <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl overflow-hidden border border-white/60">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#880e4f] text-white text-sm uppercase tracking-wider">
                            <th className="p-5 whitespace-nowrap">Order ID</th>
                            <th className="p-5">Customer</th>
                            <th className="p-5 whitespace-nowrap">Date & Time</th>
                            <th className="p-5 whitespace-nowrap">Total</th>
                            <th className="p-5">Method</th>
                            <th className="p-5">Status</th>
                            <th className="p-5 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-12 text-center">
                                    <span className="text-4xl block mb-2">🔍</span>
                                    <p className="text-[#880e4f] font-serif font-bold text-xl">No orders found.</p>
                                    <p className="text-[#7B2C62] text-sm opacity-80 mt-1">Try adjusting your search, date range, or status filters.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map((order) => (
                                <tr 
                                  key={order.orderid} 
                                  className={`transition-all duration-700 ${
                                    String(order.orderid) === highlightId 
                                      ? 'bg-[#F3E5F5] ring-2 ring-inset ring-[#9B5DE5] shadow-[inset_0_0_15px_rgba(155,93,229,0.2)]' 
                                      : 'hover:bg-pink-50/50'
                                  }`}
                                >
                                    <td className="p-5 font-bold text-[#ad1457]">
                                        #{order.orderid}
                                        {String(order.orderid) === highlightId && (
                                            <span className="ml-2 text-[10px] bg-[#9B5DE5] text-white px-2 py-0.5 rounded-full animate-pulse">NEW</span>
                                        )}
                                    </td>
                                    <td className="p-5 min-w-[150px]">
                                        <div className="font-bold">{order.shipping_name}</div>
                                        <div className="text-xs text-gray-400">{order.shipping_phone}</div>
                                    </td>
                                    
                                    <td className="p-5 whitespace-nowrap">
                                        <div className="font-bold text-[#4a1d46] text-sm">
                                            {new Date(order.orderdate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="text-xs text-gray-500 font-medium mt-0.5">
                                            {new Date(order.orderdate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>

                                    <td className="p-5 font-bold whitespace-nowrap">LKR {parseFloat(order.totalamount).toLocaleString()}</td>
                                    <td className="p-5 text-sm">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${order.paymentmethod === 'COD' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                            {order.paymentmethod}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <select 
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.orderid, e.target.value)}
                                            className={`px-3 py-2 rounded-xl text-sm font-bold border outline-none cursor-pointer transition-colors ${
                                                order.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                order.status === 'Processing' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                                                order.status === 'Delivered' ? 'bg-green-100 text-green-600 border-green-200' :
                                                'bg-red-100 text-red-600 border-red-200'
                                            }`}
                                        >
                                            {!STATUS_OPTIONS.includes(order.status) && (
                                                <option value={order.status}>{order.status}</option>
                                            )}
                                            {STATUS_OPTIONS.map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-5 text-center">
                                        <button onClick={() => handleViewDetails(order)} className="px-4 py-2 bg-[#fce4ec] text-[#880e4f] rounded-full text-xs font-bold hover:bg-[#f8bbd0] transition whitespace-nowrap">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                
                {filteredOrders.length > 0 && (
                    <div className="bg-pink-50/50 p-4 border-t border-pink-100 flex justify-between items-center text-sm">
                        <span className="font-bold text-[#7B2C62]">Showing {filteredOrders.length} Order(s)</span>
                        <span className="font-bold text-[#880e4f]">Filtered Total: LKR {visibleTotal.toLocaleString()}</span>
                    </div>
                )}
            </div>
          </div>

          {/* DELIVERY SETTINGS MODAL */}
          {showSettings && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                  <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full relative animate-scale-up">
                      <button onClick={() => setShowSettings(false)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 font-bold text-xl">✕</button>
                      <h2 className="text-xl font-serif font-bold text-[#880e4f] mb-2">Delivery Time</h2>
                      <p className="text-xs text-gray-500 mb-6">Set the estimated number of working days for a customer to receive their order.</p>
                      
                      <form onSubmit={handleSaveSettings} className="space-y-4">
                          <div className="flex items-center gap-4">
                              <div className="flex-1">
                                  <label className="text-xs font-bold text-[#ad1457] uppercase">Min Days</label>
                                  <input type="number" required min="1" value={minDays} onChange={e => setMinDays(e.target.value)} className="w-full mt-1 p-3 rounded-xl border outline-none bg-gray-50 focus:border-[#880e4f] text-[#4a1d46] font-bold" />
                              </div>
                              <div className="flex-1">
                                  <label className="text-xs font-bold text-[#ad1457] uppercase">Max Days</label>
                                  <input type="number" required min="1" value={maxDays} onChange={e => setMaxDays(e.target.value)} className="w-full mt-1 p-3 rounded-xl border outline-none bg-gray-50 focus:border-[#880e4f] text-[#4a1d46] font-bold" />
                              </div>
                          </div>
                          <button type="submit" disabled={savingSettings} className="w-full py-3 bg-[#880e4f] text-white rounded-xl font-bold shadow-md hover:bg-[#ad1457] transition disabled:opacity-70 mt-4">
                              {savingSettings ? 'Saving...' : 'Save Settings'}
                          </button>
                      </form>
                  </div>
              </div>
          )}

          {/* DETAILS POPUP MODAL */}
          {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-up border border-pink-100">
                    
                    <button onClick={() => setSelectedOrder(null)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 font-bold text-2xl">✕</button>
                    
                    <h2 className="text-3xl font-serif font-bold text-[#880e4f] mb-6">Order #{selectedOrder.orderid}</h2>
                    <div className="text-sm text-gray-500 mb-6 pb-4 border-b flex justify-between items-start">
                        <div>
                            <p><strong className="text-[#ad1457]">Customer:</strong> {selectedOrder.shipping_name}</p>
                            <p><strong className="text-[#ad1457]">Address:</strong> {selectedOrder.shipping_address}</p>
                            <p><strong className="text-[#ad1457]">Phone:</strong> {selectedOrder.shipping_phone}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-[#4a1d46]">{new Date(selectedOrder.orderdate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs text-gray-400">{new Date(selectedOrder.orderdate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-[#4a1d46] mb-3">Ordered Items</h3>
                    
                    {loadingItems ? (
                        <div className="text-center py-8 text-gray-400">Loading Items...</div>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {orderItems.length > 0 ? (
                                orderItems.map((item, index) => (
                                    <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-pink-100 transition">
                                        <div className="w-14 h-14 bg-white rounded-lg border flex-shrink-0 overflow-hidden flex items-center justify-center">
                                           {item.image ? (
                                             <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                           ) : (
                                             <span className="text-xl">📦</span>
                                           )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-[#4a1d46] text-sm">{item.name || "Unknown Product"}</h4>
                                            <p className="text-[10px] text-gray-400 font-mono tracking-wider mb-0.5">
                                                ID: {item.productid || item.itemid || item.id || "N/A"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {item.quantity} x LKR {parseFloat(item.price || item.amount || 0).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="font-bold text-[#880e4f] text-sm">
                                            LKR {(item.quantity * parseFloat(item.price || item.amount || 0)).toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                 <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded-xl text-center border border-yellow-100">
                                   ⚠️ No products found for this order. 
                                 </div>
                            )}
                        </div>
                    )}
                    
                    {selectedOrder.paymentslip && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Payment Slip</h4>
                            <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-white flex items-center justify-center">
                                 <img 
                                    src={selectedOrder.paymentslip} 
                                    alt="Payment Slip" 
                                    className="max-w-full max-h-full object-contain"
                                 />
                            </div>
                            <div className="text-center mt-2">
                                <a href={selectedOrder.paymentslip} download={`slip-${selectedOrder.orderid}`} className="text-xs text-blue-500 hover:underline font-bold">
                                    ⬇️ Download Slip
                                </a>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 border-t flex justify-between items-center bg-pink-50/50 p-4 rounded-xl mt-auto">
                         <span className="text-sm font-bold text-gray-500">Order Total</span>
                         <span className="text-2xl font-bold text-[#880e4f]">LKR {parseFloat(selectedOrder.totalamount).toLocaleString()}</span>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FFF0F5] text-[#880e4f] font-bold">Loading Orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}