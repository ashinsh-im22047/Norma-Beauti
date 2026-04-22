// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [confirmDialog, setConfirmDialog] = useState({ show: false, itemId: '', itemType: '', itemName: '' });
  const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'success', redirect: '' });

  useEffect(() => { 
    fetchWishlist(); 
  }, []);

  // Fetch the user's wishlist items from the backend API and update the component state accordingly, handling loading state and any potential errors during the fetch process
  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/whishlist'); // Matching your folder name
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.items || []);
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  // Handle the confirmation and execution of deleting an item from the wishlist by sending a DELETE request to the backend API with the relevant item details, refreshing the wishlist upon successful deletion, and managing the confirmation dialog state
  const confirmDelete = async () => {
    try {
      const { itemId, itemType } = confirmDialog;
      const res = await fetch('/api/whishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, type: itemType }),
      });
      if (res.ok) fetchWishlist(); 
    } catch (error) { 
      console.error(error); 
    }
    setConfirmDialog({ show: false, itemId: '', itemType: '', itemName: '' });
  };

  // --- ENHANCEMENT: ADD TO CART & THEN REMOVE FROM WISHLIST ---
  const handleAddToCart = async (item: any) => {
    try {
        // 1. Add to Cart
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, type: item.type, quantity: 1, price: item.price }),
        });

        if (res.ok) {
            setAlertState({ show: true, title: 'Added to Cart', message: `"${item.name}" has been successfully added to your cart.`, type: 'success', redirect: '' });
            
            // 2. Remove from Wishlist after successful addition
            await fetch('/api/whishlist', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, type: item.type }),
            });
            
            // 3. Refresh Wishlist
            fetchWishlist();
            
        } else {
            const data = await res.json();
            setAlertState({ show: true, title: 'Notice', message: data.error || 'Failed to add item.', type: 'error', redirect: '' });
        }
    } catch (error) {
        setAlertState({ show: true, title: 'Error', message: 'Failed to connect.', type: 'error', redirect: '' });
    }
  };

  const closeAlert = () => {
      setAlertState({ ...alertState, show: false });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
      <CustomerHeader />
      
      <main className="container mx-auto px-4 md:px-6 py-10 max-w-[1200px]">
        
        {/* --- HERO SECTION --- */}
        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-sm border border-slate-100 mb-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#fff5f4] to-transparent pointer-events-none opacity-80"></div>
            
            <div className="relative z-10 text-center md:text-left">
                
                {/* ENHANCEMENT: BACK BUTTON */}
                <button 
                    onClick={() => router.back()} 
                    className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#F76D82] transition-colors uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full w-fit mx-auto md:mx-0 border border-slate-100"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Go Back
                </button>

                <div className="inline-block bg-[#fff5f4] px-4 py-1.5 rounded-full border border-[#FFAFA8]/30 text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-[#F76D82]">
                    Favorites Ready
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-slate-900">Your Wishlist</h1>
                <p className="text-slate-500 font-medium text-sm md:text-base max-w-md mx-auto md:mx-0">
                    Review your favorite items and add them directly to your secure cart.
                </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-slate-100 relative">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    {wishlistItems.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-[#F76D82] text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-sm border border-white">
                            {wishlistItems.length}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- WISHLIST ITEMS LIST --- */}
        {loading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F76D82]"></div>
            </div>
        ) : wishlistItems.length === 0 ? (
           <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-16 text-center max-w-3xl mx-auto flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300 border border-slate-100">
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
             </div>
             <p className="text-xl font-bold text-slate-900 mb-2">Your wishlist is empty.</p>
             <p className="text-slate-500 mb-8 font-medium text-sm">Save items you love here to easily find them later.</p>
             <button onClick={() => router.push('/shop')} className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold shadow-sm hover:bg-[#F76D82] transition-colors text-xs tracking-widest uppercase">
                 Return to Shop
             </button>
           </div>
        ) : (
          <div className="flex flex-col gap-4">
              {wishlistItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-4 flex flex-col md:flex-row items-center gap-6 transition-all hover:shadow-md">
                  
                  {/* Image */}
                  <div className="w-full md:w-32 h-32 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-slate-50">
                      {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                      ) : (
                          <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                  </div>
                  
                  {/* Details */}
                  <div className="flex flex-col flex-1 text-center md:text-left w-full">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{item.type}</p>
                      <h3 className="font-bold text-slate-900 text-lg mb-1">{item.name}</h3>
                      <p className="font-bold text-slate-900 text-base">LKR {parseFloat(item.price).toLocaleString()}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-center md:justify-end mt-2 md:mt-0">
                      <button 
                          onClick={() => handleAddToCart(item)} 
                          className="px-6 py-2.5 bg-[#fff5f4] text-[#F76D82] rounded-full font-bold text-xs tracking-widest uppercase hover:bg-[#F76D82] hover:text-white transition-colors border border-[#FFAFA8]/30"
                      >
                          Add to Cart
                      </button>
                      <button 
                          onClick={() => setConfirmDialog({ show: true, itemId: item.id, itemType: item.type, itemName: item.name })}
                          className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Remove from Wishlist"
                      >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                  </div>

                </div>
              ))}
          </div>
        )}
      </main>

      {/* --- CONFIRMATION DIALOG --- */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border-t-8 border-rose-500">
              <h3 className="text-xl font-bold mb-2 text-slate-900">Remove Item?</h3>
              <p className="text-slate-500 mb-8 text-sm">Are you sure you want to remove "{confirmDialog.itemName}" from your wishlist?</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setConfirmDialog({ ...confirmDialog, show: false })} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 text-xs">Cancel</button>
                <button onClick={confirmDelete} className="px-6 py-2.5 bg-rose-500 text-white rounded-full font-bold hover:bg-rose-600 text-xs">Remove</button>
              </div>
           </div>
        </div>
      )}

      {/* --- CUSTOM ALERT DIALOG --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border-t-8 border-[#F76D82]">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg ${alertState.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {alertState.type === 'success' ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 tracking-tight">{alertState.title}</h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">{alertState.message}</p>
              <button onClick={closeAlert} className="w-full py-3.5 bg-slate-900 text-white rounded-full font-bold hover:bg-[#F76D82] transition-colors text-xs tracking-widest uppercase">
                Continue
              </button>
           </div>
        </div>
      )}
    </div>
  );
}