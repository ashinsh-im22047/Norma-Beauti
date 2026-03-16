"use client";

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ProductListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Context
  const categoryId = searchParams.get('category') || '';
  const highlightId = searchParams.get('highlight'); 
  const isReadyMade = categoryId.includes('ready');
  const isCustomBox = categoryId.includes('custom'); 
  
  const dbType = isReadyMade ? 'item' : 'product'; 
  
  // Dynamic Title
  let pageTitle = "Individual Products";
  if (isReadyMade) pageTitle = "Ready-Made Items";
  if (isCustomBox) pageTitle = "Available Products"; 

  // State
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modal State (--- UPDATED: Added minStock defaulting to '5' ---)
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', minStock: '5', description: '', image: '' });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Loading State for Save Button
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for scrolling
  const highlightRef = useRef<HTMLDivElement>(null);

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

  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'error') => {
    setAlertState({ show: true, title, message, type });
  };

  const closeAlert = () => {
    setAlertState({ ...alertState, show: false });
  };

  useEffect(() => { 
    if(categoryId) fetchData(); 
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [categoryId]);

  useEffect(() => {
    if (!isLoading && highlightId && highlightRef.current) {
        setTimeout(() => {
            highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300); 
    }
  }, [isLoading, highlightId, items]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const res = await fetch(`/api/inventory-items?categoryId=${categoryId}`, { cache: 'no-store' });
        const data = await res.json();
        setItems(data);
    } catch(err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleApproval = async (e: React.MouseEvent, id: string, newStatus: 'approved' | 'rejected') => {
    e.stopPropagation(); 
    try {
        const res = await fetch(`/api/inventory-items/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) fetchData(); 
    } catch (error) { showAlert("Error", "Action failed"); }
  };

  const getLists = () => {
    let all = [...items];
    
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        all = all.filter(i => 
            (i.name && i.name.toLowerCase().includes(lowerSearch)) || 
            (i.id && i.id.toLowerCase().includes(lowerSearch))
        );
    }

    if (sortOption === 'price-low') all.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortOption === 'price-high') all.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortOption === 'qty') all.sort((a, b) => a.quantity - b.quantity);

    if (isCustomBox) {
        return {
            pending: all.filter(i => i.status === 'pending'),
            approved: all.filter(i => i.status === 'approved'),
            standard: []
        };
    }
    return { pending: [], approved: [], standard: all };
  };
  
  const { pending, approved, standard } = getLists();

  const handleSave = async () => {
      if (!formData.name) return showAlert("Missing Input", "Please fill in the Name field.");
      if (!formData.price) return showAlert("Missing Input", "Please fill in the Price field.");
      if (!formData.quantity) return showAlert("Missing Input", "Please fill in the Quantity field.");
      
      if (parseFloat(formData.price) < 0) return showAlert("Invalid Input", "Price cannot be negative.");
      if (parseInt(formData.quantity) < 0) return showAlert("Invalid Input", "Quantity cannot be negative.");

      if (!formData.image && !fileToUpload) return showAlert("Missing Input", "Please provide an image.");

      setIsSubmitting(true);

      try {
        let finalImageUrl = formData.image;
        if (fileToUpload) {
            const uploadData = new FormData();
            uploadData.set('file', fileToUpload);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
            const uploadJson = await uploadRes.json();
            finalImageUrl = uploadJson.url; 
        }
        
        // --- UPDATED: Passing minStock to payload ---
        const payload = {
            name: formData.name, price: formData.price, quantity: formData.quantity, minStock: formData.minStock,
            description: formData.description, image: finalImageUrl || ''
        };
        let res;
        if (isEditing && currentItemId) {
            res = await fetch(`/api/inventory-items/${currentItemId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
        } else {
            res = await fetch('/api/inventory-items', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, categoryType: dbType, categoryId })
            });
        }
        
        if (res.ok) { 
            showAlert("Success", isEditing ? "Updated Successfully!" : "Added Successfully!", "success");
            resetForm(); 
            fetchData(); 
        } else {
            throw new Error("Failed");
        }
    } catch(err) { 
        showAlert("Error", "Error saving product."); 
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setAlertState({
        show: true,
        title: "Confirm Delete",
        message: "Are you sure you want to delete this item? This action cannot be undone.",
        type: "confirm",
        onConfirm: async () => {
            await fetch(`/api/inventory-items/${id}`, { method: 'DELETE' });
            fetchData();
            closeAlert();
        }
    });
  };
  
  // --- UPDATED: resetForm & openEditModal to include minStock ---
  const resetForm = () => { setShowModal(false); setIsEditing(false); setFileToUpload(null); setFormData({ name: '', price: '', quantity: '', minStock: '5', description: '', image: '' }); };
  const openEditModal = (item: any) => { setIsEditing(true); setCurrentItemId(item.id); setFormData({ name: item.name, price: item.price, quantity: item.quantity, minStock: item.minStock?.toString() || '5', description: item.desc, image: item.image }); setShowModal(true); setActiveMenuId(null); };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { setFileToUpload(e.target.files[0]); setFormData({ ...formData, image: e.target.files[0].name }); } };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const ProductCard = ({ item, isPending = false }: { item: any, isPending?: boolean }) => {
    const isHighlighted = item.id === highlightId;
    
    return (
      <div 
        key={item.id} 
        ref={isHighlighted ? highlightRef : null}
        className={`
            backdrop-blur-md p-4 rounded-2xl flex items-center justify-between relative transition-all duration-700
            ${isPending ? 'border-yellow-400/50 bg-[#5D2E46]/95' : 'bg-[#5D2E46]/90'}
            ${activeMenuId === item.id ? 'z-50' : 'z-0'}
            ${isHighlighted 
                ? 'ring-4 ring-inset ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-[1.02] border-red-500' 
                : 'border-white/10 hover:shadow-2xl hover:scale-[1.01]'
            } 
        `}
      >
        {isHighlighted && (
            <div className="absolute -top-3 -right-2 bg-red-600 text-white text-[10px] font-bold px-4 py-1 rounded-full shadow-lg animate-pulse uppercase tracking-widest z-10">
                Low Stock Alert
            </div>
        )}

        <div className="flex items-center gap-5 flex-1 overflow-hidden">
            <div className="h-16 w-16 bg-white/10 rounded-xl flex items-center justify-center shrink-0 border border-white/20 overflow-hidden shadow-inner">
               {item.image && item.image.startsWith('http') ? (
                 <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
               ) : (
                 <span className="text-2xl">📷</span>
               )}
            </div>
            <div className="flex flex-col min-w-0">
               <h3 className="font-bold text-white truncate text-lg tracking-wide">{item.name}</h3>
               <p className="text-[10px] text-[#D883B7] font-mono tracking-wider mb-1">ID: {item.id}</p>
               <p className="text-xs text-gray-300 truncate max-w-md opacity-80">{item.desc || "No description"}</p>
            </div>
        </div>

        <div className="flex items-center gap-8 shrink-0 ml-4">
            <div className="text-right hidden sm:block">
                <p className="text-[10px] text-[#D883B7] font-bold uppercase tracking-wider opacity-90">Price</p>
                <p className="font-bold text-white text-lg">LKR {item.price}</p>
            </div>
            <div className="text-right hidden sm:block w-16">
                <p className="text-[10px] text-[#D883B7] font-bold uppercase tracking-wider opacity-90">Stock</p>
                <span className={`font-bold text-lg ${item.quantity <= (item.minStock || 5) ? 'text-red-400 animate-pulse' : 'text-green-300'}`}>
                    {item.quantity}
                </span>
            </div>

            {isPending ? (
               <div className="flex gap-2">
                   <button onClick={(e) => handleApproval(e, item.id, 'approved')} className="bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-600 shadow-md">Add</button>
                   <button onClick={(e) => handleApproval(e, item.id, 'rejected')} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-red-600 shadow-md">Remove</button>
               </div>
            ) : (
               <div className="relative">
                  <button onClick={(e) => toggleMenu(e, item.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white text-xl font-bold transition">⋮</button>
                  {activeMenuId === item.id && (
                    <div className="absolute right-0 top-8 bg-[#2E1029] backdrop-blur-xl rounded-xl shadow-xl py-2 w-32 border border-white/20 z-50">
                      <button onClick={() => openEditModal(item)} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 flex gap-2">Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 flex gap-2">Delete</button>
                    </div>
                  )}
               </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans pb-20 text-[#2E1029]">
      <header className="bg-gradient-to-r from-[#2E1029] to-[#4A1D46] text-white py-4 px-8 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
           <button onClick={() => router.back()} className="text-xl hover:bg-white/10 p-2 rounded-full transition">←</button>
           <h1 className="text-xl font-bold tracking-wider text-[#F3E5F5]">{isCustomBox ? 'CUSTOM BOX SETUP' : 'ITEM MANAGEMENT'}</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 relative z-10 max-w-6xl">
        <div className="bg-[#4A1D46]/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/20 mb-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                   <h2 className="text-3xl font-serif text-white tracking-wide">{pageTitle}</h2>
                   <p className="text-sm text-[#D883B7] mt-1 font-medium">Manage stock and pricing.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-[#4A1D46]">🔍</span>
                        <input 
                          type="text" placeholder="Search Name or ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 rounded-xl bg-[#F3E5F5] text-[#2E1029] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D883B7] w-48 shadow-inner placeholder-[#4A1D46]/50"
                        />
                    </div>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="py-2 px-3 rounded-xl bg-[#F3E5F5] text-[#2E1029] font-medium text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D883B7] shadow-sm">
                        <option value="newest">Newest First</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="qty">Quantity: Low to High</option>
                    </select>
                    <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-6 py-2 rounded-xl shadow-lg font-bold hover:opacity-90 hover:scale-105 transition-all flex items-center gap-2 border border-white/20">
                      <span className="text-xl leading-none">+</span> Add
                    </button>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-4">
            {isCustomBox ? (
                <div className="flex flex-col gap-10">
                    {pending.length > 0 && (
                        <div>
                            <h3 className="text-[#4A1D46] font-bold text-xl mb-4 flex items-center gap-3 pl-2">
                                ⏳ Pending Approval <span className="text-xs font-bold bg-[#ffd54f] px-2 py-0.5 rounded-full text-[#2E1029] border border-[#2E1029]/20">{pending.length}</span>
                            </h3>
                            <div className="flex flex-col gap-4">
                                {pending.map(item => <ProductCard key={item.id} item={item} isPending={true} />)}
                            </div>
                        </div>
                    )}
                    <div>
                        <h3 className="text-[#4A1D46] font-bold text-xl mb-4 pl-2">✅ Available Products</h3>
                        <div className="flex flex-col gap-4">
                            {approved.length === 0 && <p className="text-[#7B2C62] italic p-6 text-center opacity-70 bg-white/40 rounded-xl">No approved products yet.</p>}
                            {approved.map(item => <ProductCard key={item.id} item={item} />)}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {standard.length === 0 && <p className="text-[#7B2C62] italic p-6 text-center opacity-70 bg-white/40 rounded-xl">No items found.</p>}
                    {standard.map(item => <ProductCard key={item.id} item={item} />)}
                </div>
            )}
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={resetForm}>
          <div className="bg-[#2E1029]/90 backdrop-blur-xl w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative border border-white/30 text-white" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-serif font-bold text-white mb-6 text-center tracking-wide">Product Details</h2>
            <div className="flex flex-col gap-5">
               <div><label className="text-xs font-bold text-[#D883B7] ml-3 uppercase">Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/10 rounded-full px-5 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white placeholder-white/30"/></div>
               
               {/* --- UPDATED: 3-Column Layout for Price, Qty, and Min Alert --- */}
               <div className="flex gap-3">
                   <div className="w-1/3">
                       <label className="text-xs font-bold text-[#D883B7] ml-3 uppercase">Price</label>
                       <input type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-white/10 rounded-full px-4 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white text-center"/>
                   </div>
                   <div className="w-1/3">
                       <label className="text-xs font-bold text-[#D883B7] ml-3 uppercase">Qty</label>
                       <input type="number" min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-white/10 rounded-full px-4 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white text-center"/>
                   </div>
                   <div className="w-1/3">
                       <label className="text-xs font-bold text-[#D883B7] ml-3 uppercase" title="Minimum Stock Alert Level">Min Alert</label>
                       <input type="number" min="0" placeholder="5" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="w-full bg-white/10 rounded-full px-4 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white text-center"/>
                   </div>
               </div>

               <div><label className="text-xs font-bold text-[#D883B7] ml-3 uppercase">Description <span className="text-white/50 font-normal normal-case">(Optional)</span></label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/10 rounded-full px-5 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white"/></div>
               <div><label className="text-xs font-bold text-[#D883B7] ml-3 uppercase">Image</label><label className="w-full h-24 bg-white/10 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-[#D883B7]/50 text-gray-300 text-sm cursor-pointer hover:bg-white/20 transition"><input type="file" onChange={handleFileChange} className="hidden" accept="image/*"/>{formData.image ? <span className="text-[#D883B7] font-bold truncate max-w-[80%]">{formData.image}</span> : <span>Click to upload image</span>}</label></div>
               
               <div className="flex justify-center mt-6">
                 <button 
                   onClick={handleSave} 
                   disabled={isSubmitting} 
                   className={`bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-12 py-3 rounded-full font-bold shadow-lg transition border border-white/20
                     ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 hover:scale-105'}`}
                 >
                   {isSubmitting ? "Saving..." : (isEditing ? "Update Product" : "Add Product")}
                 </button>
               </div>

               <button onClick={resetForm} className="absolute top-5 right-6 text-[#D883B7] font-bold text-2xl hover:text-red-400 transition">&times;</button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT DIALOG */}
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
                      <button 
                        onClick={closeAlert}
                        className="px-6 py-2 rounded-full font-bold border border-white/30 text-gray-300 hover:bg-white/10 transition-all"
                      >
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

export default function ProductPage() { return <Suspense fallback={<div>Loading...</div>}><ProductListContent /></Suspense>; }