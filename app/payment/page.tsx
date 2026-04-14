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

  useEffect(() => {
    const storedItems = localStorage.getItem('checkoutItems');
    if (storedItems) setItems(JSON.parse(storedItems));
    else router.push('/cart');

    fetch('/api/profile')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
            if (data) setDetails({ name: data.name || '', address: data.address || '', phone: data.phone || '' });
        }).catch(err => console.error(err));
    
    fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
            if (data.min_delivery_days !== undefined) setDeliveryDays({ min: data.min_delivery_days, max: data.max_delivery_days });
        }).catch(err => console.error(err));

  }, [router]);

  const getDeliveryDates = () => {
    const today = new Date();
    const start = new Date(today); start.setDate(today.getDate() + deliveryDays.min);
    const end = new Date(today); end.setDate(today.getDate() + deliveryDays.max);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const numbersOnly = val.replace(/[^0-9]/g, '');
    if (numbersOnly.length <= 9) setDetails({ ...details, phone: `+94${numbersOnly}` });
  };

  const getPhoneDigits = () => {
    if (!details.phone) return '';
    return details.phone.startsWith('+94') ? details.phone.slice(3) : details.phone;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSlipFile(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!details.name.trim()) return setAlertState({ show: true, type: 'error', title: 'Missing Info', message: 'Name is required.', redirect: '' });
    if (!details.address.trim()) return setAlertState({ show: true, type: 'error', title: 'Missing Info', message: 'Address is required.', redirect: '' });
    const phoneDigits = getPhoneDigits();
    if (phoneDigits.length !== 9) return setAlertState({ show: true, type: 'error', title: 'Invalid Phone', message: 'Please enter exactly 9 digits after +94.', redirect: '' });
    if (paymentMethod === 'Slip' && !slipFile) return setAlertState({ show: true, type: 'error', title: 'Payment Slip Required', message: 'Please upload the bank transfer slip.', redirect: '' });

    setLoading(true);
    const total = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, total, method: paymentMethod, slip: slipFile, details })
        });

        if (res.ok) {
            localStorage.removeItem('checkoutItems');
            setAlertState({ show: true, type: 'success', title: 'Order Placed! 🎉', message: 'Your order has been placed successfully.', redirect: '/profile/my-orders' });
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

  const total = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46] pb-20">
      <CustomerHeader />
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        
        <div className="bg-[#4A1D46]/95 backdrop-blur-xl rounded-[2rem] p-10 md:p-12 shadow-2xl border border-white/20 mb-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D883B7]/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9B5DE5]/20 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <div className="inline-block bg-white/10 px-5 py-1.5 rounded-full border border-white/20 text-xs font-bold tracking-widest uppercase mb-4 text-[#F3E5F5] shadow-inner">
                    Final Step
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-wide mb-3">Secure Checkout</h1>
                <p className="text-[#D883B7] font-medium text-lg max-w-md mx-auto md:mx-0">
                    Confirm your details and complete your purchase.
                </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-4xl shadow-inner border border-white/20 relative group hover:scale-105 transition-transform duration-500">
                    <span className="animate-pulse drop-shadow-[0_0_15px_rgba(216,131,183,0.6)]">💳</span>
                </div>
            </div>
        </div>

        <div className="w-full max-w-4xl mx-auto bg-white/70 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-white/60">
             <form onSubmit={handlePlaceOrder} className="flex flex-col md:flex-row gap-12">
                
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center border-b pb-4 border-pink-100">
                        <h3 className="text-2xl font-serif font-bold text-[#4A1D46]">1. Delivery</h3>
                        <button type="button" onClick={() => setIsEditing(!isEditing)} className="text-xs font-bold text-[#880e4f] bg-pink-50 hover:bg-[#880e4f] hover:text-white px-4 py-2 rounded-full transition-all border border-pink-200 hover:border-transparent">
                            {isEditing ? 'Done' : '✎ Edit'}
                        </button>
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-bold text-[#D883B7] uppercase tracking-widest mb-1.5 ml-2">Name</label>
                        <input type="text" value={details.name} readOnly={!isEditing} onChange={e => setDetails({...details, name: e.target.value})} placeholder="Enter your full name" className={`w-full p-3.5 rounded-2xl border outline-none font-medium transition-colors ${isEditing ? 'bg-white border-pink-300 text-[#4A1D46] focus:ring-1 focus:ring-[#9B5DE5] shadow-sm' : 'bg-gray-50 border-transparent text-gray-500 cursor-default'}`} />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-[#D883B7] uppercase tracking-widest mb-1.5 ml-2">Address</label>
                        <input type="text" value={details.address} readOnly={!isEditing} onChange={e => setDetails({...details, address: e.target.value})} placeholder="Enter your address" className={`w-full p-3.5 rounded-2xl border outline-none font-medium transition-colors ${isEditing ? 'bg-white border-pink-300 text-[#4A1D46] focus:ring-1 focus:ring-[#9B5DE5] shadow-sm' : 'bg-gray-50 border-transparent text-gray-500 cursor-default'}`} />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-[#D883B7] uppercase tracking-widest mb-1.5 ml-2">Phone</label>
                        <div className={`flex items-center w-full p-3.5 rounded-2xl border transition-colors ${isEditing ? 'bg-white border-pink-300 focus-within:ring-1 focus-within:ring-[#9B5DE5] shadow-sm' : 'bg-gray-50 border-transparent'}`}>
                            <span className="text-gray-400 font-bold mr-2 select-none">+94</span>
                            <input type="text" value={getPhoneDigits()} readOnly={!isEditing} onChange={handlePhoneChange} placeholder="7XXXXXXXX" maxLength={9} className={`w-full outline-none bg-transparent font-medium ${isEditing ? 'text-[#4A1D46]' : 'text-gray-500 cursor-default'}`} />
                        </div>
                    </div>

                    <div className="mt-6 bg-[#F3E5F5] p-5 rounded-2xl border border-pink-100 flex items-center gap-4 shadow-sm">
                        <div className="text-3xl">🚚</div>
                        <div>
                            <p className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest">Estimated Delivery</p>
                            <p className="text-sm font-bold text-[#4A1D46]">{getDeliveryDates()}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-6 flex flex-col">
                    <div className="border-b pb-4 border-pink-100">
                        <h3 className="text-2xl font-serif font-bold text-[#4A1D46]">2. Payment</h3>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        <label className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3 font-bold transition-all ${paymentMethod === 'COD' ? 'bg-white border-[#9B5DE5] text-[#4A1D46] shadow-md' : 'bg-white/50 border-white text-gray-500 hover:bg-white'}`}>
                            <input type="radio" name="pay" className="hidden" onClick={() => setPaymentMethod('COD')} />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-[#9B5DE5]' : 'border-gray-300'}`}>
                                {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-[#9B5DE5]"></div>}
                            </div>
                            Cash On Delivery
                        </label>

                        <label className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3 font-bold transition-all ${paymentMethod === 'Slip' ? 'bg-white border-[#9B5DE5] text-[#4A1D46] shadow-md' : 'bg-white/50 border-white text-gray-500 hover:bg-white'}`}>
                            <input type="radio" name="pay" className="hidden" onClick={() => setPaymentMethod('Slip')} />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Slip' ? 'border-[#9B5DE5]' : 'border-gray-300'}`}>
                                {paymentMethod === 'Slip' && <div className="w-2.5 h-2.5 rounded-full bg-[#9B5DE5]"></div>}
                            </div>
                            Bank Transfer Slip
                        </label>
                    </div>

                    {paymentMethod === 'Slip' && (
                        <div className="p-6 bg-white/50 rounded-2xl border border-dashed border-[#D883B7] text-center animate-fade-in">
                            <p className="text-xs font-bold text-[#ad1457] uppercase tracking-widest mb-3">Upload Transfer Slip</p>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-pink-50 file:text-[#880e4f] hover:file:bg-pink-100 cursor-pointer" />
                        </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-pink-100">
                        <div className="flex justify-between items-center text-xl font-bold text-[#4A1D46] mb-6 bg-[#F3E5F5] p-5 rounded-2xl">
                            <span className="uppercase tracking-widest text-sm">Total</span>
                            <span className="text-2xl text-[#880e4f]">LKR {total.toLocaleString()}</span>
                        </div>
                        <button disabled={loading} type="submit" className="w-full py-4 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all disabled:opacity-70 border border-white/20">
                            {loading ? "Processing..." : "Place Order Securely"}
                        </button>
                    </div>
                </div>
             </form>
        </div>
      </main>

      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border ${alertState.type === 'success' ? 'bg-green-50 border-green-200 text-green-500' : 'bg-[#FFF9C4] border-[#FFF59D] text-yellow-600'}`}>
                {alertState.type === 'success' ? '✨' : '⚠️'}
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">{alertState.title}</h3>
              <p className="text-[#7B2C62] mb-8 font-medium text-sm">{alertState.message}</p>
              <button onClick={closeAlert} className={`px-10 py-3 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all w-full border border-white/20 ${alertState.type === 'success' ? 'bg-gradient-to-r from-[#D883B7] to-[#9B5DE5]' : 'bg-gray-800'}`}>
                {alertState.type === 'success' ? 'Continue' : 'Close'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}