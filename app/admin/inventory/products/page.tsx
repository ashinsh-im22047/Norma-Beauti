"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ProductListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Context Logic
  const categoryId = searchParams.get('category') || '';
  const isItemTable = categoryId.toLowerCase().includes('ready') || categoryId.includes('cat_ready');
  const dbType = isItemTable ? 'item' : 'product'; 
  const term = isItemTable ? "Gift Box Item" : "Product"; 

  // State
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // FILTER & SORT STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // newest, price-low, price-high, qty

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', description: '', image: '' });

  useEffect(() => {
    if(categoryId) fetchData();
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [categoryId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const res = await fetch(`/api/inventory-items?categoryId=${categoryId}`, { cache: 'no-store' });
        const data = await res.json();
        setItems(data);
    } catch(err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  // --- FILTER & SORT LOGIC ---
  const getProcessedItems = () => {
    let result = [...items];

    // 1. Search
    if (searchTerm) {
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. Sort
    if (sortOption === 'price-low') {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortOption === 'price-high') {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortOption === 'qty') {
      result.sort((a, b) => a.quantity - b.quantity);
    } 
    // 'newest' uses default database order (usually ID)

    return result;
  };

  const processedItems = getProcessedItems();

  // --- ACTIONS ---
  const handleSave = async () => {
    const payload = {
        name: formData.name, price: formData.price, quantity: formData.quantity,
        description: formData.description, image: formData.image || 'placeholder.png'
    };
    try {
        let res;
        if (isEditing && currentItemId) {
            res = await fetch(`/api/inventory-items/${currentItemId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch('/api/inventory-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, categoryType: dbType, categoryId })
            });
        }
        if (res.ok) {
          alert("Success!");
          resetForm();
          fetchData();
        } else alert("Failed to save.");
    } catch(err) { alert("Error saving."); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    try {
        await fetch(`/api/inventory-items/${id}`, { method: 'DELETE' });
        fetchData();
    } catch(err) { alert("Error deleting."); }
  };

  const resetForm = () => {
    setShowModal(false); setIsEditing(false); setCurrentItemId(null);
    setFormData({ name: '', price: '', quantity: '', description: '', image: '' });
  };

  const openEditModal = (item: any) => {
    setIsEditing(true); setCurrentItemId(item.id);
    setFormData({ name: item.name, price: item.price, quantity: item.quantity, description: item.desc, image: item.image });
    setShowModal(true);
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, image: e.target.files[0].name });
    }
  };

  return (
    <div className="min-h-screen bg-[#F3E6EF] font-sans pb-20">
      
      {/* HEADER */}
      <header className="bg-[#134B5F] text-white py-4 px-8 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
           <button onClick={() => router.back()} className="text-xl hover:bg-white/10 p-2 rounded-full transition">←</button>
           <h1 className="text-xl font-bold tracking-wider">{term.toUpperCase()} MANAGEMENT</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        
        {/* --- TOP BAR: Title + Search + Sort + Add --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
            
            {/* Title */}
            <div>
               <h2 className="text-3xl font-serif text-gray-900">{isItemTable ? 'Ready-Made Items' : 'Individual Products'}</h2>
               <p className="text-sm text-gray-600 mt-1">Manage stock and pricing.</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
                
                {/* Search Bar */}
                <div className="relative group">
                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#134B5F] w-48 transition"
                    />
                </div>

                {/* Sort Dropdown */}
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#134B5F] text-sm bg-white cursor-pointer"
                >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="qty">Quantity: Low to High</option>
                </select>

                {/* Add Button */}
                <button 
                  onClick={() => setShowModal(true)} 
                  className="bg-[#403b58] text-white px-5 py-2 rounded-lg shadow-lg font-bold hover:bg-[#2e2a40] transition flex items-center gap-2"
                >
                  <span className="text-xl leading-none">+</span> Add
                </button>
            </div>
        </div>

        {/* --- LIST VIEW --- */}
        <div className="flex flex-col gap-3">
            {isLoading ? <p className="text-gray-500 text-center py-10">Loading...</p> : processedItems.map((item: any) => (
                
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition flex items-center justify-between border border-gray-100">
                    
                    <div className="flex items-center gap-4 flex-1 overflow-hidden">
                        {/* IMAGE BOX */}
                        <div className="h-14 w-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
                           {item.image && item.image !== 'placeholder.png' ? (
                             // IMPORTANT: Look for image in public folder root
                             <img src={`/${item.image}`} alt={item.name} className="h-full w-full object-cover" />
                           ) : (
                             <span className="text-xl">📷</span>
                           )}
                        </div>

                        {/* TEXT INFO */}
                        <div className="flex flex-col min-w-0">
                           <h3 className="font-bold text-gray-800 truncate text-lg">{item.name}</h3>
                           <p className="text-xs text-gray-500 truncate max-w-md">{item.desc || "No description"}</p>
                        </div>
                    </div>

                    {/* METRICS & MENU */}
                    <div className="flex items-center gap-8 shrink-0 ml-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Price</p>
                            <p className="font-bold text-gray-800">${item.price}</p>
                        </div>
                        <div className="text-right hidden sm:block w-16">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Stock</p>
                            <span className={`font-bold ${item.quantity < 5 ? 'text-red-500' : 'text-green-600'}`}>
                                {item.quantity}
                            </span>
                        </div>
                        
                        {/* 3-DOT MENU */}
                        <div className="relative">
                          <button onClick={(e) => toggleMenu(e, item.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl font-bold">⋮</button>
                          
                          {activeMenuId === item.id && (
                            <div className="absolute right-0 top-10 bg-white rounded-lg shadow-xl py-2 w-32 border border-gray-200 z-50">
                              <button onClick={() => openEditModal(item)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex gap-2">✏️ Edit</button>
                              <button onClick={() => handleDelete(item.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex gap-2">🗑️ Delete</button>
                            </div>
                          )}
                        </div>
                    </div>
                </div>
            ))}

            {!isLoading && processedItems.length === 0 && (
                <div className="text-center py-20 bg-white/50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">No results found.</p>
                </div>
            )}
        </div>
      </main>

      {/* --- MODAL (Matches Your Design) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={resetForm}>
          <div className="bg-[#D9D9D9] w-full max-w-lg rounded-3xl p-8 shadow-2xl relative overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-black mb-6">{isEditing ? 'Edit Item' : 'Add Item'}</h2>
            
            <div className="flex flex-col gap-4">
               <div><label className="text-xs text-gray-700 ml-2">Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#EAE0E4] rounded-full px-4 py-2 outline-none"/></div>
               <div className="flex gap-4">
                 <div className="w-1/2"><label className="text-xs text-gray-700 ml-2">Price</label><input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-[#EAE0E4] rounded-full px-4 py-2 outline-none"/></div>
                 <div className="w-1/2"><label className="text-xs text-gray-700 ml-2">Qty</label><input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-[#EAE0E4] rounded-full px-4 py-2 outline-none"/></div>
               </div>
               <div><label className="text-xs text-gray-700 ml-2">Description</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#EAE0E4] rounded-full px-4 py-2 outline-none"/></div>

               {/* IMAGE UPLOAD BOX */}
               <div>
                  <label className="text-xs text-gray-700 ml-2">image</label>
                  <label className="w-full h-24 bg-[#EAE0E4] rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-400 text-gray-500 text-sm cursor-pointer hover:bg-gray-200 transition relative">
                     <input type="file" onChange={handleFileChange} className="hidden" accept="image/*"/>
                     {formData.image ? <span className="text-black font-bold">{formData.image}</span> : <span>drag and drop files</span>}
                  </label>
               </div>
               
               <div className="flex justify-between items-center mt-6">
                 <button onClick={resetForm} className="text-gray-500 font-bold hover:text-black">Cancel</button>
                 <button onClick={handleSave} className="bg-[#403b58] text-white px-8 py-2 rounded-full font-bold hover:bg-[#2e2a40] shadow-lg">{isEditing ? "Update" : "Add"}</button>
               </div>
               <button onClick={resetForm} className="absolute top-4 right-4 text-gray-500 font-bold text-xl">&times;</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductPage() {
  return <Suspense fallback={<div>Loading...</div>}><ProductListContent /></Suspense>;
}