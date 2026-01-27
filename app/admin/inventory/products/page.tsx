"use client";

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ProductListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Context
  const categoryId = searchParams.get('category') || '';
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
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null); // For 3-dot menu

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', description: '', image: '' });
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // --- NEW: Loading State for Save Button ---
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // --- APPROVAL WORKFLOW (For Custom Box Page) ---
  const handleApproval = async (e: React.MouseEvent, id: string, newStatus: 'approved' | 'rejected') => {
    e.stopPropagation(); // Prevent menu close issues
    try {
        const res = await fetch(`/api/inventory-items/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) fetchData(); 
    } catch (error) { alert("Action failed"); }
  };

  // --- FILTERING ---
  const getLists = () => {
    let all = [...items];
    if (searchTerm) all = all.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Sort Logic
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

  // --- ACTIONS (UPDATED WITH VALIDATION & LOADING) ---
  const handleSave = async () => {
     // 1. Validation
     if (!formData.name) return alert("Please fill in the Name field.");
     if (!formData.price) return alert("Please fill in the Price field.");
     if (!formData.quantity) return alert("Please fill in the Quantity field.");
     
     // --- NEW: Negative Value Validation ---
     if (parseFloat(formData.price) < 0) return alert("Price cannot be negative.");
     if (parseInt(formData.quantity) < 0) return alert("Quantity cannot be negative.");

     // Description is optional now, so we don't check it
     if (!formData.image && !fileToUpload) return alert("Please provide an image.");

     // 2. Start Loading
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
        const payload = {
            name: formData.name, price: formData.price, quantity: formData.quantity,
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
            // 3. Success Feedback
            alert(isEditing ? "Updated Successfully!" : "Added Successfully!");
            resetForm(); 
            fetchData(); 
        } else {
            throw new Error("Failed");
        }
    } catch(err) { 
        alert("Error saving product."); 
    } finally {
        // 4. Stop Loading
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/inventory-items/${id}`, { method: 'DELETE' });
    fetchData();
  };
  
  const resetForm = () => { setShowModal(false); setIsEditing(false); setFileToUpload(null); setFormData({ name: '', price: '', quantity: '', description: '', image: '' }); };
  const openEditModal = (item: any) => { setIsEditing(true); setCurrentItemId(item.id); setFormData({ name: item.name, price: item.price, quantity: item.quantity, description: item.desc, image: item.image }); setShowModal(true); setActiveMenuId(null); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) { setFileToUpload(e.target.files[0]); setFormData({ ...formData, image: e.target.files[0].name }); } };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // --- REUSABLE CARD COMPONENT (Unified Design) ---
  const ProductCard = ({ item, isPending = false }: { item: any, isPending?: boolean }) => (
    <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border ${isPending ? 'border-yellow-200 bg-yellow-50' : 'border-gray-100'} flex items-center justify-between relative`}>
        
        {/* LEFT: Image & Text */}
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden">
               {item.image && item.image.startsWith('http') ? (
                 <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
               ) : (
                 <span className="text-2xl">📷</span>
               )}
            </div>
            <div className="flex flex-col min-w-0">
               <h3 className="font-bold text-gray-800 truncate text-lg">{item.name}</h3>
               <p className="text-xs text-gray-500 truncate max-w-md">{item.desc || "No description"}</p>
            </div>
        </div>

        {/* RIGHT: Price & Menu */}
        <div className="flex items-center gap-8 shrink-0 ml-4">
            <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Price</p>
                {/* --- UPDATED: Currency to LKR --- */}
                <p className="font-bold text-gray-800">LKR {item.price}</p>
            </div>
            <div className="text-right hidden sm:block w-16">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Stock</p>
                <span className={`font-bold ${item.quantity < 5 ? 'text-red-500' : 'text-green-600'}`}>
                    {item.quantity}
                </span>
            </div>

            {/* PENDING ACTIONS (Buttons) OR APPROVED ACTIONS (Menu) */}
            {isPending ? (
               <div className="flex gap-2">
                   <button onClick={(e) => handleApproval(e, item.id, 'approved')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700">Add</button>
                   <button onClick={(e) => handleApproval(e, item.id, 'rejected')} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600">Remove</button>
               </div>
            ) : (
               <div className="relative">
                  <button onClick={(e) => toggleMenu(e, item.id)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl font-bold">⋮</button>
                  {activeMenuId === item.id && (
                    <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl py-2 w-32 border border-gray-200 z-50">
                      <button onClick={() => openEditModal(item)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex gap-2">✏️ Edit</button>
                      <button onClick={() => handleDelete(item.id)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex gap-2">🗑️ Delete</button>
                    </div>
                  )}
               </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3E6EF] font-sans pb-20">
      <header className="bg-[#134B5F] text-white py-4 px-8 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
           <button onClick={() => router.back()} className="text-xl hover:bg-white/10 p-2 rounded-full transition">←</button>
           <h1 className="text-xl font-bold tracking-wider">{isCustomBox ? 'CUSTOM BOX SETUP' : 'PRODUCT MANAGEMENT'}</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        
        {/* --- CONTROLS ROW --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
            <div>
               <h2 className="text-3xl font-serif text-gray-900">{pageTitle}</h2>
               <p className="text-sm text-gray-600 mt-1">Manage stock and pricing.</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    <input 
                      type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#134B5F] w-48 transition"
                    />
                </div>
                {/* Sort */}
                <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="py-2 px-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#134B5F] text-sm bg-white cursor-pointer">
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="qty">Quantity: Low to High</option>
                </select>
                {/* Add Button */}
                <button onClick={() => setShowModal(true)} className="bg-[#403b58] text-white px-5 py-2 rounded-lg shadow-lg font-bold hover:bg-[#2e2a40] transition flex items-center gap-2">
                  <span className="text-xl leading-none">+</span> Add
                </button>
            </div>
        </div>

        {/* --- LIST VIEW --- */}
        <div className="flex flex-col gap-3">
            
            {/* SCENARIO A: CUSTOM BOX PAGE (Split View) */}
            {isCustomBox ? (
                <div className="flex flex-col gap-8">
                    {/* 1. PENDING LIST */}
                    {pending.length > 0 && (
                        <div>
                            <h3 className="text-[#134B5F] font-bold text-xl mb-3 flex items-center gap-2">
                                ⏳ Pending Approval <span className="text-sm font-normal bg-yellow-200 px-2 rounded-full text-black">{pending.length}</span>
                            </h3>
                            <div className="flex flex-col gap-3">
                                {pending.map(item => <ProductCard key={item.id} item={item} isPending={true} />)}
                            </div>
                        </div>
                    )}

                    {/* 2. APPROVED LIST */}
                    <div>
                        <h3 className="text-[#134B5F] font-bold text-xl mb-3">✅ Available Products</h3>
                        <div className="flex flex-col gap-3">
                            {approved.length === 0 && <p className="text-gray-500 italic p-4 text-center">No approved products yet.</p>}
                            {approved.map(item => <ProductCard key={item.id} item={item} />)}
                        </div>
                    </div>
                </div>
            ) : (
                /* SCENARIO B: NORMAL PAGE (Standard List) */
                <div className="flex flex-col gap-3">
                    {standard.map(item => <ProductCard key={item.id} item={item} />)}
                </div>
            )}
            
        </div>
      </main>

      {/* MODAL (Updated) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={resetForm}>
          <div className="bg-[#D9D9D9] w-full max-w-lg rounded-3xl p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-black mb-6">Product Details</h2>
            <div className="flex flex-col gap-4">
               <div><label className="text-xs text-gray-700 ml-2">Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#EAE0E4] rounded-full px-4 py-2 outline-none"/></div>
               <div className="flex gap-4">
                   <div className="w-1/2">
                       <label className="text-xs text-gray-700 ml-2">Price</label>
                       {/* --- UPDATED: Min 0 Validation --- */}
                       <input type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-[#EAE0E4] rounded-full px-4 py-2 outline-none"/>
                   </div>
                   <div className="w-1/2">
                       <label className="text-xs text-gray-700 ml-2">Qty</label>
                       {/* --- UPDATED: Min 0 Validation --- */}
                       <input type="number" min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-[#EAE0E4] rounded-full px-4 py-2 outline-none"/>
                   </div>
               </div>
               <div><label className="text-xs text-gray-700 ml-2">Description <span className="text-gray-400 font-light">(Optional)</span></label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#EAE0E4] rounded-full px-4 py-2 outline-none"/></div>
               <div><label className="text-xs text-gray-700 ml-2">Image</label><label className="w-full h-24 bg-[#EAE0E4] rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-400 text-gray-500 text-sm cursor-pointer hover:bg-gray-200"><input type="file" onChange={handleFileChange} className="hidden" accept="image/*"/>{formData.image ? <span className="text-black font-bold truncate max-w-[80%]">{formData.image}</span> : <span>drag and drop</span>}</label></div>
               
               {/* UPDATED SAVE BUTTON WITH LOADING STATE */}
               <div className="flex justify-center mt-6">
                 <button 
                   onClick={handleSave} 
                   disabled={isSubmitting} // Disable when adding
                   className={`bg-[#483D58] text-white px-12 py-2 rounded-full font-bold shadow-lg transition
                     ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#352c42]'}`}
                 >
                   {isSubmitting ? "Adding..." : (isEditing ? "Update" : "Add")}
                 </button>
               </div>

               <button onClick={resetForm} className="absolute top-4 right-4 text-gray-500 font-bold text-xl">&times;</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductPage() { return <Suspense fallback={<div>Loading...</div>}><ProductListContent /></Suspense>; }