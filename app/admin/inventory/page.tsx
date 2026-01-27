"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    
    // Close menu when clicking anywhere else
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

  // --- LOGOUT FUNCTION (UPDATED) ---
  const handleLogout = async () => {
    try {
      // 1. Ask the server to delete the cookies (Wait for this to finish!)
      await fetch('/api/logout', { method: 'POST' });
      
      // 2. Clear Local Storage
      localStorage.clear();
      
      // 3. Alert and Force Refresh to Login
      alert("Logged out successfully");
      window.location.href = '/login'; 

    } catch (error) {
      console.error("Logout failed", error);
      // Fallback if API fails
      localStorage.clear();
      window.location.href = '/login';
    }
  };
  // --------------------------------

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
    <div className="min-h-screen bg-[#F3E6EF] font-sans">
      
      {/* HEADER */}
      <header className="bg-[#134B5F] text-white py-4 px-8 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
           <button onClick={() => router.back()} className="text-xl hover:bg-white/10 p-2 rounded-full transition">←</button>
           <h1 className="text-xl font-bold tracking-wider">ADMIN PANEL</h1>
        </div>
        <div className="flex items-center gap-4">
            {/* UPDATED LOGOUT BUTTON */}
            <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-5 rounded-full transition"
            >
            LOGOUT
            </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-serif text-gray-900">Inventory Management</h2>
            <p className="text-gray-600 text-sm mt-1">Manage your products, ready-made & custom boxes.</p>
          </div>
          <button onClick={openAddModal} className="bg-[#403b58] hover:bg-[#2e2a40] text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition transform hover:scale-105">
            <span className="text-xl font-bold">+</span> Add New Category
          </button>
        </div>

        {/* CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? <p>Loading...</p> : categories.map((cat) => (
            
            <div key={cat.categoryid} className="relative group block">
              
              {/* --- 3-DOT MENU --- */}
              <div className="absolute top-4 right-4 z-40">
                <button 
                  onClick={(e) => toggleMenu(e, cat.categoryid)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/10 transition font-bold text-gray-800 text-xl bg-white/50 backdrop-blur-sm"
                >
                  ⋮
                </button>

                {activeMenuId === cat.categoryid && (
                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-xl py-2 w-32 border border-gray-200 z-50">
                    <button 
                      onClick={(e) => openEditModal(e, cat)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={(e) => handleDelete(e, cat.categoryid)}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>

              {/* --- CLICKABLE CARD -> NAVIGATES TO PRODUCT PAGE --- */}
              <Link href={`/admin/inventory/products?category=${cat.categoryid}`}>
                <div className="bg-[#94A3B8] h-60 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-md transition transform hover:-translate-y-1 hover:shadow-xl cursor-pointer">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
                    {getIcon(cat.categoryname)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{cat.categoryname}</h3>
                  <p className="text-gray-700 text-sm mt-2">{cat.categorydescription}</p>
                </div>
              </Link>

            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white w-full max-w-md rounded-2xl p-8 shadow-2xl relative">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {isEditing ? 'Edit Category' : 'Add New Category'}
            </h3>
            
            <div className="flex flex-col gap-4">
              <label className="text-sm font-bold text-gray-700">Category Name</label>
              <input 
                value={currentCat.name}
                onChange={(e) => setCurrentCat({...currentCat, name: e.target.value})}
                className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#134B5F]"
              />
              <label className="text-sm font-bold text-gray-700">Description</label>
              <textarea 
                value={currentCat.description}
                onChange={(e) => setCurrentCat({...currentCat, description: e.target.value})}
                className="bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#134B5F]"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleSave} className="bg-[#134B5F] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#0f3a4a]">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}