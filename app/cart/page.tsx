"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const router = useRouter();

  // --- STATE FOR CUSTOM CONFIRMATION DIALOG ---
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    itemId: '',
    itemType: '',
    itemName: ''
  });

  useEffect(() => { fetchCart(); }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      if (res.ok) setCartItems(data.items || []);
    } catch (e) { console.error(e); }
  };

  // --- NEW: HANDLE CHECKOUT NAVIGATION ---
  const handleCheckout = () => {
    // 1. Get the actual objects for the selected IDs
    const selectedData = cartItems.filter(item => selectedItems.has(item.id));
    
    // 2. Validation
    if (selectedData.length === 0) {
      alert("Please select at least one item to proceed.");
      return;
    }

    // 3. Save selected items to LocalStorage (so Payment Page can read them)
    localStorage.setItem('checkoutItems', JSON.stringify(selectedData));

    // 4. Navigate to Payment Page
    router.push('/payment');
  };

  // --- DELETE DIALOG LOGIC ---
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

  const cancelDelete = () => {
    setConfirmDialog({ show: false, itemId: '', itemType: '', itemName: '' });
  };

  const updateQuantity = async (id: string, type: string, newQty: number) => {
    if (newQty < 1) return;
    setCartItems(cartItems.map(item => (item.id === id && item.type === type) ? { ...item, quantity: newQty } : item));
    await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type, quantity: newQty }),
    });
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedItems);
    newSet.has(id) ? newSet.delete(id) : newSet.add(id);
    setSelectedItems(newSet);
  };

  // Calculate Total only for SELECTED items
  const total = cartItems.filter(item => selectedItems.has(item.id)).reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46]">
      <CustomerHeader />
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-serif font-bold text-[#880e4f] mb-8 text-center">Your Shopping Bag</h1>
        
        {cartItems.length === 0 ? (
           <div className="text-center py-20">
             <p className="text-xl text-[#ad1457] mb-4">Your cart is empty.</p>
             <button onClick={() => router.push('/shop')} className="px-6 py-2 bg-[#880e4f] text-white rounded-full hover:bg-[#ad1457] transition">Go to Shop</button>
           </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-grow space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 bg-white/70 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-white/50">
                  <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleSelection(item.id)} className="w-5 h-5 accent-[#880e4f] cursor-pointer" />
                  <img src={item.image} className="w-20 h-20 object-cover rounded-xl bg-gray-100" alt={item.name} />
                  <div className="flex-grow">
                    <h3 className="font-bold text-[#880e4f] text-lg">{item.name}</h3>
                    <p className="text-xs text-gray-500 uppercase">{item.type}</p>
                    <p className="font-bold text-[#c2185b] mt-1">LKR {parseFloat(item.price).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center bg-white rounded-full border shadow-sm">
                    <button onClick={() => updateQuantity(item.id, item.type, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:text-[#880e4f]">-</button>
                    <span className="font-bold w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.type, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center font-bold text-gray-500 hover:text-[#880e4f]">+</button>
                  </div>
                  <button 
                    onClick={() => openDeleteDialog(item.id, item.type, item.name)} 
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 rounded-full transition-all shadow-sm" 
                    title="Remove Item"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            
            {/* --- CHECKOUT SECTION --- */}
            <div className="w-full lg:w-80">
              <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl text-center border border-white/60 sticky top-28">
                <h3 className="text-3xl font-bold text-[#880e4f] mb-6">LKR {total.toFixed(2)}</h3>
                
                <button 
                  onClick={handleCheckout} 
                  disabled={total === 0} 
                  className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-transform ${total > 0 ? 'bg-gradient-to-r from-[#880e4f] to-[#d81b60] hover:scale-105' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  Buy Now
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* --- CONFIRMATION DIALOG --- */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60">
              <div className="w-16 h-16 bg-[#FFEBEE] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-[#FFCDD2] text-red-500">🗑️</div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">Remove Item?</h3>
              <p className="text-[#7B2C62] mb-8 font-medium">
                Are you sure you want to remove <br/>
                <span className="font-bold text-[#880e4f]">"{confirmDialog.itemName}"</span> <br/>
                from your bag?
              </p>
              <div className="flex gap-3">
                <button onClick={cancelDelete} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-gradient-to-r from-[#e53935] to-[#d32f2f] text-white rounded-xl font-bold shadow-lg hover:shadow-red-200 hover:scale-105 transition-all">Yes, Remove</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}