// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [deliveryDays, setDeliveryDays] = useState({ min: 3, max: 5 });
  const [deliveryFee, setDeliveryFee] = useState(350); // State for Delivery Fee
  
  const [details, setDetails] = useState({ name: '', address: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Slip'>('COD');
  const [slipFile, setSlipFile] = useState<string | null>(null);

  const [alertState, setAlertState] = useState({ 
    show: false, type: 'success', title: '', message: '', redirect: ''
  });

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, show: false }));
    if (alertState.redirect) router.push(alertState.redirect);
  };

  // Load cart items, user profile, and settings on component mount
  useEffect(() => {
    const storedItems = localStorage.getItem('checkoutItems');
    if (storedItems) setItems(JSON.parse(storedItems));
    else router.push('/cart');

    const storedFee = localStorage.getItem('deliveryFee');
    if (storedFee) setDeliveryFee(parseFloat(storedFee));

    fetch('/api/profile')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data) setDetails({ name: data.name || '', address: data.address || '', phone: data.phone || '' });
        }).catch(err => console.error(err));
    
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            if (data.min_delivery_days !== undefined) setDeliveryDays({ min: data.min_delivery_days, max: data.max_delivery_days });
            if (data.delivery_fee !== undefined) setDeliveryFee(data.delivery_fee);
        }).catch(err => console.error(err));

  }, [router]);

  // Calculate and format estimated delivery date range based on current date and settings
  const getDeliveryDates = () => {
    const today = new Date();
    const start = new Date(today); start.setDate(today.getDate() + deliveryDays.min);
    const end = new Date(today); end.setDate(today.getDate() + deliveryDays.max);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
  };
// Handle phone number input, ensuring only digits are entered and formatted with +94 country code
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const numbersOnly = val.replace(/[^0-9]/g, '');
    if (numbersOnly.length <= 9) setDetails({ ...details, phone: `+94${numbersOnly}` });
  };

  // Extract digits from phone number for validation, ensuring it starts with +94 and has exactly 9 digits after
  const getPhoneDigits = () => {
    if (!details.phone) return '';
    return details.phone.startsWith('+94') ? details.phone.slice(3) : details.phone;
  };

  // Handle file input change for payment slip upload, converting the selected image to a base64 string for storage and later submission to the backend
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSlipFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

// Handle the final order placement process, including validation of user inputs, preparation of order data, communication with the backend API, and user feedback through alerts
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!details.name.trim()) return setAlertState({ show: true, type: 'error', title: 'Missing Info', message: 'Name is required.', redirect: '' });
    if (!details.address.trim()) return setAlertState({ show: true, type: 'error', title: 'Missing Info', message: 'Address is required.', redirect: '' });
    const phoneDigits = getPhoneDigits();
    if (phoneDigits.length !== 9) return setAlertState({ show: true, type: 'error', title: 'Invalid Phone', message: 'Please enter exactly 9 digits after +94.', redirect: '' });
    if (paymentMethod === 'Slip' && !slipFile) return setAlertState({ show: true, type: 'error', title: 'Payment Slip Required', message: 'Please upload the bank transfer slip.', redirect: '' });

    setLoading(true);
    
    // Add delivery fee to the final total sent to the database
    const itemsTotal = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    const finalTotalWithDelivery = itemsTotal + deliveryFee;

    const formattedItems = items.map(item => {
        const itemId = item.id || item.productid || item.itemid;
        const itemName = item.name || item.productname || item.itemname;
        let itemType = item.type;
        if (!itemType) {
             itemType = String(itemId).toUpperCase().includes('PROD') ? 'product' : 'item';
        }
        return { ...item, id: itemId, name: itemName, type: itemType };
    });

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: formattedItems, total: finalTotalWithDelivery, method: paymentMethod, slip: slipFile, details })
        });

        if (res.ok) {
            localStorage.removeItem('checkoutItems');
            localStorage.removeItem('deliveryFee');
            setAlertState({ show: true, type: 'success', title: 'Order Placed!', message: 'Your order has been placed successfully.', redirect: '/profile/my-orders' });
        } else {
            const err = await res.json();
            setAlertState({ show: true, type: 'error', title: 'Order Failed', message: err.error || 'Failed to place order.', redirect: '' });
        }
    } catch (error) { 
        setAlertState({ show: true, type: 'error', title: 'System Error', message: 'Something went wrong.', redirect: '' });
    } finally { 
        setLoading(false); 
    }
  };

  // Calculate total amounts for items and final payable amount including delivery fee, ensuring that if there are no items the total is shown as 0
  const itemsTotal = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
  const finalTotal = itemsTotal > 0 ? itemsTotal + deliveryFee : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
      <CustomerHeader />
      <main className="container mx-auto px-4 md:px-6 py-10 max-w-[1400px]">
        
        {/* --- ELEGANT CUSTOMER HERO SECTION --- */}
        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-sm border border-slate-200 mb-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <div className="inline-block bg-[#fff5f4] px-5 py-1.5 rounded-full border border-[#FFAFA8]/30 text-xs font-bold tracking-widest uppercase mb-4 text-[#ff8a80] shadow-sm">
                    Final Step
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-slate-900">Secure Checkout</h1>
                <p className="text-slate-500 font-medium text-lg max-w-md mx-auto md:mx-0">
                    Confirm your details and complete your purchase.
                </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shadow-inner border border-slate-100 relative group hover:bg-white hover:shadow-md hover:border-[#FFAFA8] transition-all duration-300">
                    <svg className="w-10 h-10 group-hover:text-[#ff8a80] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
            </div>
        </div>

        <div className="w-full max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-200">
             <form onSubmit={handlePlaceOrder} className="flex flex-col md:flex-row gap-12">
                
                {/* 1. DELIVERY SECTION */}
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center border-b pb-4 border-slate-100">
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">1. Delivery</h3>
                        <button type="button" onClick={() => setIsEditing(!isEditing)} className="text-[10px] font-bold text-slate-500 bg-slate-50 hover:bg-[#fff5f4] hover:text-[#ff8a80] px-4 py-2 rounded-full transition-all border border-slate-200 hover:border-[#FFAFA8] uppercase tracking-widest shadow-sm">
                            {isEditing ? 'Done' : 'Edit Details'}
                        </button>
                    </div>
                    
                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-2">Full Name</label>
                            <div className="relative">
                                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <input type="text" value={details.name} readOnly={!isEditing} onChange={e => setDetails({...details, name: e.target.value})} placeholder="Full Name" className={`w-full pl-12 pr-6 py-3.5 rounded-full border outline-none font-medium transition-all text-sm ${isEditing ? 'bg-white border-[#FFAFA8] text-slate-800 focus:ring-2 focus:ring-[#FFAFA8]/20 shadow-sm' : 'bg-slate-50 border-transparent text-slate-500 cursor-default'}`} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-2">Shipping Address</label>
                            <div className="relative">
                                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <input type="text" value={details.address} readOnly={!isEditing} onChange={e => setDetails({...details, address: e.target.value})} placeholder="Shipping Address" className={`w-full pl-12 pr-6 py-3.5 rounded-full border outline-none font-medium transition-all text-sm ${isEditing ? 'bg-white border-[#FFAFA8] text-slate-800 focus:ring-2 focus:ring-[#FFAFA8]/20 shadow-sm' : 'bg-slate-50 border-transparent text-slate-500 cursor-default'}`} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-2">Phone Number</label>
                            <div className={`flex items-center w-full px-1 py-1 rounded-full border transition-all ${isEditing ? 'bg-white border-[#FFAFA8] ring-2 ring-[#FFAFA8]/20 shadow-sm' : 'bg-slate-50 border-transparent'}`}>
                                <span className="bg-slate-100 text-slate-500 font-bold px-4 py-2.5 rounded-full select-none text-xs border border-slate-200">+94</span>
                                <input type="text" value={getPhoneDigits()} readOnly={!isEditing} onChange={handlePhoneChange} placeholder="7XXXXXXXX" maxLength={9} className={`flex-1 outline-none bg-transparent font-medium px-3 text-sm ${isEditing ? 'text-slate-800' : 'text-slate-500 cursor-default'}`} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-gradient-to-br from-white to-[#fffafa] p-6 rounded-3xl border border-slate-100 flex items-center gap-5 shadow-sm">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Delivery</p>
                            <p className="text-base font-bold text-slate-800 tracking-tight">{getDeliveryDates()}</p>
                            <p className="text-xs font-bold text-[#ff8a80] mt-1">Delivery Fee: LKR {deliveryFee.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* 2. PAYMENT SECTION */}
                <div className="flex-1 space-y-6 flex flex-col">
                    <div className="border-b pb-4 border-slate-100">
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">2. Payment</h3>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                        <label className={`p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 font-bold transition-all shadow-sm group ${paymentMethod === 'COD' ? 'bg-[#fff5f4] border-[#FFAFA8] text-[#ff8a80]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}>
                            <input type="radio" name="pay" className="hidden" onClick={() => setPaymentMethod('COD')} />
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'COD' ? 'border-[#FFAFA8] bg-white' : 'border-slate-300 bg-slate-50'}`}>
                                {paymentMethod === 'COD' && <div className="w-3 h-3 rounded-full bg-[#ff8a80]"></div>}
                            </div>
                            <span className="flex-1">Cash On Delivery</span>
                            <svg className={`w-5 h-5 transition-colors ${paymentMethod === 'COD' ? 'text-[#ff8a80]' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </label>

                        <label className={`p-5 rounded-2xl border-2 cursor-pointer flex items-center gap-4 font-bold transition-all shadow-sm group ${paymentMethod === 'Slip' ? 'bg-[#fff5f4] border-[#FFAFA8] text-[#ff8a80]' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}>
                            <input type="radio" name="pay" className="hidden" onClick={() => setPaymentMethod('Slip')} />
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'Slip' ? 'border-[#FFAFA8] bg-white' : 'border-slate-300 bg-slate-50'}`}>
                                {paymentMethod === 'Slip' && <div className="w-3 h-3 rounded-full bg-[#ff8a80]"></div>}
                            </div>
                            <span className="flex-1">Bank Transfer Slip</span>
                            <svg className={`w-5 h-5 transition-colors ${paymentMethod === 'Slip' ? 'text-[#ff8a80]' : 'text-slate-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </label>
                    </div>

                    {paymentMethod === 'Slip' && (
                        <div className="p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-center animate-fade-in">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Upload Transfer Slip</p>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:tracking-widest file:bg-white file:text-slate-700 hover:file:bg-slate-100 file:shadow-sm file:transition-all cursor-pointer" />
                        </div>
                    )}

                    <div className="mt-auto pt-8 border-t border-slate-100">
                        <div className="w-full space-y-3 mb-6 px-2">
                            <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                                <span>Items Total</span>
                                <span>LKR {itemsTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                                <span>Delivery Fee</span>
                                <span>LKR {deliveryFee.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xl font-bold text-slate-900 mb-8 bg-slate-50 p-6 rounded-[1.5rem] shadow-inner">
                            <span className="uppercase tracking-widest text-[10px] text-[#ff8a80] font-bold">Total Payable</span>
                            <span className="text-2xl tracking-tight">LKR {finalTotal.toLocaleString()}</span>
                        </div>
                        <button disabled={loading} type="submit" className={`w-full py-4 rounded-full font-bold text-white shadow-md tracking-wide transition-all border border-transparent flex items-center justify-center gap-2 ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] hover:shadow-lg hover:scale-[1.02]'}`}>
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processing...</>
                            ) : (
                                <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg> Place Order Securely</>
                            )}
                        </button>
                    </div>
                </div>
             </form>
        </div>
      </main>

      {/* --- CUSTOM ELEGANT DIALOG BOX --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 relative transform transition-all scale-100">
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 
                  ${alertState.type === 'success' ? 'bg-emerald-50 border-white text-emerald-500 shadow-emerald-200' : 'bg-rose-50 border-white text-rose-500 shadow-rose-200'}`}>
                {alertState.type === 'success' ? (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">{alertState.title}</h3>
              <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed whitespace-pre-line">{alertState.message}</p>
              
              <button onClick={closeAlert} className={`px-10 py-3.5 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all w-full tracking-wide ${alertState.type === 'success' ? 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80]' : 'bg-slate-800'}`}>
                {alertState.type === 'success' ? 'Continue' : 'Close'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}