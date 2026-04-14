"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null); 
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [deliveryDays, setDeliveryDays] = useState({ min: 3, max: 5 });

  const [confirmDialog, setConfirmDialog] = useState({
    show: false, type: '', orderId: '', title: '', message: ''
  });

  // --- BEAUTIFUL CUSTOM ALERT STATE ---
  const [alertState, setAlertState] = useState({ 
    show: false, type: 'success', title: '', message: '' 
  });

  const [supportMode, setSupportMode] = useState<'menu' | 'review' | 'complaint' | 'return' | null>(null);
  const [supportData, setSupportData] = useState({
      productId: '',
      itemId: '',
      message: '',
      rating: 5,
      reason: ''
  });
  const [submittingSupport, setSubmittingSupport] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            if (data.min_delivery_days !== undefined) setDeliveryDays({ min: data.min_delivery_days, max: data.max_delivery_days });
        }).catch(err => console.error(err));
  }, []);

  const getDeliveryInfo = (orderDateString: string) => {
    const baseDate = new Date(orderDateString);
    const start = new Date(baseDate); start.setDate(start.getDate() + deliveryDays.min);
    const end = new Date(baseDate); end.setDate(end.getDate() + deliveryDays.max);
    
    const today = new Date(); today.setHours(0, 0, 0, 0); 
    const maxNormalized = new Date(end); maxNormalized.setHours(0, 0, 0, 0);
    const isExpired = maxNormalized < today;

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const text = `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
    
    return { text, isExpired };
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setOrders(data);
      }
    } catch (error) { console.error("Failed to load orders"); } 
    finally { setLoading(false); }
  };

  const openConfirmDialog = (type: 'cancel' | 'delete', orderId: string) => {
    if (type === 'cancel') {
        setConfirmDialog({ show: true, type: 'cancel', orderId, title: 'Cancel Order?', message: 'Are you sure you want to cancel this order? This action cannot be undone.' });
    } else {
        setConfirmDialog({ show: true, type: 'delete', orderId, title: 'Delete from History?', message: 'This will permanently remove this order from your history. Are you sure?' });
    }
  };

  const handleConfirmAction = async () => {
    const { type, orderId } = confirmDialog;
    setConfirmDialog({ ...confirmDialog, show: false }); 

    try {
        const res = await fetch(`/api/orders?orderId=${orderId}&action=${type}`, { method: 'DELETE' });
        if (res.ok) {
            fetchOrders(); 
        } else {
            const err = await res.json();
            setAlertState({ show: true, type: 'error', title: 'Action Failed', message: err.error || "Failed to update order." });
        }
    } catch (error) { 
        setAlertState({ show: true, type: 'error', title: 'System Error', message: 'An error occurred. Please try again.' });
    }
  };

  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order);
    setSupportMode(null);
    setLoadingDetails(true);
    setOrderItems([]);

    try {
        const res = await fetch(`/api/admin/order-item?orderId=${order.orderid}`);
        if (res.ok) setOrderItems(await res.json());
    } catch (error) { console.error("Details error", error); } 
    finally { setLoadingDetails(false); }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmittingSupport(true);

      try {
          const res = await fetch('/api/support', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  type: supportMode,
                  orderId: selectedOrder.orderid,
                  customerName: selectedOrder.shipping_name, // Send the name safely from the order
                  ...supportData
              })
          });

          if (res.ok) {
              const data = await res.json();
              setAlertState({ show: true, type: 'success', title: 'Success!', message: data.message });
              setSupportMode(null);
              setSupportData({ productId: '', itemId: '', message: '', rating: 5, reason: '' });
          } else {
              const err = await res.json();
              setAlertState({ show: true, type: 'error', title: 'Submission Failed', message: err.error || "Failed to submit request." });
          }
      } catch (error) {
          setAlertState({ show: true, type: 'error', title: 'System Error', message: 'An error occurred. Please check your connection and try again.' });
      } finally {
          setSubmittingSupport(false);
      }
  };

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#880e4f]"></div>
      </div>
  );

  const modalDeliveryInfo = selectedOrder ? getDeliveryInfo(selectedOrder.orderdate) : null;
  const showModalDeliveryBadge = selectedOrder && modalDeliveryInfo && !modalDeliveryInfo.isExpired && ['Processing', 'Pending'].includes(selectedOrder.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46] pb-20">
      <CustomerHeader />
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        
        <div className="bg-[#4A1D46]/95 backdrop-blur-xl rounded-[2rem] p-10 md:p-12 shadow-2xl border border-white/20 mb-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D883B7]/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9B5DE5]/20 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <div className="inline-block bg-white/10 px-5 py-1.5 rounded-full border border-white/20 text-xs font-bold tracking-widest uppercase mb-4 text-[#F3E5F5] shadow-inner">
                    Order History
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-wide mb-3">Your Orders</h1>
                <p className="text-[#D883B7] font-medium text-lg max-w-md mx-auto md:mx-0">Track your current deliveries and review your past purchases.</p>
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
                    <button onClick={() => router.push('/shop')} className="px-8 py-3 mt-4 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all border border-white/20">Start Shopping</button>
                </div>
            ) : (
                orders.map((order) => {
                    const deliveryInfo = getDeliveryInfo(order.orderdate);
                    const showDeliveryBadge = ['Processing', 'Pending'].includes(order.status) && !deliveryInfo.isExpired;

                    return (
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
                                }`}>{order.status}</span>
                            </div>

                            {showDeliveryBadge && (
                                <div className="bg-pink-50/50 p-4 rounded-2xl border border-pink-100 text-[#7B2C62] text-sm mb-6 flex items-center gap-3 shadow-inner">
                                    <span className="text-xl">🚚</span> 
                                    <span><span className="font-bold">Estimated Arrival:</span> {deliveryInfo.text}</span>
                                </div>
                            )}
                            
                            {order.status === 'Rejected' && (
                                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-red-700 text-sm font-bold mb-6 flex items-center gap-3">
                                    <span className="text-lg">❌</span> Order Rejected: {order.rejectreason}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-between items-center py-4 border-t border-pink-100 gap-4">
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">{order.paymentmethod}</div>
                                    <p className="text-2xl font-bold text-[#880e4f]">LKR {parseFloat(order.totalamount).toLocaleString()}</p>
                                </div>

                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button onClick={() => handleViewDetails(order)} className="flex-1 sm:flex-none px-6 py-2.5 bg-pink-50 text-[#880e4f] rounded-full text-sm font-bold hover:bg-[#880e4f] hover:text-white transition-all border border-pink-200 hover:border-transparent shadow-sm">View Details</button>
                                    {order.status === 'Pending' && <button onClick={() => openConfirmDialog('cancel', order.orderid)} className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-red-500 border border-red-200 rounded-full text-sm font-bold hover:bg-red-50 transition-all shadow-sm">Cancel</button>}
                                    {['Delivered', 'Cancelled', 'Rejected'].includes(order.status) && <button onClick={() => openConfirmDialog('delete', order.orderid)} className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-gray-400 border border-gray-200 rounded-full text-sm font-bold hover:bg-gray-50 hover:text-red-500 transition-all shadow-sm">Remove</button>}
                                </div>
                            </div>
                        </div>
                    );
                })
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
                    <button onClick={() => setConfirmDialog({ ...confirmDialog, show: false })} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">No, Keep it</button>
                    <button onClick={handleConfirmAction} className={`flex-1 py-3 text-white rounded-xl font-bold transition shadow-lg ${confirmDialog.type === 'delete' ? 'bg-gradient-to-r from-[#e53935] to-[#d32f2f]' : 'bg-gradient-to-r from-[#D883B7] to-[#9B5DE5]'}`}>
                        {confirmDialog.type === 'delete' ? 'Yes, Delete' : 'Yes, Cancel'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- BEAUTIFUL CUSTOM ALERT DIALOG --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 animate-scale-up">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border ${alertState.type === 'success' ? 'bg-green-50 border-green-200 text-green-500' : 'bg-[#FFF9C4] border-[#FFF59D] text-yellow-600'}`}>
                {alertState.type === 'success' ? '✨' : '⚠️'}
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">{alertState.title}</h3>
              <p className="text-[#7B2C62] mb-8 font-medium text-sm">{alertState.message}</p>
              <button 
                onClick={() => setAlertState({ ...alertState, show: false })}
                className={`px-10 py-3 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all w-full border border-white/20 ${alertState.type === 'success' ? 'bg-gradient-to-r from-[#D883B7] to-[#9B5DE5]' : 'bg-gray-800'}`}
              >
                Close
              </button>
           </div>
        </div>
      )}

      {/* --- ORDER DETAILS MODAL (WITH SUPPORT HUB) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-up border border-white/60 custom-scrollbar flex flex-col md:flex-row gap-8">
                
                <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 text-gray-400 hover:text-[#880e4f] font-bold text-2xl leading-none transition-colors z-10">✕</button>
                
                <div className="flex-1 border-r border-pink-100 pr-0 md:pr-8">
                    <div className="mb-8 border-b border-pink-100 pb-6">
                        <p className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest mb-1">Receipt</p>
                        <h2 className="text-3xl font-serif font-bold text-[#4A1D46]">Order #{selectedOrder.orderid}</h2>
                    </div>
                    
                    <div className="bg-pink-50/50 p-6 rounded-2xl mb-8 border border-pink-100 relative">
                        {showModalDeliveryBadge && (
                            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-lg border border-pink-100 text-xs font-bold text-[#7B2C62] shadow-sm flex items-center gap-1.5">
                                <span>🚚</span> {modalDeliveryInfo?.text}
                            </div>
                        )}
                        
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
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-2xl opacity-50">📦</span>}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[#4A1D46] text-base">{item.name}</h4>
                                        <p className="text-xs font-bold text-gray-400 mt-1">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="font-bold text-[#880e4f] text-base">LKR {(item.quantity * parseFloat(item.price || item.amount)).toLocaleString()}</div>
                                </div>
                            )) : <p className="text-gray-500 text-sm text-center py-4">No items found.</p>}
                        </div>
                    )}
                    
                    <div className="mt-8 pt-6 border-t border-pink-100 flex justify-between items-center bg-[#F3E5F5] p-6 rounded-2xl">
                        <span className="text-sm font-bold text-[#4A1D46] uppercase tracking-widest">Total Paid</span>
                        <span className="text-2xl font-bold text-[#880e4f]">LKR {parseFloat(selectedOrder.totalamount).toLocaleString()}</span>
                    </div>
                </div>

                <div className="w-full md:w-80 shrink-0 flex flex-col pt-8 md:pt-0">
                    <div className="mb-6 border-b border-pink-100 pb-4">
                        <h3 className="text-xl font-serif font-bold text-[#880e4f] flex items-center gap-2">
                            <span>💬</span> Help & Support
                        </h3>
                    </div>

                    {!supportMode ? (
                        <div className="space-y-3">
                            <button onClick={() => setSupportMode('complaint')} className="w-full p-4 bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-pink-200 rounded-xl text-left transition group">
                                <p className="font-bold text-[#4A1D46] mb-1 flex items-center justify-between">
                                    <span>⚠️ File a Complaint</span>
                                    <span className="text-gray-400 group-hover:text-[#880e4f]">→</span>
                                </p>
                                <p className="text-xs text-gray-500">Delivery issues or bad service.</p>
                            </button>
                            
                            {selectedOrder.status === 'Delivered' && (
                                <>
                                    <button onClick={() => setSupportMode('review')} className="w-full p-4 bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-pink-200 rounded-xl text-left transition group">
                                        <p className="font-bold text-[#4A1D46] mb-1 flex items-center justify-between">
                                            <span>🌟 Write a Review</span>
                                            <span className="text-gray-400 group-hover:text-[#880e4f]">→</span>
                                        </p>
                                        <p className="text-xs text-gray-500">Rate your purchased products.</p>
                                    </button>
                                    <button onClick={() => setSupportMode('return')} className="w-full p-4 bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-pink-200 rounded-xl text-left transition group">
                                        <p className="font-bold text-[#4A1D46] mb-1 flex items-center justify-between">
                                            <span>↩️ Request Return</span>
                                            <span className="text-gray-400 group-hover:text-[#880e4f]">→</span>
                                        </p>
                                        <p className="text-xs text-gray-500">Item is damaged or incorrect.</p>
                                    </button>
                                </>
                            )}
                            {selectedOrder.status !== 'Delivered' && (
                                <p className="text-xs text-center text-gray-400 mt-4 italic p-4 bg-gray-50 rounded-xl">Reviews and Returns will unlock once your order is Delivered.</p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl animate-fade-in flex flex-col h-full">
                            <button type="button" onClick={() => setSupportMode(null)} className="text-xs font-bold text-gray-400 hover:text-[#880e4f] mb-4 flex items-center gap-1 w-fit">
                                ← Back to Menu
                            </button>
                            
                            <h4 className="font-bold text-[#880e4f] mb-4">
                                {supportMode === 'complaint' && 'File a Complaint'}
                                {supportMode === 'review' && 'Write a Product Review'}
                                {supportMode === 'return' && 'Request a Return'}
                            </h4>

                            <form onSubmit={handleSupportSubmit} className="space-y-4 flex flex-col flex-grow">
                                
                                {(supportMode === 'review' || supportMode === 'return') && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Select Item *</label>
                                        <select 
                                            required
                                            className="w-full p-2.5 mt-1 border rounded-xl text-sm outline-none focus:border-[#880e4f] text-[#4A1D46]"
                                            onChange={(e) => {
                                                const selected = orderItems.find(i => i.productid === e.target.value || i.itemid === e.target.value);
                                                if (selected) {
                                                    setSupportData({...supportData, productId: selected.productid || '', itemId: selected.itemid || ''});
                                                }
                                            }}
                                        >
                                            <option value="">Choose a product...</option>
                                            {orderItems.map((item, idx) => (
                                                <option key={idx} value={item.productid || item.itemid}>{item.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {supportMode === 'review' && (
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Rating</label>
                                        <div className="flex gap-2 mt-1">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button 
                                                    key={star} type="button"
                                                    onClick={() => setSupportData({...supportData, rating: star})}
                                                    className={`text-2xl transition-transform hover:scale-110 ${supportData.rating >= star ? 'text-yellow-400' : 'text-gray-200 grayscale'}`}
                                                >
                                                    ⭐
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex-grow flex flex-col">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1">
                                        {supportMode === 'return' ? 'Reason for Return *' : 'Your Message *'}
                                    </label>
                                    <textarea 
                                        required
                                        rows={5}
                                        placeholder={
                                            supportMode === 'complaint' ? "Tell us what went wrong..." :
                                            supportMode === 'review' ? "What did you love (or hate) about it?" :
                                            "Explain why you need to return this item..."
                                        }
                                        value={supportMode === 'return' ? supportData.reason : supportData.message}
                                        onChange={e => {
                                            if (supportMode === 'return') setSupportData({...supportData, reason: e.target.value});
                                            else setSupportData({...supportData, message: e.target.value});
                                        }}
                                        className="w-full p-3 border rounded-xl text-sm outline-none focus:border-[#880e4f] resize-none flex-grow"
                                    ></textarea>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={submittingSupport}
                                    className="w-full py-3 mt-auto bg-[#880e4f] text-white rounded-xl font-bold shadow-md hover:opacity-90 transition disabled:opacity-50"
                                >
                                    {submittingSupport ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
}