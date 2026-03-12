"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManageOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Search States for the checkboxes
  const [productSearch, setProductSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  // --- CUSTOM ALERT STATE ---
  const [alertState, setAlertState] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm';
    onConfirm?: () => void;
  }>({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'success' 
  });

  const [formData, setFormData] = useState({
    offerid: '',
    offername: '',
    discountpercent: '',
    startdate: '',
    enddate: '',
    selectedProducts: [] as string[],
    selectedItems: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [offersRes, inventoryRes] = await Promise.all([
        fetch('/api/admin/offers'),
        fetch('/api/inventory-items') 
      ]);

      if (offersRes.ok) setOffers(await offersRes.json());
      if (inventoryRes.ok) {
          const invData = await inventoryRes.json();
          setProducts(invData.filter((i: any) => i.type === 'product'));
          setItems(invData.filter((i: any) => i.type === 'item'));
      }
    } catch (error) {
      console.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // --- CUSTOM ALERT HELPERS ---
  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'error') => {
    setAlertState({ show: true, title, message, type });
  };
  const closeAlert = () => setAlertState({ ...alertState, show: false });

  const handleDelete = (id: string) => {
    setAlertState({
        show: true,
        title: "Confirm Delete",
        message: "Are you sure you want to permanently delete this offer?",
        type: "confirm",
        onConfirm: async () => {
            try {
                await fetch(`/api/admin/offers?id=${id}`, { method: 'DELETE' });
                fetchData();
                closeAlert();
            } catch (error) {
                showAlert("Error", "Failed to delete offer.");
            }
        }
    });
  };

  const handleEdit = (offer: any) => {
      setIsEditing(true);
      setFormData({
          offerid: offer.offerid,
          offername: offer.offername,
          discountpercent: offer.discountpercent || '',
          startdate: new Date(offer.startdate).toISOString().split('T')[0],
          enddate: new Date(offer.enddate).toISOString().split('T')[0],
          selectedProducts: offer.selectedProducts || [],
          selectedItems: offer.selectedItems || []
      });
      setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.offername || !formData.startdate || !formData.enddate) {
        return showAlert("Missing Information", "Please fill all required fields (*).");
    }

    const start = new Date(formData.startdate);
    const end = new Date(formData.enddate);
    
    if (end < start) {
        return showAlert("Invalid Dates", "End date cannot be earlier than the start date.");
    }

    if (formData.discountpercent) {
        const discount = parseFloat(formData.discountpercent);
        if (discount < 0 || discount > 100) {
             return showAlert("Invalid Discount", "Discount percentage must be between 0 and 100.");
        }
    }

    try {
        const method = isEditing ? 'PUT' : 'POST';
        const res = await fetch('/api/admin/offers', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (res.ok) {
            showAlert("Success!", isEditing ? "Offer Updated!" : "Offer Created!", "success");
            closeModal();
            fetchData();
        } else {
            showAlert("Error", "Failed to save offer. Please try again.");
        }
    } catch (error) {
        showAlert("System Error", "Something went wrong.");
    }
  };

  const closeModal = () => {
      setShowModal(false);
      setIsEditing(false);
      setProductSearch('');
      setItemSearch('');
      setFormData({ offerid: '', offername: '', discountpercent: '', startdate: '', enddate: '', selectedProducts: [], selectedItems: [] });
  };

  const toggleProduct = (id: string) => setFormData(prev => ({ ...prev, selectedProducts: prev.selectedProducts.includes(id) ? prev.selectedProducts.filter(p => p !== id) : [...prev.selectedProducts, id] }));
  const toggleItem = (id: string) => setFormData(prev => ({ ...prev, selectedItems: prev.selectedItems.includes(id) ? prev.selectedItems.filter(i => i !== id) : [...prev.selectedItems, id] }));

  // Get Today's date for the min attribute on inputs (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#880e4f]">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans pb-20 text-[#2E1029]">
      
      {/* HEADER */}
      <header className="bg-gradient-to-r from-[#2E1029] to-[#4A1D46] text-white py-4 px-8 flex justify-between items-center shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-3">
           <button onClick={() => router.push('/admin/dashboard')} className="text-xl hover:bg-white/10 p-2 rounded-full transition">←</button>
           <h1 className="text-xl font-bold tracking-wider text-[#F3E5F5]">MANAGE OFFERS</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl relative z-10">
        
        {/* TOP CONTROL BAR */}
        <div className="bg-[#4A1D46]/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/20 mb-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-3xl font-serif text-white tracking-wide">Promotions & Sales</h2>
                <p className="text-sm text-[#D883B7] mt-1 font-medium">Create and manage your active store discounts.</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-8 py-3 rounded-full shadow-lg font-bold hover:opacity-90 hover:scale-105 transition-all flex items-center gap-2 border border-white/20">
                <span className="text-xl leading-none">+</span> New Offer
            </button>
        </div>

        {/* OFFERS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.length === 0 ? (
                <div className="col-span-full text-center py-12">
                    <p className="text-[#7B2C62] italic opacity-70 bg-white/40 p-6 rounded-2xl border border-white/50">No active offers found. Create one to boost sales!</p>
                </div>
            ) : offers.map((offer) => (
                <div key={offer.offerid} className="bg-[#5D2E46]/90 backdrop-blur-md p-6 rounded-[2rem] shadow-lg border border-white/10 flex flex-col relative hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                    
                    {/* Discount Badge */}
                    {offer.discountpercent ? (
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg border border-white/20 transform rotate-3">
                            {offer.discountpercent}% OFF
                        </div>
                    ) : (
                        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#9B5DE5] to-[#D883B7] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg border border-white/20 transform rotate-3">
                            PROMO
                        </div>
                    )}

                    <h3 className="font-serif font-bold text-white text-2xl tracking-wide mb-1 pr-12">{offer.offername}</h3>
                    
                    <div className="bg-white/10 rounded-xl p-3 mb-4 mt-2 flex justify-between items-center border border-white/5">
                        <div className="text-center w-full border-r border-white/10">
                            <p className="text-[10px] text-[#D883B7] font-bold uppercase tracking-wider">Starts</p>
                            <p className="text-sm font-medium text-gray-200">{new Date(offer.startdate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center w-full">
                            <p className="text-[10px] text-[#D883B7] font-bold uppercase tracking-wider">Ends</p>
                            <p className="text-sm font-medium text-gray-200">{new Date(offer.enddate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 mb-6">
                        <div className="flex-1 bg-[#2E1029]/50 rounded-xl p-2 text-center border border-white/5">
                            <span className="text-xl block mb-1">💄</span>
                            <span className="text-xs text-gray-300 block">{offer.productCount} Products</span>
                        </div>
                        <div className="flex-1 bg-[#2E1029]/50 rounded-xl p-2 text-center border border-white/5">
                            <span className="text-xl block mb-1">🎁</span>
                            <span className="text-xs text-gray-300 block">{offer.itemCount} Boxes</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                        <button onClick={() => handleEdit(offer)} className="flex-1 py-2.5 bg-white/10 text-white rounded-full text-sm font-bold hover:bg-white/20 transition-colors border border-white/10">
                            Edit
                        </button>
                        <button onClick={() => handleDelete(offer.offerid)} className="flex-1 py-2.5 bg-red-500/20 text-red-300 rounded-full text-sm font-bold hover:bg-red-500 hover:text-white transition-colors border border-red-500/30">
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>

      </main>

      {/* --- CREATE / EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-[#2E1029]/95 backdrop-blur-xl w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl relative border border-white/30 text-white max-h-[90vh] flex flex-col">
                
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-2xl font-serif font-bold text-white tracking-wide">{isEditing ? 'Edit Offer' : 'Create New Offer'}</h2>
                    <button onClick={closeModal} className="text-[#D883B7] hover:text-red-400 text-2xl font-bold transition">&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-[#D883B7] ml-2 uppercase block mb-1">Offer Name *</label>
                            <input required type="text" placeholder="e.g. Free Delivery" className="w-full bg-white/10 rounded-xl px-4 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white placeholder-white/30"
                                value={formData.offername} onChange={e => setFormData({...formData, offername: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[#D883B7] ml-2 uppercase block mb-1">Discount (%) <span className="font-normal normal-case opacity-60">(Optional)</span></label>
                            <input type="number" min="0" max="100" step="0.01" placeholder="e.g. 15" className="w-full bg-white/10 rounded-xl px-4 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white placeholder-white/30"
                                value={formData.discountpercent} onChange={e => setFormData({...formData, discountpercent: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-[#D883B7] ml-2 uppercase block mb-1">Start Date *</label>
                            <input required type="date" min={today} className="w-full bg-white/10 rounded-xl px-4 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white [&::-webkit-calendar-picker-indicator]:filter-[invert(1)] cursor-pointer"
                                value={formData.startdate} onChange={e => setFormData({...formData, startdate: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[#D883B7] ml-2 uppercase block mb-1">End Date *</label>
                            <input required type="date" min={formData.startdate || today} className="w-full bg-white/10 rounded-xl px-4 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white [&::-webkit-calendar-picker-indicator]:filter-[invert(1)] cursor-pointer"
                                value={formData.enddate} onChange={e => setFormData({...formData, enddate: e.target.value})} />
                        </div>
                    </div>

                    {/* Product Selection with Search */}
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-[#D883B7] uppercase">Apply to Products</label>
                            <input type="text" placeholder="Search name or ID..." value={productSearch} onChange={e => setProductSearch(e.target.value)}
                                className="bg-black/20 border border-white/20 rounded-full px-3 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D883B7]"
                            />
                        </div>
                        <div className="h-32 overflow-y-auto border border-white/10 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1 p-2 bg-black/10 custom-scrollbar">
                            {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.id.toLowerCase().includes(productSearch.toLowerCase())).length === 0 ? (
                                <p className="text-xs text-gray-400 p-2 col-span-full text-center italic">No products found</p>
                            ) : (
                                products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.id.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                                    <label key={p.id} className="flex items-center gap-3 text-sm p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors group">
                                        <input type="checkbox" checked={formData.selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)} className="accent-[#D883B7] w-4 h-4" />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-gray-200 group-hover:text-white truncate">{p.name}</span>
                                            <span className="text-[9px] text-gray-500 font-mono truncate">{p.id}</span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Item Selection with Search */}
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-[#D883B7] uppercase">Apply to Gift Boxes</label>
                            <input type="text" placeholder="Search name or ID..." value={itemSearch} onChange={e => setItemSearch(e.target.value)}
                                className="bg-black/20 border border-white/20 rounded-full px-3 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#D883B7]"
                            />
                        </div>
                        <div className="h-32 overflow-y-auto border border-white/10 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-1 p-2 bg-black/10 custom-scrollbar">
                            {items.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()) || i.id.toLowerCase().includes(itemSearch.toLowerCase())).length === 0 ? (
                                <p className="text-xs text-gray-400 p-2 col-span-full text-center italic">No items found</p>
                            ) : (
                                items.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()) || i.id.toLowerCase().includes(itemSearch.toLowerCase())).map(i => (
                                    <label key={i.id} className="flex items-center gap-3 text-sm p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors group">
                                        <input type="checkbox" checked={formData.selectedItems.includes(i.id)} onChange={() => toggleItem(i.id)} className="accent-[#D883B7] w-4 h-4" />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-gray-200 group-hover:text-white truncate">{i.name}</span>
                                            <span className="text-[9px] text-gray-500 font-mono truncate">{i.id}</span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 shrink-0">
                        <button type="button" onClick={closeModal} className="flex-1 py-3 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition border border-white/20">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold hover:opacity-90 hover:scale-[1.02] transition shadow-lg border border-white/20">
                            {isEditing ? 'Save Changes' : 'Create Offer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- CUSTOM ELEGANT DIALOG BOX --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-[#2E1029]/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/30 text-white transform transition-all scale-100">
              
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border 
                  ${alertState.type === 'error' ? 'bg-red-500/20 border-red-400 text-red-200' : 
                    alertState.type === 'confirm' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200' : 
                    'bg-green-500/20 border-green-400 text-green-200'}`}>
                {alertState.type === 'error' ? '⚠️' : alertState.type === 'confirm' ? '❓' : '✅'}
              </div>

              <h3 className="text-2xl font-serif font-bold mb-2 text-[#F3E5F5]">
                {alertState.title}
              </h3>
              
              <p className="text-[#D883B7] mb-8 font-medium text-sm">
                {alertState.message}
              </p>

              <div className="flex gap-3 justify-center">
                  {alertState.type === 'confirm' && (
                      <button onClick={closeAlert} className="px-6 py-2 rounded-full font-bold border border-white/30 text-gray-300 hover:bg-white/10 transition-all">
                        Cancel
                      </button>
                  )}
                  
                  <button 
                    onClick={alertState.type === 'confirm' && alertState.onConfirm ? alertState.onConfirm : closeAlert}
                    className={`px-8 py-2 rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all
                        ${alertState.type === 'error' ? 'bg-red-500 text-white' : 'bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white'}`}
                  >
                    {alertState.type === 'confirm' ? 'Yes, Delete' : 'OK'}
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}