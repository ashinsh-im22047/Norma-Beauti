"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from 'next/image';

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

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      localStorage.clear();
      alert("Logged out successfully");
      window.location.href = '/';
    } catch (error) {
      console.error("Logout failed", error);
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('individual')) return '💄';
    if (lower.includes('ready made') || lower.includes('box')) return '🎁';
    if (lower.includes('custom')) return '⚙️';
    return '📦'; 
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setActiveMenuId(null);   
        await fetchCategories(); 
      } else {
        alert("Failed to delete category.");
      }
    } catch (error) {
      alert("Network Error.");
    }
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
    } catch (error) {
      alert("Error saving category");
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
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#2E1029]">
      
      {/* Decorative Background Glows */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* ADMIN HEADER (Same as Dashboard) */}
      <header className="bg-gradient-to-r from-[#2E1029] to-[#4A1D46] text-white px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50 border-b border-[#D883B7]/30">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="text-xl hover:bg-white/10 p-2 rounded-full transition">←</button>
            <div className="w-10 h-10 rounded-full bg-white/90 overflow-hidden border-2 border-[#D883B7] shadow-md">
                <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif font-bold text-lg tracking-wide text-[#F3E5F5] hidden md:block">NORMA BEAUTI</span>
        </div>
        <button 
            onClick={handleLogout} 
            className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-6 py-2 rounded-full font-bold text-xs hover:opacity-90 transition shadow-md border border-white/20 tracking-wider"
        >
            LOGOUT
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-6 py-10 relative z-10 max-w-7xl">
        
        {/* CONTROLS CARD (Dark Glass) */}
        <div className="bg-[#4A1D46]/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/20 mb-12 text-white">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h2 className="text-3xl font-serif text-white tracking-wide">Inventory Management</h2>
                   <p className="text-sm text-[#D883B7] mt-1 font-medium">Manage your products, ready-made & custom boxes.</p>
                </div>
                <button 
                    onClick={openAddModal} 
                    className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-8 py-3 rounded-xl shadow-lg font-bold hover:opacity-90 hover:scale-105 transition-all flex items-center gap-2 border border-white/20"
                >
                    <span className="text-xl leading-none">+</span> Add New Category
                </button>
            </div>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
              <div className="col-span-full flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9B5DE5]"></div></div>
          ) : (
              categories.map((cat) => (
                <div key={cat.categoryid} className="relative group block">
                  
                  {/* --- 3-DOT MENU --- */}
                  <div className="absolute top-5 right-5 z-40">
                    <button 
                      onClick={(e) => toggleMenu(e, cat.categoryid)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition font-bold text-white text-2xl bg-white/10 backdrop-blur-md"
                    >
                      ⋮
                    </button>

                    {activeMenuId === cat.categoryid && (
                      <div className="absolute right-0 top-10 bg-[#2E1029] backdrop-blur-xl rounded-xl shadow-xl py-2 w-32 border border-white/20 z-50">
                        <button 
                          onClick={(e) => openEditModal(e, cat)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, cat.categoryid)}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10 flex items-center gap-2"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* --- CLICKABLE CARD (Larger & Dark Glass Style) --- */}
                  <Link href={`/admin/inventory/products?category=${cat.categoryid}`}>
                    <div className="bg-[#5D2E46]/90 backdrop-blur-md h-72 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center shadow-lg border border-white/10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-[#5D2E46] cursor-pointer group-hover:border-[#D883B7]/50">
                      
                      {/* Icon Circle (Gradient) */}
                      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] flex items-center justify-center text-5xl mb-6 shadow-md group-hover:scale-110 transition-transform text-white border border-white/20">
                        {getIcon(cat.categoryname)}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white tracking-wide">{cat.categoryname}</h3>
                      <p className="text-[#D883B7] text-sm mt-2 opacity-80 group-hover:opacity-100">{cat.categorydescription}</p>
                    </div>
                  </Link>

                </div>
              ))
          )}
        </div>
      </main>

      {/* MODAL (Elegant Glassmorphism) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#2E1029]/95 backdrop-blur-xl w-full max-w-md rounded-[2rem] p-10 shadow-2xl relative border border-white/30 text-white">
            <h3 className="text-2xl font-serif font-bold mb-8 text-center tracking-wide text-white">
              {isEditing ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <div className="flex flex-col gap-6">
              <div>
                  <label className="text-xs font-bold text-[#D883B7] ml-3 uppercase">Category Name</label>
                  <input 
                    value={currentCat.name}
                    onChange={(e) => setCurrentCat({...currentCat, name: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-white placeholder-white/30 transition"
                  />
              </div>
              <div>
                  <label className="text-xs font-bold text-[#D883B7] ml-3 uppercase">Description</label>
                  <textarea 
                    value={currentCat.description}
                    onChange={(e) => setCurrentCat({...currentCat, description: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-white placeholder-white/30 transition"
                    rows={3}
                  />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-10">
              <button onClick={() => setShowModal(false)} className="px-6 py-2 text-[#D883B7] font-bold hover:text-white transition">Cancel</button>
              <button onClick={handleSave} className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all border border-white/20">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}