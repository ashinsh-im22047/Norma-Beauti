// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

export default function ManageOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

  const [alertState, setAlertState] = useState<{
    show: boolean; title: string; message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void;
  }>({ show: false, title: '', message: '', type: 'success' });

  const [formData, setFormData] = useState({
    offerid: '', offername: '', offer_type: 'PERCENTAGE', discountpercent: '', fixed_discount: '', 
    buy_qty: '', get_qty: '', startdate: '', enddate: '', selectedProducts: [] as string[], selectedItems: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // --- SYSTEM FIX ---
      // We must explicitly ask for 'cat_ready_box' because the backend API 
      // hides the 'item' table (Boxes) if no categoryId is provided.
      const [offersRes, defaultProductsRes, readyBoxesRes] = await Promise.all([
        fetch('/api/admin/offers'),
        fetch('/api/inventory-items'), // Usually gets 'product' table
        fetch('/api/inventory-items?categoryId=cat_ready_box') // Forces 'item' table fetch
      ]);

      if (offersRes.ok) setOffers(await offersRes.json());
      
      if (defaultProductsRes.ok) {
          const data = await defaultProductsRes.json();
          setProducts(data);
      }
      
      if (readyBoxesRes.ok) {
          const data = await readyBoxesRes.json();
          setItems(data);
      }
      
    } catch (error) {
      console.error("Failed to load offer data", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CUSTOM ALERT HANDLERS ---
  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'error') => {
    setAlertState({ show: true, title, message, type });
  };
  const closeAlert = () => setAlertState({ ...alertState, show: false });

  // Delete Offer
  const handleDelete = (id: string) => {
    setAlertState({
        show: true, title: "Confirm Delete", message: "Are you sure you want to permanently delete this offer?", type: "confirm",
        onConfirm: async () => {
            try {
                await fetch(`/api/admin/offers?id=${id}`, { method: 'DELETE' });
                fetchData(); closeAlert();
            } catch (error) { showAlert("Error", "Failed to delete offer."); }
        }
    });
  };
  //edit offer
  const handleEdit = (offer: any) => {
      setIsEditing(true);
      setFormData({
          offerid: offer.offerid, offername: offer.offername, offer_type: offer.offer_type || 'PERCENTAGE', 
          discountpercent: offer.discountpercent || '', fixed_discount: offer.fixed_discount || '', 
          buy_qty: offer.buy_qty || '', get_qty: offer.get_qty || '', 
          startdate: new Date(offer.startdate).toISOString().split('T')[0],
          enddate: new Date(offer.enddate).toISOString().split('T')[0],
          selectedProducts: offer.selectedProducts || [], selectedItems: offer.selectedItems || []
      });
      setShowModal(true);
  };

  // --- FORM SUBMISSION HANDLER (Handles both Add and Edit for Offers) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.offername || !formData.startdate || !formData.enddate || !formData.offer_type) {
        return showAlert("Missing Information", "Please fill all required fields (*).");
    }

    const start = new Date(formData.startdate);
    const end = new Date(formData.enddate);
    if (end < start) return showAlert("Invalid Dates", "End date cannot be earlier than the start date.");

    try {
        const method = isEditing ? 'PUT' : 'POST';
        const res = await fetch('/api/admin/offers', {
            method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData)
        });

        if (res.ok) {
            showAlert("Success!", isEditing ? "Offer Updated!" : "Offer Created!", "success");
            closeModal(); fetchData();
        } else {
            showAlert("Error", "Failed to save offer.");
        }
    } catch (error) { showAlert("System Error", "Something went wrong."); }
  };

  // --- MODAL CLOSE HANDLER (Resets form and state) ---
  const closeModal = () => {
      setShowModal(false); setIsEditing(false); setProductSearch(''); setItemSearch('');
      setFormData({ 
          offerid: '', offername: '', offer_type: 'PERCENTAGE', discountpercent: '', fixed_discount: '', 
          buy_qty: '', get_qty: '', startdate: '', enddate: '', selectedProducts: [], selectedItems: [] 
      });
  };

  // --- TOGGLE SELECTION HANDLERS (For Products and Items in the offer) ---
  const toggleProduct = (id: string) => setFormData(prev => ({ ...prev, selectedProducts: prev.selectedProducts.includes(id) ? prev.selectedProducts.filter(p => p !== id) : [...prev.selectedProducts, id] }));
  const toggleItem = (id: string) => setFormData(prev => ({ ...prev, selectedItems: prev.selectedItems.includes(id) ? prev.selectedItems.filter(i => i !== id) : [...prev.selectedItems, id] }));

  const today = new Date().toISOString().split('T')[0];

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#fff5f4] font-sans pb-20 text-slate-800">
      <AdminHeader />

      <main className="container mx-auto px-4 md:px-6 py-10 max-w-[1400px] relative z-10">
        
        {/* HEADER CARD */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Promotions & Sales</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">Manage Percentage, BOGO, and Fixed discounts.</p>
            </div>
            <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-8 py-3.5 rounded-full shadow-md font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm tracking-wide relative z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                New Offer
            </button>
        </div>

        {/* OFFERS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {offers.length === 0 ? (
                <div className="col-span-full bg-white rounded-[2rem] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 text-[#FFAFA8]">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">No Active Offers</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">Create a new promotion to boost your sales and reward your customers.</p>
                </div>
            ) : offers.map((offer) => {
                const isPercentage = offer.offer_type === 'PERCENTAGE';
                const isBogo = offer.offer_type === 'BOGO';
                const isExpired = new Date(offer.enddate) < new Date();

                return (
                <div key={offer.offerid} className={`bg-white p-8 rounded-[2.5rem] border flex flex-col relative transition-all duration-300 hover:-translate-y-1 ${isExpired ? 'border-slate-200 opacity-80 hover:opacity-100 shadow-sm' : 'border-slate-100 hover:border-[#FFAFA8] hover:shadow-xl shadow-md'}`}>
                    
                    {/* Badge */}
                    <div className={`absolute -top-3 -right-3 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border transform rotate-3 ${isExpired ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white border-white'}`}>
                        {isPercentage ? `${offer.discountpercent}% OFF` : 
                         isBogo ? `BUY ${offer.buy_qty} GET ${offer.get_qty}` : 
                         `LKR ${offer.fixed_discount} OFF`}
                    </div>

                    <h3 className="font-bold text-slate-900 text-2xl tracking-tight mb-2 pr-10 leading-tight">{offer.offername}</h3>
                    
                    <div className="bg-slate-50 rounded-2xl p-4 mb-6 mt-4 flex justify-between items-center border border-slate-100">
                        <div className="text-center w-full border-r border-slate-200">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Starts
                            </p>
                            <p className="text-sm font-bold text-slate-700">{new Date(offer.startdate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-center w-full">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Ends
                            </p>
                            <p className={`text-sm font-bold ${isExpired ? 'text-rose-500' : 'text-slate-700'}`}>{new Date(offer.enddate).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-auto pt-2">
                        <button onClick={() => handleEdit(offer)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:bg-slate-50 hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            Edit
                        </button>
                        <button onClick={() => handleDelete(offer.offerid)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-bold hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm flex items-center justify-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Delete
                        </button>
                    </div>
                </div>
            )})}
        </div>
      </main>

      {/* --- ADD/EDIT MODAL (z-index changed to z-[1000]) --- */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={closeModal}>
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative border border-slate-100 text-slate-800 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                
                <div className="flex justify-between items-center mb-8 shrink-0">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{isEditing ? 'Edit Offer' : 'Create New Offer'}</h2>
                    <button onClick={closeModal} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    
                    {/* Offer Name */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 ml-4 uppercase tracking-wider block mb-2">Offer Name *</label>
                        <input required type="text" placeholder="e.g. Summer Sale 2026" className="w-full bg-slate-50 rounded-full px-6 py-3.5 outline-none border border-slate-200 focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-slate-800 font-bold transition-all shadow-sm"
                            value={formData.offername} onChange={e => setFormData({...formData, offername: e.target.value})} />
                    </div>

                    {/* Offer Type Selection */}
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <label className="text-xs font-bold text-slate-500 ml-2 uppercase tracking-wider block mb-4">Offer Type *</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            {['PERCENTAGE', 'BOGO', 'FIXED'].map(type => (
                                <label key={type} className={`flex-1 py-3 px-2 rounded-xl border-2 cursor-pointer text-center font-bold text-xs tracking-wide transition-all shadow-sm ${formData.offer_type === type ? 'bg-[#fff5f4] text-[#ff8a80] border-[#FFAFA8]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                                    <input type="radio" name="offer_type" className="hidden" checked={formData.offer_type === type} onChange={() => setFormData({...formData, offer_type: type})} />
                                    {type === 'PERCENTAGE' && '% Percentage'}
                                    {type === 'FIXED' && '$ Fixed Amount'}
                                    {type === 'BOGO' && '🎁 Buy 1 Get 1'}
                                </label>
                            ))}
                        </div>

                        {/* Dynamic Input based on Type */}
                        <div className="mt-5">
                            {formData.offer_type === 'PERCENTAGE' && (
                                <div className="relative">
                                    <span className="absolute left-6 top-3.5 text-slate-400 font-bold">%</span>
                                    <input type="number" placeholder="Discount Percentage (e.g. 20)" required className="w-full bg-white rounded-full pl-12 pr-6 py-3.5 border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] text-slate-800 font-bold shadow-sm transition-all"
                                        value={formData.discountpercent} onChange={e => setFormData({...formData, discountpercent: e.target.value})} />
                                </div>
                            )}
                            {formData.offer_type === 'FIXED' && (
                                <div className="relative">
                                    <span className="absolute left-6 top-3.5 text-slate-400 font-bold tracking-widest text-xs mt-0.5">LKR</span>
                                    <input type="number" placeholder="Amount Off" required className="w-full bg-white rounded-full pl-16 pr-6 py-3.5 border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] text-slate-800 font-bold shadow-sm transition-all"
                                        value={formData.fixed_discount} onChange={e => setFormData({...formData, fixed_discount: e.target.value})} />
                                </div>
                            )}
                            {formData.offer_type === 'BOGO' && (
                                <div className="flex gap-4">
                                    <input type="number" placeholder="Buy Qty (e.g. 2)" required className="flex-1 bg-white rounded-full px-6 py-3.5 border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] text-slate-800 font-bold text-center shadow-sm transition-all" value={formData.buy_qty} onChange={e => setFormData({...formData, buy_qty: e.target.value})} />
                                    <input type="number" placeholder="Get Qty (e.g. 1)" required className="flex-1 bg-white rounded-full px-6 py-3.5 border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] text-slate-800 font-bold text-center shadow-sm transition-all" value={formData.get_qty} onChange={e => setFormData({...formData, get_qty: e.target.value})} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs font-bold text-slate-500 ml-4 uppercase tracking-wider block mb-2 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Start Date *
                            </label>
                            <input required type="date" min={today} className="w-full bg-slate-50 rounded-full px-6 py-3.5 border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] text-slate-800 font-medium transition-all shadow-sm" value={formData.startdate} onChange={e => setFormData({...formData, startdate: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 ml-4 uppercase tracking-wider block mb-2 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> End Date *
                            </label>
                            <input required type="date" min={formData.startdate || today} className="w-full bg-slate-50 rounded-full px-6 py-3.5 border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] text-slate-800 font-medium transition-all shadow-sm" value={formData.enddate} onChange={e => setFormData({...formData, enddate: e.target.value})} />
                        </div>
                    </div>

                    {/* SELECT PRODUCTS */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Applicable Products</label>
                            <div className="relative">
                                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input type="text" placeholder="Search..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="bg-white border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-700 outline-none focus:border-[#FFAFA8] focus:ring-1 focus:ring-[#FFAFA8] transition-all shadow-sm w-40" />
                            </div>
                        </div>
                        <div className="h-40 overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-white shadow-inner custom-scrollbar">
                            {products.filter(p => (p.name || p.productname || '').toLowerCase().includes(productSearch.toLowerCase())).map(p => {
                                const isSelected = formData.selectedProducts.includes(p.id || p.productid);
                                return (
                                <label key={p.id || p.productid} className={`flex items-center gap-4 text-sm p-3 rounded-xl cursor-pointer transition-colors border mb-2 ${isSelected ? 'bg-[#fff5f4] border-[#FFAFA8]' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleProduct(p.id || p.productid)} className="w-5 h-5 accent-[#FFAFA8] cursor-pointer" />
                                    <span className={`truncate font-medium ${isSelected ? 'text-[#ff8a80]' : 'text-slate-700'}`}>{p.name || p.productname}</span>
                                </label>
                            )})}
                            {products.length === 0 && <p className="text-xs text-slate-400 text-center mt-12 italic">No products available.</p>}
                        </div>
                    </div>

                    {/* SELECT BOXES */}
                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider ml-1">Applicable Gift Boxes</label>
                            <div className="relative">
                                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input type="text" placeholder="Search..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="bg-white border border-slate-200 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-700 outline-none focus:border-[#FFAFA8] focus:ring-1 focus:ring-[#FFAFA8] transition-all shadow-sm w-40" />
                            </div>
                        </div>
                        <div className="h-40 overflow-y-auto border border-slate-200 rounded-2xl p-2 bg-white shadow-inner custom-scrollbar">
                            {items.filter(i => (i.name || i.itemname || '').toLowerCase().includes(itemSearch.toLowerCase())).map(i => {
                                const isSelected = formData.selectedItems.includes(i.id || i.itemid);
                                return (
                                <label key={i.id || i.itemid} className={`flex items-center gap-4 text-sm p-3 rounded-xl cursor-pointer transition-colors border mb-2 ${isSelected ? 'bg-[#fff5f4] border-[#FFAFA8]' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                                    <input type="checkbox" checked={isSelected} onChange={() => toggleItem(i.id || i.itemid)} className="w-5 h-5 accent-[#FFAFA8] cursor-pointer" />
                                    <span className={`truncate font-medium ${isSelected ? 'text-[#ff8a80]' : 'text-slate-700'}`}>{i.name || i.itemname}</span>
                                </label>
                            )})}
                            {items.length === 0 && <p className="text-xs text-slate-400 text-center mt-12 italic">No boxes available.</p>}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 shrink-0 border-t border-slate-100">
                        <button type="button" onClick={closeModal} className="flex-1 py-3.5 bg-white text-slate-600 rounded-full font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                        <button type="submit" className={`flex-1 py-3.5 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md border border-transparent tracking-wide transition-all hover:shadow-lg hover:scale-[1.02]`}>
                            {isEditing ? 'Save Changes' : 'Create Offer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- CUSTOM ELEGANT DIALOG BOX (z-index changed to z-[1100]) --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 text-slate-800 transform transition-all scale-100">
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 
                  ${alertState.type === 'error' ? 'bg-rose-50 border-white text-rose-500 shadow-rose-200' : 
                    alertState.type === 'confirm' ? 'bg-amber-50 border-white text-amber-500 shadow-amber-200' : 
                    'bg-emerald-50 border-white text-emerald-500 shadow-emerald-200'}`}>
                {alertState.type === 'error' ? <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> : 
                 alertState.type === 'confirm' ? <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : 
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>

              <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">
                {alertState.title}
              </h3>
              
              <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
                {alertState.message}
              </p>

              <div className="flex gap-3 justify-center">
                  {alertState.type === 'confirm' && (
                      <button 
                        onClick={closeAlert}
                        className="px-6 py-3 rounded-full font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                      >
                        Cancel
                      </button>
                  )}
                  
                  <button 
                    onClick={alertState.type === 'confirm' && alertState.onConfirm ? alertState.onConfirm : (alertState.type === 'success' && alertState.onConfirm ? alertState.onConfirm : closeAlert)}
                    className={`px-8 py-3 rounded-full font-bold shadow-md hover:opacity-90 hover:scale-105 transition-all text-white tracking-wide
                        ${alertState.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80]'}`}
                  >
                    {alertState.type === 'confirm' ? 'Yes, Confirm' : 'OK'}
                  </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}