"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- STATE FOR MODALS ---
  const [selectedOrder, setSelectedOrder] = useState<any>(null); 
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- STATE FOR CONFIRMATION DIALOG ---
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    type: '', 
    orderId: '',
    title: '',
    message: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (error) {
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (type: 'cancel' | 'delete', orderId: string) => {
    if (type === 'cancel') {
        setConfirmDialog({
            show: true, type: 'cancel', orderId,
            title: 'Cancel Order?',
            message: 'Are you sure you want to cancel this order? This action cannot be undone.'
        });
    } else {
        setConfirmDialog({
            show: true, type: 'delete', orderId,
            title: 'Delete from History?',
            message: 'This will permanently remove this order from your history. Are you sure?'
        });
    }
  };

  const handleConfirmAction = async () => {
    const { type, orderId } = confirmDialog;
    setConfirmDialog({ ...confirmDialog, show: false }); 

    try {
        const endpoint = `/api/orders?orderId=${orderId}&action=${type}`;
        const res = await fetch(endpoint, { method: 'DELETE' });

        if (res.ok) {
            fetchOrders(); 
        } else {
            const err = await res.json();
            alert(err.error || "Action failed.");
        }
    } catch (error) {
        console.error("Action error", error);
    }
  };

  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order);
    setLoadingDetails(true);
    setOrderItems([]);

    try {
        const res = await fetch(`/api/admin/order-item?orderId=${order.orderid}`);
        if (res.ok) {
            const data = await res.json();
            setOrderItems(data);
        }
    } catch (error) {
        console.error("Details error", error);
    } finally {
        setLoadingDetails(false);
    }
  };

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#880e4f]"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46] pb-20">
      <CustomerHeader />
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* --- ELEGANT HERO SECTION --- */}
        <div className="bg-[#4A1D46]/95 backdrop-blur-xl rounded-[2rem] p-10 md:p-12 shadow-2xl border border-white/20 mb-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D883B7]/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9B5DE5]/20 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <div className="inline-block bg-white/10 px-5 py-1.5 rounded-full border border-white/20 text-xs font-bold tracking-widest uppercase mb-4 text-[#F3E5F5] shadow-inner">
                    Order History
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-wide mb-3">Your Orders</h1>
                <p className="text-[#D883B7] font-medium text-lg max-w-md mx-auto md:mx-0">
                    Track your current deliveries and review your past purchases.
                </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-4xl shadow-inner border border-white/20 relative group hover:scale-105 transition-transform duration-500">
                    <span className="animate-pulse drop-shadow-[0_0_15px_rgba(216,131,183,0.6)]">📦</span>
                </div>
            </div>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
            {orders.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/60 p-16 text-center">
                    <div className="text-6xl mb-4 opacity-70">🛍️</div>
                    <p className="text-2xl font-serif font-bold text-[#880e4f] mb-2">No orders yet.</p>
                    <p className="text-[#7B2C62] font-medium mb-8">When you purchase items, they will appear here.</p>
                    <button onClick={() => router.push('/shop')} className="px-8 py-3 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all border border-white/20">
                        Start Shopping
                    </button>
                </div>
            ) : (
                orders.map((order) => (
                    <div key={order.orderid} className="bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-[2rem] shadow-sm border border-white/50 hover:shadow-lg transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <div>
                                <span className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest block mb-1">ORDER #{order.orderid}</span>
                                <p className="text-sm font-bold text-[#4A1D46]">{new Date(order.orderdate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <span className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
                                order.status === 'Delivered' ? 'bg-green-50 text-green-600 border-green-200' :
                                order.status === 'Rejected' || order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                                order.status === 'Processing' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                'bg-yellow-50 text-yellow-600 border-yellow-200'
                            }`}>
                                {order.status}
                            </span>
                        </div>

                        {order.status === 'Delivered' && (
                            <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 text-green-700 text-sm font-bold mb-6 flex items-center gap-3">
                                <span className="text-lg">🚚</span> Estimated Arrival: Within 2-5 working days.
                            </div>
                        )}
                        {order.status === 'Rejected' && (
                            <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-red-700 text-sm font-bold mb-6 flex items-center gap-3">
                                <span className="text-lg">❌</span> Order Rejected: {order.rejectreason}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between items-center py-4 border-t border-pink-100 gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                                    {order.paymentmethod}
                                </div>
                                <p className="text-2xl font-bold text-[#880e4f]">LKR {parseFloat(order.totalamount).toLocaleString()}</p>
                            </div>

                            <div className="flex gap-3 w-full sm:w-auto">
                                <button 
                                    onClick={() => handleViewDetails(order)}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-pink-50 text-[#880e4f] rounded-full text-sm font-bold hover:bg-[#880e4f] hover:text-white transition-all border border-pink-200 hover:border-transparent shadow-sm"
                                >
                                    View Details
                                </button>
                                {order.status === 'Pending' && (
                                    <button 
                                        onClick={() => openConfirmDialog('cancel', order.orderid)}
                                        className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-red-500 border border-red-200 rounded-full text-sm font-bold hover:bg-red-50 transition-all shadow-sm"
                                    >
                                        Cancel
                                    </button>
                                )}
                                {['Delivered', 'Cancelled', 'Rejected'].includes(order.status) && (
                                    <button 
                                        onClick={() => openConfirmDialog('delete', order.orderid)}
                                        className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-gray-400 border border-gray-200 rounded-full text-sm font-bold hover:bg-gray-50 hover:text-red-500 transition-all shadow-sm"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>

      {/* --- CONFIRMATION DIALOG --- */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 animate-scale-up">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border ${confirmDialog.type === 'delete' ? 'bg-[#FFEBEE] border-[#FFCDD2] text-red-500' : 'bg-[#FFF9C4] border-[#FFF59D] text-yellow-600'}`}>
                    {confirmDialog.type === 'delete' ? '🗑️' : '⚠️'}
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#4A1D46] mb-2">{confirmDialog.title}</h3>
                <p className="text-[#7B2C62] mb-8 font-medium text-sm">{confirmDialog.message}</p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                        className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        No, Keep it
                    </button>
                    <button 
                        onClick={handleConfirmAction}
                        className={`flex-1 py-3 text-white rounded-xl font-bold transition shadow-lg ${
                            confirmDialog.type === 'delete' ? 'bg-gradient-to-r from-[#e53935] to-[#d32f2f]' : 'bg-gradient-to-r from-[#D883B7] to-[#9B5DE5]'
                        }`}
                    >
                        {confirmDialog.type === 'delete' ? 'Yes, Delete' : 'Yes, Cancel'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- ORDER DETAILS MODAL --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-up border border-white/60 custom-scrollbar">
                <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-gray-400 hover:text-[#880e4f] font-bold text-2xl leading-none transition-colors">✕</button>
                
                <div className="text-center mb-8 border-b border-pink-100 pb-6">
                    <p className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest mb-1">Receipt</p>
                    <h2 className="text-3xl font-serif font-bold text-[#4A1D46]">Order #{selectedOrder.orderid}</h2>
                </div>
                
                <div className="bg-pink-50/50 p-6 rounded-2xl mb-8 border border-pink-100">
                    <p className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest mb-2">Shipping To</p>
                    <p className="font-bold text-lg text-[#4A1D46] mb-1">{selectedOrder.shipping_name}</p>
                    <p className="text-sm font-medium text-[#7B2C62] mb-1">{selectedOrder.shipping_address}</p>
                    <p className="text-sm font-bold text-gray-500">{selectedOrder.shipping_phone}</p>
                </div>

                <h3 className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest mb-3 ml-2">Items Ordered</h3>
                
                {loadingDetails ? (
                    <div className="text-center py-8 text-gray-400 font-medium">Loading details...</div>
                ) : (
                    <div className="space-y-4">
                        {orderItems.length > 0 ? orderItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200 shrink-0">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl opacity-50">📦</span>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#4A1D46] text-base">{item.name}</h4>
                                    <p className="text-xs font-bold text-gray-400 mt-1">Qty: {item.quantity}</p>
                                </div>
                                <div className="font-bold text-[#880e4f] text-base">
                                    LKR {(item.quantity * parseFloat(item.price || item.amount)).toLocaleString()}
                                </div>
                            </div>
                        )) : <p className="text-gray-500 text-sm text-center py-4">No items found.</p>}
                    </div>
                )}
                
                <div className="mt-8 pt-6 border-t border-pink-100 flex justify-between items-center bg-[#F3E5F5] p-6 rounded-2xl">
                    <span className="text-sm font-bold text-[#4A1D46] uppercase tracking-widest">Total Paid</span>
                    <span className="text-2xl font-bold text-[#880e4f]">LKR {parseFloat(selectedOrder.totalamount).toLocaleString()}</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}