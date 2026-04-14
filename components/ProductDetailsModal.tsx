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
    
    // --- NEW: REVIEW STATES ---
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);

    useEffect(() => {
        // 1. Fetch Delivery Settings
        fetch('/api/settings')
            .then(res => res.json())
            .then(data => {
                if (data.min_delivery_days !== undefined) {
                    setDeliveryDays({ min: data.min_delivery_days, max: data.max_delivery_days });
                }
            })
            .catch(err => console.error("Failed to load delivery settings", err));

        // 2. Fetch Real Reviews
        const fetchReviews = async () => {
            setLoadingReviews(true);
            try {
                // Safely determine if this is a product or an item depending on where the modal was opened from
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
        
        fetchReviews();
    }, [product]);

    const getDeliveryDates = () => {
        const today = new Date();
        const start = new Date(today); start.setDate(today.getDate() + deliveryDays.min);
        const end = new Date(today); end.setDate(today.getDate() + deliveryDays.max);
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
    };

    const rawStock = product.quantity ?? product.availablequantity ?? product.itemquantity;
    const maxAvailable = rawStock !== undefined && rawStock !== null && !isNaN(Number(rawStock)) ? Number(rawStock) : 100; 
    
    const isInStock = maxAvailable > 0;
    const isLowStock = maxAvailable > 0 && maxAvailable <= 5;

    const { originalPrice, finalPrice, isDiscounted, badgeText } = getPriceDetails(product);

    // --- NEW: Calculate Real Average Rating ---
    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1) 
        : 0;

    const handleUpdateQuantity = (change: number) => {
        const newQty = quantity + change;
        if (newQty >= 1 && newQty <= maxAvailable) {
            setQuantity(newQty);
        }
    };

    const confirmAddToCart = () => {
        onAddToCart(product, quantity);
        onClose(); 
    };

    const handleModalClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const displayImage = product.imageurl || product.image;
    const displayName = product.itemname || product.productname || product.name || "Product";
    const displayDesc = product.description || product.itemdescription || product.productdescription || "An exceptionally elegant choice from Norma Beauti, crafted to make you look and feel beautiful.";
    const displayType = product.type || (product.itemid ? "Ready-Made Box" : "Product");

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white/90 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative animate-scale-up border border-white/60 custom-scrollbar flex flex-col md:flex-row gap-10" onClick={handleModalClick}>
                
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 font-bold text-2xl leading-none transition-colors z-10">✕</button>

                <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 rounded-3xl border border-pink-100 p-6 min-h-[300px] shrink-0 overflow-hidden relative shadow-inner">
                    {displayImage ? (
                        <img src={displayImage} alt={displayName} className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-6xl opacity-40">📷</span>
                    )}
                    
                    {(badgeText || product.offername) && (
                        <div className={`absolute top-4 left-4 text-white text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg tracking-wider animate-pulse z-10
                            ${product.offer_type === 'BOGO' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 
                              product.offer_type === 'FIXED' || parseFloat(product.fixed_discount) > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                              'bg-gradient-to-r from-[#e91e63] to-[#ff4081]'}`}
                        >
                            {badgeText || product.offername}
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-6 flex flex-col">
                    <div>
                        <p className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest mb-1.5">{displayType}</p>
                        <h2 className="text-3xl font-serif font-bold text-[#4A1D46] leading-tight mb-4">
                            {displayName}
                        </h2>
                        
                        <div className="flex justify-between items-center bg-[#F3E5F5] p-5 rounded-2xl border border-pink-100 shadow-sm">
                            <div>
                                {isDiscounted && (
                                    <p className="text-xs text-gray-500 line-through mb-0.5">LKR {originalPrice.toLocaleString()}</p>
                                )}
                                <p className="text-3xl font-bold text-[#880e4f]">
                                    LKR {finalPrice.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shadow-sm ${isInStock ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                    {isLowStock ? 'Low Stock' : isInStock ? 'In Stock' : 'Out of Stock'}
                                </span>
                                {isInStock && rawStock !== undefined && (
                                    <span className="text-[10px] font-bold text-gray-400 mt-1 mr-1">{maxAvailable} available</span>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-3 text-sm text-[#7B2C62] bg-pink-50/50 p-4 rounded-2xl border border-pink-100 shadow-inner">
                            <span className="text-xl">🚚</span> 
                            <span><span className="font-bold">Estimated Delivery:</span> {getDeliveryDates()}</span>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-pink-100 pt-6">
                        <h4 className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest ml-1">Product Description</h4>
                        <p className="text-sm font-medium text-[#7B2C62] leading-relaxed whitespace-pre-line bg-gray-50/50 p-5 rounded-2xl border border-pink-50/50 shadow-inner">
                            {displayDesc}
                        </p>
                    </div>

                    {/* --- DYNAMIC REVIEWS SECTION --- */}
                    <div className="space-y-2 border-t border-pink-100 pt-6 flex-grow">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest ml-1">Verified Reviews</h4>
                            {reviews.length > 0 && (
                                <div className="text-sm text-yellow-500 flex items-center gap-1 font-bold">
                                    <span>⭐</span> <span className="text-gray-500 font-medium">{averageRating} ({reviews.length})</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                            {loadingReviews ? (
                                <p className="text-xs text-gray-400 italic px-2">Loading reviews...</p>
                            ) : reviews.length > 0 ? (
                                reviews.map((review) => (
                                    <ReviewCard 
                                        key={review.reviewid} 
                                        name={review.customer_name} 
                                        comment={review.comment} 
                                        rating={review.rating} 
                                        date={review.date}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-[#D883B7] italic px-2">No reviews yet. Be the first to review after purchasing!</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-pink-100 flex items-center gap-4">
                        <div className="flex items-center bg-white rounded-full border border-pink-100 shadow-sm p-1.5 shrink-0">
                            <button 
                                onClick={() => handleUpdateQuantity(-1)} 
                                disabled={!isInStock || quantity <= 1} 
                                className="w-10 h-10 flex items-center justify-center font-bold text-gray-500 hover:text-[#880e4f] hover:bg-pink-50 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                            >
                                -
                            </button>
                            <span className="font-bold w-10 text-center text-lg text-[#4a1d46]">{quantity}</span>
                            <button 
                                onClick={() => handleUpdateQuantity(1)} 
                                disabled={!isInStock || quantity >= maxAvailable} 
                                className="w-10 h-10 flex items-center justify-center font-bold text-gray-500 hover:text-[#880e4f] hover:bg-pink-50 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
                            >
                                +
                            </button>
                        </div>
                        <button 
                            onClick={confirmAddToCart}
                            disabled={!isInStock}
                            className="flex-1 py-4 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:hover:scale-100 border border-white/20"
                        >
                            {isInStock ? `Add ${quantity} to Bag` : "Out of Stock"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- UPDATED: Dynamic Review Card Component ---
const ReviewCard = ({ name, comment, rating, date }: { name: string, comment: string, rating: number, date: string }) => (
    <div className="p-4 bg-white rounded-2xl border border-gray-100 text-xs shadow-sm">
        <div className="flex justify-between items-start mb-1">
            <p className="font-bold text-[#4A1D46]">{name} <span className="text-yellow-500 ml-1">{'⭐'.repeat(rating)}</span></p>
            <span className="text-[9px] text-gray-400">{new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</span>
        </div>
        <p className="text-gray-600 italic">"{comment}"</p>
    </div>
);