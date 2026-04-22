// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

type Category = {
  categoryid: string;
  categoryname: string;
  categorydescription: string;
};

export default function InventoryManagement() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCat, setCurrentCat] = useState({ id: '', name: '', description: '' });

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
    fetchCategories();
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- PROFESSIONAL SVG ICONS ---
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('individual')) return (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
    );
    if (lower.includes('ready made') || lower.includes('box')) return (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    );
    if (lower.includes('custom')) return (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
    );
    return (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
    ); 
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    
    setAlertState({
        show: true,
        title: "Confirm Delete",
        message: "Are you sure you want to delete this category? This action cannot be undone.",
        type: "confirm",
        onConfirm: async () => {
            try {
                const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    setActiveMenuId(null);   
                    await fetchCategories();
                    closeAlert(); 
                } else {
                    showAlert("Error", "Failed to delete category.");
                }
            } catch (error) {
                showAlert("Error", "Network Error.");
            }
        }
    });
  };

  const handleSave = async () => {
    const payload = { name: currentCat.name, description: currentCat.description };
    try {
      let res;
      if (isEditing) {
        res = await fetch(`/api/categories/${currentCat.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      if (!res.ok) throw new Error("API Error");
      setShowModal(false);
      await fetchCategories();
      showAlert("Success", isEditing ? "Category Updated!" : "Category Created!", "success");
    } catch (error) {
      showAlert("Error", "Error saving category");
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentCat({ id: '', name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (e: React.MouseEvent, cat: Category) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setCurrentCat({ id: cat.categoryid, name: cat.categoryname, description: cat.categorydescription });
    setShowModal(true);
    setActiveMenuId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f8fafe] to-[#fff5f4] font-sans text-slate-800 pb-20">
      
      <AdminHeader />

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 md:px-6 py-10 relative z-10 max-w-[1400px]">
        
        {/* CONTROLS CARD */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 mb-10 relative overflow-hidden">
            {/* Soft decorative background gradient corner */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                   <h2 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">Inventory Categories</h2>
                   <p className="text-sm text-slate-500 mt-2 font-medium">Manage your product lines, ready-made sets, and custom boxes.</p>
                </div>
                <button 
                    onClick={openAddModal} 
                    className="bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-8 py-3.5 rounded-full shadow-md font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm tracking-wide"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    New Category
                </button>
            </div>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
              <div className="col-span-full flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div></div>
          ) : (
              categories.map((cat) => (
                <div key={cat.categoryid} className="relative group block">
                  
                  {/* --- 3-DOT MENU --- */}
                  <div className="absolute top-6 right-6 z-40">
                    <button 
                      onClick={(e) => toggleMenu(e, cat.categoryid)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-700 bg-white border border-slate-100 shadow-sm"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>

                    {activeMenuId === cat.categoryid && (
                      <div className="absolute right-0 top-12 bg-white rounded-2xl shadow-xl py-2 w-44 border border-slate-100 z-50 overflow-hidden">
                        <button 
                          onClick={(e) => openEditModal(e, cat)}
                          className="w-full text-left px-5 py-3 text-sm text-slate-700 font-medium hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                        >
                          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Edit Details
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, cat.categoryid)}
                          className="w-full text-left px-5 py-3 text-sm text-rose-600 font-medium hover:bg-rose-50 flex items-center gap-3 transition-colors"
                        >
                          <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* --- CLICKABLE CARD --- */}
                  <Link href={`/admin/inventory/products?category=${cat.categoryid}`}>
                    <div className="bg-white h-[22rem] rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center shadow-sm border border-slate-100 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl cursor-pointer group relative overflow-hidden">
                      
                      {/* Top Hover Gradient Line */}
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FFAFA8] via-purple-300 to-[#ff8a80] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      {/* Icon Circle */}
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:from-[#FFAFA8] group-hover:to-[#ff8a80] group-hover:text-white transition-all duration-500 border border-slate-100 group-hover:border-transparent">
                        {getIcon(cat.categoryname)}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-slate-800 tracking-tight group-hover:text-[#ff8a80] transition-colors duration-300">{cat.categoryname}</h3>
                      <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed px-4">{cat.categorydescription}</p>
                    </div>
                  </Link>

                </div>
              ))
          )}
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative border border-slate-100 text-slate-800">
            <h3 className="text-2xl font-bold mb-8 text-center tracking-tight text-slate-900">
              {isEditing ? 'Edit Category' : 'New Category'}
            </h3>
            
            <div className="flex flex-col gap-6">
              <div>
                  <label className="text-xs font-bold text-slate-500 ml-4 uppercase tracking-wider mb-2 block">Category Name</label>
                  <input 
                    value={currentCat.name}
                    onChange={(e) => setCurrentCat({...currentCat, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-full px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-slate-800 placeholder-slate-400 font-medium transition-all shadow-sm"
                    placeholder="e.g. Gift Boxes"
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-slate-500 ml-4 uppercase tracking-wider mb-2 block">Description</label>
                  <textarea 
                    value={currentCat.description}
                    onChange={(e) => setCurrentCat({...currentCat, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-slate-800 placeholder-slate-400 font-medium transition-all shadow-sm custom-scrollbar"
                    rows={4}
                    placeholder="Short description of the category..."
                  />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <button onClick={() => setShowModal(false)} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-800 transition-all hover:bg-slate-100 rounded-full">Cancel</button>
              <button onClick={handleSave} className="bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-10 py-3 rounded-full font-bold shadow-md hover:shadow-lg hover:opacity-90 hover:scale-105 transition-all tracking-wide">
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM ELEGANT DIALOG BOX --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
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

              <div className="flex gap-4 justify-center">
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