"use client";

import React, { useState, useEffect } from 'react';

interface ProductDetailsModalProps {
    product: any; 
    onClose: () => void; 
    onAddToCart: (item: any, quantity: number) => void; 
}

export const getPriceDetails = (item: any) => {
    const originalPrice = parseFloat(item.originalPrice || item.itemprice || item.price || 0);
    let finalPrice = originalPrice;
    let isDiscounted = false;
    let badgeText = item.offername || '';

    const pct = parseFloat(item.discountpercent);
    const fix = parseFloat(item.fixed_discount);

    if (item.offer_type === 'FIXED' && !isNaN(fix) && fix > 0) {
        finalPrice = Math.max(0, originalPrice - fix);
        isDiscounted = true;
        badgeText = `LKR ${fix} OFF`;
    } else if (item.offer_type === 'PERCENTAGE' && !isNaN(pct) && pct > 0) {
        finalPrice = originalPrice - (originalPrice * pct / 100);
        isDiscounted = true;
        badgeText = `${pct}% OFF`;
    } else if (item.offer_type === 'BOGO' && item.buy_qty && item.get_qty) {
        badgeText = `Buy ${item.buy_qty} Get ${item.get_qty} FREE`;
    } else if (!isNaN(fix) && fix > 0) {
        finalPrice = Math.max(0, originalPrice - fix);
        isDiscounted = true;
        badgeText = `LKR ${fix} OFF`;
    } else if (!isNaN(pct) && pct > 0) {
        finalPrice = originalPrice - (originalPrice * pct / 100);
        isDiscounted = true;
        badgeText = `${pct}% OFF`;
    }

    return { originalPrice, finalPrice, isDiscounted, badgeText };
};

export default function ProductDetailsModal({ product, onClose, onAddToCart }: ProductDetailsModalProps) {
    const [quantity, setQuantity] = useState(1);
    const [deliveryDays, setDeliveryDays] = useState({ min: 3, max: 5 });
    
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    const [includedProducts, setIncludedProducts] = useState<any[]>(product?.includedProducts || []);
    const [loadingIncluded, setLoadingIncluded] = useState(false);

    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [alertState, setAlertState] = useState({ show: false, title: '', message: '', type: 'success' });

    const [cartQty, setCartQty] = useState(0);

    const parsedVariants = product?.variants ? (typeof product.variants === 'string' ? JSON.parse(product.variants) : product.variants) : [];
    const validVariants = Array.isArray(parsedVariants) ? parsedVariants : [];
    
    const parsedFeatures = product?.features ? (typeof product.features === 'string' ? JSON.parse(product.features) : product.features) : [];
    const validFeatures = Array.isArray(parsedFeatures) ? parsedFeatures : [];

    const [selectedVariant, setSelectedVariant] = useState<any>(validVariants.length > 0 ? validVariants[0] : null);

    useEffect(() => {
        if (!product) return;
        
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.min_delivery_days !== undefined) {
                    setDeliveryDays({ min: data.min_delivery_days, max: data.max_delivery_days });
                }
            })
            .catch(err => console.error("Failed to load delivery settings", err));

        const fetchReviews = async () => {
            setLoadingReviews(true);
            try {
                const pId = product.productid || (product.type === 'product' ? product.id : null);
                const iId = product.itemid || (product.type === 'item' ? product.id : null);
                
                let url = '/api/reviews?';
                if (pId) url += `productId=${pId}`;
                else if (iId) url += `itemId=${iId}`;
                else { setLoadingReviews(false); return; }

                const res = await fetch(url);
                if (res.ok) {
                    setReviews(await res.json());
                }
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            } finally {
                setLoadingReviews(false);
            }
        };

        const fetchIncludedProducts = async () => {
            const fetchId = product.itemid || product.id;
            if (!fetchId || !String(fetchId).startsWith('item_')) return;

            setLoadingIncluded(true);
            try {
                const res = await fetch(`/api/inventory-items/${fetchId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.includedProducts && Array.isArray(data.includedProducts)) {
                        setIncludedProducts(data.includedProducts);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch box contents", err);
            } finally {
                setLoadingIncluded(false);
            }
        };
        
        // --- FIX: Strictly match cart items by the variant combo string ---
        const fetchCartQuantity = async () => {
            try {
                const res = await fetch('/api/cart', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    let qtyInCart = 0;
                    
                    const targetId = String(product.id || product.productid || product.itemid);
                    const targetCombo = selectedVariant && selectedVariant.combo ? selectedVariant.combo.join(' / ') : "";
                    
                    const itemsArray = Array.isArray(data) ? data : (data.items || []);
                    
                    itemsArray.forEach((cartItem: any) => {
                        const cartItemId = String(cartItem.id || cartItem.productid || cartItem.itemid);
                        
                        if (cartItemId === targetId) {
                            const dbCombo = cartItem.selectedVariantCombo || cartItem.variant_combo || "";
                            
                            if (dbCombo === targetCombo) {
                                qtyInCart += parseInt(cartItem.quantity || cartItem.productquantity || cartItem.itemquantity || 1, 10);
                            }
                        }
                    });
                    setCartQty(qtyInCart);
                }
            } catch (e) {
                console.error("Failed to check cart quantity", e);
            }
        };

        fetchReviews();
        fetchIncludedProducts();
        fetchCartQuantity();
    }, [product, selectedVariant]);

    if (!product) return null; 

    const getDeliveryDates = () => {
        const today = new Date();
        const start = new Date(today); start.setDate(today.getDate() + deliveryDays.min);
        const end = new Date(today); end.setDate(today.getDate() + deliveryDays.max);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
    };

    let maxAvailable = 100;
    if (selectedVariant && selectedVariant.quantity !== undefined) {
        maxAvailable = parseInt(selectedVariant.quantity, 10) || 0;
    } else {
        const rawStock = product.quantity ?? product.availablequantity ?? product.itemquantity;
        maxAvailable = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : 100; 
    }
    
    // Calculate how many more the user can safely add
    const realMaxAvailable = Math.max(0, maxAvailable - cartQty);
    const isInStock = maxAvailable > 0;
    const isLowStock = maxAvailable > 0 && maxAvailable <= 5;
    const canAddToCart = isInStock && realMaxAvailable > 0;

    useEffect(() => {
        if (quantity > realMaxAvailable && realMaxAvailable > 0) {
            setQuantity(realMaxAvailable);
        } else if (quantity < 1 && realMaxAvailable > 0) {
            setQuantity(1);
        } else if (realMaxAvailable === 0) {
            setQuantity(0);
        }
    }, [selectedVariant, realMaxAvailable]);

    const dynamicProductForPrice = { 
        ...product, 
        price: selectedVariant && selectedVariant.price ? selectedVariant.price : (product.price || product.itemprice) 
    };
    const { originalPrice, finalPrice, isDiscounted, badgeText } = getPriceDetails(dynamicProductForPrice);

    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1) 
        : 0;

    const handleUpdateQuantity = (change: number) => {
        const newQty = quantity + change;
        if (newQty >= 1 && newQty <= realMaxAvailable) {
            setQuantity(newQty);
        }
    };

    // --- FIX: Explicitly append custom_name and variant_combo to the payload ---
    const confirmAddToCart = () => {
        const itemToAdd = { ...product };
        const finalPriceToSet = selectedVariant && selectedVariant.price ? selectedVariant.price : (product.price || product.itemprice);
        
        itemToAdd.price = finalPriceToSet;
        itemToAdd.itemprice = finalPriceToSet;

        if (selectedVariant && selectedVariant.combo) {
             const comboStr = selectedVariant.combo.join(' / ');
             const augmentedName = `${product.name || product.productname || product.itemname} - ${comboStr}`;
             
             itemToAdd.name = augmentedName;
             itemToAdd.custom_name = augmentedName; // Fallback for parent request
             itemToAdd.selectedVariantCombo = comboStr; 
             itemToAdd.variant_combo = comboStr;    // Fallback for parent request
        }

        onAddToCart(itemToAdd, quantity);
        onClose(); 
    };

    const handleAddToWishlist = async () => {
        setWishlistLoading(true);
        try {
            const variantPrice = selectedVariant && selectedVariant.price ? selectedVariant.price : (product.price || product.itemprice);
            const variantCombo = selectedVariant && selectedVariant.combo ? selectedVariant.combo.join(' / ') : null;
            const baseName = product.name || product.productname || product.itemname;
            const augmentedName = variantCombo ? `${baseName} - ${variantCombo}` : baseName;

            const res = await fetch('/api/whishlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: product.id || product.itemid || product.productid, 
                    type: product.type || 'product',
                    price: variantPrice,
                    selectedVariantCombo: variantCombo,
                    variant_combo: variantCombo, // Sending explicitly
                    name: augmentedName,
                    custom_name: augmentedName // Sending explicitly
                })
            });
            
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                if (res.ok) {
                    setAlertState({ show: true, title: 'Success!', message: 'Added to your wishlist.', type: 'success' });
                } else {
                    setAlertState({ show: true, title: 'Notice', message: data.error || 'Failed to add.', type: 'error' });
                }
            } else {
                setAlertState({ show: true, title: 'API Error', message: 'API endpoint not found. Backend returned HTML instead of JSON.', type: 'error' });
            }
        } catch (err) { 
            console.error(err); 
            setAlertState({ show: true, title: 'Error', message: 'System error. Please try again.', type: 'error' });
        } finally {
            setWishlistLoading(false);
        }
    };

    let dynamicVariantImage = null;
    if (selectedVariant && selectedVariant.combo) {
        for (const valName of selectedVariant.combo) {
            for (const feature of validFeatures) {
                const match = feature.values?.find((val: any) => val.name === valName && val.image);
                if (match) {
                    dynamicVariantImage = match.image;
                    break;
                }
            }
            if (dynamicVariantImage) break;
        }
    }

    const displayImage = dynamicVariantImage || product.imageurl || product.image;
    const displayName = product.itemname || product.productname || product.name || "Product";
    const displayDesc = product.description || product.itemdescription || product.productdescription || "An exceptionally elegant choice from Norma Beauti.";
    const displayType = product.type || (product.itemid || String(product.id).startsWith('item_') ? "Ready-Made Box" : "Individual Product");

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto relative animate-scale-up border border-slate-200 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex flex-col md:flex-row gap-10" onClick={(e) => e.stopPropagation()}>
                
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-[#EC5564] font-bold text-2xl leading-none transition-colors z-10">✕</button>

                <div className="w-full md:w-1/2 flex items-center justify-center bg-slate-50 rounded-3xl border border-slate-100 p-6 min-h-[300px] shrink-0 overflow-hidden relative shadow-inner">
                    {displayImage ? (
                        <img src={displayImage} alt={displayName} className="w-full h-full object-contain transition-all duration-300" />
                    ) : (
                        <svg className="w-16 h-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                    
                    {(badgeText || product.offername) && (
                        <div className={`absolute top-4 left-4 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg tracking-wider animate-pulse z-10
                            ${product.offer_type === 'BOGO' ? 'bg-indigo-500' : 
                              product.offer_type === 'FIXED' || parseFloat(product.fixed_discount) > 0 ? 'bg-emerald-500' : 
                              'bg-gradient-to-r from-[#F76D82] to-[#EC5564]'}`}
                        >
                            {badgeText || product.offername}
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-6 flex flex-col">
                    <div>
                        <p className="text-[10px] font-bold text-[#F76D82] uppercase tracking-widest mb-1.5">{displayType}</p>
                        <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-4">
                            {displayName}
                        </h2>
                        
                        <div className="flex justify-between items-center bg-[#fff5f4] p-5 rounded-2xl border border-[#FFAFA8]/30 shadow-sm">
                            <div>
                                {isDiscounted && (
                                    <p className="text-xs text-slate-400 line-through mb-0.5">LKR {originalPrice.toLocaleString()}</p>
                                )}
                                <p className="text-3xl font-bold text-[#D94452] transition-all duration-300">
                                    LKR {finalPrice.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${isInStock ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {isLowStock ? 'Low Stock' : isInStock ? 'Available' : 'Sold Out'}
                                </span>
                                {isInStock && maxAvailable !== undefined && (
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 mr-1">{maxAvailable} Total</span>
                                )}
                            </div>
                        </div>

                        {validVariants.length > 0 && (
                            <div className="mt-5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Option</p>
                                <div className="flex flex-wrap gap-2">
                                    {validVariants.map((v: any, idx: number) => {
                                        const comboText = v.combo ? v.combo.join(' / ') : `Option ${idx + 1}`;
                                        
                                        let thumbImg = null;
                                        if (v.combo) {
                                            for (const valName of v.combo) {
                                                for (const feature of validFeatures) {
                                                    const match = feature.values?.find((val: any) => val.name === valName && val.image);
                                                    if (match) { thumbImg = match.image; break; }
                                                }
                                                if (thumbImg) break;
                                            }
                                        }

                                        const isSelected = selectedVariant?.combo?.join() === v.combo?.join();
                                        const isVariantOutOfStock = parseInt(v.quantity, 10) <= 0;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setSelectedVariant(v); 
                                                }}
                                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-all duration-200 flex items-center gap-2 shadow-sm ${
                                                    isSelected 
                                                    ? 'bg-[#EC5564] text-white border-[#EC5564] shadow-md scale-105' 
                                                    : isVariantOutOfStock 
                                                    ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 hover:opacity-80'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#FFAFA8]'
                                                }`}
                                            >
                                                {thumbImg && (
                                                    <img src={thumbImg} alt={comboText} className="w-5 h-5 rounded-full object-cover border border-white/50 bg-white" />
                                                )}
                                                {comboText}
                                                {isVariantOutOfStock && <span className="text-[9px] uppercase tracking-widest ml-1">(Out)</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
                            <svg className="w-5 h-5 text-[#F76D82]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 011 1v2.586a1 1 0 01-.293.707l-1.414 1.414a1 1 0 01-.707.293h-2.586a1 1 0 01-1-1V17a1 1 0 011-1h1m8-10v10m-6-10v10" /></svg>
                            <span><span className="font-bold text-slate-700">Estimated Delivery:</span> {getDeliveryDates()}</span>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-slate-100 pt-6">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">About Product</h4>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner italic">
                            "{displayDesc}"
                        </p>
                    </div>

                    {(includedProducts.length > 0 || loadingIncluded) && (
                        <div className="space-y-3 border-t border-slate-100 pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    Box Contents
                                </h4>
                                {includedProducts.length > 0 && (
                                    <span className="text-[10px] bg-[#fff5f4] text-[#D94452] px-2 py-0.5 rounded-full font-bold shadow-sm border border-[#FFAFA8]/30">{includedProducts.length} Items</span>
                                )}
                            </div>
                            
                            {loadingIncluded ? (
                                <p className="text-xs text-[#F76D82] italic px-2 animate-pulse">Unpacking box contents...</p>
                            ) : (
                                <div className="grid gap-3 max-h-60 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pr-2">
                                    {includedProducts.map((incProd: any, idx: number) => (
                                        <div key={idx} className="flex gap-3 bg-slate-50/50 p-2 rounded-xl border border-slate-100 items-center">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0 shadow-sm border border-slate-100">
                                                {incProd.image ? <img src={incProd.image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-slate-100" />}
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 truncate">{incProd.name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2 border-t border-slate-100 pt-6 flex-grow">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Verified Reviews</h4>
                            {reviews.length > 0 && (
                                <div className="text-sm text-amber-500 flex items-center gap-1 font-bold">
                                    <span>★</span> <span className="text-slate-500 font-medium">{averageRating} ({reviews.length})</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] pr-2">
                            {loadingReviews ? (
                                <p className="text-xs text-slate-400 italic px-2">Loading reviews...</p>
                            ) : reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <div key={review.reviewid} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-bold text-slate-900">{review.customer_name} <span className="text-amber-400 ml-1">{'★'.repeat(review.rating)}</span></p>
                                            <span className="text-[9px] text-slate-400">{new Date(review.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
                                        </div>
                                        <p className="text-slate-600 italic">"{review.comment}"</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-[#F76D82] italic px-2">No reviews yet. Be the first to review after purchasing!</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-50 rounded-full border border-slate-200 shadow-sm p-1.5 shrink-0">
                                <button onClick={() => handleUpdateQuantity(-1)} disabled={!canAddToCart || quantity <= 1} className="w-10 h-10 flex items-center justify-center font-bold text-slate-500 hover:text-[#EC5564] hover:bg-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed">-</button>
                                <span className="font-bold w-10 text-center text-lg text-slate-900">{quantity}</span>
                                <button onClick={() => handleUpdateQuantity(1)} disabled={!canAddToCart || quantity >= realMaxAvailable} className="w-10 h-10 flex items-center justify-center font-bold text-slate-500 hover:text-[#EC5564] hover:bg-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed">+</button>
                            </div>
                            <button 
                                onClick={confirmAddToCart}
                                disabled={!canAddToCart}
                                className="flex-1 py-3.5 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 uppercase tracking-widest text-xs"
                            >
                                {isInStock && realMaxAvailable > 0 ? `Add to Cart` : realMaxAvailable === 0 && isInStock ? `Max Qty in Cart` : "Sold Out"}
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleAddToWishlist}
                            disabled={wishlistLoading}
                            className="w-full py-3.5 bg-white text-slate-600 rounded-full font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-[10px] tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {wishlistLoading ? <div className="w-4 h-4 border-2 border-slate-300 border-t-[#EC5564] rounded-full animate-spin"></div> : <svg className="w-4 h-4 text-[#F76D82]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                            {wishlistLoading ? 'Adding to Wishlist...' : 'Add to Wishlist'}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- BEAUTIFUL CUSTOM ALERT DIALOG --- */}
            {alertState.show && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border-t-8 border-[#EC5564] animate-scale-up">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 ${alertState.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-500' : 'bg-rose-50 border-rose-200 text-rose-500'}`}>
                            {alertState.type === 'success' ? (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{alertState.title}</h3>
                        <p className="text-slate-500 text-xs mb-8 leading-relaxed">{alertState.message}</p>
                        <button onClick={() => setAlertState({ ...alertState, show: false })} className="w-full py-3 bg-slate-900 text-white rounded-full font-bold text-[10px] tracking-widest uppercase hover:bg-[#EC5564] transition-colors">
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}