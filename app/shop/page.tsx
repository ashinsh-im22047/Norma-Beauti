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

  const ProductCard = ({ item }: { item: any }) => {
    const imgUrl = item.imageurl || item.image || (item.images && item.images.length > 0 ? item.images[0] : null);
    const itemName = item.name || item.productname || item.itemname;
    const itemDesc = item.desc || item.description || item.productdescription;
    
    let { originalPrice, finalPrice, isDiscounted, badgeText } = getPriceDetails(item);

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
    
    if (parsedVariants.length > 0) {
        const validPrices = parsedVariants.map((v: any) => parseFloat(v.price)).filter((p: number) => !isNaN(p) && p > 0);
        if (validPrices.length > 0) {
            const lowestVariantPrice = Math.min(...validPrices);
            displayPriceText = `Starting LKR ${lowestVariantPrice.toLocaleString()}`;
            displayOriginalPriceText = ``; 
        }
    }

    const isPromo = item.isOffer || isDiscounted || badgeText;
    const isNew = item.isNew;

    return (
        <div 
            onClick={() => setSelectedProduct({ ...item, description: itemDesc, variants: parsedVariants })}
            className="bg-[#fffafa] rounded-xl shadow hover:shadow-lg transition-all duration-300 overflow-hidden group border border-[#F76D82]/20 flex flex-col h-full relative cursor-pointer"
        >
            <div className="h-40 bg-white relative overflow-hidden flex items-center justify-center">
                {imgUrl ? (
                    <img src={imgUrl} alt={itemName} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-in-out" />
                ) : <svg className="w-8 h-8 text-[#F76D82]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                
                {isNew && !isPromo && (
                    <div className="absolute top-2 right-2 bg-[#EC5564] text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 uppercase">NEW</div>
                )}
                
                {isPromo && badgeText && (
                    <div className="absolute top-2 left-2 bg-[#D94452] text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 uppercase animate-pulse">
                        {badgeText}
                    </div>
                )}
            </div>

            <div className="p-3 flex flex-col gap-1 flex-grow">
                <h4 className="font-bold text-xs text-[#D94452] truncate uppercase tracking-tighter">{itemName}</h4>
                <div className="flex justify-between items-center mt-auto pt-2 border-t border-[#F76D82]/10">
                    <div className="flex flex-col">
                        {isPromo && isDiscounted ? (
                            <>
                                {displayOriginalPriceText && <span className="text-[9px] text-[#F76D82]/60 line-through">{displayOriginalPriceText}</span>}
                                <span className="text-[11px] font-bold text-[#D94452]">{displayPriceText}</span>
                            </>
                        ) : (
                            <span className="text-[11px] font-bold text-[#EC5564]">{displayPriceText}</span>
                        )}
                    </div>
                    <button className="bg-[#EC5564] text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-[#D94452] transition-colors shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
  };

  const showFilters = activeCategory === 'cat_ready_box' || activeCategory === 'cat_custom_box' || searchTerm.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#fff5f5] font-sans text-slate-800">
      <CustomerHeader /> 

      {/* GRADIENT HEADER - NO WHITE */}
      <header className="relative pt-8 pb-10 px-4 text-center bg-gradient-to-r from-[#F76D82] via-[#EC5564] to-[#D94452] shadow-inner overflow-hidden">
        <div className="absolute inset-0 bg-black/10 opacity-20"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-white">
          <h2 className="text-2xl md:text-4xl font-bold tracking-tight uppercase">Find Your Perfect Look</h2>
          <p className="text-[#fffafa]/80 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">Premium Cosmetics & Jewelry</p>
        </div>
      </header>

      {/* Search & Categories Bar */}
      <div className="sticky top-[72px] z-40 bg-[#EC5564]/95 backdrop-blur-md shadow-md py-3">
         <div className="container mx-auto px-4">
             <div className="flex flex-col md:flex-row gap-3 items-center justify-between max-w-6xl mx-auto">
                 <div className="w-full md:w-64 relative">
                    <svg className="w-4 h-4 text-[#F76D82] absolute left-3.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-1.5 rounded-full bg-[#fffafa] text-[#D94452] font-bold text-xs placeholder-[#F76D82]/50 focus:outline-none focus:ring-2 focus:ring-[#F76D82]"/>
                 </div>
                 
                 <div className="flex flex-wrap items-center justify-center gap-2">
                    {showFilters && (
                        <div className="flex items-center gap-1 bg-[#fffafa]/20 rounded-full px-3 py-1 border border-white/30">
                            <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-12 bg-transparent text-white placeholder-white/60 text-[10px] outline-none text-center" />
                            <span className="text-white/50">-</span>
                            <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-12 bg-transparent text-white placeholder-white/60 text-[10px] outline-none text-center"/>
                        </div>
                    )}
                    <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="pl-4 pr-8 py-1.5 rounded-full bg-[#D94452] text-white font-bold text-[10px] cursor-pointer hover:bg-black/20 transition-all outline-none border border-white/20">
                        {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                 </div>
             </div>
         </div>
      </div>

      <main className="container mx-auto px-4 md:px-6 py-8 relative z-20">
        
        {/* NEW ARRIVALS - COMPACT GRADIENT BOX */}
        {!searchTerm && categoryNewArrivals.length > 0 && (
            <div className="mb-10 bg-gradient-to-br from-[#F76D82] to-[#EC5564] p-6 rounded-3xl shadow-xl relative">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevSlide} className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white hover:text-[#EC5564] transition-all flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
                    <div className="text-center">
                        <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tighter">New Arrivals</h3>
                    </div>
                    <button onClick={nextSlide} className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white hover:text-[#EC5564] transition-all flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categoryNewArrivals.slice(slideIndex, slideIndex + itemsPerSlide).map((item, idx) => <ProductCard key={`new-${idx}`} item={item} />)}
                </div>
            </div>
        )}

        {/* OFFERS - COMPACT GRADIENT BOX */}
        {!searchTerm && categoryOffers.length > 0 && (
            <div className="mb-10 bg-gradient-to-br from-[#EC5564] to-[#D94452] p-6 rounded-3xl shadow-xl relative border-t-4 border-white/20">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={prevOfferSlide} className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white hover:text-[#D94452] transition-all flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg></button>
                    <div className="text-center">
                        <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tighter">Exclusive Offers</h3>
                    </div>
                    <button onClick={nextOfferSlide} className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white hover:text-[#D94452] transition-all flex items-center justify-center"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categoryOffers.slice(offerSlideIndex, offerSlideIndex + itemsPerSlide).map((item, idx) => <ProductCard key={`offer-${idx}`} item={item} />)}
                </div>
            </div>
        )}

        {/* MAIN PRODUCT GRID - NO WHITE BACKGROUND */}
        <div className="bg-[#fffafa] p-6 rounded-3xl shadow-sm border border-[#F76D82]/10 min-h-[400px]">
            <div className="mb-6 flex items-center justify-between border-b border-[#F76D82]/10 pb-3">
                <h3 className="text-xl font-bold text-[#D94452] uppercase tracking-tighter">
                    {searchTerm ? `Search: "${searchTerm}"` : activeCategory === 'all' ? 'All Masterpieces' : CATEGORIES.find(c => c.id === activeCategory)?.name}
                </h3>
            </div>
            
            {isLoadingProducts ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EC5564]"></div></div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map(item => <ProductCard key={item.id || item.productid || item.itemid} item={item} />)
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center opacity-40">
                            <svg className="w-12 h-12 text-[#D94452] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            <p className="text-[#D94452] font-bold text-sm">No items found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>

      {/* Modals & Alerts */}
      {selectedProduct && (
          <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onAddToCart={handleAddToCart} />
      )}

      {alertState.show && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-xs w-full text-center border-t-8 border-[#EC5564]">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${alertState.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-500' : 'bg-rose-50 border-rose-200 text-rose-500'}`}>
                {alertState.type === 'success' ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{alertState.title}</h3>
              <p className="text-slate-500 text-xs mb-6 leading-relaxed">{alertState.message}</p>
              <button onClick={closeAlert} className="px-8 py-2.5 bg-gradient-to-r from-[#F76D82] to-[#D94452] text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all w-full text-[10px] uppercase tracking-widest">
                {alertState.redirect ? 'Go to Login' : 'Dismiss'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
}