"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Custom Alert & Confirm Dialog States
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    itemId: '',
    itemType: '',
    itemName: ''
  });

  const [alertState, setAlertState] = useState({
    show: false,
    title: '',
    message: '',
    type: 'success' 
  });

  useEffect(() => { 
    fetchWishlist(); 
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setWishlistItems(data.items || []);
      }
    } catch (e) { 
      console.error("Failed to fetch wishlist", e); 
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (id: string, type: string, name: string) => {
    setConfirmDialog({ show: true, itemId: id, itemType: type, itemName: name });
  };

  const confirmDelete = async () => {
    try {
      const { itemId, itemType } = confirmDialog;
      const res = await fetch('/api/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, type: itemType }),
      });
      if (res.ok) {
        fetchWishlist(); 
      }
    } catch (error) { 
      console.error("Error removing item", error); 
    }
    setConfirmDialog({ show: false, itemId: '', itemType: '', itemName: '' });
  };

  const cancelDelete = () => setConfirmDialog({ show: false, itemId: '', itemType: '', itemName: '' });
  const closeAlert = () => setAlertState({ show: false, title: '', message: '', type: 'success' });

  const handleAddToCart = async (item: any) => {
    try {
        const res = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: item.id, type: item.type, quantity: 1 }),
        });

        if (res.ok) {
            setAlertState({
                show: true,
                title: 'Added to Bag!',
                message: `"${item.name}" has been successfully added to your shopping bag.`,
                type: 'success'
            });
        } else {
            throw new Error("Failed to add");
        }
    } catch (error) {
        setAlertState({
            show: true,
            title: 'Oops!',
            message: `Something went wrong while adding "${item.name}" to your bag.`,
            type: 'warning'
        });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46] pb-20">
      <CustomerHeader />
      
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* --- ELEGANT CUSTOMER HERO SECTION --- */}
        <div className="bg-[#4A1D46]/95 backdrop-blur-xl rounded-[2rem] p-10 md:p-12 shadow-2xl border border-white/20 mb-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Decorative background glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D883B7]/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9B5DE5]/20 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <div className="inline-block bg-white/10 px-5 py-1.5 rounded-full border border-white/20 text-xs font-bold tracking-widest uppercase mb-4 text-[#F3E5F5] shadow-inner">
                    My Favorites
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-wide mb-3">Your Wishlist</h1>
                <p className="text-[#D883B7] font-medium text-lg max-w-md mx-auto md:mx-0">
                    Curate your personal collection of must-have beauty items and custom gift boxes.
                </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-4xl shadow-inner border border-white/20 relative group hover:scale-105 transition-transform duration-500">
                    <span className="animate-pulse drop-shadow-[0_0_15px_rgba(216,131,183,0.6)]">💖</span>
                    {wishlistItems.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-lg border border-white/20">
                            {wishlistItems.length}
                        </div>
                    )}
                </div>
            </div>
        </div>
        {/* --- END HERO SECTION --- */}

        {loading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#880e4f]"></div>
            </div>
        ) : wishlistItems.length === 0 ? (
           <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/60 p-16 text-center max-w-2xl mx-auto">
             <div className="text-6xl mb-4 opacity-70">✨</div>
             <p className="text-2xl font-serif font-bold text-[#880e4f] mb-2">Your wishlist is empty.</p>
             <p className="text-[#7B2C62] mb-8 font-medium">Looks like you haven't saved any favorites yet!</p>
             <button onClick={() => router.push('/shop')} className="px-8 py-3 bg-gradient-to-r from-[#880e4f] to-[#ad1457] text-white rounded-full font-bold shadow-lg hover:scale-105 hover:shadow-pink-300 transition-all border border-white/20">
                 Explore Products
             </button>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlistItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                  
                  {/* Image Container */}
                  <div className="relative w-full h-56 bg-gray-50 flex items-center justify-center overflow-hidden">
                      {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.name} />
                      ) : (
                          <span className="text-4xl opacity-50">📷</span>
                      )}
                      
                      {/* Delete Button */}
                      <button 
                        onClick={() => openDeleteDialog(item.id, item.type, item.name)} 
                        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-md rounded-full transition-all shadow-sm z-10" 
                        title="Remove from Wishlist"
                      >
                        ✕
                      </button>
                  </div>
                  
                  {/* Details Container */}
                  <div className="p-5 flex flex-col flex-grow">
                    <p className="text-[10px] text-[#D883B7] font-bold uppercase tracking-widest mb-1">{item.type}</p>
                    <h3 className="font-bold text-[#4a1d46] text-lg leading-tight mb-2 line-clamp-1">{item.name}</h3>
                    <p className="font-bold text-[#c2185b] text-lg mt-auto mb-4">LKR {parseFloat(item.price).toLocaleString()}</p>
                    
                    <button 
                        onClick={() => handleAddToCart(item)} 
                        className="w-full py-2.5 rounded-full font-bold text-sm bg-pink-50 text-[#880e4f] border border-pink-200 hover:bg-gradient-to-r hover:from-[#880e4f] hover:to-[#ad1457] hover:text-white hover:border-transparent transition-all hover:shadow-lg"
                    >
                        Add to Bag
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      {/* --- CONFIRMATION DIALOG --- */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60">
              <div className="w-16 h-16 bg-[#FFEBEE] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-[#FFCDD2] text-red-500">💔</div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">Remove Item?</h3>
              <p className="text-[#7B2C62] mb-8 font-medium text-sm">Are you sure you want to remove <br/><span className="font-bold text-[#880e4f] text-base">"{confirmDialog.itemName}"</span> <br/>from your wishlist?</p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-gradient-to-r from-[#e53935] to-[#d32f2f] text-white rounded-xl font-bold shadow-lg hover:shadow-red-200 hover:scale-105 transition-all">Yes, Remove</button>
              </div>
           </div>
        </div>
      )}

      {/* --- CUSTOM ALERT DIALOG --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 relative">
              <button onClick={closeAlert} className="absolute top-5 right-5 text-gray-400 hover:text-[#880e4f] transition-colors p-2 text-xl leading-none" aria-label="Close">✕</button>
              
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border 
                  ${alertState.type === 'success' ? 'bg-green-50 border-green-200 text-green-500' : 'bg-[#FFF9C4] border-[#FFF59D] text-yellow-600'}`}>
                {alertState.type === 'success' ? '🛍️' : '⚠️'}
              </div>
              
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">{alertState.title}</h3>
              <p className="text-[#7B2C62] mb-8 font-medium text-sm">{alertState.message}</p>
              
              <button onClick={closeAlert} className="px-10 py-3 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all w-full border border-white/20">
                Continue Shopping
              </button>
           </div>
        </div>
      )}
    </div>
  );
}