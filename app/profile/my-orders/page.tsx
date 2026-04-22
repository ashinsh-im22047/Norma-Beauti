// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

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

  const [alertState, setAlertState] = useState({ 
    show: false, type: 'success', title: '', message: '' 
  });

  const [supportMode, setSupportMode] = useState<'menu' | 'review' | 'complaint' | 'return' | null>(null);
  
  const [supportData, setSupportData] = useState({
      productId: '',
      itemId: '',
      message: '',
      rating: 5,
      reason: '',
      files: [] as File[] 
  });
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // --- NEW: LOGIC TO HIGHLIGHT ORDER FROM NOTIFICATION ---
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    // Grab the highlight ID from the URL (e.g. ?highlight=123)
    const params = new URLSearchParams(window.location.search);
    setHighlightId(params.get('highlight'));

    fetchOrders();
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            if (data.min_delivery_days !== undefined) setDeliveryDays({ min: data.min_delivery_days, max: data.max_delivery_days });
        }).catch(err => console.error(err));
  }, []);

  // Scroll to highlighted order smoothly when orders load
  useEffect(() => {
      if (highlightId && orders.length > 0) {
          setTimeout(() => {
              const element = document.getElementById(`order-${highlightId}`);
              if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          }, 500);
      }
  }, [highlightId, orders]);

  // Calculate delivery date range and check if it's expired based on order date and current settings
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
// Fetch orders from the backend API and handle loading state
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

  // Open a confirmation dialog for canceling or deleting an order, setting the appropriate title and message based on the action type
  const openConfirmDialog = (type: 'cancel' | 'delete', orderId: string) => {
    if (type === 'cancel') {
        setConfirmDialog({ show: true, type: 'cancel', orderId, title: 'Cancel Order?', message: 'Are you sure you want to cancel this order? This action cannot be undone.' });
    } else {
        setConfirmDialog({ show: true, type: 'delete', orderId, title: 'Delete History?', message: 'This will permanently remove this order from your history.' });
    }
  };
// Handle the confirmation action for canceling or deleting an order by sending a DELETE request to the backend API with the order ID and action type, then refreshing the orders list or showing an error alert based on the response
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

  // When viewing order details, fetch the items for that order and handle loading state
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


  const handleSupportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          const newFiles = Array.from(e.target.files);
          if (supportData.files.length + newFiles.length > 3) {
              setAlertState({ show: true, type: 'error', title: 'Limit Reached', message: 'You can only upload up to 3 images.' });
              return;
          }
          setSupportData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
      }
  };

  const removeSupportFile = (index: number) => {
      setSupportData(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmittingSupport(true);

      try {
          let uploadedImageUrls: string[] = [];
          if (supportData.files.length > 0) {
              uploadedImageUrls = await Promise.all(
                  supportData.files.map(async file => {
                      const uploadData = new FormData(); 
                      uploadData.set('file', file);
                      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
                      const uploadJson = await uploadRes.json();
                      return uploadJson.url; 
                  })
              );
          }

          const res = await fetch('/api/support', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  type: supportMode,
                  orderId: selectedOrder.orderid,
                  customerName: selectedOrder.shipping_name, 
                  productId: supportData.productId,
                  itemId: supportData.itemId,
                  message: supportData.message,
                  rating: supportData.rating,
                  reason: supportData.reason,
                  images: uploadedImageUrls
              })
          });

          if (res.ok) {
              const data = await res.json();
              setAlertState({ show: true, type: 'success', title: 'Success!', message: data.message });
              setSupportMode(null);
              setSupportData({ productId: '', itemId: '', message: '', rating: 5, reason: '', files: [] });
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
      </div>
  );

  const modalDeliveryInfo = selectedOrder ? getDeliveryInfo(selectedOrder.orderdate) : null;
  const showModalDeliveryBadge = selectedOrder && modalDeliveryInfo && !modalDeliveryInfo.isExpired && ['Processing', 'Pending'].includes(selectedOrder.status);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-24">
      <CustomerHeader />
      <main className="container mx-auto px-4 md:px-6 py-10 max-w-[1400px]">
        
        {/* HERO SECTION */}
        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-sm border border-slate-200 mb-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <button 
                    onClick={() => router.back()} 
                    className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#F76D82] transition-colors uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full w-fit mx-auto md:mx-0 border border-slate-100"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Go Back
                </button>

                <div className="inline-block bg-[#fff5f4] px-5 py-1.5 rounded-full border border-[#FFAFA8]/30 text-xs font-bold tracking-widest uppercase mb-4 text-[#ff8a80] shadow-sm">
                    Order History
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-slate-900">Your Orders</h1>
                <p className="text-slate-500 font-medium text-lg max-w-md mx-auto md:mx-0">Track your current deliveries and review your past purchases.</p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center shadow-inner border border-slate-100 relative group hover:bg-white hover:shadow-md hover:border-[#FFAFA8] transition-all duration-300">
                    <svg className="w-10 h-10 text-slate-400 group-hover:text-[#ff8a80] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
            </div>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
            {orders.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 text-slate-300">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </div>
                    <p className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">No orders yet.</p>
                    <button onClick={() => router.push('/shop')} className="px-10 py-3.5 mt-4 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md hover:scale-105 hover:shadow-lg transition-all tracking-wide">Start Shopping</button>
                </div>
            ) : (
                orders.map((order) => {
                    const deliveryInfo = getDeliveryInfo(order.orderdate);
                    const showDeliveryBadge = ['Processing', 'Pending'].includes(order.status) && !deliveryInfo.isExpired;

                    // --- HIGHLIGHT STYLING ---
                    const isHighlighted = highlightId === String(order.orderid);

                    return (
                        <div 
                            id={`order-${order.orderid}`} 
                            key={order.orderid} 
                            className={`p-6 md:p-8 rounded-[2rem] shadow-sm border transition-all duration-700 group ${
                                isHighlighted 
                                ? 'bg-[#fffafa] border-[#FFAFA8] ring-4 ring-[#FFAFA8]/30 scale-[1.02]' 
                                : 'bg-white border-slate-200 hover:border-[#FFAFA8] hover:shadow-md'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ORDER #{order.orderid}</span>
                                    <p className="text-sm font-bold text-slate-700">{new Date(order.orderdate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                                <span className={`px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${
                                    order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    order.status === 'Rejected' || order.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                    order.status === 'Processing' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                    'bg-amber-50 text-amber-600 border-amber-200'
                                }`}>{order.status}</span>
                            </div>

                            {showDeliveryBadge && (
                                <div className="bg-[#fff5f4] p-4 rounded-2xl border border-[#FFAFA8]/30 text-[#ff8a80] text-sm mb-6 flex items-center gap-3 shadow-inner">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011 1v2.586a1 1 0 01-.293.707l-1.414 1.414a1 1 0 01-.707.293h-2.586a1 1 0 01-1-1V17a1 1 0 011-1h1m8-10v10m-6-10v10" /></svg>
                                    <span><span className="font-bold">Estimated Arrival:</span> {deliveryInfo.text}</span>
                                </div>
                            )}
                            
                            {order.status === 'Rejected' && (
                                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 text-rose-700 text-sm font-bold mb-6 flex items-center gap-3">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Order Rejected: {order.rejectreason}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row justify-between items-center py-4 border-t border-slate-100 gap-4">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md uppercase tracking-wider">{order.paymentmethod}</div>
                                    <p className="text-2xl font-bold text-slate-900">LKR {parseFloat(order.totalamount).toLocaleString()}</p>
                                </div>

                                <div className="flex gap-3 w-full sm:w-auto">
                                    <button onClick={() => handleViewDetails(order)} className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-slate-700 rounded-full text-sm font-bold hover:bg-slate-50 hover:text-[#ff8a80] transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        View Details
                                    </button>
                                    {order.status === 'Pending' && <button onClick={() => openConfirmDialog('cancel', order.orderid)} className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-rose-500 border border-rose-200 rounded-full text-sm font-bold hover:bg-rose-50 transition-all shadow-sm">Cancel</button>}
                                    {['Delivered', 'Cancelled', 'Rejected'].includes(order.status) && <button onClick={() => openConfirmDialog('delete', order.orderid)} className="flex-1 sm:flex-none px-6 py-2.5 bg-white text-slate-400 border border-slate-200 rounded-full text-sm font-bold hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 transform transition-all scale-100">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 border-white ${confirmDialog.type === 'delete' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">{confirmDialog.title}</h3>
                <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">{confirmDialog.message}</p>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setConfirmDialog({ ...confirmDialog, show: false })} className="flex-1 py-3 bg-white text-slate-600 rounded-full font-bold hover:bg-slate-50 border border-slate-200 transition-all shadow-sm">Cancel</button>
                    <button onClick={handleConfirmAction} className={`flex-1 py-3 text-white rounded-full font-bold shadow-md transition-all hover:scale-105 ${confirmDialog.type === 'delete' ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80]'}`}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- CUSTOM ALERT DIALOG --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 relative transform transition-all scale-100">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 border-white ${alertState.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {alertState.type === 'success' ? (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">{alertState.title}</h3>
              <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">{alertState.message}</p>
              <button 
                onClick={() => setAlertState({ ...alertState, show: false })}
                className="px-10 py-3.5 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all w-full tracking-wide uppercase text-xs"
              >
                Close
              </button>
           </div>
        </div>
      )}

      {/* --- ORDER DETAILS MODAL (WITH SUPPORT HUB) --- */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => { setSelectedOrder(null); setSupportData({...supportData, files: []}); }}>
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-up border border-slate-100 custom-scrollbar flex flex-col md:flex-row gap-10" onClick={e => e.stopPropagation()}>
                
                <button onClick={() => { setSelectedOrder(null); setSupportData({...supportData, files: []}); }} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:text-rose-500 transition-colors leading-none z-10 shadow-sm">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="flex-1 md:border-r md:border-slate-100 md:pr-10">
                    <div className="mb-8 border-b border-slate-100 pb-6">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt Summary</p>
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Order #{selectedOrder.orderid}</h2>
                    </div>
                    
                    <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-200 relative shadow-inner">
                        {showModalDeliveryBadge && (
                            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-lg border border-[#FFAFA8]/30 text-xs font-bold text-[#ff8a80] shadow-sm flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011 1v2.586a1 1 0 01-.293.707l-1.414 1.414a1 1 0 01-.707.293h-2.586a1 1 0 01-1-1V17a1 1 0 011-1h1m8-10v10m-6-10v10" /></svg>
                                {modalDeliveryInfo?.text}
                            </div>
                        )}
                        
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Shipping To</p>
                        <p className="font-bold text-lg text-slate-800 mb-1">{selectedOrder.shipping_name}</p>
                        <p className="text-sm font-medium text-slate-600 mb-2 leading-relaxed">{selectedOrder.shipping_address}</p>
                        <p className="text-sm font-bold text-slate-400 font-mono">{selectedOrder.shipping_phone}</p>
                    </div>

                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">Purchased Items</h3>
                    
                    {loadingDetails ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFAFA8]"></div></div>
                    ) : (
                        <div className="space-y-4">
                            {orderItems.length > 0 ? orderItems.map((item, index) => (
                                <div key={index} className="flex items-center gap-5 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-[#FFAFA8] transition-colors group/item">
                                    <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
                                        {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" /> : <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 text-base truncate">{item.name}</h4>
                                        <p className="text-xs font-bold text-slate-400 mt-1">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="font-bold text-slate-900 text-base">LKR {(item.quantity * parseFloat(item.price || item.amount)).toLocaleString()}</div>
                                </div>
                            )) : <p className="text-slate-400 text-sm text-center py-8 italic font-medium">No items found for this order.</p>}
                        </div>
                    )}
                    
                    <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white p-6 rounded-3xl">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Transaction</span>
                        <span className="text-3xl font-bold tracking-tight text-slate-900">LKR {parseFloat(selectedOrder.totalamount).toLocaleString()}</span>
                    </div>
                </div>

                <div className="w-full md:w-80 shrink-0 flex flex-col pt-8 md:pt-0">
                    <div className="mb-8 border-b border-slate-100 pb-4">
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#ff8a80]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                            Support Hub
                        </h3>
                    </div>

                    {!supportMode ? (
                        <div className="space-y-3">
                            <button onClick={() => setSupportMode('complaint')} className="w-full p-5 bg-slate-50 hover:bg-[#fff5f4] border border-slate-200 hover:border-[#FFAFA8] rounded-2xl text-left transition-all duration-300 group/btn shadow-sm">
                                <p className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        File a Complaint
                                    </span>
                                    <svg className="w-4 h-4 text-slate-300 group-hover/btn:text-[#ff8a80] group-hover/btn:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Delivery or service issues</p>
                            </button>
                            
                            {selectedOrder.status === 'Delivered' && (
                                <>
                                    <button onClick={() => setSupportMode('review')} className="w-full p-5 bg-slate-50 hover:bg-[#fff5f4] border border-slate-200 hover:border-[#FFAFA8] rounded-2xl text-left transition-all duration-300 group/btn shadow-sm">
                                        <p className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                                Write a Review
                                            </span>
                                            <svg className="w-4 h-4 text-slate-300 group-hover/btn:text-[#ff8a80] group-hover/btn:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Rate your products</p>
                                    </button>
                                    <button onClick={() => setSupportMode('return')} className="w-full p-5 bg-slate-50 hover:bg-[#fff5f4] border border-slate-200 hover:border-[#FFAFA8] rounded-2xl text-left transition-all duration-300 group/btn shadow-sm">
                                        <p className="font-bold text-slate-800 mb-1 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                                Request Return
                                            </span>
                                            <svg className="w-4 h-4 text-slate-300 group-hover/btn:text-[#ff8a80] group-hover/btn:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                        </p>
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Item damaged or incorrect</p>
                                    </button>
                                </>
                            )}
                            {selectedOrder.status !== 'Delivered' && (
                                <p className="text-xs text-center text-slate-400 mt-6 italic p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner font-medium leading-relaxed">Reviews and Returns will unlock once your order is Delivered.</p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl animate-fade-in flex flex-col h-full">
                            <button type="button" onClick={() => { setSupportMode(null); setSupportData({...supportData, files: []}); }} className="text-xs font-bold text-slate-400 hover:text-[#ff8a80] mb-6 flex items-center gap-1.5 transition-colors w-fit group/back">
                                <svg className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Back to Menu
                            </button>
                            
                            <h4 className="font-bold text-slate-900 mb-6 text-lg tracking-tight">
                                {supportMode === 'complaint' && 'File a Complaint'}
                                {supportMode === 'review' && 'Write a Product Review'}
                                {supportMode === 'return' && 'Request a Return'}
                            </h4>

                            <form onSubmit={handleSupportSubmit} className="space-y-5 flex flex-col flex-grow">
                                
                                {(supportMode === 'review' || supportMode === 'return') && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Select Item *</label>
                                        <div className="relative">
                                            <select 
                                                required
                                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-slate-800 font-medium appearance-none shadow-sm transition-all"
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
                                            <svg className="w-4 h-4 absolute right-4 top-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                )}

                                {supportMode === 'review' && (
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Your Rating</label>
                                        <div className="flex gap-2.5 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner w-fit">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button 
                                                    key={star} type="button"
                                                    onClick={() => setSupportData({...supportData, rating: star})}
                                                    className={`text-2xl transition-all hover:scale-125 ${supportData.rating >= star ? 'text-amber-400 filter drop-shadow-sm' : 'text-slate-200'}`}
                                                >
                                                    <svg className="w-7 h-7 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex-grow flex flex-col">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                                        {supportMode === 'return' ? 'Reason for Return *' : 'Your Message *'}
                                    </label>
                                    <textarea 
                                        required
                                        rows={4}
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
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-slate-800 font-medium resize-none flex-grow shadow-inner transition-all placeholder:text-slate-400"
                                    ></textarea>
                                </div>

                                {(supportMode === 'complaint' || supportMode === 'return' || supportMode === 'review') && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2 mt-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Attach Images (Optional)</label>
                                            <span className="text-[10px] font-bold text-slate-400">{supportData.files.length}/3</span>
                                        </div>
                                        
                                        {supportData.files.length > 0 && (
                                            <div className="flex gap-3 mb-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                {supportData.files.map((file, i) => (
                                                    <div key={i} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group">
                                                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => removeSupportFile(i)} className="absolute inset-0 bg-rose-500/80 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center">Del</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <label className={`w-full h-12 bg-slate-50 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-200 text-slate-500 font-medium text-xs cursor-pointer transition ${supportData.files.length >= 3 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:border-[#FFAFA8] hover:text-[#ff8a80]'}`}>
                                            <input type="file" multiple className="hidden" accept="image/*" onChange={handleSupportFileChange} disabled={supportData.files.length >= 3}/>
                                            <span className="flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                                Upload Photos
                                            </span>
                                        </label>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={submittingSupport}
                                    className={`w-full py-4 mt-6 text-white rounded-full font-bold shadow-md transition-all tracking-wide text-sm
                                        ${submittingSupport ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] hover:shadow-lg hover:scale-[1.02]'}`}
                                >
                                    {submittingSupport ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Submitting...
                                        </span>
                                    ) : 'Submit Support Request'}
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