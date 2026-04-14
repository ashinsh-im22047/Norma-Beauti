"use client";

import React, { useEffect, useState, useCallback } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import ProductDetailsModal, { getPriceDetails } from '@/components/ProductDetailsModal'; 
import { useRouter } from 'next/navigation'; 

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'cat_individual', name: 'Individual Product' },
  { id: 'cat_ready_box', name: 'Ready Made Gift Boxes' },
  { id: 'cat_custom_box', name: 'Customizable Gift Box'}, 
];

export default function ShopPage() {
  const router = useRouter(); 
  
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  
  const [categoryNewArrivals, setCategoryNewArrivals] = useState<any[]>([]); 
  const [categoryOffers, setCategoryOffers] = useState<any[]>([]); 
  
  const [offerSlideIndex, setOfferSlideIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const itemsPerSlide = 4;

  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  
  const [minPrice, setMinPrice] = useState(''); 
  const [maxPrice, setMaxPrice] = useState(''); 
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [alertState, setAlertState] = useState({ 
    show: false, title: '', message: '', type: 'success', redirect: '' 
  });

  const closeAlert = () => {
    const redirectPath = alertState.redirect;
    setAlertState({ ...alertState, show: false, redirect: '' });
    if (redirectPath) router.push(redirectPath);
  };

  const dismissAlert = () => setAlertState(prev => ({ ...prev, show: false }));

  const fetchActiveOffers = async () => {
      try {
          const res = await fetch('/api/offers');
          if (res.ok) {
              return await res.json();
          }
      } catch (error) {
          console.error("Failed to load offers", error);
      }
      return [];
  };

  const fetchProductsByCategory = useCallback(async (catId: string, currentOffers: any[]) => {
    setIsLoadingProducts(true);
    try {
        setSearchTerm(''); setMinPrice(''); setMaxPrice(''); setSortOption('newest'); 
        setSlideIndex(0); setOfferSlideIndex(0);

        const url = catId === 'all' ? '/api/inventory-items' : `/api/inventory-items?categoryId=${catId}`;
        const res = await fetch(url);
        let data = await res.json();
        
        if (catId === 'cat_custom_box') {
           data = data.filter((item: any) => {
             const status = item.customStatus || item.custom_status || item.status;
             return status === 'approved';
           });
        }
        
        const enhancedData = data.map((item: any, index: number) => {
            const offerMatch = currentOffers.find(offer => offer.id === (item.id || item.productid || item.itemid));
            const isNewArrival = index >= data.length - 10;

            if (offerMatch) {
                return {
                    ...item,
                    isOffer: true,
                    offername: offerMatch.offername,
                    offer_type: offerMatch.offer_type,
                    discountpercent: offerMatch.discountpercent,
                    fixed_discount: offerMatch.fixed_discount,
                    buy_qty: offerMatch.buy_qty,
                    get_qty: offerMatch.get_qty,
                    isNew: isNewArrival 
                };
            }
            
            return { ...item, isNew: isNewArrival };
        });

        const reversedData = enhancedData.reverse();

        setProducts(reversedData);
        setFilteredProducts(reversedData);

        const currentCatOffers = reversedData.filter((item: any) => item.isOffer);
        setCategoryOffers(currentCatOffers);

        const latestItems = reversedData.filter((item: any) => item.isNew && !item.isOffer).slice(0, 10);
        setCategoryNewArrivals(latestItems);

    } catch (err) { console.error(err); } 
    finally { setIsLoadingProducts(false); }
  }, []);

  useEffect(() => { 
      const loadAllData = async () => {
          const offers = await fetchActiveOffers(); 
          await fetchProductsByCategory(activeCategory, offers); 
      };
      loadAllData();
  }, [activeCategory, fetchProductsByCategory]);

  useEffect(() => {
    let result = [...products];
    if (searchTerm) result = result.filter(item => (item.name || item.productname || item.itemname || '').toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (minPrice) result = result.filter(item => getPriceDetails(item).finalPrice >= parseFloat(minPrice));
    if (maxPrice) result = result.filter(item => getPriceDetails(item).finalPrice <= parseFloat(maxPrice));
    
    if (sortOption === 'price-low') result.sort((a, b) => getPriceDetails(a).finalPrice - getPriceDetails(b).finalPrice);
    else if (sortOption === 'price-high') result.sort((a, b) => getPriceDetails(b).finalPrice - getPriceDetails(a).finalPrice);
    
    setFilteredProducts(result);
  }, [searchTerm, sortOption, minPrice, maxPrice, products]);

  const handleAddToCart = async (item: any, quantity: number = 1) => {
    const storedUserId = localStorage.getItem('userId');
    const storedSession = document.cookie.includes("user_session=true");

    if (!storedUserId && !storedSession) {
        setAlertState({ show: true, title: 'Login Required', message: 'Please login or create an account to add items to your cart.', type: 'error', redirect: '/login' });
        return; 
    }

    try {
      const itemId = item.id || item.productid || item.itemid;
      const itemType = item.type || (String(itemId).includes('prod') ? 'product' : 'item');

      const { finalPrice } = getPriceDetails(item);

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: itemId, 
          type: itemType,
          price: finalPrice, 
          quantity: quantity
        }),
      });

      if (res.status === 401) {
        setAlertState({ show: true, title: 'Login Required', message: 'Your session has expired. Please login again.', type: 'error', redirect: '/login' });
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add to cart');

      setAlertState({ show: true, title: 'Added to Bag', message: `${quantity}x ${item.name || item.productname || item.itemname} added to your shopping bag.`, type: 'success', redirect: '' });
    } catch (error: any) {
      setAlertState({ show: true, title: 'Error', message: error.message || 'Something went wrong.', type: 'error', redirect: '' });
    }
  };

  const nextSlide = () => setSlideIndex(prev => (prev + itemsPerSlide < categoryNewArrivals.length ? prev + 1 : 0));
  const prevSlide = () => setSlideIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, categoryNewArrivals.length - itemsPerSlide)));
  
  const nextOfferSlide = () => setOfferSlideIndex(prev => (prev + itemsPerSlide < categoryOffers.length ? prev + 1 : 0));
  const prevOfferSlide = () => setOfferSlideIndex(prev => (prev > 0 ? prev - 1 : Math.max(0, categoryOffers.length - itemsPerSlide)));

  // --- STRICT PRODUCT CARD BADGE LOGIC & SMART PRICING ---
  const ProductCard = ({ item }: { item: any }) => {
    const imgUrl = item.imageurl || item.image || (item.images && item.images.length > 0 ? item.images[0] : null);
    const itemName = item.name || item.productname || item.itemname;
    const itemDesc = item.desc || item.description || item.productdescription;
    
    let { originalPrice, finalPrice, isDiscounted, badgeText } = getPriceDetails(item);

    // --- BULLETPROOF VARIANT PARSER ---
    let parsedVariants: any[] = [];
    if (item.variants) {
        try {
            parsedVariants = typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants;
        } catch (e) {
            console.error("Error parsing variants for product", itemName, e);
        }
    }
    
    let displayPriceText = `LKR ${finalPrice.toLocaleString()}`;
    let displayOriginalPriceText = `LKR ${originalPrice.toLocaleString()}`;
    
    // --- UPDATED LOGIC: Always check for variants regardless of base price ---
    if (parsedVariants.length > 0) {
        // Map variants and filter out any NaN or 0 values
        const validPrices = parsedVariants
            .map((v: any) => parseFloat(v.price))
            .filter((p: number) => !isNaN(p) && p > 0);
        
        if (validPrices.length > 0) {
            const lowestVariantPrice = Math.min(...validPrices);
            displayPriceText = `Starting from LKR ${lowestVariantPrice.toLocaleString()}`;
            displayOriginalPriceText = ``; // Hide original price for variant ranges to avoid confusion
        }
    }

    const isPromo = item.isOffer || isDiscounted || badgeText;
    const isNew = item.isNew;

    return (
        <div 
            onClick={() => setSelectedProduct({ ...item, description: itemDesc, variants: parsedVariants })}
            className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group border border-white/50 flex flex-col h-full relative cursor-pointer"
        >
            <div className="h-44 bg-gradient-to-b from-white to-[#fff0f5] relative overflow-hidden flex items-center justify-center">
                {imgUrl && imgUrl.startsWith('http') ? (
                    <img src={imgUrl} alt={itemName} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out" />
                ) : <span className="text-3xl text-gray-300">📷</span>}
                
                {isNew && !isPromo && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-lg tracking-wider z-10">NEW</div>
                )}
                
                {isPromo && badgeText && (
                    <div className={`absolute top-3 left-3 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg tracking-wider animate-bounce z-10
                        ${item.offer_type === 'BOGO' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 
                          item.offer_type === 'FIXED' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                          'bg-gradient-to-r from-[#880e4f] to-[#e91e63]'}`}
                    >
                        {badgeText}
                    </div>
                )}

                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                    <span className="text-xs font-bold text-white bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm shadow-lg border border-white/20">View Details</span>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-1 flex-grow">
                <h4 className="font-serif font-bold text-base text-[#880e4f] truncate tracking-wide">{itemName}</h4>
                <p className="text-[10px] text-gray-500 line-clamp-2 flex-grow italic">{itemDesc}</p>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#f8bbd0]/30">
                    
                    <div className="flex flex-col leading-tight">
                        {isPromo && isDiscounted ? (
                            <>
                                {displayOriginalPriceText && <span className="text-[10px] text-gray-400 line-through">{displayOriginalPriceText}</span>}
                                <span className="text-sm font-bold text-red-600">{displayPriceText}</span>
                            </>
                        ) : isPromo && item.offer_type === 'BOGO' ? (
                            <>
                                <span className="text-[9px] text-[#e91e63] font-bold uppercase tracking-wider">{item.offername}</span>
                                <span className="text-sm font-bold text-[#ad1457]">{displayPriceText}</span>
                            </>
                        ) : (
                            <span className="text-sm font-bold text-[#ad1457]">{displayPriceText}</span>
                        )}
                    </div>

                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (parsedVariants.length > 0) {
                                setSelectedProduct({ ...item, description: itemDesc, variants: parsedVariants });
                            } else {
                                handleAddToCart(item, 1); 
                            }
                        }}
                        className="bg-[#880e4f] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-[#e91e63] hover:to-[#ff4081] transition-all shadow-md text-sm z-10 relative"
                        title={parsedVariants.length > 0 ? "Select Options" : "Add to Cart"}
                    >
                    {parsedVariants.length > 0 ? "..." : "+"}
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const showFilters = activeCategory === 'cat_ready_box' || activeCategory === 'cat_custom_box' || searchTerm.trim().length > 0;

  return (
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
                 
                 {showFilters && (
                     <div className="flex gap-2 w-full md:w-auto flex-shrink-0 justify-center animate-fade-in items-center">
                        <input type="number" placeholder="Min Rs." value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-24 px-3 py-2 rounded-full bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#f06292] text-xs font-medium text-center" />
                        <span className="text-white/50">-</span>
                        <input type="number" placeholder="Max Rs." value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-24 px-3 py-2 rounded-full bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#f06292] text-xs font-medium text-center"/>
                        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="px-4 py-2 rounded-full bg-white/10 text-white font-medium text-xs cursor-pointer focus:outline-none hover:bg-white/20 transition text-center border border-white/20">
                            <option value="newest">Newest First</option>
                            <option value="price-low">Price Low-High</option>
                            <option value="price-high">Price High-Low</option>
                        </select>
                     </div>
                 )}

                 <div className="flex gap-2 w-full md:w-auto justify-center flex-shrink-0">
                    <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="px-4 py-2 rounded-full bg-white/10 text-white font-medium text-xs cursor-pointer focus:outline-none hover:bg-white/20 transition text-center border border-white/20">
                        {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id} className="text-black">{cat.name}</option>)}
                    </select>
                 </div>
             </div>
         </div>
      </div>

      <main className="container mx-auto px-6 py-10 relative z-20">
        
        {/* --- DYNAMIC OFFERS SLIDER --- */}
        {!searchTerm && categoryOffers.length > 0 && (
            <div className="mb-20 bg-gradient-to-r from-[#ff7e5f] via-[#e91e63] to-[#880e4f] p-8 rounded-[2.5rem] shadow-2xl border border-white/20 relative animate-fade-in-up">
                <div className="absolute top-0 right-10 bg-yellow-400 text-black px-4 py-1 rounded-b-xl text-xs font-bold shadow-md tracking-widest uppercase">Limited Time</div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <button onClick={prevOfferSlide} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-white hover:text-[#e91e63] transition-all flex items-center justify-center text-xl group"><span className="group-hover:-translate-x-0.5 transition-transform">&lt;</span></button>
                    <div className="text-center">
                        <h3 className="text-3xl font-serif font-bold text-white tracking-widest mb-1">Exclusive Offers</h3>
                        <p className="text-white/80 text-xs tracking-widest uppercase">
                            {activeCategory === 'all' ? "Grab them before they're gone!" : `Deals on ${CATEGORIES.find(c => c.id === activeCategory)?.name}`}
                        </p>
                        <div className="h-0.5 w-24 bg-white/30 mx-auto mt-2"></div>
                    </div>
                    <button onClick={nextOfferSlide} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-white hover:text-[#e91e63] transition-all flex items-center justify-center text-xl group"><span className="group-hover:translate-x-0.5 transition-transform">&gt;</span></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                    {categoryOffers.slice(offerSlideIndex, offerSlideIndex + itemsPerSlide).map((item, idx) => <ProductCard key={`offer-${item.id}-${idx}`} item={item} />)}
                </div>
            </div>
        )}

        {/* --- NEW ARRIVALS SLIDER --- */}
        {!searchTerm && categoryNewArrivals.length > 0 && (
            <div className="mb-14 bg-gradient-to-r from-[#880e4f] via-[#ad1457] to-[#d81b60] p-8 rounded-[2.5rem] shadow-2xl border border-white/20 relative animate-fade-in-up">
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <button onClick={prevSlide} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-white hover:text-[#ad1457] transition-all flex items-center justify-center text-xl group"><span className="group-hover:-translate-x-0.5 transition-transform">&lt;</span></button>
                    <div className="text-center">
                        <h3 className="text-3xl font-serif font-bold text-white tracking-widest mb-1">New Arrivals</h3>
                        <p className="text-white/70 text-xs tracking-widest uppercase">
                           {activeCategory === 'all' ? 'All Collections' : CATEGORIES.find(c => c.id === activeCategory)?.name}
                        </p>
                        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#f48fb1] to-transparent mx-auto mt-2"></div>
                    </div>
                    <button onClick={nextSlide} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white border border-white/20 shadow-lg hover:bg-white hover:text-[#ad1457] transition-all flex items-center justify-center text-xl group"><span className="group-hover:translate-x-0.5 transition-transform">&gt;</span></button>
                </div>
                {isLoadingProducts ? <p className="text-sm text-center text-white/70">Loading masterpieces...</p> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        {categoryNewArrivals.slice(slideIndex, slideIndex + itemsPerSlide).map((item, idx) => <ProductCard key={`new-${item.id || item.productid || item.itemid}-${idx}`} item={item} />)}
                    </div>
                )}
            </div>
        )}

        {/* ALL / FILTERED PRODUCTS GRID */}
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
            {isLoadingProducts ? (<div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ec407a]"></div></div>) : (<div className="grid grid-cols-2 md:grid-cols-4 gap-6">{filteredProducts.length > 0 ? (filteredProducts.map(item => <ProductCard key={item.id || item.productid || item.itemid} item={item} />)) : (<div className="col-span-full text-center py-20 flex flex-col items-center"><span className="text-4xl mb-2">🌸</span><p className="text-[#880e4f] font-serif italic">No treasures found.</p></div>)}</div>)}
        </div>
      </main>

      {selectedProduct && (
          <ProductDetailsModal 
              product={selectedProduct} 
              onClose={() => setSelectedProduct(null)} 
              onAddToCart={handleAddToCart}
          />
      )}

      {alertState.show && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 animate-fade-in-up relative">
              <button onClick={dismissAlert} className="absolute top-5 right-5 text-gray-400 hover:text-[#880e4f] transition-colors p-2 text-xl leading-none" aria-label="Close">✕</button>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-[#F8BBD0] ${alertState.type === 'success' ? 'bg-[#FCE4EC]' : 'bg-[#FFF9C4]'}`}>
                {alertState.type === 'success' ? '🛍️' : '⚠️'}
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">{alertState.title}</h3>
              <p className="text-[#7B2C62] mb-8 font-medium">{alertState.message}</p>
              <button onClick={closeAlert} className="px-10 py-3 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all w-full">
                {alertState.redirect ? 'Login Now' : 'Continue Shopping'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}