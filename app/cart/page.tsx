"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    itemId: '',
    itemType: '',
    itemName: ''
  });

  const [alertState, setAlertState] = useState({
    show: false,
    title: '',
    message: ''
  });

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (res.ok) setCartItems(data.items || []);
    } catch (e) { console.error(e); }
  };

  const handleCheckout = () => {
    const selectedData = cartItems.filter(item => selectedItems.has(item.id));
    if (selectedData.length === 0) {
      setAlertState({
        show: true,
        title: 'Empty Selection',
        message: 'Please select at least one item to proceed to checkout.'
      });
      return;
    }
    localStorage.setItem('checkoutItems', JSON.stringify(selectedData));
    router.push('/payment');
  };

  const openDeleteDialog = (id: string, type: string, name: string) => {
    setConfirmDialog({ show: true, itemId: id, itemType: type, itemName: name });
  };

  const confirmDelete = async () => {
    try {
      const { itemId, itemType } = confirmDialog;
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, type: itemType }),
      });
      if (res.ok) {
        fetchCart(); 
        if (selectedItems.has(itemId)) {
          const newSet = new Set(selectedItems);
          newSet.delete(itemId);
          setSelectedItems(newSet);
        }
      }
    } catch (error) { console.error("Error removing item", error); }
    setConfirmDialog({ show: false, itemId: '', itemType: '', itemName: '' });
  };

  const cancelDelete = () => setConfirmDialog({ show: false, itemId: '', itemType: '', itemName: '' });
  
  const closeAlert = () => setAlertState({ show: false, title: '', message: '' });

  const updateQuantity = async (item: any, newQty: number) => {
    if (newQty < 1) return;
    
    if (newQty > item.maxStock) {
        setAlertState({
            show: true,
            title: 'Stock Limit Reached',
            message: `Sorry, we only have ${item.maxStock} of "${item.name}" left in stock!`
        });
        return;
    }

    setCartItems(cartItems.map(i => (i.id === item.id && i.type === item.type) ? { ...i, quantity: newQty } : i));
    await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, type: item.type, quantity: newQty }),
    });
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedItems(newSet);
  };

  const total = cartItems.filter(item => selectedItems.has(item.id)).reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

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
                    Checkout Ready
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-wide mb-3">Your Cart</h1>
                <p className="text-[#D883B7] font-medium text-lg max-w-md mx-auto md:mx-0">
                    Review your items and proceed to secure payment.
                </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-4xl shadow-inner border border-white/20 relative group hover:scale-105 transition-transform duration-500">
                    <span className="animate-pulse drop-shadow-[0_0_15px_rgba(216,131,183,0.6)]">🛒</span>
                    {cartItems.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-lg border border-white/20">
                            {cartItems.length}
                        </div>
                    )}
                </div>
            </div>
        </div>
        {/* --- END HERO SECTION --- */}

        {cartItems.length === 0 ? (
           <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] shadow-lg border border-white/60 p-16 text-center max-w-2xl mx-auto">
             <div className="text-6xl mb-4 opacity-70">✨</div>
             <p className="text-2xl font-serif font-bold text-[#880e4f] mb-2">Your cart is empty.</p>
             <p className="text-[#7B2C62] mb-8 font-medium">Looks like you haven't added any items yet!</p>
             <button onClick={() => router.push('/shop')} className="px-8 py-3 bg-gradient-to-r from-[#880e4f] to-[#ad1457] text-white rounded-full font-bold shadow-lg hover:scale-105 hover:shadow-pink-300 transition-all border border-white/20">
                 Go to Shop
             </button>
           </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-shadow group">
                  <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleSelection(item.id)} className="w-5 h-5 accent-[#880e4f] cursor-pointer shrink-0" />
                  
                  <div className="w-20 h-20 rounded-xl bg-gray-50 flex shrink-0 items-center justify-center overflow-hidden border border-white/50 shadow-sm">
                      {item.image ? (
                          <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                      ) : (
                          <span className="text-2xl opacity-50">📷</span>
                      )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-[#880e4f] text-lg leading-tight truncate">{item.name}</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">{item.type}</p>
                    <p className="font-bold text-[#c2185b] mt-1 text-base">LKR {parseFloat(item.price).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center bg-white rounded-full border border-pink-100 shadow-sm p-1 shrink-0">
                    <button onClick={() => updateQuantity(item, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:text-[#880e4f] hover:bg-pink-50 rounded-full transition-colors">-</button>
                    <span className="font-bold w-8 text-center text-sm text-[#4a1d46]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:text-[#880e4f] hover:bg-pink-50 rounded-full transition-colors">+</button>
                  </div>
                  
                  <button onClick={() => openDeleteDialog(item.id, item.type, item.name)} className="w-10 h-10 flex shrink-0 items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 rounded-full transition-all shadow-sm ml-2" title="Remove Item">✕</button>
                </div>
              ))}
            </div>
            
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl text-center border border-white/60 sticky top-28">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order Total</p>
                <h3 className="text-3xl font-bold text-[#880e4f] mb-8">LKR {total.toLocaleString()}</h3>
                
                <button 
                    onClick={handleCheckout} 
                    disabled={total === 0} 
                    className={`w-full py-4 rounded-full font-bold text-white shadow-lg transition-all border border-white/20
                        ${total > 0 ? 'bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] hover:opacity-90 hover:scale-105' : 'bg-gray-300 cursor-not-allowed opacity-70'}`}
                >
                    Proceed to Payment
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* --- CONFIRMATION DIALOG (FOR DELETING) --- */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60">
              <div className="w-16 h-16 bg-[#FFEBEE] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-[#FFCDD2] text-red-500">🗑️</div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">Remove Item?</h3>
              <p className="text-[#7B2C62] mb-8 font-medium text-sm">Are you sure you want to remove <br/><span className="font-bold text-[#880e4f] text-base">"{confirmDialog.itemName}"</span> <br/>from your cart?</p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-gradient-to-r from-[#e53935] to-[#d32f2f] text-white rounded-xl font-bold shadow-lg hover:shadow-red-200 hover:scale-105 transition-all">Yes, Remove</button>
              </div>
           </div>
        </div>
      )}

      {/* --- CUSTOM ALERT DIALOG (FOR STOCK LIMITS & EMPTY CHECKOUT) --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 relative">
              <button onClick={closeAlert} className="absolute top-5 right-5 text-gray-400 hover:text-[#880e4f] transition-colors p-2 text-xl leading-none" aria-label="Close">✕</button>
              <div className="w-16 h-16 bg-[#FFF9C4] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-[#FFF59D] text-yellow-600">
                ⚠️
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">{alertState.title}</h3>
              <p className="text-[#7B2C62] mb-8 font-medium text-sm">{alertState.message}</p>
              <button onClick={closeAlert} className="px-10 py-3 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all w-full border border-white/20">
                OK
              </button>
           </div>
        </div>
      )}
    </div>
  );
}