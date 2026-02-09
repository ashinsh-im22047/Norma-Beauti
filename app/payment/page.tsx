"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function PaymentPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // FORM STATE
  const [details, setDetails] = useState({ 
    name: '', 
    address: '', 
    phone: '' // Stores full format: +947XXXXXXXX
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Slip'>('COD');
  const [slipFile, setSlipFile] = useState<string | null>(null);

  // --- CUSTOM ALERT STATE ---
  const [alertState, setAlertState] = useState({ 
    show: false, 
    type: 'success', // 'success' or 'error'
    title: '', 
    message: '',
    redirect: '' // Optional redirection path
  });

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, show: false }));
    // If a redirect path exists (e.g., after success), navigate there
    if (alertState.redirect) {
        router.push(alertState.redirect);
    }
  };

  useEffect(() => {
    // 1. Load Cart Items
    const storedItems = localStorage.getItem('checkoutItems');
    if (storedItems) {
        setItems(JSON.parse(storedItems));
    } else {
        router.push('/cart');
    }

    // 2. FETCH PROFILE DATA (To Pre-fill Form)
    const fetchProfileData = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
           const data = await res.json();
           setDetails({
             name: data.name || '',
             address: data.address || '',
             phone: data.phone || '' 
           });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    
    fetchProfileData();
  }, [router]);

  // --- PHONE INPUT HANDLER ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const numbersOnly = val.replace(/[^0-9]/g, '');
    
    // Limit to 9 digits
    if (numbersOnly.length <= 9) {
        setDetails({ ...details, phone: `+94${numbersOnly}` });
    }
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
    
    // --- STRICT VALIDATION WITH CUSTOM DIALOGS ---

    // 1. Validate Name
    if (!details.name.trim()) {
        setAlertState({
            show: true, type: 'error', title: 'Missing Information', 
            message: 'Name is required. Please fill in your name.', redirect: ''
        });
        return;
    }

    // 2. Validate Address
    if (!details.address.trim()) {
        setAlertState({
            show: true, type: 'error', title: 'Missing Information', 
            message: 'Address is required. Please fill in your delivery address.', redirect: ''
        });
        return;
    }

    // 3. Validate Phone (Must be exactly 9 digits after +94)
    const phoneDigits = getPhoneDigits();
    if (phoneDigits.length !== 9) {
        setAlertState({
            show: true, type: 'error', title: 'Invalid Phone Number', 
            message: 'Please enter exactly 9 digits after +94.', redirect: ''
        });
        return;
    }

    // 4. Validate Slip
    if (paymentMethod === 'Slip' && !slipFile) {
        setAlertState({
            show: true, type: 'error', title: 'Payment Slip Required', 
            message: 'Please upload the bank transfer slip to continue.', redirect: ''
        });
        return;
    }

    setLoading(true);
    const total = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items,
                total,
                method: paymentMethod,
                slip: slipFile,
                details 
            })
        });

        if (res.ok) {
            localStorage.removeItem('checkoutItems');
            // SUCCESS DIALOG WITH REDIRECT
            setAlertState({
                show: true, type: 'success', title: 'Order Placed! 🚀', 
                message: 'Your order has been placed successfully.', 
                redirect: '/profile/my-orders'
            });
        } else {
            const err = await res.json();
            setAlertState({
                show: true, type: 'error', title: 'Order Failed', 
                message: err.error || 'Failed to place order. Please try again.', redirect: ''
            });
        }
    } catch (error) { 
        console.error(error);
        setAlertState({
            show: true, type: 'error', title: 'System Error', 
            message: 'Something went wrong. Please check your connection.', redirect: ''
        });
    } finally { 
        setLoading(false); 
    }
  };

  const total = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

  return (
    <div className="min-h-screen bg-[#fff0f5]">
      <CustomerHeader />
      <main className="container mx-auto px-6 py-12 flex justify-center">
        <div className="w-full max-w-4xl bg-white/80 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-white/60">
             <h2 className="text-3xl font-serif font-bold text-[#880e4f] mb-8 text-center">Checkout</h2>
             
             <form onSubmit={handlePlaceOrder} className="flex flex-col md:flex-row gap-10">
                
                {/* 1. DELIVERY DETAILS */}
                <div className="flex-1 space-y-6">
                    <h3 className="text-xl font-bold text-[#ad1457]">1. Delivery Details</h3>
                    <p className="text-xs text-gray-500 mb-4">Edit address for this order if needed.</p>
                    
                    <div>
                        <label className="block text-xs font-bold text-[#ad1457] uppercase mb-1">Name</label>
                        <input 
                            type="text" 
                            value={details.name} 
                            onChange={e => setDetails({...details, name: e.target.value})} 
                            placeholder="Enter your full name"
                            className="w-full p-3 rounded-xl bg-white border border-gray-200 focus:border-[#880e4f] outline-none" 
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#ad1457] uppercase mb-1">Address</label>
                        <input 
                            type="text" 
                            value={details.address} 
                            onChange={e => setDetails({...details, address: e.target.value})} 
                            placeholder="Enter your address"
                            className="w-full p-3 rounded-xl bg-white border border-gray-200 focus:border-[#880e4f] outline-none" 
                        />
                    </div>

                    {/* PHONE INPUT WITH FIXED +94 */}
                    <div>
                        <label className="block text-xs font-bold text-[#ad1457] uppercase mb-1">Phone</label>
                        <div className="flex items-center w-full p-3 rounded-xl bg-white border border-gray-200 focus-within:border-[#880e4f]">
                            <span className="text-gray-500 font-bold mr-2 select-none">+94</span>
                            <input 
                                type="text" 
                                value={getPhoneDigits()} 
                                onChange={handlePhoneChange} 
                                placeholder="7XXXXXXXX"
                                maxLength={9}
                                className="w-full outline-none bg-transparent" 
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Enter exactly 9 digits.</p>
                    </div>
                </div>

                {/* 2. PAYMENT METHOD */}
                <div className="flex-1 space-y-6">
                    <h3 className="text-xl font-bold text-[#ad1457]">2. Payment Method</h3>
                    <div className="flex gap-4">
                        <label className={`flex-1 p-4 rounded-xl border cursor-pointer text-center font-bold transition ${paymentMethod === 'COD' ? 'bg-[#880e4f] text-white border-[#880e4f]' : 'bg-white text-gray-500'}`}>
                            <input type="radio" name="pay" className="hidden" onClick={() => setPaymentMethod('COD')} />
                            Cash On Delivery
                        </label>
                        <label className={`flex-1 p-4 rounded-xl border cursor-pointer text-center font-bold transition ${paymentMethod === 'Slip' ? 'bg-[#880e4f] text-white border-[#880e4f]' : 'bg-white text-gray-500'}`}>
                            <input type="radio" name="pay" className="hidden" onClick={() => setPaymentMethod('Slip')} />
                            Upload Slip
                        </label>
                    </div>

                    {paymentMethod === 'Slip' && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
                            <p className="text-sm text-gray-500 mb-2">Upload Bank Transfer Slip</p>
                            <input type="file" accept="image/*" onChange={handleFileChange} />
                        </div>
                    )}

                    <div className="pt-6 border-t mt-4">
                        <div className="flex justify-between text-xl font-bold text-[#880e4f] mb-4">
                            <span>Total</span>
                            <span>LKR {total.toFixed(2)}</span>
                        </div>
                        <button disabled={loading} type="submit" className="w-full py-4 bg-gradient-to-r from-[#880e4f] to-[#d81b60] text-white rounded-xl font-bold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-70">
                            {loading ? "Placing Order..." : "Place Order"}
                        </button>
                    </div>
                </div>
             </form>
        </div>
      </main>

      {/* --- CUSTOM ELEGANT DIALOG BOX --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60">
              
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border ${alertState.type === 'success' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                {alertState.type === 'success' ? '✅' : '⚠️'}
              </div>

              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">
                {alertState.title}
              </h3>
              
              <p className="text-[#7B2C62] mb-8 font-medium">
                {alertState.message}
              </p>

              <button 
                onClick={closeAlert}
                className={`px-10 py-3 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all ${alertState.type === 'success' ? 'bg-gradient-to-r from-[#880e4f] to-[#d81b60]' : 'bg-gray-800'}`}
              >
                {alertState.type === 'success' ? 'Okay' : 'Close'}
              </button>
           </div>
        </div>
      )}

    </div>
  );
}