"use client";

import React, { useEffect, useState, useCallback } from 'react';
import CustomerHeader from '@/components/CustomerHeader';

const CATEGORIES = [
  { id: 'cat_individual', name: 'Individual Product' },
  { id: 'cat_ready_box', name: 'Ready Made Gift Boxes' },
  { id: 'cat_custom_box', name: 'Customizable Gift Box'}, 
];

export default function ShopPage() {
  // --- STATE ---
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filterType, setFilterType] = useState('all'); 
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  // --- SLIDESHOW STATE ---
  const [slideIndex, setSlideIndex] = useState(0);
  const itemsPerSlide = 4; // Show 4 items at the screen

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const res = await fetch('/api/new-arrivals');
        const dataRaw = await res.json();
        
        // CHANGE: Get the LAST 5 products
        // slice(-5) gets the last 5. reverse() shows the very latest one first.
        const last5Products = dataRaw.slice(-5).reverse();

        setNewArrivals(last5Products.map((item: any) => ({
            id: item.productid, name: item.productname, desc: item.productdescription,
            price: item.price, image: item.imageurl 
        })));
      } catch (err) { console.error(err); } 
      finally { setIsLoadingNew(false); }
    };
    fetchNewArrivals();
  }, []);

  const fetchProductsByCategory = useCallback(async (catId: string) => {
    setIsLoadingProducts(true);
    try {
        setSearchTerm(''); setFilterType('all');
        const res = await fetch(`/api/inventory-items?categoryId=${catId}`);
        let data = await res.json();

        if (catId === 'cat_custom_box') {
           data = data.filter((item: any) => {
             const status = item.customStatus || item.custom_status || item.status;
             return status === 'approved';
           });
        }
        setProducts(data);
        setFilteredProducts(data);
    } catch (err) { console.error(err); }
    finally { setIsLoadingProducts(false); }
  }, []);

  useEffect(() => { fetchProductsByCategory(activeCategory); }, [activeCategory, fetchProductsByCategory]);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = [...products];
    if (searchTerm) result = result.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterType === 'under-1000') result = result.filter(item => parseFloat(item.price) < 1000);
    if (filterType === 'under-5000') result = result.filter(item => parseFloat(item.price) < 5000);
    if (sortOption === 'price-low') result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortOption === 'price-high') result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    setFilteredProducts(result);
  }, [searchTerm, sortOption, filterType, products]);

  // --- SLIDE FUNCTIONS ---
  const nextSlide = () => {
    // If we can slide further
    if (slideIndex + itemsPerSlide < newArrivals.length) {
      setSlideIndex(slideIndex + 1);
    } else {
      setSlideIndex(0); // Loop back to start
    }
  };

  const prevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex(slideIndex - 1);
    } else {
      // Loop to the end
      setSlideIndex(Math.max(0, newArrivals.length - itemsPerSlide)); 
    }
  };

  const ProductCard = ({ item, isNew = false }: { item: any, isNew?: boolean }) => (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition duration-300 overflow-hidden group border border-[#134B5F]/10 flex flex-col h-full">
        <div className="h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
            {item.image && item.image.startsWith('http') ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
            ) : <span className="text-3xl text-gray-400">📷</span>}
            {isNew && <div className="absolute top-2 right-2 bg-[#134B5F] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">NEW</div>}
        </div>
        <div className="p-3 flex flex-col gap-1 flex-grow">
            <h4 className="font-bold text-sm text-gray-800 truncate">{item.name || item.productname}</h4>
            <p className="text-[10px] text-gray-500 line-clamp-2 flex-grow">{item.desc || item.description || item.productdescription}</p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <span className="text-base font-bold text-[#134B5F]">LKR {item.price}</span>
                <button className="bg-[#483D58] text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#134B5F] transition shadow-md text-sm">+</button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3E6EF] font-sans text-[#483D58]">
      
      <CustomerHeader /> 

      {/* HERO BANNER */}
      <header className="relative pt-10 pb-16 px-4 text-center bg-cover bg-center" style={{ backgroundImage: "url('/backgroundHeaderHome.jpg')" }}>
        <div className="absolute inset-0 bg-[#483D58]/70"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-white">
          <h2 className="text-3xl md:text-4xl font-serif mb-2 text-shadow-sm">Find Your Perfect Look</h2>
          <p className="text-gray-200 text-sm md:text-base">Browse our exclusive collection of premium cosmetics.</p>
        </div>
      </header>

      {/* STICKY SEARCH BAR */}
      <div className="sticky top-[72px] z-40 bg-[#483D58]/95 backdrop-blur-md shadow-xl border-y border-white/10 py-4 transition-all duration-300">
         <div className="container mx-auto px-4">
             <div className="flex flex-col lg:flex-row gap-4 items-center justify-center max-w-7xl mx-auto">
                 <div className="w-full md:w-72 relative flex-shrink-0">
                    <span className="absolute left-4 top-2.5 text-[#483D58]/70">🔍</span>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-full bg-white/90 text-[#483D58] font-bold text-sm placeholder-[#483D58]/50 focus:outline-none focus:ring-2 focus:ring-[#E0B0D8] shadow-inner"/>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto flex-shrink-0 justify-center">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 rounded-full bg-white/90 text-[#483D58] font-bold text-xs cursor-pointer focus:outline-none hover:bg-white transition text-center shadow-sm"><option value="all">All Prices</option><option value="under-1000">{'< 1000'}</option><option value="under-5000">{'< 5000'}</option></select>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="px-4 py-2 rounded-full bg-white/90 text-[#483D58] font-bold text-xs cursor-pointer focus:outline-none hover:bg-white transition text-center shadow-sm"><option value="newest">Newest</option><option value="price-low">Price Low-High</option><option value="price-high">Price High-Low</option></select>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto justify-center flex-shrink-0">
                    {CATEGORIES.map((cat) => (
                      <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1 transition-all whitespace-nowrap border ${activeCategory === cat.id ? 'bg-[#E0B0D8] text-[#134B5F] border-[#E0B0D8] shadow-md' : 'bg-white/10 text-white border-white/30 hover:bg-white/20'}`}>{cat.name}</button>
                    ))}
                 </div>
             </div>
         </div>
      </div>

      <main className="container mx-auto px-6 py-8 relative z-20">
        
        {/* --- NEW ARRIVALS SLIDESHOW --- */}
        {!searchTerm && activeCategory === CATEGORIES[0].id && newArrivals.length > 0 && (
            // CHANGE: Dark Gradient Background
            <div className="mb-12 bg-gradient-to-r from-slate-700 to-slate-900 p-8 rounded-[2rem] shadow-xl border border-gray-600 relative">
                
                {/* Header Row with Buttons at Left/Right Corners */}
                <div className="flex items-center justify-between mb-6">
                    
                    {/* LEFT BUTTON (<) */}
                    <button 
                      onClick={prevSlide}
                      className="w-10 h-10 rounded-full bg-white/20 text-white font-bold shadow-md hover:bg-white hover:text-[#134B5F] transition flex items-center justify-center text-xl"
                    >
                      &lt;
                    </button>

                    {/* CENTER TITLE */}
                    <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-serif font-bold text-white">✨ New Arrivals</h3>
                    </div>
                    
                    {/* RIGHT BUTTON (>) */}
                    <button 
                      onClick={nextSlide}
                      className="w-10 h-10 rounded-full bg-white/20 text-white font-bold shadow-md hover:bg-white hover:text-[#134B5F] transition flex items-center justify-center text-xl"
                    >
                      &gt;
                    </button>
                </div>

                {isLoadingNew ? <p className="text-sm text-center text-white">Loading...</p> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 transition-all duration-500 ease-in-out">
                        {/* Slice the array to show only 4 items at a time based on slideIndex */}
                        {newArrivals
                           .slice(slideIndex, slideIndex + itemsPerSlide)
                           .map(item => <ProductCard key={item.id} item={item} isNew={true} />)
                        }
                    </div>
                )}
            </div>
        )}

        {/* REGULAR PRODUCTS LIST */}
        <div className="bg-white/60 p-6 rounded-3xl shadow-sm border border-white/50 backdrop-blur-sm min-h-[400px]">
            <div className="mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-serif font-bold text-[#134B5F]">
                        {searchTerm ? `Results` : activeCategory === 'cat_custom_box' ? 'Available Products' : CATEGORIES.find(c => c.id === activeCategory)?.name}
                    </h3>
                    <div className="h-0.5 flex-grow bg-[#134B5F]/20 rounded-full"></div>
                </div>
                {activeCategory === 'cat_custom_box' && !searchTerm && (<p className="text-sm text-gray-500 mt-1">Choose products and add them to your gift box.</p>)}
            </div>
            
            {isLoadingProducts ? (
                <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#134B5F]"></div></div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(item => <ProductCard key={item.id || item.productid} item={item} />)
                    ) : (
                        <div className="col-span-full text-center py-10"><p className="text-gray-500 text-sm">No items found.</p></div>
                    )}
                </div>
            )}
        </div>
      </main>
    </div>
  );
}