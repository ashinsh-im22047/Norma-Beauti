"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

// Define Category Options
const CATEGORIES = [
  { id: 'cat_individual', name: 'Individual' },
  { id: 'cat_ready_box', name: 'Ready Made Boxes' },
  { id: 'cat_custom_box', name: 'Customizable Boxes' }, 
];

export default function CustomerHomePage() {
  // --- STATE ---
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filterType, setFilterType] = useState('all'); 
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  // --- 1. FETCH INITIAL DATA (New Arrivals) ---
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const res = await fetch('/api/new-arrivals');
        const dataRaw = await res.json();
        const dataNormalized = dataRaw.map((item: any) => ({
            id: item.productid, name: item.productname, desc: item.productdescription,
            price: item.price, image: item.imageurl 
        }));
        setNewArrivals(dataNormalized);
      } catch (err) { console.error(err); } 
      finally { setIsLoadingNew(false); }
    };
    fetchNewArrivals();
  }, []);

  // --- 2. FETCH PRODUCTS BASED ON ACTIVE CATEGORY ---
  const fetchProductsByCategory = useCallback(async (catId: string) => {
    setIsLoadingProducts(true);
    try {
        setSearchTerm(''); setFilterType('all');
        const res = await fetch(`/api/inventory-items?categoryId=${catId}`);
        const data = await res.json();
        setProducts(data);
        setFilteredProducts(data);
    } catch (err) { console.error(err); }
    finally { setIsLoadingProducts(false); }
  }, []);

  useEffect(() => {
    fetchProductsByCategory(activeCategory);
  }, [activeCategory, fetchProductsByCategory]);

  // --- 3. CLIENT-SIDE SEARCH & FILTER LOGIC ---
  useEffect(() => {
    let result = [...products];

    if (searchTerm) {
      result = result.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterType === 'under-1000') result = result.filter(item => parseFloat(item.price) < 1000);
    if (filterType === 'under-5000') result = result.filter(item => parseFloat(item.price) < 5000);

    if (sortOption === 'price-low') result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortOption === 'price-high') result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));

    setFilteredProducts(result);
  }, [searchTerm, sortOption, filterType, products]);

  // --- COMPONENT: PRODUCT CARD ---
  const ProductCard = ({ item, isNew = false }: { item: any, isNew?: boolean }) => (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden group border border-[#134B5F]/10 flex flex-col h-full">
        <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
            {item.image && item.image.startsWith('http') ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
            ) : (
                <span className="text-3xl text-gray-400">📷</span>
            )}
            {isNew && <div className="absolute top-2 right-2 bg-[#134B5F] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">NEW</div>}
        </div>
        <div className="p-3 flex flex-col gap-1 flex-grow">
            <h4 className="font-bold text-sm text-gray-800 truncate">{item.name}</h4>
            <p className="text-[10px] text-gray-500 line-clamp-2 flex-grow">{item.desc}</p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <span className="text-base font-bold text-[#134B5F]">Rs {item.price}</span>
                <button className="bg-[#483D58] text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#134B5F] transition shadow-md text-sm">+</button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3E6EF] font-sans text-[#483D58]">
      
      {/* 1. NAVBAR (Sticky Top 0) */}
      <nav className="bg-[#134B5F] text-white sticky top-0 z-50 shadow-lg h-16 flex items-center">
        <div className="container mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#134B5F] font-bold text-lg">N</div>
                <h1 className="text-xl font-bold tracking-widest font-serif">NORMA BEAUTI</h1>
            </div>
            <div className="flex items-center gap-6 font-semibold text-xs md:text-sm">
               <Link href="/login" className="hover:text-[#E0B0D8] transition">Login</Link>
               <Link href="/register" className="bg-[#E0B0D8] text-[#134B5F] px-4 py-1.5 rounded-full hover:bg-white transition font-bold">Sign Up</Link>
               <Link href="/cart" className="relative hover:text-[#E0B0D8] transition text-lg">🛒<span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] w-3 h-3 flex items-center justify-center rounded-full">0</span></Link>
               <Link href="/profile" className="hover:text-[#E0B0D8] transition text-lg">👤</Link>
            </div>
        </div>
      </nav>

      {/* 2. HERO TITLE (Scrolls Away) */}
      <header 
        className="relative pt-10 pb-16 px-4 text-center bg-cover bg-center" 
        style={{ backgroundImage: "url('/backgroundHeaderHome.jpg')" }} 
      >
        <div className="absolute inset-0 bg-[#483D58]/70"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-serif mb-2 text-shadow-sm">Find Your Perfect Look</h2>
          <p className="text-gray-200 text-sm md:text-base">Browse our exclusive collection of premium beauti items.</p>
        </div>
      </header>

      {/* 3. STICKY SEARCH & FILTER BAR (Sticks below Navbar) */}
      {/* top-16 ensures it sticks exactly below the 16px height navbar */}
      <div className="sticky top-16 z-40 bg-[#483D58]/80 backdrop-blur-md shadow-xl border-y border-white/10 py-4 transition-all duration-300">
         <div className="container mx-auto px-4">
             
             {/* Controls Container */}
             <div className="flex flex-col md:flex-row gap-3 items-center justify-center max-w-5xl mx-auto">
                 
                 {/* Search Input */}
                 <div className="w-full md:w-96 relative">
                    <span className="absolute left-4 top-2.5 text-[#483D58]/70">🔍</span>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-full bg-white/90 text-[#483D58] font-bold text-sm placeholder-[#483D58]/50 focus:outline-none focus:ring-2 focus:ring-[#E0B0D8] shadow-inner"/>
                 </div>

                 {/* Dropdowns */}
                 <div className="flex gap-2 w-full md:w-auto">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-1/2 md:w-auto px-4 py-2 rounded-full bg-white/90 text-[#483D58] font-bold text-xs cursor-pointer focus:outline-none hover:bg-white transition text-center shadow-sm">
                        <option value="all">All Prices</option><option value="under-1000">{'< 1000'}</option><option value="under-5000">{'< 5000'}</option>
                    </select>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="w-1/2 md:w-auto px-4 py-2 rounded-full bg-white/90 text-[#483D58] font-bold text-xs cursor-pointer focus:outline-none hover:bg-white transition text-center shadow-sm">
                        <option value="newest">Newest</option><option value="price-low">Price: Low</option><option value="price-high">Price: High</option>
                    </select>
                 </div>

                 {/* Category Buttons (Inline) */}
                 <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 justify-center">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-2 rounded-full font-bold text-[10px] md:text-xs flex items-center gap-1 transition-all whitespace-nowrap border
                          ${activeCategory === cat.id 
                            ? 'bg-[#E0B0D8] text-[#134B5F] border-[#E0B0D8] shadow-md' 
                            : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                          }`}
                      >
                         {cat.name}
                      </button>
                    ))}
                 </div>
             </div>
         </div>
      </div>

      {/* 4. MAIN CONTENT */}
      <main className="container mx-auto px-6 py-8 relative z-20">
        
        {/* NEW ARRIVALS */}
        {!searchTerm && activeCategory === CATEGORIES[0].id && newArrivals.length > 0 && (
            <div className="mb-10 bg-white/60 p-6 rounded-3xl shadow-sm border border-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-xl font-serif font-bold text-[#134B5F]">New Arrivals</h3>
                    <div className="h-0.5 flex-grow bg-[#134B5F]/20 rounded-full"></div>
                </div>
                {isLoadingNew ? <p className="text-sm">Loading...</p> : (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {newArrivals.map(item => <ProductCard key={item.id} item={item} isNew={true} />)}
                   </div>
                )}
            </div>
        )}

        {/* BROWSE PRODUCTS */}
        <div className="bg-white/60 p-6 rounded-3xl shadow-sm border border-white/50 backdrop-blur-sm min-h-[400px]">
            <div className="flex items-center gap-4 mb-6">
                <h3 className="text-xl font-serif font-bold text-[#134B5F]">
                    {searchTerm ? `Results` : CATEGORIES.find(c => c.id === activeCategory)?.name}
                </h3>
                <div className="h-0.5 flex-grow bg-[#134B5F]/20 rounded-full"></div>
            </div>

            {isLoadingProducts ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#134B5F]"></div></div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(item => <ProductCard key={item.id || item.productid} item={item} />)
                    ) : (
                        <div className="col-span-full text-center py-10">
                            <p className="text-gray-500 text-sm">No items found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-[#134B5F] text-white text-center py-6 mt-8">
        <h2 className="text-lg font-bold font-serif mb-1">NORMA BEAUTI</h2>
        <p className="text-xs opacity-70">© 2026 All Rights Reserved.</p>
      </footer>

    </div>
  );
}