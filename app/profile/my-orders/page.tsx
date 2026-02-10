"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- STATE FOR MODALS ---
  const [selectedOrder, setSelectedOrder] = useState<any>(null); // For "View Details"
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- STATE FOR CONFIRMATION DIALOG ---
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    type: '', // 'cancel' or 'delete'
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

  // --- 1. OPEN CONFIRMATION DIALOG ---
  const openConfirmDialog = (type: 'cancel' | 'delete', orderId: string) => {
    if (type === 'cancel') {
        setConfirmDialog({
            show: true,
            type: 'cancel',
            orderId,
            title: 'Cancel Order?',
            message: 'Are you sure you want to cancel this order? This action cannot be undone.'
        });
    } else {
        setConfirmDialog({
            show: true,
            type: 'delete',
            orderId,
            title: 'Delete from History?',
            message: 'This will permanently remove this order from your history. Are you sure?'
        });
    }
  };

  // --- 2. EXECUTE ACTION (Cancel or Delete) ---
  const handleConfirmAction = async () => {
    const { type, orderId } = confirmDialog;
    setConfirmDialog({ ...confirmDialog, show: false }); // Close dialog

    try {
        const endpoint = `/api/orders?orderId=${orderId}&action=${type}`;
        const res = await fetch(endpoint, { method: 'DELETE' });

        if (res.ok) {
            fetchOrders(); // Refresh list
        } else {
            const err = await res.json();
            alert(err.error || "Action failed.");
        }
    } catch (error) {
        console.error("Action error", error);
    }
  };

  // --- VIEW DETAILS HANDLER ---
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#880e4f]">Loading orders...</div>;

  return (
    <div className="min-h-screen bg-[#fff0f5]">
      <CustomerHeader />
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif font-bold text-[#880e4f] mb-8 text-center">My Orders</h1>
        
        <div className="space-y-6 max-w-3xl mx-auto">
            {orders.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No orders yet.</p>
            ) : (
                orders.map((order) => (
                    <div key={order.orderid} className="bg-white/80 p-6 rounded-2xl shadow-md border border-white">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold text-gray-400">ORDER #{order.orderid}</span>
                                <p className="text-sm text-gray-500">{new Date(order.orderdate).toLocaleDateString()}</p>
                            </div>
                            <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                                order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'Rejected' || order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                                {order.status}
                            </span>
                        </div>

                        {/* DYNAMIC STATUS MESSAGE */}
                        {order.status === 'Delivered' && (
                            <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-green-800 text-sm font-medium mb-4">
                                🚚 Estimated Arrival: Within 2-5 working days.
                            </div>
                        )}
                        {order.status === 'Rejected' && (
                            <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-800 text-sm font-medium mb-4">
                                ❌ Order Rejected: {order.rejectreason}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t mb-4">
                            <p className="text-sm text-gray-600">Payment: {order.paymentmethod}</p>
                            <p className="text-xl font-bold text-[#880e4f]">LKR {parseFloat(order.totalamount).toLocaleString()}</p>
                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex gap-3 justify-end">
                            <button 
                                onClick={() => handleViewDetails(order)}
                                className="px-4 py-2 bg-[#fce4ec] text-[#880e4f] rounded-xl text-xs font-bold hover:bg-[#f8bbd0] transition border border-pink-200"
                            >
                                View Details
                            </button>

                            {/* CANCEL BUTTON (Only if Pending) */}
                            {order.status === 'Pending' && (
                                <button 
                                    onClick={() => openConfirmDialog('cancel', order.orderid)}
                                    className="px-4 py-2 bg-white text-red-500 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-50 transition"
                                >
                                    Cancel Order
                                </button>
                            )}

                            {/* DELETE BUTTON (If Delivered, Cancelled, or Rejected) */}
                            {['Delivered', 'Cancelled', 'Rejected'].includes(order.status) && (
                                <button 
                                    onClick={() => openConfirmDialog('delete', order.orderid)}
                                    className="px-4 py-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-200 transition"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
      </main>

      {/* --- CONFIRMATION DIALOG --- */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-[1.5rem] shadow-2xl max-w-sm w-full text-center">
                <h3 className="text-xl font-bold text-[#4A1D46] mb-2">{confirmDialog.title}</h3>
                <p className="text-gray-600 mb-6 text-sm">{confirmDialog.message}</p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => setConfirmDialog({ ...confirmDialog, show: false })}
                        className="px-5 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200 transition"
                    >
                        No, Keep it
                    </button>
                    <button 
                        onClick={handleConfirmAction}
                        className={`px-5 py-2 text-white rounded-lg text-sm font-bold transition ${
                            confirmDialog.type === 'delete' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#880e4f] hover:bg-[#ad1457]'
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
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-up">
                <button onClick={() => setSelectedOrder(null)} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 font-bold text-2xl">✕</button>
                
                <h2 className="text-2xl font-serif font-bold text-[#880e4f] mb-4">Order Details #{selectedOrder.orderid}</h2>
                
                {/* Shipping Info */}
                <div className="bg-gray-50 p-5 rounded-2xl mb-6 space-y-2 text-sm text-gray-700 border border-gray-100">
                    <p><strong className="text-[#ad1457] uppercase text-xs tracking-wider block mb-1">Shipping To</strong></p>
                    <p className="font-bold text-lg text-gray-900">{selectedOrder.shipping_name}</p>
                    <p>{selectedOrder.shipping_address}</p>
                    <p>{selectedOrder.shipping_phone}</p>
                </div>

                <h3 className="text-lg font-bold text-[#4a1d46] mb-3">Items Ordered</h3>
                
                {loadingDetails ? (
                    <div className="text-center py-8 text-gray-400">Loading details...</div>
                ) : (
                    <div className="space-y-3">
                        {orderItems.length > 0 ? orderItems.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl">
                                <div className="w-14 h-14 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                                   {item.image ? (
                                     <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                   ) : (
                                     <span className="text-xl">📦</span>
                                   )}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-[#4a1d46] text-sm">{item.name}</h4>
                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <div className="font-bold text-[#880e4f] text-sm">
                                    LKR {(item.quantity * parseFloat(item.price || item.amount)).toLocaleString()}
                                </div>
                            </div>
                        )) : <p className="text-gray-500 text-sm text-center py-4">No items found.</p>}
                    </div>
                )}
                
                <div className="mt-6 pt-4 border-t flex justify-end">
                     <span className="text-xl font-bold text-[#880e4f]">Total: LKR {parseFloat(selectedOrder.totalamount).toLocaleString()}</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}