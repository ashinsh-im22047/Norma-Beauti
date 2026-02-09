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

  const STATUS_OPTIONS = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

  // 1. Fetch Orders on Load
  useEffect(() => {
    fetchOrders();
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

  // 2. Update Status
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

  // 3. View Details (Fetching Items)
  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    setOrderItems([]); 

    try {
        // Log to see if order ID is correct
        console.log("Fetching items for Order ID:", order.orderid);

        const res = await fetch(`/api/admin/order-item?orderId=${order.orderid}`);
        if (res.ok) {
            const data = await res.json();
            console.log("Items received:", data); // Check your Browser Console (F12)
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
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-serif font-bold text-[#880e4f]">Order Management</h1>
            <p className="text-sm text-gray-500">View and update customer orders.</p>
        </div>
        <button onClick={() => router.push('/admin/dashboard')} className="px-6 py-2 bg-white rounded-full shadow-md text-sm font-bold hover:bg-gray-50 transition">
            ← Back to Dashboard
        </button>
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
                                        order.status === 'Shipped' ? 'bg-purple-100 text-purple-600 border-purple-200' :
                                        order.status === 'Delivered' ? 'bg-green-100 text-green-600 border-green-200' :
                                        'bg-red-100 text-red-600 border-red-200'
                                    }`}
                                >
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

      {/* DETAILS POPUP MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-up">
                
                <button onClick={() => setSelectedOrder(null)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 font-bold text-2xl">✕</button>
                
                {/* 1. Customer Details */}
                <h2 className="text-2xl font-serif font-bold text-[#880e4f] mb-1">Order #{selectedOrder.orderid}</h2>
                <div className="text-sm text-gray-500 mb-6 pb-4 border-b">
                    <p><strong className="text-[#ad1457]">Customer:</strong> {selectedOrder.shipping_name}</p>
                    <p><strong className="text-[#ad1457]">Address:</strong> {selectedOrder.shipping_address}</p>
                    <p><strong className="text-[#ad1457]">Phone:</strong> {selectedOrder.shipping_phone}</p>
                </div>

                {/* 2. Items List */}
                <h3 className="text-lg font-bold text-[#4a1d46] mb-3">Ordered Items</h3>
                
                {loadingItems ? (
                    <div className="text-center py-8 text-gray-400">Loading Items...</div>
                ) : (
                    <div className="space-y-3 mb-6">
                        {orderItems.length > 0 ? (
                            orderItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-pink-100 transition">
                                    {/* Image */}
                                    <div className="w-14 h-14 bg-white rounded-lg border flex-shrink-0 overflow-hidden flex items-center justify-center">
                                       {item.image ? (
                                         <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                       ) : (
                                         <span className="text-xl">📦</span>
                                       )}
                                    </div>
                                    {/* Details */}
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#4a1d46] text-sm">{item.name || "Unknown Product"}</h4>
                                        <p className="text-xs text-gray-500">
                                            {item.quantity} x LKR {parseFloat(item.amount || item.price || 0).toLocaleString()}
                                        </p>
                                    </div>
                                    {/* Total */}
                                    <div className="font-bold text-[#880e4f] text-sm">
                                        LKR {(item.quantity * parseFloat(item.amount || item.price || 0)).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                             // ERROR MESSAGE IF EMPTY
                             <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded-xl text-center border border-yellow-100">
                                ⚠️ No products found for this order. 
                                <br/><span className="text-xs opacity-70">(This usually means the Product ID in the order doesn't match the Product Table)</span>
                             </div>
                        )}
                    </div>
                )}
                
                {/* 3. Payment Slip Preview */}
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

                {/* 4. Footer Total */}
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