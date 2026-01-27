"use client";

import React, { useEffect, useState, useCallback } from 'react';
import CustomerHeader from '@/components/CustomerHeader';

const CATEGORIES = [
  { id: 'cat_individual', name: 'Individual Product' },
  { id: 'cat_ready_box', name: 'Ready Made Gift Boxes' },
  { id: 'cat_custom_box', name: 'Customizable Gift Box'}, 
];

export default function ShopPage() {
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  const [isLoadingNew, setIsLoadingNew] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [filterType, setFilterType] = useState('all'); 
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);

  const [slideIndex, setSlideIndex] = useState(0);
  const itemsPerSlide = 4;

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        const res = await fetch('/api/new-arrivals');
        const dataRaw = await res.json();
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

  useEffect(() => {
    let result = [...products];
    if (searchTerm) result = result.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterType === 'under-1000') result = result.filter(item => parseFloat(item.price) < 1000);
    if (filterType === 'under-5000') result = result.filter(item => parseFloat(item.price) < 5000);
    if (sortOption === 'price-low') result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortOption === 'price-high') result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    setFilteredProducts(result);
  }, [searchTerm, sortOption, filterType, products]);

  const nextSlide = () => {
    if (slideIndex + itemsPerSlide < newArrivals.length) { setSlideIndex(slideIndex + 1); } 
    else { setSlideIndex(0); }
  };

  const prevSlide = () => {
    if (slideIndex > 0) { setSlideIndex(slideIndex - 1); } 
    else { setSlideIndex(Math.max(0, newArrivals.length - itemsPerSlide)); }
  };

  const ProductCard = ({ item, isNew = false }: { item: any, isNew?: boolean }) => (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group border border-white/50 flex flex-col h-full relative">
        <div className="h-44 bg-gradient-to-b from-white to-[#fff0f5] relative overflow-hidden flex items-center justify-center">
            {item.image && item.image.startsWith('http') ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out" />
            ) : <span className="text-3xl text-gray-300">📷</span>}
            {isNew && <div className="absolute top-3 right-3 bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-lg tracking-wider">NEW</div>}
        </div>
        <div className="p-4 flex flex-col gap-1 flex-grow">
            <h4 className="font-serif font-bold text-base text-[#880e4f] truncate tracking-wide">{item.name || item.productname}</h4>
            <p className="text-[10px] text-gray-500 line-clamp-2 flex-grow italic">{item.desc || item.description || item.productdescription}</p>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#f8bbd0]/30">
                <span className="text-sm font-bold text-[#ad1457]">LKR {item.price}</span>
                <button className="bg-[#880e4f] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-[#e91e63] hover:to-[#ff4081] transition-all shadow-md text-sm">+</button>
            </div>
        </div>
    </div>
  );

  return (
    // UPDATED: Elegant White-Pink Gradient
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46]">
      <CustomerHeader /> 

      <header className="relative pt-10 pb-16 px-4 text-center bg-cover bg-center shadow-md" style={{ backgroundImage: "url('/backgroundHeaderHome.jpg')" }}>
        <div className="absolute inset-0 bg-[#880e4f]/40 backdrop-blur-[1px]"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-white">
          <h2 className="text-3xl md:text-5xl font-serif mb-2 text-shadow-lg tracking-wide">Find Your Perfect Look</h2>
          <p className="text-[#f8bbd0] text-sm md:text-base font-light tracking-widest uppercase">Premium Cosmetics & Jewelry</p>
        </div>
      </header>

      <div className="sticky top-[72px] z-40 bg-[#880e4f]/90 backdrop-blur-md shadow-xl border-y border-white/10 py-4 transition-all duration-300">
         <div className="container mx-auto px-4">
             <div className="flex flex-col lg:flex-row gap-4 items-center justify-center max-w-7xl mx-auto">
                 <div className="w-full md:w-72 relative flex-shrink-0">
                    <span className="absolute left-4 top-2.5 text-[#e91e63]">🔍</span>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-full bg-[#fff0f5] text-[#880e4f] font-bold text-sm placeholder-[#e91e63]/50 focus:outline-none focus:ring-2 focus:ring-[#f06292] shadow-inner"/>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto flex-shrink-0 justify-center">
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 rounded-full bg-white/10 text-white font-medium text-xs cursor-pointer focus:outline-none hover:bg-white/20 transition text-center border border-white/20">
                        <option value="all" className="text-black">All Prices</option><option value="under-1000" className="text-black">{'< 1000'}</option><option value="under-5000" className="text-black">{'< 5000'}</option>
                    </select>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="px-4 py-2 rounded-full bg-white/10 text-white font-medium text-xs cursor-pointer focus:outline-none hover:bg-white/20 transition text-center border border-white/20">
                        <option value="newest" className="text-black">Newest</option><option value="price-low" className="text-black">Price Low-High</option><option value="price-high" className="text-black">Price High-Low</option>
                    </select>
                 </div>
                 <div className="flex gap-2 w-full md:w-auto justify-center flex-shrink-0">
                    {CATEGORIES.map((cat) => (
                      <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1 transition-all whitespace-nowrap border ${activeCategory === cat.id ? 'bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white border-transparent shadow-[0_0_15px_rgba(233,30,99,0.4)]' : 'bg-white/10 text-[#f8bbd0] border-white/20 hover:bg-white/20'}`}>{cat.name}</button>
                    ))}
                 </div>
             </div>
         </div>
      </div>

      <main className="container mx-auto px-6 py-10 relative z-20">
        {!searchTerm && activeCategory === CATEGORIES[0].id && newArrivals.length > 0 && (
            // UPDATED: Richer Pink Gradient for New Arrivals
            <div className="mb-14 bg-gradient-to-r from-[#880e4f] via-[#ad1457] to-[#d81b60] p-8 rounded-[2.5rem] shadow-2xl border border-white/20 relative">
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <button onClick={prevSlide} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-white hover:text-[#ad1457] transition-all flex items-center justify-center text-xl group"><span className="group-hover:-translate-x-0.5 transition-transform">&lt;</span></button>
                    <div className="text-center">
                        <h3 className="text-3xl font-serif font-bold text-white tracking-widest mb-1">New Arrivals</h3>
                        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#f48fb1] to-transparent mx-auto"></div>
                    </div>
                    <button onClick={nextSlide} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-white hover:text-[#ad1457] transition-all flex items-center justify-center text-xl group"><span className="group-hover:translate-x-0.5 transition-transform">&gt;</span></button>
                </div>
                {isLoadingNew ? <p className="text-sm text-center text-white/70">Loading masterpieces...</p> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        {newArrivals.slice(slideIndex, slideIndex + itemsPerSlide).map(item => <ProductCard key={item.id} item={item} isNew={true} />)}
                    </div>
                )}
            </div>
        )}

        <div className="bg-white/40 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl border border-white/60 min-h-[500px]">
            <div className="mb-8 flex flex-col items-start relative">
                <div className="flex items-center gap-4 w-full">
                    <h3 className="text-2xl font-serif font-bold text-[#880e4f]">
                        {searchTerm ? `Results for "${searchTerm}"` : activeCategory === 'cat_custom_box' ? 'Available Products' : CATEGORIES.find(c => c.id === activeCategory)?.name}
                    </h3>
                    <div className="h-[1px] flex-grow bg-gradient-to-r from-[#ec407a]/50 to-transparent"></div>
                </div>
                {activeCategory === 'cat_custom_box' && !searchTerm && (<p className="text-sm text-[#ad1457] mt-1 font-medium italic">Create your own box of happiness.</p>)}
            </div>
            {isLoadingProducts ? (<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ec407a]"></div></div>) : (<div className="grid grid-cols-2 md:grid-cols-4 gap-6">{filteredProducts.length > 0 ? (filteredProducts.map(item => <ProductCard key={item.id || item.productid} item={item} />)) : (<div className="col-span-full text-center py-20 flex flex-col items-center"><span className="text-4xl mb-2">🌸</span><p className="text-[#880e4f] font-serif italic">No treasures found.</p></div>)}</div>)}
        </div>
      </main>
    </div>
  );
}