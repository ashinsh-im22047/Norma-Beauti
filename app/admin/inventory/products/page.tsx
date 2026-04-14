"use client";

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

// --- DATA TYPES ---
type FeatureValue = { name: string; image: string; file?: File | null };
type FeatureGroup = { name: string; values: FeatureValue[] };
type ProductVariant = { combo: string[]; price: string; quantity: string };
type SelectedProduct = { id: string; qty: number }; 

function ProductListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const categoryId = searchParams.get('category') || '';
  const highlightId = searchParams.get('highlight'); 
  const isReadyMade = categoryId.includes('ready');
  const isCustomBox = categoryId.includes('custom'); 
  
  const dbType = isReadyMade ? 'item' : 'product'; 
  
  let pageTitle = "Individual Products";
  if (isReadyMade) pageTitle = "Ready-Made Items";
  if (isCustomBox) pageTitle = "Available Products"; 

  // State
  const [items, setItems] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [globalReviews, setGlobalReviews] = useState<any[]>([]); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // --- CUSTOMER-STYLE PREVIEW MODAL STATE ---
  const [previewProduct, setPreviewProduct] = useState<any | null>(null);
  const [previewActiveImage, setPreviewActiveImage] = useState<string>('');

  // --- ADD/EDIT MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', price: '', quantity: '', minStock: '5', description: '', 
    images: [] as string[], features: [] as FeatureGroup[], variants: [] as ProductVariant[], 
    selectedProducts: [] as SelectedProduct[] 
  });
  
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]); 
  const [productSearch, setProductSearch] = useState(''); 
  const [boxBuilderView, setBoxBuilderView] = useState<'checklist' | 'newProduct'>('checklist'); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  const [alertState, setAlertState] = useState<{
    show: boolean; title: string; message: string; type: 'success' | 'error' | 'confirm'; onConfirm?: () => void;
  }>({ show: false, title: '', message: '', type: 'success' });

  const showAlert = (title: string, message: string, type: 'success' | 'error' = 'error') => { setAlertState({ show: true, title, message, type }); };
  const closeAlert = () => setAlertState({ ...alertState, show: false });

  // --- BUG FIX: BULLETPROOF REVIEW FETCHER ---
  useEffect(() => {
    const fetchAllReviews = async () => {
        const possibleEndpoints = ['/api/product_reviews', '/api/reviews', '/api/admin/reviews', '/api/support/reviews'];
        let found = false;
        for (const endpoint of possibleEndpoints) {
            try {
                const res = await fetch(endpoint);
                if (res.ok) {
                    const data = await res.json();
                    const reviewsArray = Array.isArray(data) ? data : (data.reviews || data.data || []);
                    if (Array.isArray(reviewsArray) && reviewsArray.length > 0) {
                        setGlobalReviews(reviewsArray);
                        console.log(`✅ Loaded ${reviewsArray.length} reviews from ${endpoint}`);
                        found = true;
                        break; 
                    }
                }
            } catch (e) { /* Check next endpoint */ }
        }
        if (!found) console.warn("⚠️ No reviews found in background fetch. Ensure you have a GET endpoint for the product_reviews table.");
    };
    fetchAllReviews();
  }, []);

  const getReviewsForProduct = (cardId: string) => {
      if (!cardId) return [];
      const normalizedCardId = String(cardId).toLowerCase(); // Normalize target ID
      
      return globalReviews.filter(r => {
          // Normalize database IDs (handles PROD_ vs prod_)
          const dbProductId = String(r.productid || r.productId || '').toLowerCase();
          const dbItemId = String(r.itemid || r.itemId || '').toLowerCase();
          const matchId = (dbProductId === normalizedCardId) || (dbItemId === normalizedCardId);
          
          // Ensure review is not hidden (handles SQL tinyint 0 or string '0')
          const isNotHidden = r.is_hidden == 0 || r.is_hidden === false || r.is_hidden == null;
          
          return matchId && isNotHidden;
      });
  };

  useEffect(() => { 
    if(categoryId) { fetchData(); if (isReadyMade) fetchAvailableProducts(); }
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [categoryId, isReadyMade]);

  useEffect(() => {
    if (!isLoading && highlightId && highlightRef.current) setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300); 
  }, [isLoading, highlightId, items]);

  // Variant Generator
  useEffect(() => {
      const featureData = formData.features.map(f => ({ n: f.name, v: f.values.map(val => val.name) }));
      const featureNames = featureData.map(f => f.n.trim());
      const featureValues = featureData.map(f => f.v.filter(Boolean));

      const isValid = featureNames.length > 0 && featureNames.every(Boolean) && featureValues.every(arr => arr.length > 0);
      if (!isValid) { if (formData.variants.length > 0) setFormData(prev => ({ ...prev, variants: [] })); return; }

      const combinations = featureValues.reduce((acc, curr) => acc.flatMap(c => curr.map(n => [...c, n])), [[]] as string[][]);

      setFormData(prev => {
          const newVariants = combinations.map(combo => {
              const existing = prev.variants.find(v => JSON.stringify(v.combo) === JSON.stringify(combo));
              return existing || { combo, price: prev.price || '', quantity: '' };
          });
          if (JSON.stringify(prev.variants.map(v=>v.combo)) !== JSON.stringify(newVariants.map(v=>v.combo))) return { ...prev, variants: newVariants };
          return prev;
      });
  }, [JSON.stringify(formData.features.map(f => ({ n: f.name, v: f.values.map(val => val.name) })))]);


  const fetchData = async () => {
    setIsLoading(true);
    try {
        const res = await fetch(`/api/inventory-items?categoryId=${categoryId}`, { cache: 'no-store' });
        setItems(await res.json());
    } catch(err) { console.error(err); } finally { setIsLoading(false); }
  };

  const fetchAvailableProducts = async () => {
    try {
        const res = await fetch('/api/inventory-items');
        if (res.ok) setAvailableProducts((await res.json()).filter((i: any) => i.type === 'product'));
    } catch (error) { console.error("Failed to load products", error); }
  };

  const handleApproval = async (e: React.MouseEvent, id: string, newStatus: 'approved' | 'rejected') => {
    e.stopPropagation(); 
    try {
        const res = await fetch(`/api/inventory-items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
        if (res.ok) fetchData(); 
    } catch (error) { showAlert("Error", "Action failed"); }
  };

  const getLists = () => {
    let all = [...items];
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        all = all.filter(i => {
            const nameMatch = (i.name || i.productname || i.itemname || '').toLowerCase().includes(lowerSearch);
            const idMatch = (i.id || i.productid || i.itemid || '').toLowerCase().includes(lowerSearch);
            return nameMatch || idMatch;
        });
    }
    
    if (sortOption === 'price-low') all.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortOption === 'price-high') all.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortOption === 'qty') all.sort((a, b) => a.quantity - b.quantity);

    if (isCustomBox) return { pending: all.filter(i => i.status === 'pending'), approved: all.filter(i => i.status === 'approved'), standard: [] };
    return { pending: [], approved: [], standard: all };
  };
  
  const { pending, approved, standard } = getLists();

  // Handlers
  const addFeatureGroup = () => setFormData(prev => ({ ...prev, features: [...prev.features, { name: '', values: [{ name: '', image: '', file: null }] }] }));
  const removeFeatureGroup = (index: number) => setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  const updateFeatureGroupName = (index: number, name: string) => setFormData(prev => { const newFeatures = [...prev.features]; newFeatures[index].name = name; return { ...prev, features: newFeatures }; });
  const addFeatureValue = (groupIndex: number) => setFormData(prev => { const newFeatures = [...prev.features]; newFeatures[groupIndex].values = [...newFeatures[groupIndex].values, { name: '', image: '', file: null }]; return { ...prev, features: newFeatures }; });
  const removeFeatureValue = (groupIndex: number, valueIndex: number) => setFormData(prev => { const newFeatures = [...prev.features]; newFeatures[groupIndex].values = newFeatures[groupIndex].values.filter((_, i) => i !== valueIndex); return { ...prev, features: newFeatures }; });
  const updateFeatureValueName = (groupIndex: number, valueIndex: number, name: string) => setFormData(prev => { const newFeatures = [...prev.features]; newFeatures[groupIndex].values[valueIndex].name = name; return { ...prev, features: newFeatures }; });
  
  const handleFeatureImageChange = (groupIndex: number, valueIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setFormData(prev => { const newFeatures = [...prev.features]; newFeatures[groupIndex].values[valueIndex].file = file; return { ...prev, features: newFeatures }; });
      }
  };

  const updateVariantPrice = (idx: number, val: string) => { setFormData(prev => { const newV = [...prev.variants]; newV[idx].price = val; return {...prev, variants: newV}; }); };
  const updateVariantQty = (idx: number, val: string) => { setFormData(prev => { const newV = [...prev.variants]; newV[idx].quantity = val; return {...prev, variants: newV}; }); };

  const handleSave = async () => {
      if (!formData.name) return showAlert("Missing Input", "Please fill in the Name field.");
      let finalQuantity = formData.quantity; let finalPrice = formData.price;
      if (formData.variants.length > 0) {
          const totalQty = formData.variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);
          finalQuantity = totalQty.toString();
          if (totalQty === 0) return showAlert("Missing Input", "Please enter quantities for your product variants.");
      } else {
          if (!formData.price || !formData.quantity) return showAlert("Missing Input", "Please fill in Price and Quantity.");
          if (parseFloat(formData.price) < 0) return showAlert("Invalid Input", "Price cannot be negative.");
      }

      if (formData.images.length === 0 && filesToUpload.length === 0) return showAlert("Missing Input", "Please provide at least one product image.");
      if (isReadyMade && formData.selectedProducts.length === 0) return showAlert("Empty Box", "Please select at least one product for this box.");

      setIsSubmitting(true);
      try {
        const newFileUrls = await Promise.all(
            filesToUpload.map(async file => {
                const uploadData = new FormData(); uploadData.set('file', file);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
                return (await uploadRes.json()).url; 
            })
        );
        const finalImageUrls = [...formData.images, ...newFileUrls]; 

        const processedFeatures = await Promise.all(
            formData.features.map(async (featureGroup) => {
                const processedValues = await Promise.all(
                    featureGroup.values.map(async (val) => {
                        if (val.file) {
                            const fd = new FormData(); fd.set('file', val.file);
                            const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
                            return { name: val.name, image: (await uploadRes.json()).url }; 
                        }
                        return { name: val.name, image: val.image };
                    })
                );
                return { name: featureGroup.name, values: processedValues };
            })
        );

        const payload = {
            name: formData.name, price: finalPrice, quantity: finalQuantity, minStock: formData.minStock, description: formData.description, 
            image: finalImageUrls[0] || '', images: finalImageUrls, features: processedFeatures, variants: formData.variants, 
            includedProducts: isReadyMade ? formData.selectedProducts : [] 
        };

        let res;
        const submitId = currentItemId;
        if (isEditing && submitId) res = await fetch(`/api/inventory-items/${submitId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        else res = await fetch('/api/inventory-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, categoryType: dbType, categoryId }) });
        
        if (res.ok) { showAlert("Success", isEditing ? "Updated Successfully!" : "Added Successfully!", "success"); resetForm(); fetchData(); } 
        else throw new Error("Failed"); 
    } catch(err) { showAlert("Error", "Error saving item."); } finally { setIsSubmitting(false); }
  };

  const [nestedProductFormData, setNestedProductFormData] = useState({ name: '', price: '', quantity: '', minStock: '5', description: '', files: [] as File[] });
  const [isSubmittingNested, setIsSubmittingNested] = useState(false);

  const handleNestedProductSave = async () => {
    if (!nestedProductFormData.name || !nestedProductFormData.price || !nestedProductFormData.quantity) return showAlert("Error", "Fill Name, Price and Quantity for the new product.");
    if (nestedProductFormData.files.length === 0) return showAlert("Error", "Please add an image for the new product.");
    setIsSubmittingNested(true);

    try {
        const imageUrls = await Promise.all(
            nestedProductFormData.files.map(async file => {
                const uploadData = new FormData(); uploadData.set('file', file);
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadData });
                return (await uploadRes.json()).url; 
            })
        );
        const productPayload = { ...nestedProductFormData, image: imageUrls[0] || '', images: imageUrls, categoryType: 'product' };
        const res = await fetch('/api/inventory-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productPayload) });
        
        if (res.ok) {
            const newProduct = await res.json();
            const newId = newProduct.id || newProduct.productid;
            await fetchAvailableProducts(); 
            setFormData(prev => ({ ...prev, selectedProducts: [...prev.selectedProducts, { id: newId, qty: 1 }] })); 
            setBoxBuilderView('checklist'); 
            showAlert("Success", "New product created and added to the box!", "success");
        }
    } catch (err) { showAlert("Error", "Failed to create new product."); } finally { setIsSubmittingNested(false); }
  };

  const handleDelete = (id: string) => {
    setAlertState({
        show: true, title: "Confirm Delete", message: "Delete this item? This action is permanent.", type: "confirm",
        onConfirm: async () => { await fetch(`/api/inventory-items/${id}`, { method: 'DELETE' }); fetchData(); closeAlert(); }
    });
  };
  
  const resetForm = () => { setShowModal(false); setIsEditing(false); setFilesToUpload([]); setFormData({ name: '', price: '', quantity: '', minStock: '5', description: '', images: [], features: [], variants: [], selectedProducts: [] }); setBoxBuilderView('checklist'); setProductSearch(''); };
  
  const openEditModal = (item: any) => { 
      setIsEditing(true); 
      setCurrentItemId(item.id || item.productid || item.itemid); 
      const existingImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
      const mappedFeatures = (item.features || []).map((f: any) => ({ name: f.name, values: f.values.map((v: any) => typeof v === 'string' ? { name: v, image: '', file: null } : v) }));
      const mappedSelectedProducts = (item.includedProducts || []).map((p: any) => { if (typeof p === 'string') return { id: p, qty: 1 }; return p; });

      setFormData({ 
          name: item.name || item.productname || item.itemname, price: item.price, quantity: item.quantity, minStock: item.minStock?.toString() || '5', 
          description: item.desc || item.description, images: existingImages, features: mappedFeatures, variants: item.variants || [], selectedProducts: mappedSelectedProducts 
      }); 
      setShowModal(true); setActiveMenuId(null); 
  };
  
  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { setFilesToUpload([...filesToUpload, ...Array.from(e.target.files)]); } };
  const removeFileToUpload = (index: number) => setFilesToUpload(filesToUpload.filter((_, i) => i !== index));
  const removeExistingFile = (index: number) => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const toggleMenu = (e: React.MouseEvent, id: string) => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(activeMenuId === id ? null : id); };
  const toggleProductSelection = (id: string) => { setFormData(prev => { const exists = prev.selectedProducts.find(p => p.id === id); return { ...prev, selectedProducts: exists ? prev.selectedProducts.filter(p => p.id !== id) : [...prev.selectedProducts, { id, qty: 1 }] }; }); };
  const updateSelectedQty = (id: string, qty: number) => { if (qty < 1) return; setFormData(prev => ({ ...prev, selectedProducts: prev.selectedProducts.map(p => p.id === id ? { ...p, qty } : p) })); };

  const calculateAverageRating = (reviews?: any[]) => {
      if (!reviews || reviews.length === 0) return 0;
      const sum = reviews.reduce((acc, curr) => acc + (Number(curr.rating) || 0), 0);
      return Math.round((sum / reviews.length) * 10) / 10;
  };

  const renderStars = (rating: number) => {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      if (rating === 0) return <span className="text-gray-500 text-xs italic">No ratings yet</span>;
      return (
          <span className="text-[#F59E0B] text-lg tracking-widest">
              {'★'.repeat(fullStars)}{hasHalfStar ? '⯨' : ''}{'☆'.repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}
          </span>
      );
  };

  // --- E-COMMERCE GRID CARD ---
  const ProductCard = ({ item, isPending = false }: { item: any, isPending?: boolean }) => {
    const cardId = item.id || item.productid || item.itemid;
    const isHighlighted = cardId === highlightId;
    const displayImg = (item.images && item.images.length > 0) ? item.images[0] : item.image;
    const totalQty = item.variants && item.variants.length > 0 ? item.variants.reduce((sum: number, v: any) => sum + parseInt(v.quantity || 0), 0) : item.quantity;
    
    // Automatically merge reviews from the background fetch
    const itemReviews = (item.reviews && item.reviews.length > 0) ? item.reviews : getReviewsForProduct(cardId);
    const avgRating = calculateAverageRating(itemReviews);
    const reviewCount = itemReviews.length;

    return (
      <div 
        ref={isHighlighted ? highlightRef : null}
        onClick={() => { setPreviewProduct({ ...item, actualReviews: itemReviews }); setPreviewActiveImage(displayImg); }}
        className={`group cursor-pointer flex flex-col bg-[#5D2E46]/80 backdrop-blur-md rounded-3xl overflow-hidden border ${isHighlighted ? 'border-red-500 ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'border-white/10 hover:border-[#D883B7] hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]'} transition-all duration-300 hover:-translate-y-1 relative`}
      >
        <div className="relative h-56 w-full bg-black/20 overflow-hidden">
            {displayImg ? (
                <img src={displayImg} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">📷</div>
            )}
            
            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${totalQty > (item.minStock || 5) ? 'bg-[#10B981]' : 'bg-red-500 animate-pulse'}`}></span>
                <span className="text-[10px] font-bold text-white tracking-wider leading-none">{totalQty} IN STOCK</span>
            </div>

            {!isPending && (
                <div className="absolute top-3 right-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleMenu(e, cardId); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-[#D883B7] text-white backdrop-blur-md transition-colors border border-white/20">⋮</button>
                    {activeMenuId === cardId && (
                        <div className="absolute right-0 top-10 bg-[#2E1029]/95 backdrop-blur-xl rounded-xl shadow-xl py-2 w-32 border border-white/20 z-50" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setActiveMenuId(null); openEditModal(item); }} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-white/10">Edit details</button>
                            <button onClick={() => { setActiveMenuId(null); handleDelete(cardId); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10">Delete item</button>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="p-5 flex flex-col flex-1">
            <p className="text-[10px] text-[#D883B7] font-mono tracking-widest mb-1.5 uppercase">ID: {cardId}</p>
            <h3 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-2">{item.name || item.productname || item.itemname}</h3>
            
            <div className="flex items-center gap-1 mb-4">
                {renderStars(avgRating)}
                {reviewCount > 0 && <span className="text-[10px] text-gray-400 ml-1">({reviewCount} Reviews)</span>}
            </div>

            <div className="mt-auto flex items-end justify-between">
                <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Price</p>
                    <p className="font-bold text-white text-xl">LKR {item.price}</p>
                </div>
                {isPending && (
                    <div className="flex gap-2" onClick={e=>e.stopPropagation()}>
                        <button onClick={(e) => handleApproval(e, cardId, 'approved')} className="bg-[#10B981] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-emerald-400 transition-colors">Approve</button>
                    </div>
                )}
                {!isPending && item.variants && item.variants.length > 0 && (
                    <span className="text-[10px] bg-[#D883B7]/20 text-[#D883B7] border border-[#D883B7]/50 px-2 py-1 rounded-md font-bold">{item.variants.length} Options</span>
                )}
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans pb-20 text-[#2E1029]">
      <AdminHeader />
      <main className="container mx-auto px-4 md:px-6 py-8 relative z-10 max-w-[1400px]">
        
        <div className="bg-[#4A1D46]/90 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 shadow-2xl border border-white/20 mb-8 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div><h2 className="text-3xl md:text-4xl font-serif tracking-wide">{pageTitle}</h2><p className="text-sm text-[#D883B7] mt-1 font-medium">Manage your beautiful catalog.</p></div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none"><span className="absolute left-3 top-2.5 text-[#4A1D46]">🔍</span><input type="text" placeholder="Search catalog..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#F3E5F5] text-[#2E1029] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D883B7] shadow-inner"/></div>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="py-2 px-3 rounded-xl bg-[#F3E5F5] text-[#2E1029] font-medium text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D883B7] shadow-sm"><option value="newest">Newest First</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="qty">Quantity: Lowest</option></select>
                    <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] px-6 py-2 rounded-xl shadow-lg font-bold hover:scale-105 transition-all flex items-center gap-2 border border-white/20 text-sm leading-none"><span className="text-xl">+</span> Add New</button>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-8">
            {isCustomBox ? (
                <div className="flex flex-col gap-10">
                    {pending.length > 0 && (
                        <div>
                            <h3 className="text-[#4A1D46] font-bold text-xl mb-4 pl-2 flex items-center gap-2">⏳ Pending Approval <span className="text-xs bg-[#F59E0B] px-2 py-0.5 rounded-full text-white shadow-sm">{pending.length}</span></h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">{pending.map(item => <ProductCard key={item.id || item.productid} item={item} isPending={true} />)}</div>
                        </div>
                    )}
                    <div>
                        <h3 className="text-[#4A1D46] font-bold text-xl mb-4 pl-2">✅ Available Products</h3>
                        {approved.length === 0 && <p className="text-[#7B2C62] italic p-8 text-center opacity-70 bg-white/40 rounded-2xl">No approved products.</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">{approved.map(item => <ProductCard key={item.id || item.productid} item={item} />)}</div>
                    </div>
                </div>
            ) : (
                <>
                    {standard.length === 0 && <p className="text-[#7B2C62] italic p-8 text-center opacity-70 bg-white/40 rounded-2xl">No items found in your catalog.</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">{standard.map(item => <ProductCard key={item.id || item.productid || item.itemid} item={item} />)}</div>
                </>
            )}
        </div>
      </main>

      {/* --- ADD/EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-[60] py-10 px-4 overflow-y-auto backdrop-blur-sm" onClick={resetForm}>
          <div className={`bg-[#2E1029]/95 backdrop-blur-xl w-full ${isReadyMade ? 'max-w-4xl' : 'max-w-lg'} my-auto rounded-[2rem] p-6 md:p-8 shadow-2xl relative border border-white/30 text-white flex flex-col transition-all duration-300`} onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-serif font-bold mb-4 text-center tracking-wide shrink-0">
              {isEditing ? 'Edit' : 'Add'} {isReadyMade ? 'Item Details' : 'Product Details'}
            </h2>
            
            <div className={`grid gap-6 overflow-y-auto pr-2 custom-scrollbar flex-1 ${isReadyMade ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                
                <div className="flex flex-col gap-4">
                   <div><label className="text-xs font-bold text-[#D883B7] ml-3 uppercase tracking-wider">Name</label><input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/10 rounded-full px-5 py-3 outline-none border border-white/20 focus:ring-2 focus:ring-[#D883B7] text-white"/></div>
                   <div className="flex gap-2">
                       <div className="flex-1"><label className="text-xs font-bold text-[#D883B7] ml-3 uppercase">Price</label><input type="number" min="0" disabled={formData.variants.length > 0} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={`w-full rounded-full px-3 py-3 border border-white/20 text-center ${formData.variants.length > 0 ? 'bg-black/40 text-gray-400 cursor-not-allowed' : 'bg-white/10 text-white'}`} placeholder={formData.variants.length > 0 ? "Matrix" : ""}/></div>
                       <div className="flex-1"><label className="text-xs font-bold text-[#D883B7] ml-3 uppercase">Qty</label><input type="number" min="0" disabled={formData.variants.length > 0} value={formData.variants.length > 0 ? formData.variants.reduce((acc, v) => acc + (parseInt(v.quantity)||0), 0) : formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className={`w-full rounded-full px-3 py-3 border border-white/20 text-center ${formData.variants.length > 0 ? 'bg-black/40 text-gray-400 cursor-not-allowed' : 'bg-white/10 text-white'}`}/></div>
                       <div className="flex-1"><label className="text-xs font-bold text-[#D883B7] ml-3 uppercase" title="Minimum Stock Alert Level">Min Alert</label><input type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="w-full bg-white/10 rounded-full px-3 py-3 border border-white/20 text-white text-center"/></div>
                   </div>
                   <div><label className="text-xs font-bold text-[#D883B7] ml-3 uppercase tracking-wider">Description</label><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white/10 rounded-full px-5 py-3 border border-white/20 text-white"/></div>
                   
                   <div>
                       <label className="text-xs font-bold text-[#D883B7] ml-3 uppercase tracking-wider">Images ({formData.images.length + filesToUpload.length}/5)</label>
                       {(formData.images.length > 0 || filesToUpload.length > 0) && (
                           <div className="flex flex-wrap gap-2 mb-2 bg-black/20 p-3 rounded-2xl border border-white/5">
                               {formData.images.map((img, i) => (<div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/20 group"><img src={img} className="w-full h-full object-cover"/><button onClick={() => removeExistingFile(i)} className="absolute inset-0 bg-red-600/70 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center">Del</button></div>))}
                               {filesToUpload.map((file, i) => (<div key={`new_${i}`} className="relative w-14 h-14 rounded-lg overflow-hidden border-2 border-dashed border-[#D883B7]/50 group"><img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-70"/><button onClick={() => removeFileToUpload(i)} className="absolute inset-0 bg-red-600/70 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center">Del</button></div>))}
                           </div>
                       )}
                       <label className={`w-full h-16 bg-white/10 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#D883B7]/50 text-gray-300 text-sm cursor-pointer transition ${formData.images.length + filesToUpload.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}`}>
                           <input type="file" multiple onChange={handleMainFileChange} className="hidden" accept="image/*" disabled={formData.images.length + filesToUpload.length >= 5}/><span>+ Add Photo</span>
                       </label>
                   </div>

                   {!isReadyMade && (
                       <div className="bg-black/20 p-4 rounded-2xl border border-white/10 mt-2">
                           <div className="flex justify-between items-center mb-3"><label className="text-xs font-bold text-[#D883B7] uppercase tracking-wider">Product Variants</label><button onClick={addFeatureGroup} className="text-[10px] bg-white/10 px-3 py-1 rounded-full font-bold hover:bg-white/20 transition shadow-sm">+ Add Option</button></div>
                           {formData.features.map((featureGroup, groupIndex) => (
                               <div key={groupIndex} className="bg-white/5 rounded-xl p-3 border border-white/5 mb-3">
                                   <div className="flex gap-2 mb-3"><input value={featureGroup.name} onChange={e => updateFeatureGroupName(groupIndex, e.target.value)} placeholder="Option Name (e.g. Colour)" className="flex-1 bg-black/30 rounded-full px-4 py-2 outline-none text-xs text-white border border-white/10 font-bold"/><button onClick={() => removeFeatureGroup(groupIndex)} className="text-xs text-red-400 font-bold px-3 bg-red-500/10 rounded-full hover:bg-red-500/20 transition">✕</button></div>
                                   <div className="flex flex-col gap-2 pl-2">
                                       {featureGroup.values.map((val, valIndex) => (
                                           <div key={valIndex} className="flex gap-2 items-center bg-black/20 p-1.5 rounded-full border border-white/5">
                                               <label className="w-8 h-8 rounded-full border border-dashed border-white/40 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#D883B7] transition shrink-0 bg-black/40 relative group" title="Upload swatch/thumbnail">
                                                   {val.file ? <img src={URL.createObjectURL(val.file)} className="w-full h-full object-cover" /> : val.image ? <img src={val.image} className="w-full h-full object-cover" /> : <span className="text-[10px] text-white/50">+</span>}
                                                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFeatureImageChange(groupIndex, valIndex, e)} />
                                               </label>
                                               <input value={val.name} onChange={e => updateFeatureValueName(groupIndex, valIndex, e.target.value)} placeholder="Value" className="flex-1 bg-transparent px-2 py-1 text-xs text-white outline-none placeholder-white/30"/>
                                               <button onClick={() => removeFeatureValue(groupIndex, valIndex)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:text-red-400 hover:bg-red-500/10 transition shrink-0 mr-1">✕</button>
                                           </div>
                                       ))}
                                       <button onClick={() => addFeatureValue(groupIndex)} className="text-[10px] text-[#D883B7] bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/10 transition self-start mt-1">+ Add Value</button>
                                   </div>
                               </div>
                           ))}
                           {formData.variants.length > 0 && (
                               <div className="mt-4 pt-4 border-t border-white/10">
                                   <label className="text-xs font-bold text-[#D883B7] uppercase tracking-wider mb-3 block">Inventory Matrix</label>
                                   <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                       {formData.variants.map((variant, idx) => (
                                           <div key={idx} className="flex gap-2 items-center bg-black/30 p-2 rounded-xl border border-white/5">
                                               <div className="flex-1 text-[11px] font-bold text-white pl-2 break-words leading-tight">{variant.combo.join(' / ')}</div>
                                               <div className="flex flex-col gap-1 w-20 shrink-0">
                                                   <input type="number" placeholder="Price" value={variant.price} onChange={(e) => updateVariantPrice(idx, e.target.value)} className="w-full bg-white/10 rounded-md px-2 py-1 text-[10px] text-white outline-none border border-transparent focus:border-[#D883B7] text-center" title="Price"/>
                                                   <input type="number" placeholder="Qty" value={variant.quantity} onChange={(e) => updateVariantQty(idx, e.target.value)} className="w-full bg-white/10 rounded-md px-2 py-1 text-[10px] text-white outline-none border border-transparent focus:border-[#D883B7] text-center" title="Stock"/>
                                               </div>
                                           </div>
                                       ))}
                                   </div>
                               </div>
                           )}
                       </div>
                   )}
                </div>

                {isReadyMade && (
                    <div className="flex flex-col bg-black/20 p-5 rounded-3xl border border-white/10">
                        {boxBuilderView === 'checklist' ? (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-xs font-bold text-[#D883B7] uppercase tracking-wider">📦 Box Contents</label>
                                    <span className="text-[10px] bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] px-3 py-1 rounded-full font-bold shadow-md">{formData.selectedProducts.length} Selected</span>
                                </div>
                                <div className="flex gap-2 mb-4 shrink-0">
                                    <input type="text" placeholder="Search available products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="flex-1 bg-white/10 rounded-full pl-4 pr-4 py-2 outline-none text-xs text-white placeholder-white/40 border border-white/5 focus:bg-white/20 transition-colors"/>
                                    <button onClick={() => setBoxBuilderView('newProduct')} className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-4 py-2 rounded-full font-bold text-xs hover:scale-105 transition-all shadow-md flex items-center gap-1.5 border border-white/10"><span className="text-sm">+</span> New</button>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-80 border border-white/5 rounded-xl p-2 bg-[#2E1029]/50 shadow-inner">
                                    {availableProducts.filter(p => (p.name || p.productname || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.id || p.productid || '').toLowerCase().includes(productSearch.toLowerCase())).map(product => {
                                        const pId = product.id || product.productid;
                                        const selectedItem = formData.selectedProducts.find(sp => sp.id === pId);
                                        const isSelected = !!selectedItem;
                                        const displayImg = (product.images && product.images.length > 0) ? product.images[0] : product.image;

                                        return (
                                            <div key={pId} className={`flex items-center justify-between gap-3 p-2 rounded-xl transition-all duration-200 mb-2 border ${isSelected ? 'bg-white/10 border-[#D883B7] shadow-md' : 'border-transparent hover:bg-white/5 hover:border-white/10'}`}>
                                                <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                                                    <div className="relative flex items-center justify-center shrink-0">
                                                        <input type="checkbox" className="peer appearance-none w-5 h-5 border-2 border-white/30 rounded-md checked:bg-[#D883B7] checked:border-[#D883B7] transition-all cursor-pointer shadow-inner" checked={isSelected} onChange={() => toggleProductSelection(pId)}/>
                                                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                                    </div>
                                                    <div className="w-10 h-10 bg-black/20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-white/10">
                                                        {displayImg ? <img src={displayImg} className="w-full h-full object-cover" /> : <span className="text-[10px]">📷</span>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-sm leading-tight truncate transition-colors ${isSelected ? 'text-[#D883B7]' : 'text-white'}`}>{product.name || product.productname}</p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">ID: {pId} | <span className="text-[#D883B7] font-medium">LKR {product.price}</span></p>
                                                    </div>
                                                </label>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {isSelected && (
                                                        <input type="number" min="1" value={selectedItem.qty} onChange={(e) => updateSelectedQty(pId, parseInt(e.target.value) || 1)} className="w-12 bg-black/40 rounded-md px-1 py-1 text-xs text-white outline-none border border-white/10 focus:border-[#D883B7] text-center transition-colors" title="Quantity in box" onClick={(e) => e.stopPropagation()} />
                                                    )}
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setPreviewProduct({ ...product, actualReviews: getReviewsForProduct(pId) }); setPreviewActiveImage(displayImg); }} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 hover:bg-[#D883B7] text-white transition-colors border border-white/10" title="Quick View">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {availableProducts.length === 0 && <p className="text-xs text-gray-400 text-center mt-10 italic">No products available.</p>}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2 pb-2">
                                <div className="flex justify-between items-center mb-1 shrink-0"><h4 className="text-sm font-bold text-white uppercase tracking-wider">✨ Create New Product</h4><button onClick={() => setBoxBuilderView('checklist')} className="text-[10px] text-[#D883B7] font-bold hover:text-red-400 transition bg-white/10 px-2 py-1 rounded-md">✕ Cancel</button></div>
                                <input value={nestedProductFormData.name} onChange={e => setNestedProductFormData({...nestedProductFormData, name: e.target.value})} placeholder="New Product Name" className="w-full bg-white/10 rounded-full px-4 py-2.5 outline-none border border-white/20 text-xs text-white shrink-0"/>
                                <div className="flex gap-2 shrink-0"><input type="number" min="0" placeholder="Price" value={nestedProductFormData.price} onChange={e => setNestedProductFormData({...nestedProductFormData, price: e.target.value})} className="w-1/3 bg-white/10 rounded-full px-4 py-2 border border-white/20 text-xs text-white text-center"/><input type="number" min="0" placeholder="Initial Qty" value={nestedProductFormData.quantity} onChange={e => setNestedProductFormData({...nestedProductFormData, quantity: e.target.value})} className="w-1/3 bg-white/10 rounded-full px-4 py-2 border border-white/20 text-xs text-white text-center"/><input type="number" min="0" placeholder="Min Alert" value={nestedProductFormData.minStock} onChange={e => setNestedProductFormData({...nestedProductFormData, minStock: e.target.value})} className="w-1/3 bg-white/10 rounded-full px-4 py-2 border border-white/20 text-xs text-white text-center"/></div>
                                <input value={nestedProductFormData.description} onChange={e => setNestedProductFormData({...nestedProductFormData, description: e.target.value})} placeholder="Optional Description" className="w-full bg-white/10 rounded-full px-4 py-2.5 border border-white/20 text-xs text-white shrink-0"/>
                                <label className="w-full h-16 bg-white/10 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-[#D883B7]/50 text-gray-400 text-xs cursor-pointer hover:bg-white/20 transition shrink-0"><input type="file" multiple onChange={(e) => e.target.files && setNestedProductFormData({...nestedProductFormData, files: [...nestedProductFormData.files, ...Array.from(e.target.files)]})} className="hidden" accept="image/*"/>
                                    {nestedProductFormData.files.length > 0 ? <span className="text-[#D883B7] font-bold truncate max-w-[80%]">{nestedProductFormData.files.length} Photo(s) Added</span> : <span>Click to upload photo(s)</span>}
                                </label>
                                <button onClick={handleNestedProductSave} disabled={isSubmittingNested} className={`bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white py-3 mt-2 rounded-full font-bold text-sm shadow-md transition shrink-0 ${isSubmittingNested ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 hover:opacity-90'}`}>
                                    {isSubmittingNested ? '⏳ Saving...' : 'Save Product & Add to Box'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="flex justify-center mt-6 pt-6 border-t border-white/10 shrink-0">
                <button onClick={handleSave} disabled={isSubmitting || (isReadyMade && boxBuilderView === 'newProduct')} className={`bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-12 py-3 rounded-full font-bold shadow-lg transition border border-white/20 ${isSubmitting || (isReadyMade && boxBuilderView === 'newProduct') ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 hover:scale-105'}`}>
                    {isSubmitting ? "Saving..." : (isEditing ? (isReadyMade ? "Update Box" : "Update Product") : (isReadyMade ? "Create Box" : "Create Product"))}
                </button>
            </div>
            <button onClick={resetForm} className="absolute top-4 right-4 md:top-6 md:right-8 text-white/50 bg-black/20 w-8 h-8 rounded-full flex items-center justify-center font-bold hover:text-white hover:bg-red-500/50 transition">✕</button>
          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewProduct && (
          <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[70] p-4 backdrop-blur-md animate-fade-in" onClick={() => setPreviewProduct(null)}>
              <div 
                  className="bg-[#2E1029] w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl relative border border-white/20 flex flex-col md:flex-row overflow-hidden"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="md:w-1/2 bg-black/40 p-6 flex flex-col gap-4 border-r border-white/10">
                      <div className="w-full h-64 md:h-[400px] rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                          {previewActiveImage ? (
                              <img src={previewActiveImage} alt={previewProduct.name} className="w-full h-full object-cover" />
                          ) : (
                              <span className="text-6xl">📷</span>
                          )}
                      </div>
                      
                      {previewProduct.images && previewProduct.images.length > 1 && (
                          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                              {previewProduct.images.map((img: string, i: number) => (
                                  <div 
                                      key={i} onClick={() => setPreviewActiveImage(img)}
                                      className={`w-16 h-16 rounded-xl overflow-hidden cursor-pointer shrink-0 border-2 transition-all ${previewActiveImage === img ? 'border-[#D883B7]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                  >
                                      <img src={img} className="w-full h-full object-cover" />
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="md:w-1/2 p-8 overflow-y-auto custom-scrollbar flex flex-col bg-gradient-to-b from-[#2E1029] to-[#4A1D46]">
                      <div className="flex justify-between items-start mb-2">
                          <p className="text-[#D883B7] text-xs font-mono tracking-widest uppercase">{previewProduct.id || previewProduct.productid || previewProduct.itemid}</p>
                          <button onClick={() => setPreviewProduct(null)} className="text-white/50 hover:text-white bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-colors">✕</button>
                      </div>
                      
                      <h2 className="text-3xl font-serif font-bold text-white leading-tight mb-2">{previewProduct.name || previewProduct.productname || previewProduct.itemname}</h2>
                      
                      <div className="flex items-center gap-1 mb-4">
                          {renderStars(calculateAverageRating(previewProduct.actualReviews))}
                          {previewProduct.actualReviews && previewProduct.actualReviews.length > 0 && (
                              <span className="text-[10px] text-gray-400 ml-1">({previewProduct.actualReviews.length} Reviews)</span>
                          )}
                      </div>

                      <p className="text-2xl font-bold text-white mb-6">LKR {previewProduct.price}</p>
                      
                      <div className="mb-6">
                          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-2">Description</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">{previewProduct.desc || previewProduct.description || "No specific description available."}</p>
                      </div>

                      {previewProduct.features && previewProduct.features.length > 0 && (
                          <div className="flex flex-col gap-4 mb-8">
                              {previewProduct.features.map((feature: any, idx: number) => (
                                  <div key={idx}>
                                      <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2">{feature.name}</h4>
                                      <div className="flex flex-wrap gap-2">
                                          {feature.values.map((val: any, vIdx: number) => {
                                              const vName = typeof val === 'string' ? val : val.name;
                                              const vImg = typeof val === 'object' && val.image ? val.image : null;
                                              return (
                                                  <div key={vIdx} className="flex items-center gap-2 border border-white/20 rounded-full px-3 py-1.5 bg-white/5 hover:bg-white/10 transition cursor-pointer">
                                                      {vImg && <img src={vImg} className="w-5 h-5 rounded-full object-cover border border-white/20" />}
                                                      <span className="text-sm text-gray-200">{vName}</span>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}

                      <div className="mt-auto pt-6 border-t border-white/10">
                          <h4 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Customer Reviews</h4>
                          {(!previewProduct.actualReviews || previewProduct.actualReviews.length === 0) ? (
                              <p className="text-gray-400 text-sm italic bg-white/5 p-4 rounded-xl text-center">No reviews yet for this product.</p>
                          ) : (
                              <div className="flex flex-col gap-4">
                                  {previewProduct.actualReviews.map((review: any, idx: number) => {
                                      const reviewerName = review.author || review.userName || review.customer_name || review.customerName || review.name || "Verified Customer";
                                      const reviewText = review.text || review.comment || review.content || review.review_text || review.reviewText;
                                      
                                      return (
                                          <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                              <div className="flex justify-between items-center mb-1">
                                                  <p className="text-white font-bold text-sm">{reviewerName}</p>
                                                  {renderStars(Number(review.rating) || 5)}
                                              </div>
                                              <p className="text-gray-400 text-xs italic">"{reviewText}"</p>
                                          </div>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-[#2E1029]/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/30 text-white">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border ${alertState.type === 'error' ? 'bg-red-500/20 border-red-400 text-red-200' : alertState.type === 'confirm' ? 'bg-yellow-500/20 border-yellow-400 text-yellow-200' : 'bg-green-500/20 border-green-400 text-green-200'}`}>
                {alertState.type === 'error' ? '⚠️' : alertState.type === 'confirm' ? '❓' : '✅'}
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#F3E5F5]">{alertState.title}</h3>
              <p className="text-[#D883B7] mb-8 font-medium text-sm">{alertState.message}</p>
              <div className="flex gap-3 justify-center">
                  {alertState.type === 'confirm' && <button onClick={closeAlert} className="px-6 py-2 rounded-full font-bold border border-white/30 text-gray-300 hover:bg-white/10 transition">Cancel</button>}
                  <button onClick={alertState.type === 'confirm' && alertState.onConfirm ? alertState.onConfirm : closeAlert} className={`px-8 py-2 rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition ${alertState.type === 'error' ? 'bg-red-500 text-white' : 'bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white'}`}>
                    {alertState.type === 'confirm' ? 'Yes, Confirm' : 'OK'}
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function ProductPage() { return <Suspense fallback={<div>Loading...</div>}><ProductListContent /></Suspense>; }