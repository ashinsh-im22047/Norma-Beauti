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

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (res.ok) setCartItems(data.items || []);
    } catch (e) { console.error(e); }
  };

  // --- STRICT CHECKOUT VALIDATION FOR VARIANTS ---
  const handleCheckout = async () => {
    const selectedData = cartItems.filter(item => selectedItems.has(item.id));
    
    if (selectedData.length === 0) {
      setAlertState({
        show: true,
        title: 'Empty Selection',
        message: 'Please select at least one item to proceed to checkout.'
      });
      return;
    }

    setIsCheckingOut(true);

    try {
        const inventoryRes = await fetch('/api/inventory-items', { cache: 'no-store' });
        const liveInventory = await inventoryRes.json();

        for (const cartItem of selectedData) {
            const dbItem = liveInventory.find((i: any) => i.id === cartItem.id || i.productid === cartItem.id || i.itemid === cartItem.id);
            
            if (!dbItem) {
                setAlertState({
                    show: true,
                    title: 'Item Unavailable',
                    message: `Sorry, "${cartItem.name}" is no longer available in our store.`
                });
                setIsCheckingOut(false);
                return;
            }

            let liveStock = parseInt(dbItem.quantity || dbItem.availablequantity || dbItem.itemquantity || 0, 10);

            // Fetch Live Stock Specifically for the Variant
            if (dbItem.variants) {
                 try {
                     const variantsArr = typeof dbItem.variants === 'string' ? JSON.parse(dbItem.variants) : dbItem.variants;
                     for (const v of variantsArr) {
                         if (v.combo) {
                             const comboStr = v.combo.join(' / ');
                             if (cartItem.selectedVariantCombo === comboStr || (cartItem.name && cartItem.name.includes(comboStr))) {
                                 liveStock = parseInt(v.quantity, 10) || 0;
                                 break;
                             }
                         }
                     }
                 } catch (e) { console.error("Variant Check Failed", e); }
            }

            const totalRequiredQty = parseInt(cartItem.quantity, 10) || 0;

            if (totalRequiredQty > liveStock) {
                setAlertState({
                    show: true,
                    title: 'Insufficient Stock',
                    message: `Sorry, we only have ${liveStock} of "${cartItem.name}" left in stock. Please reduce your quantity.`
                });
                setIsCheckingOut(false);
                return;
            }
        }

        localStorage.setItem('checkoutItems', JSON.stringify(selectedData));
        router.push('/payment');

    } catch (error) {
        console.error("Checkout Validation Error:", error);
        setAlertState({
            show: true,
            title: 'System Error',
            message: 'Unable to verify stock at this moment. Please try again.'
        });
        setIsCheckingOut(false);
    }
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

  // --- LIVE VALIDATION ON QUANTITY UPDATE (+) BUTTON ---
  const updateQuantity = async (item: any, newQty: number) => {
    if (newQty < 1) return;
    
    try {
        const resInv = await fetch('/api/inventory-items', { cache: 'no-store' });
        const liveInventory = await resInv.json();
        const dbItem = liveInventory.find((i: any) => i.id === item.id || i.productid === item.id || i.itemid === item.id);
        
        if (dbItem) {
            let liveStock = parseInt(dbItem.quantity || dbItem.availablequantity || dbItem.itemquantity || 0, 10);
            
            if (dbItem.variants) {
                try {
                    const variantsArr = typeof dbItem.variants === 'string' ? JSON.parse(dbItem.variants) : dbItem.variants;
                    for (const v of variantsArr) {
                        if (v.combo) {
                            const comboStr = v.combo.join(' / ');
                            if (item.selectedVariantCombo === comboStr || (item.name && item.name.includes(comboStr))) {
                                liveStock = parseInt(v.quantity, 10) || 0;
                                break;
                            }
                        }
                    }
                } catch (e) {}
            }

            if (newQty > liveStock) {
                setAlertState({
                    show: true,
                    title: 'Stock Limit Reached',
                    message: `Sorry, we only have ${liveStock} of "${item.name}" left in stock!`
                });
                return; 
            }
        }
    } catch(e) { console.error("Stock check failed", e); }

    setCartItems(cartItems.map(i => (i.id === item.id && i.type === item.type) ? { ...i, quantity: newQty } : i));
    
    const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, type: item.type, quantity: newQty }),
    });

    if (res.ok) {
        fetchCart(); 
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedItems(newSet);
  };

  const total = cartItems.filter(item => selectedItems.has(item.id)).reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
      <CustomerHeader />
      
      <main className="container mx-auto px-4 md:px-6 py-10 max-w-[1400px]">
        
        {/* --- ELEGANT CUSTOMER HERO SECTION --- */}
        <div className="bg-white rounded-[2.5rem] p-10 md:p-12 shadow-sm border border-slate-200 mb-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <div className="inline-block bg-[#fff5f4] px-5 py-1.5 rounded-full border border-[#FFAFA8]/30 text-xs font-bold tracking-widest uppercase mb-4 text-[#ff8a80] shadow-sm">
                    Checkout Ready
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-slate-900">Your Cart</h1>
                <p className="text-slate-500 font-medium text-lg max-w-md mx-auto md:mx-0">
                    Review your items and proceed to secure payment.
                </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shadow-inner border border-slate-100 relative group hover:bg-white hover:shadow-md hover:border-[#FFAFA8] transition-all duration-300">
                    <svg className="w-10 h-10 group-hover:text-[#ff8a80] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    {cartItems.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full shadow-md border-2 border-white animate-bounce">
                            {cartItems.length}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {cartItems.length === 0 ? (
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-16 text-center max-w-2xl mx-auto flex flex-col items-center justify-center">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 text-slate-300">
                 <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
             </div>
             <p className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Your cart is empty.</p>
             <p className="text-slate-500 mb-8 font-medium">Looks like you haven't added any items yet!</p>
             <button onClick={() => router.push('/shop')} className="px-10 py-3.5 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md hover:scale-105 hover:shadow-lg transition-all tracking-wide">
                 Go to Shop
             </button>
           </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex flex-col sm:flex-row items-center gap-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 hover:shadow-md hover:border-[#FFAFA8] transition-all group relative">
                  
                  <div className="flex w-full sm:w-auto items-center gap-5">
                      <div className="relative flex items-center justify-center shrink-0">
                          <input 
                              type="checkbox" 
                              checked={selectedItems.has(item.id)} 
                              onChange={() => toggleSelection(item.id)} 
                              className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-md checked:bg-[#FFAFA8] checked:border-[#FFAFA8] transition-all cursor-pointer shadow-sm"
                          />
                          <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      
                      <div className="w-24 h-24 rounded-2xl bg-slate-50 flex shrink-0 items-center justify-center overflow-hidden border border-slate-100 shadow-inner relative">
                          {item.image ? (
                              <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                          ) : (
                              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          )}
                      </div>
                  </div>

                  <div className="flex-grow min-w-0 w-full text-center sm:text-left">
                    <h3 className="font-bold text-slate-900 text-xl leading-tight truncate group-hover:text-[#ff8a80] transition-colors">{item.name}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 mb-2">{item.type}</p>
                    
                    {item.freeQty > 0 && (
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-1 rounded-lg text-xs font-bold shadow-sm mb-3">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" /></svg>
                            +{item.freeQty} Free Item{item.freeQty > 1 ? 's' : ''} Included!
                        </div>
                    )}

                    <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-1">
                        {item.badgeText && item.originalPrice !== item.price && (
                            <span className="text-xs font-bold text-slate-400 line-through">LKR {parseFloat(item.originalPrice).toLocaleString()}</span>
                        )}
                        <p className="font-bold text-slate-800 text-xl">LKR {parseFloat(item.price).toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-center">
                      <div className="flex items-center bg-slate-50 rounded-full border border-slate-200 shadow-sm p-1 shrink-0">
                        <button onClick={() => updateQuantity(item, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:text-[#ff8a80] hover:bg-white rounded-full transition-colors">-</button>
                        <span className="font-bold w-10 text-center text-sm text-slate-800">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:text-[#ff8a80] hover:bg-white rounded-full transition-colors">+</button>
                      </div>
                      
                      <button 
                        onClick={() => openDeleteDialog(item.id, item.type, item.name)} 
                        className="w-10 h-10 flex shrink-0 items-center justify-center text-slate-400 bg-white border border-slate-200 hover:border-rose-200 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all shadow-sm" 
                        title="Remove Item"
                      >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 sticky top-28 flex flex-col items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Order Total</p>
                <h3 className="text-4xl font-bold text-slate-900 mb-8 tracking-tight">LKR {total.toLocaleString()}</h3>
                
                <div className="w-full h-px bg-slate-100 mb-8"></div>

                <button 
                    onClick={handleCheckout} 
                    disabled={total === 0 || isCheckingOut} 
                    className={`w-full py-4 rounded-full font-bold shadow-md tracking-wide transition-all border border-transparent flex items-center justify-center gap-2
                        ${total > 0 && !isCheckingOut ? 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white hover:shadow-lg hover:scale-[1.02]' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                >
                    {isCheckingOut ? (
                        <><div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Checking Stock...</>
                    ) : (
                        <>Proceed to Payment {total > 0 && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>}</>
                    )}
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* --- CONFIRMATION DIALOG --- */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 transform transition-all scale-100">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 border-white text-rose-500">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">Remove Item?</h3>
              <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
                  Are you sure you want to remove <br/>
                  <span className="font-bold text-[#ff8a80] text-base">"{confirmDialog.itemName}"</span> <br/>
                  from your cart?
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={cancelDelete} className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-full font-bold hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">Cancel</button>
                <button onClick={confirmDelete} className="px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all tracking-wide">Yes, Remove</button>
              </div>
           </div>
        </div>
      )}

      {/* --- CUSTOM ALERT DIALOG --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 relative transform transition-all scale-100">
              <button onClick={closeAlert} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm" aria-label="Close">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 border-white text-amber-500">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">{alertState.title}</h3>
              <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">{alertState.message}</p>
              <button onClick={closeAlert} className="px-10 py-3.5 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all w-full tracking-wide">
                OK
              </button>
           </div>
        </div>
      )}
    </div>
  );
}