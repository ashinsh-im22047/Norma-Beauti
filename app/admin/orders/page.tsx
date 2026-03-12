"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // --- Settings Modal State ---
  const [showSettings, setShowSettings] = useState(false);
  const [minDays, setMinDays] = useState('3');
  const [maxDays, setMaxDays] = useState('8');
  const [savingSettings, setSavingSettings] = useState(false);

  // UPDATED STATUS OPTIONS
  const STATUS_OPTIONS = ["Processing", "Delivered", "Cancelled"];

  useEffect(() => {
    fetchOrders();
    fetchDeliverySettings();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliverySettings = async () => {
      try {
          const res = await fetch('/api/delivery-estimate');
          if (res.ok) {
              const data = await res.json();
              setMinDays(data.minDays.toString());
              setMaxDays(data.maxDays.toString());
          }
      } catch (error) {
          console.error("Failed to load delivery settings", error);
      }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      setSavingSettings(true);
      try {
          const res = await fetch('/api/delivery-estimate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ minDays, maxDays })
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
        // Points to the order-item API!
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#880e4f]">Loading Orders...</div>;

  return (
    <div className="min-h-screen bg-[#fff0f5] p-6 md:p-12 font-sans text-[#4a1d46]">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-serif font-bold text-[#880e4f]">Order Management</h1>
            <p className="text-sm text-gray-500">View and update customer orders.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => setShowSettings(true)} 
                className="px-6 py-2 bg-pink-100 text-[#880e4f] border border-pink-200 rounded-full shadow-sm text-sm font-bold hover:bg-pink-200 transition flex items-center gap-2"
            >
                ⏱️ Edit Delivery Time
            </button>
            <button onClick={() => router.push('/admin/dashboard')} className="px-6 py-2 bg-white rounded-full shadow-md text-sm font-bold hover:bg-gray-50 transition">
                ← Back to Dashboard
            </button>
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div className="max-w-7xl mx-auto bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl overflow-hidden border border-white/60">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#880e4f] text-white text-sm uppercase tracking-wider">
                        <th className="p-5">Order ID</th>
                        <th className="p-5">Customer</th>
                        <th className="p-5">Date</th>
                        <th className="p-5">Total</th>
                        <th className="p-5">Method</th>
                        <th className="p-5">Status</th>
                        <th className="p-5 text-center">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                        <tr key={order.orderid} className="hover:bg-pink-50/50 transition-colors">
                            <td className="p-5 font-bold text-[#ad1457]">#{order.orderid}</td>
                            <td className="p-5">
                                <div className="font-bold">{order.shipping_name}</div>
                                <div className="text-xs text-gray-400">{order.shipping_phone}</div>
                            </td>
                            <td className="p-5 text-sm text-gray-500">
                                {new Date(order.orderdate).toLocaleDateString()}
                            </td>
                            <td className="p-5 font-bold">LKR {parseFloat(order.totalamount).toLocaleString()}</td>
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
                                        order.status === 'Pending' ? 'bg-orange-100 text-orange-600 border-orange-200' :
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
                                <button onClick={() => handleViewDetails(order)} className="px-4 py-2 bg-[#fce4ec] text-[#880e4f] rounded-full text-xs font-bold hover:bg-[#f8bbd0] transition">
                                    View Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
                              <input type="number" required min="1" value={minDays} onChange={e => setMinDays(e.target.value)} className="w-full mt-1 p-3 rounded-xl border outline-none bg-gray-50 focus:border-[#880e4f]" />
                          </div>
                          <div className="flex-1">
                              <label className="text-xs font-bold text-[#ad1457] uppercase">Max Days</label>
                              <input type="number" required min="1" value={maxDays} onChange={e => setMaxDays(e.target.value)} className="w-full mt-1 p-3 rounded-xl border outline-none bg-gray-50 focus:border-[#880e4f]" />
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
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-up">
                
                <button onClick={() => setSelectedOrder(null)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 font-bold text-2xl">✕</button>
                
                <h2 className="text-2xl font-serif font-bold text-[#880e4f] mb-1">Order #{selectedOrder.orderid}</h2>
                <div className="text-sm text-gray-500 mb-6 pb-4 border-b">
                    <p><strong className="text-[#ad1457]">Customer:</strong> {selectedOrder.shipping_name}</p>
                    <p><strong className="text-[#ad1457]">Address:</strong> {selectedOrder.shipping_address}</p>
                    <p><strong className="text-[#ad1457]">Phone:</strong> {selectedOrder.shipping_phone}</p>
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
  );
}