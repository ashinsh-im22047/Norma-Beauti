"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';

export default function PaymentPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'slip' | null>(null);
  const [loading, setLoading] = useState(false);

  // --- CUSTOM ALERT STATE ---
  const [alertState, setAlertState] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'error', // 'success' or 'error'
    redirectPath: '' 
  });

  const closeAlert = () => {
    setAlertState({ ...alertState, show: false });
    // Redirect if a path is provided (for success case)
    if (alertState.redirectPath) {
      router.push(alertState.redirectPath);
    }
  };

  // Dummy User Data for Confirmation
  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "Prabhani Maheeka",
    address: "123, Flower Road, Colombo 07",
    phone: "+94 77 123 4567"
  });

  const totalAmount = "11,950";

  const handleConfirmOrder = () => {
    if (!paymentMethod) {
        setAlertState({
            show: true,
            title: 'Payment Method Required',
            message: 'Please select a payment method to proceed.',
            type: 'error',
            redirectPath: ''
        });
        return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        setLoading(false);
        setAlertState({
            show: true,
            title: 'Order Placed!',
            message: 'Your order has been placed successfully.',
            type: 'success',
            redirectPath: '/my-orders'
        });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46]">
      <CustomerHeader />
      
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="container mx-auto px-6 py-12 relative z-10 flex justify-center">
        <div className="w-full max-w-3xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            
            <div className="flex items-center gap-4 mb-8 border-b border-[#D883B7]/30 pb-4">
                <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white shadow-sm transition">←</button>
                <h1 className="text-3xl font-serif font-bold text-[#4A1D46]">Checkout & Pay</h1>
            </div>

            <div className="flex flex-col gap-6">
                
                {/* --- 1. CONFIRM DELIVERY DETAILS (Attractive Box) --- */}
                <div className="bg-white/60 rounded-3xl p-6 border border-white/60 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#D883B7]"></div>
                    <div className="flex justify-between items-start mb-2">
                         <h3 className="text-sm font-bold text-[#7B2C62] uppercase tracking-wider flex items-center gap-2">
                            <span>📍</span> Delivery Details
                         </h3>
                         <button className="text-xs text-[#9B5DE5] font-bold underline hover:text-[#4A1D46]">Edit</button>
                    </div>
                    
                    <div className="ml-6 space-y-1">
                        <p className="text-lg font-bold text-[#4A1D46]">{deliveryDetails.name}</p>
                        <p className="text-sm text-gray-600">{deliveryDetails.address}</p>
                        <p className="text-sm text-gray-600">{deliveryDetails.phone}</p>
                    </div>
                </div>

                {/* --- 2. PAYMENT METHOD SELECTION --- */}
                <div>
                    <h3 className="text-lg font-bold mb-4 ml-2 text-[#4A1D46]">Select Payment Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Cash on Delivery (Icons Removed) */}
                        <div 
                            onClick={() => setPaymentMethod('cod')}
                            className={`cursor-pointer p-6 rounded-3xl border transition-all flex flex-col items-center justify-center gap-2 shadow-sm h-32 ${
                                paymentMethod === 'cod' 
                                ? 'bg-[#9B5DE5]/10 border-[#9B5DE5] shadow-md scale-105' 
                                : 'bg-white/40 border-white/60 hover:bg-white/60'
                            }`}
                        >
                            <span className="font-bold text-[#4A1D46] text-lg">Cash on Delivery</span>
                            {paymentMethod === 'cod' && <span className="text-[#9B5DE5] text-xs font-bold animate-pulse">Selected</span>}
                        </div>

                        {/* Upload Slip (Icons Removed) */}
                        <div 
                            onClick={() => setPaymentMethod('slip')}
                            className={`cursor-pointer p-6 rounded-3xl border transition-all flex flex-col items-center justify-center gap-2 shadow-sm h-32 ${
                                paymentMethod === 'slip' 
                                ? 'bg-[#D883B7]/10 border-[#D883B7] shadow-md scale-105' 
                                : 'bg-white/40 border-white/60 hover:bg-white/60'
                            }`}
                        >
                            <span className="font-bold text-[#4A1D46] text-lg">Upload Bank Slip</span>
                            {paymentMethod === 'slip' && <span className="text-[#D883B7] text-xs font-bold animate-pulse">Selected</span>}
                        </div>
                    </div>
                </div>

                {/* Bank Slip Upload Area */}
                {paymentMethod === 'slip' && (
                    <div className="bg-[#FFF0F5] p-6 rounded-3xl border border-[#F3E5F5] animate-fade-in-up">
                        <h4 className="font-bold text-[#4A1D46] mb-2">Bank Details</h4>
                        <div className="text-sm text-[#7B2C62] mb-4 space-y-1">
                            <p>Bank: <span className="font-bold">Commercial Bank</span></p>
                            <p>Account No: <span className="font-bold">1234-5678-9000</span></p>
                            <p>Branch: <span className="font-bold">Colombo 07</span></p>
                        </div>
                        <label className="block text-xs font-bold text-[#4A1D46] uppercase mb-2">Attach Slip</label>
                        <input type="file" className="w-full bg-white p-3 rounded-xl border border-gray-200 text-sm"/>
                    </div>
                )}

                {/* --- 3. CONFIRM BUTTON --- */}
                <div className="mt-4 pt-4 border-t border-[#D883B7]/30">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <span className="text-sm text-[#7B2C62]">Total Amount</span>
                        <span className="text-2xl font-bold text-[#4A1D46]">LKR {totalAmount}</span>
                    </div>
                    <button 
                        onClick={handleConfirmOrder}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all tracking-wide text-lg"
                    >
                        {loading ? 'Processing...' : 'Place Order'}
                    </button>
                </div>

            </div>
        </div>
      </main>

      {/* --- CUSTOM ELEGANT DIALOG BOX --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60">
              
              <div className="w-16 h-16 bg-[#FCE4EC] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-[#F8BBD0]">
                {alertState.type === 'success' ? '🎉' : '⚠️'}
              </div>

              <h3 className={`text-2xl font-serif font-bold mb-2 ${
                  alertState.type === 'error' ? 'text-[#880E4F]' : 'text-[#4A1D46]'
              }`}>
                {alertState.title}
              </h3>
              
              <p className="text-[#7B2C62] mb-8 font-medium">
                {alertState.message}
              </p>

              <button 
                onClick={closeAlert}
                className="px-10 py-3 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all w-full"
              >
                OK
              </button>
           </div>
        </div>
      )}

    </div>
  );
}