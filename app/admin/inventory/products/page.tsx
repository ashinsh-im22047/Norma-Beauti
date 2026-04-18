"use client";

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

// --- DATA TYPES ---
type FeatureValue = { name: string; image: string; file?: File | null };
type FeatureGroup = { name: string; values: FeatureValue[] };
type ProductVariant = { combo: string[]; price: string; quantity: string };
type SelectedProduct = { id: string; qty: number }; 

// --- BUG FIX: SAFE JSON PARSER ---
const safeParseArray = (data: any) => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch { return []; }
    }
    return [];
};

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

  // --- BULLETPROOF REVIEW FETCHER ---
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
                        found = true;
                        break; 
                    }
                }
            } catch (e) { /* Check next endpoint */ }
        }
    };
    fetchAllReviews();
  }, []);

  const getReviewsForProduct = (cardId: string) => {
      if (!cardId) return [];
      const normalizedCardId = String(cardId).toLowerCase(); 
      
      return globalReviews.filter(r => {
          const dbProductId = String(r.productid || r.productId || '').toLowerCase();
          const dbItemId = String(r.itemid || r.itemId || '').toLowerCase();
          const matchId = (dbProductId === normalizedCardId) || (dbItemId === normalizedCardId);
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
        const data = await res.json();
        setItems(data.map((item: any) => ({ 
            ...item, 
            variants: safeParseArray(item.variants), 
            features: safeParseArray(item.features) 
        })));
    } catch(err) { console.error(err); } finally { setIsLoading(false); }
  };

  const fetchAvailableProducts = async () => {
    try {
        const res = await fetch('/api/inventory-items');
        if (res.ok) {
            const data = await res.json();
            setAvailableProducts(data.map((item: any) => ({
                ...item,
                variants: safeParseArray(item.variants),
                features: safeParseArray(item.features)
            })).filter((i: any) => i.type === 'product'));
        }
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
                            const uploadedData = await uploadRes.json();
                            return { name: val.name, image: uploadedData.url }; 
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
      
      const safeFeatures = safeParseArray(item.features);
      const mappedFeatures = safeFeatures.map((f: any) => ({ name: f.name, values: f.values.map((v: any) => typeof v === 'string' ? { name: v, image: '', file: null } : v) }));
      const mappedSelectedProducts = (item.includedProducts || []).map((p: any) => { if (typeof p === 'string') return { id: p, qty: 1 }; return p; });

      setFormData({ 
          name: item.name || item.productname || item.itemname, price: item.price, quantity: item.quantity, minStock: item.minStock?.toString() || '5', 
          description: item.desc || item.description, images: existingImages, features: mappedFeatures, variants: safeParseArray(item.variants), selectedProducts: mappedSelectedProducts 
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
      if (rating === 0) return <span className="text-slate-400 text-xs font-medium">No ratings yet</span>;
      
      const stars = [];
      for (let i = 0; i < 5; i++) {
          if (i < fullStars) {
              stars.push(<svg key={i} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);
          } else {
              stars.push(<svg key={i} className="w-4 h-4 text-slate-200 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>);
          }
      }
      return <div className="flex gap-0.5 items-center">{stars}</div>;
  };

  const ReviewLoader = ({ item, onClick }: { item: any, onClick: (reviews: any[]) => void }) => {
      const [reviews, setReviews] = useState<any[]>([]);

      useEffect(() => {
          const fetchReviews = async () => {
              try {
                  const pId = item.productid || (item.type === 'product' ? item.id : null);
                  const iId = item.itemid || (item.type === 'item' ? item.id : null);
                  
                  let url = '/api/reviews?';
                  if (pId) url += `productId=${pId}`;
                  else if (iId) url += `itemId=${iId}`;
                  else return;

                  const res = await fetch(url);
                  if (res.ok) {
                      setReviews(await res.json());
                  }
              } catch (err) { }
          };
          fetchReviews();
      }, [item]);

      const avgRating = calculateAverageRating(reviews);
      const reviewCount = reviews.length;

      return (
          <div className="flex items-center gap-2 mb-4" onClick={(e) => { e.stopPropagation(); onClick(reviews); }}>
              {renderStars(avgRating)}
              {reviewCount > 0 && <span className="text-[11px] text-slate-500 font-medium">({reviewCount} Reviews)</span>}
          </div>
      );
  };

  // --- E-COMMERCE GRID CARD ---
  const ProductCard = ({ item, isPending = false }: { item: any, isPending?: boolean }) => {
    const cardId = item.id || item.productid || item.itemid;
    const isHighlighted = cardId === highlightId;
    const displayImg = (item.images && item.images.length > 0) ? item.images[0] : item.image;
    
    const safeVariants = safeParseArray(item.variants);
    const totalQty = safeVariants.length > 0 ? safeVariants.reduce((sum: number, v: any) => sum + parseInt(v.quantity || 0), 0) : item.quantity;
    
    let displayPriceText = `LKR ${parseFloat(item.price || 0).toLocaleString()}`;
    if (safeVariants.length > 0) {
        const validPrices = safeVariants.map((v: any) => parseFloat(v.price)).filter((p: number) => !isNaN(p) && p > 0);
        if (validPrices.length > 0) {
            const lowestVariantPrice = Math.min(...validPrices);
            displayPriceText = `From LKR ${lowestVariantPrice.toLocaleString()}`;
        }
    }

    const openPreview = (loadedReviews: any[]) => {
        setPreviewProduct({ ...item, actualReviews: loadedReviews }); 
        setPreviewActiveImage(displayImg);
    };

    return (
      <div 
        ref={isHighlighted ? highlightRef : null}
        className={`group cursor-pointer flex flex-col bg-white rounded-3xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 relative ${isHighlighted ? 'border-[#FFAFA8] ring-4 ring-[#FFAFA8]/30 shadow-lg' : 'border-slate-200 hover:border-[#ff8a80] hover:shadow-xl shadow-sm'}`}
      >
        <div className="relative h-56 w-full bg-slate-50 overflow-hidden border-b border-slate-100" onClick={() => openPreview([])}>
            {displayImg ? (
                <img src={displayImg} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
            )}
            
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-sm">
                <span className={`w-2.5 h-2.5 rounded-full ${totalQty > (item.minStock || 5) ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`}></span>
                <span className="text-[10px] font-bold text-slate-700 tracking-wider leading-none">{totalQty} IN STOCK</span>
            </div>

            {!isPending && (
                <div className="absolute top-3 right-3">
                    <button onClick={(e) => { e.stopPropagation(); toggleMenu(e, cardId); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-[#FFAFA8] hover:border-[#FFAFA8] shadow-sm transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    {activeMenuId === cardId && (
                        <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg py-2 w-36 border border-slate-100 z-50 overflow-hidden" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setActiveMenuId(null); openEditModal(item); }} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 font-medium hover:bg-slate-50 hover:text-blue-500 flex items-center gap-2 transition-colors">
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Edit
                            </button>
                            <button onClick={() => { setActiveMenuId(null); handleDelete(cardId); }} className="w-full text-left px-4 py-2.5 text-sm text-rose-600 font-medium hover:bg-rose-50 flex items-center gap-2 transition-colors">
                                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Delete
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="p-5 flex flex-col flex-1">
            <div onClick={() => openPreview([])}>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest mb-1.5 uppercase">ID: {cardId}</p>
                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-[#ff8a80] transition-colors">{item.name || item.productname || item.itemname}</h3>
            </div>
            
            <ReviewLoader item={item} onClick={openPreview} />

            <div className="mt-auto flex items-end justify-between" onClick={() => openPreview([])}>
                <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-0.5 font-bold">Price</p>
                    <p className="font-bold text-slate-900 text-xl">{displayPriceText}</p>
                </div>
                {isPending && (
                    <div className="flex gap-2" onClick={e=>e.stopPropagation()}>
                        <button onClick={(e) => handleApproval(e, cardId, 'approved')} className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md hover:scale-105 transition-transform">Approve</button>
                    </div>
                )}
                {!isPending && safeVariants.length > 0 && (
                    <span className="text-[10px] bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-md font-bold shadow-sm">{safeVariants.length} Options</span>
                )}
            </div>
        </div>
      </div>
    );
  };

  let previewPriceText = '';
  if (previewProduct) {
      const safePreviewVariants = safeParseArray(previewProduct.variants);
      previewPriceText = `LKR ${parseFloat(previewProduct.price || 0).toLocaleString()}`;
      if (safePreviewVariants.length > 0) {
          const validPrices = safePreviewVariants.map((v: any) => parseFloat(v.price)).filter((p: number) => !isNaN(p) && p > 0);
          if (validPrices.length > 0) {
              previewPriceText = `Starting from LKR ${Math.min(...validPrices).toLocaleString()}`;
          }
      }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#fff5f4] font-sans pb-20 text-slate-800">
      <AdminHeader />
      <main className="container mx-auto px-4 md:px-6 py-8 relative z-10 max-w-[1400px]">
        
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800">{pageTitle}</h2>
                    <p className="text-sm text-slate-500 mt-2 font-medium">Manage your beautiful catalog items.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Search catalog..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] placeholder-slate-400 transition-all"/>
                    </div>
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="py-2.5 px-4 rounded-full bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all"><option value="newest">Newest First</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="qty">Quantity: Lowest</option></select>
                    <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-6 py-2.5 rounded-full shadow-md font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 text-sm">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        Add New
                    </button>
                </div>
            </div>
        </div>

        <div className="flex flex-col gap-8">
            {isCustomBox ? (
                <div className="flex flex-col gap-10">
                    {pending.length > 0 && (
                        <div>
                            <h3 className="text-slate-800 font-bold text-xl mb-4 pl-2 flex items-center gap-2">
                                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Pending Approval <span className="text-xs bg-gradient-to-r from-amber-400 to-orange-400 text-white px-2.5 py-0.5 rounded-full shadow-sm font-bold ml-2">{pending.length}</span>
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">{pending.map(item => <ProductCard key={item.id || item.productid} item={item} isPending={true} />)}</div>
                        </div>
                    )}
                    <div>
                        <h3 className="text-slate-800 font-bold text-xl mb-4 pl-2 flex items-center gap-2">
                            <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Available Products
                        </h3>
                        {approved.length === 0 && <p className="text-slate-500 italic p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">No approved products.</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">{approved.map(item => <ProductCard key={item.id || item.productid} item={item} />)}</div>
                    </div>
                </div>
            ) : (
                <>
                    {standard.length === 0 && <p className="text-slate-500 italic p-8 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">No items found in your catalog.</p>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">{standard.map(item => <ProductCard key={item.id || item.productid || item.itemid} item={item} />)}</div>
                </>
            )}
        </div>
      </main>

      {/* --- ADD/EDIT MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex justify-center items-start z-[1000] py-10 px-4 overflow-y-auto backdrop-blur-sm" onClick={resetForm}>
          <div className={`bg-white w-full ${isReadyMade ? 'max-w-4xl' : 'max-w-lg'} my-auto rounded-[2rem] p-8 md:p-10 shadow-2xl relative border border-slate-100 text-slate-800 flex flex-col transition-all duration-300`} onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-8 text-center tracking-tight shrink-0 text-slate-900">
              {isEditing ? 'Edit' : 'Add'} {isReadyMade ? 'Item Details' : 'Product Details'}
            </h2>
            
            <div className={`grid gap-6 overflow-y-auto pr-2 custom-scrollbar flex-1 ${isReadyMade ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                
                <div className="flex flex-col gap-5">
                   <div>
                       <label className="text-xs font-bold text-slate-500 ml-3 uppercase tracking-wider mb-2 block">Name</label>
                       <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 rounded-full px-5 py-3 outline-none border border-slate-200 focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-slate-800 transition-all"/>
                   </div>
                   <div className="flex gap-4">
                       <div className="flex-1">
                           <label className="text-xs font-bold text-slate-500 ml-3 uppercase">Price</label>
                           <input type="number" min="0" disabled={formData.variants.length > 0} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={`w-full rounded-full px-4 py-3 border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] text-center transition-all ${formData.variants.length > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-800'}`} placeholder={formData.variants.length > 0 ? "Matrix" : ""}/>
                       </div>
                       <div className="flex-1">
                           <label className="text-xs font-bold text-slate-500 ml-3 uppercase">Qty</label>
                           <input type="number" min="0" disabled={formData.variants.length > 0} value={formData.variants.length > 0 ? formData.variants.reduce((acc, v) => acc + (parseInt(v.quantity)||0), 0) : formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className={`w-full rounded-full px-4 py-3 border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] text-center transition-all ${formData.variants.length > 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 text-slate-800'}`}/>
                       </div>
                       <div className="flex-1">
                           <label className="text-xs font-bold text-slate-500 ml-3 uppercase" title="Minimum Stock Alert Level">Min Alert</label>
                           <input type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="w-full bg-slate-50 rounded-full px-4 py-3 border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] text-slate-800 text-center transition-all"/>
                       </div>
                   </div>
                   <div>
                       <label className="text-xs font-bold text-slate-500 ml-3 uppercase tracking-wider mb-2 block">Description</label>
                       <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 rounded-full px-5 py-3 outline-none border border-slate-200 focus:ring-2 focus:ring-[#FFAFA8] text-slate-800 transition-all"/>
                   </div>
                   
                   <div>
                       <label className="text-xs font-bold text-slate-500 ml-3 uppercase tracking-wider mb-2 block">Images ({formData.images.length + filesToUpload.length}/5)</label>
                       {(formData.images.length > 0 || filesToUpload.length > 0) && (
                           <div className="flex flex-wrap gap-3 mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                               {formData.images.map((img, i) => (<div key={i} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 group shadow-sm"><img src={img} className="w-full h-full object-cover"/><button onClick={() => removeExistingFile(i)} className="absolute inset-0 bg-rose-500/80 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center">Del</button></div>))}
                               {filesToUpload.map((file, i) => (<div key={`new_${i}`} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-dashed border-[#FFAFA8] group"><img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-70"/><button onClick={() => removeFileToUpload(i)} className="absolute inset-0 bg-rose-500/80 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center justify-center">Del</button></div>))}
                           </div>
                       )}
                       <label className={`w-full h-20 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-[#FFAFA8] text-slate-500 font-medium text-sm cursor-pointer transition ${formData.images.length + filesToUpload.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 hover:text-[#FFAFA8]'}`}>
                           <input type="file" multiple onChange={handleMainFileChange} className="hidden" accept="image/*" disabled={formData.images.length + filesToUpload.length >= 5}/>
                           <span className="flex items-center gap-2">
                               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                               Add Photo
                           </span>
                       </label>
                   </div>

                   {!isReadyMade && (
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mt-4">
                           <div className="flex justify-between items-center mb-5">
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Variants</label>
                               <button onClick={addFeatureGroup} className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-full hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-500 hover:text-white hover:border-transparent transition-all shadow-sm flex items-center gap-1.5">
                                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg> Add Option
                               </button>
                           </div>
                           {formData.features.map((featureGroup, groupIndex) => (
                               <div key={groupIndex} className="bg-white rounded-2xl p-5 border border-slate-200 mb-4 shadow-sm">
                                   <div className="flex gap-3 mb-5">
                                       <input value={featureGroup.name} onChange={e => updateFeatureGroupName(groupIndex, e.target.value)} placeholder="Option Name (e.g. Colour)" className="flex-1 bg-slate-50 rounded-full px-5 py-2.5 outline-none text-sm text-slate-800 border border-slate-200 font-bold focus:ring-2 focus:ring-blue-400"/>
                                       <button onClick={() => removeFeatureGroup(groupIndex)} className="text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white font-bold w-10 h-10 rounded-full transition flex items-center justify-center shadow-sm">
                                           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                       </button>
                                   </div>
                                   <div className="flex flex-col gap-3 pl-3 border-l-2 border-slate-100 ml-2">
                                       {featureGroup.values.map((val, valIndex) => (
                                           <div key={valIndex} className="flex gap-3 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                               <label className="w-12 h-12 rounded-lg border-2 border-dashed border-[#FFAFA8] flex items-center justify-center overflow-hidden cursor-pointer hover:bg-white transition shrink-0 bg-white relative group shadow-sm" title="Upload Feature Image">
                                                   {val.file ? <img src={URL.createObjectURL(val.file)} className="w-full h-full object-cover" /> : val.image ? <img src={val.image} className="w-full h-full object-cover" /> : 
                                                   <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFeatureImageChange(groupIndex, valIndex, e)} />
                                                   { (val.file || val.image) && <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition">Edit</div> }
                                               </label>
                                               <input value={val.name} onChange={e => updateFeatureValueName(groupIndex, valIndex, e.target.value)} placeholder="Feature Value (e.g. Red)" className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none placeholder-slate-400 font-medium"/>
                                               <button onClick={() => removeFeatureValue(groupIndex, valIndex)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-slate-400 hover:text-white hover:bg-rose-400 border border-slate-200 transition shrink-0 mr-1 shadow-sm">
                                                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                               </button>
                                           </div>
                                       ))}
                                       <button onClick={() => addFeatureValue(groupIndex)} className="text-xs font-bold text-blue-500 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full hover:bg-blue-500 hover:text-white transition self-start mt-2 shadow-sm flex items-center gap-1">
                                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg> Add Value
                                       </button>
                                   </div>
                               </div>
                           ))}
                           {formData.variants.length > 0 && (
                               <div className="mt-8 pt-6 border-t border-slate-200">
                                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5 block">Inventory Matrix</label>
                                   <div className="space-y-3 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                                       {formData.variants.map((variant, idx) => (
                                           <div key={idx} className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                               <div className="flex-1 text-sm font-bold text-slate-700 pl-2 break-words leading-tight">{variant.combo.join(' / ')}</div>
                                               <div className="flex flex-col gap-2 w-28 shrink-0">
                                                   <input type="number" placeholder="Price" value={variant.price} onChange={(e) => updateVariantPrice(idx, e.target.value)} className="w-full bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none border border-slate-200 focus:border-[#FFAFA8] focus:ring-1 focus:ring-[#FFAFA8] text-center transition-all" title="Price"/>
                                                   <input type="number" placeholder="Qty" value={variant.quantity} onChange={(e) => updateVariantQty(idx, e.target.value)} className="w-full bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none border border-slate-200 focus:border-[#FFAFA8] focus:ring-1 focus:ring-[#FFAFA8] text-center transition-all" title="Stock"/>
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
                    <div className="flex flex-col bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        {boxBuilderView === 'checklist' ? (
                            <>
                                <div className="flex justify-between items-center mb-5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <svg className="w-5 h-5 text-[#FFAFA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                        Box Contents
                                    </label>
                                    <span className="text-[11px] bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-3.5 py-1.5 rounded-full font-bold shadow-md">
                                        {formData.selectedProducts.length} Selected
                                    </span>
                                </div>
                                <div className="flex gap-3 mb-5 shrink-0">
                                    <div className="relative flex-1">
                                        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        <input type="text" placeholder="Search available products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full bg-white rounded-full pl-11 pr-5 py-3 outline-none text-sm text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-[#FFAFA8] focus:ring-2 focus:ring-[#FFAFA8] transition-all shadow-sm"/>
                                    </div>
                                    <button onClick={() => setBoxBuilderView('newProduct')} className="bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-full font-bold text-sm hover:border-[#FFAFA8] hover:text-[#FFAFA8] hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg> New</button>
                                </div>
                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[24rem] bg-white rounded-2xl border border-slate-100 p-3 shadow-inner">
                                    {availableProducts.filter(p => (p.name || p.productname || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.id || p.productid || '').toLowerCase().includes(productSearch.toLowerCase())).map(product => {
                                        const pId = product.id || product.productid;
                                        const selectedItem = formData.selectedProducts.find(sp => sp.id === pId);
                                        const isSelected = !!selectedItem;
                                        const displayImg = (product.images && product.images.length > 0) ? product.images[0] : product.image;

                                        return (
                                            <div key={pId} className={`flex items-center justify-between gap-4 p-3 rounded-xl transition-all duration-200 mb-3 border ${isSelected ? 'bg-gradient-to-r from-rose-50 to-white border-[#FFAFA8] shadow-md' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                                                <label className="flex items-center gap-4 cursor-pointer flex-1 min-w-0">
                                                    <div className="relative flex items-center justify-center shrink-0">
                                                        <input type="checkbox" className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-md checked:bg-[#FFAFA8] checked:border-[#FFAFA8] transition-all cursor-pointer shadow-sm" checked={isSelected} onChange={() => toggleProductSelection(pId)}/>
                                                        <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                                    </div>
                                                    <div className="w-14 h-14 bg-slate-50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-200">
                                                        {displayImg ? <img src={displayImg} className="w-full h-full object-cover" /> : <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-sm leading-tight truncate transition-colors ${isSelected ? 'text-[#ff8a80]' : 'text-slate-800'}`}>{product.name || product.productname}</p>
                                                        <p className="text-[11px] text-slate-500 mt-1 font-medium">ID: {pId} <span className="mx-1.5">•</span> <span className="text-slate-700 font-bold">LKR {product.price}</span></p>
                                                    </div>
                                                </label>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {isSelected && (
                                                        <input type="number" min="1" value={selectedItem.qty} onChange={(e) => updateSelectedQty(pId, parseInt(e.target.value) || 1)} className="w-16 bg-white rounded-lg px-2 py-2 text-sm text-slate-800 outline-none border border-slate-200 focus:border-[#FFAFA8] focus:ring-1 focus:ring-[#FFAFA8] text-center transition-all shadow-sm" title="Quantity in box" onClick={(e) => e.stopPropagation()} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {availableProducts.length === 0 && <p className="text-sm text-slate-500 text-center mt-12 font-medium">No products available.</p>}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2 pb-2">
                                <div className="flex justify-between items-center mb-2 shrink-0">
                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                        Create New Product
                                    </h4>
                                    <button onClick={() => setBoxBuilderView('checklist')} className="text-[11px] text-slate-500 font-bold hover:text-rose-500 transition bg-white border border-slate-200 px-3.5 py-2 rounded-full shadow-sm flex items-center gap-1.5">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg> Cancel
                                    </button>
                                </div>
                                <input value={nestedProductFormData.name} onChange={e => setNestedProductFormData({...nestedProductFormData, name: e.target.value})} placeholder="New Product Name" className="w-full bg-white rounded-full px-5 py-3 outline-none border border-slate-200 text-sm text-slate-800 shrink-0 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 shadow-sm transition-all"/>
                                <div className="flex gap-4 shrink-0">
                                    <input type="number" min="0" placeholder="Price" value={nestedProductFormData.price} onChange={e => setNestedProductFormData({...nestedProductFormData, price: e.target.value})} className="w-1/3 bg-white rounded-full px-4 py-3 border border-slate-200 text-sm text-slate-800 text-center focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 shadow-sm transition-all"/>
                                    <input type="number" min="0" placeholder="Initial Qty" value={nestedProductFormData.quantity} onChange={e => setNestedProductFormData({...nestedProductFormData, quantity: e.target.value})} className="w-1/3 bg-white rounded-full px-4 py-3 border border-slate-200 text-sm text-slate-800 text-center focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 shadow-sm transition-all"/>
                                    <input type="number" min="0" placeholder="Min Alert" value={nestedProductFormData.minStock} onChange={e => setNestedProductFormData({...nestedProductFormData, minStock: e.target.value})} className="w-1/3 bg-white rounded-full px-4 py-3 border border-slate-200 text-sm text-slate-800 text-center focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 shadow-sm transition-all"/>
                                </div>
                                <input value={nestedProductFormData.description} onChange={e => setNestedProductFormData({...nestedProductFormData, description: e.target.value})} placeholder="Optional Description" className="w-full bg-white rounded-full px-5 py-3 border border-slate-200 text-sm text-slate-800 shrink-0 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400 shadow-sm transition-all"/>
                                <label className="w-full h-24 bg-white rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 text-slate-500 text-sm cursor-pointer hover:bg-slate-50 transition shrink-0"><input type="file" multiple onChange={(e) => e.target.files && setNestedProductFormData({...nestedProductFormData, files: [...nestedProductFormData.files, ...Array.from(e.target.files)]})} className="hidden" accept="image/*"/>
                                    {nestedProductFormData.files.length > 0 ? <span className="text-indigo-500 font-bold truncate max-w-[80%]">{nestedProductFormData.files.length} Photo(s) Added</span> : <span className="flex items-center gap-2"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Click to upload photo(s)</span>}
                                </label>
                                <button onClick={handleNestedProductSave} disabled={isSubmittingNested} className={`bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 mt-2 rounded-full font-bold text-sm shadow-md transition shrink-0 tracking-wide ${isSubmittingNested ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02] hover:opacity-90 hover:shadow-lg'}`}>
                                    {isSubmittingNested ? 'Saving...' : 'Save Product & Add to Box'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="flex justify-center mt-10 pt-8 border-t border-slate-200 shrink-0">
                <button onClick={handleSave} disabled={isSubmitting || (isReadyMade && boxBuilderView === 'newProduct')} className={`bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-14 py-4 rounded-full font-bold shadow-lg transition-all text-base tracking-wide ${isSubmitting || (isReadyMade && boxBuilderView === 'newProduct') ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90 hover:scale-105 hover:shadow-xl'}`}>
                    {isSubmitting ? "Saving..." : (isEditing ? (isReadyMade ? "Update Box" : "Update Product") : (isReadyMade ? "Create Box" : "Create Product"))}
                </button>
            </div>
            <button onClick={resetForm} className="absolute top-6 right-6 text-slate-400 bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center font-bold hover:text-white hover:bg-rose-500 transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* --- PREVIEW MODAL (Admin Side) --- */}
      {previewProduct && (
          <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center z-[1050] p-4 backdrop-blur-sm animate-fade-in" onClick={() => setPreviewProduct(null)}>
              <div 
                  className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2rem] shadow-2xl relative border border-slate-100 flex flex-col md:flex-row overflow-hidden"
                  onClick={e => e.stopPropagation()}
              >
                  <div className="md:w-1/2 bg-slate-50 p-8 flex flex-col gap-6 border-r border-slate-100">
                      <div className="w-full h-64 md:h-[400px] rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                          {previewActiveImage ? (
                              <img src={previewActiveImage} alt={previewProduct.name} className="w-full h-full object-cover" />
                          ) : (
                              <svg className="w-16 h-16 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          )}
                      </div>
                      
                      {previewProduct.images && previewProduct.images.length > 1 && (
                          <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                              {previewProduct.images.map((img: string, i: number) => (
                                  <div 
                                      key={i} onClick={() => setPreviewActiveImage(img)}
                                      className={`w-20 h-20 rounded-2xl overflow-hidden cursor-pointer shrink-0 border-2 shadow-sm transition-all ${previewActiveImage === img ? 'border-[#FFAFA8] scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100 hover:border-slate-300'}`}
                                  >
                                      <img src={img} className="w-full h-full object-cover" />
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>

                  <div className="md:w-1/2 p-8 md:p-10 overflow-y-auto custom-scrollbar flex flex-col bg-white">
                      <div className="flex justify-between items-start mb-4">
                          <p className="text-slate-400 text-xs font-mono tracking-widest uppercase bg-slate-50 px-3 py-1 rounded-full border border-slate-100 shadow-sm">{previewProduct.id || previewProduct.productid || previewProduct.itemid}</p>
                          <button onClick={() => setPreviewProduct(null)} className="text-slate-400 hover:text-rose-500 bg-slate-50 border border-slate-100 w-9 h-9 rounded-full flex items-center justify-center transition-all hover:bg-rose-50 shadow-sm">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-3 tracking-tight">{previewProduct.name || previewProduct.productname || previewProduct.itemname}</h2>
                      
                      <div className="flex items-center gap-2 mb-6">
                          {renderStars(calculateAverageRating(previewProduct.actualReviews))}
                          {previewProduct.actualReviews && previewProduct.actualReviews.length > 0 && (
                              <span className="text-xs text-slate-500 font-medium ml-1">({previewProduct.actualReviews.length} Reviews)</span>
                          )}
                      </div>

                      <p className="text-2xl font-bold text-slate-900 mb-8">{previewPriceText}</p>
                      
                      <div className="mb-8">
                          <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Description</h4>
                          <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{previewProduct.desc || previewProduct.description || "No specific description available."}</p>
                      </div>

                      {previewProduct.features && previewProduct.features.length > 0 && (
                          <div className="flex flex-col gap-6 mb-10">
                              {previewProduct.features.map((feature: any, idx: number) => (
                                  <div key={idx}>
                                      <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">{feature.name}</h4>
                                      <div className="flex flex-wrap gap-2.5">
                                          {feature.values.map((val: any, vIdx: number) => {
                                              const vName = typeof val === 'string' ? val : val.name;
                                              const vImg = typeof val === 'object' && val.image ? val.image : null;
                                              return (
                                                  <div 
                                                      key={vIdx} 
                                                      onClick={() => { if (vImg) setPreviewActiveImage(vImg); }}
                                                      className={`flex items-center gap-2 border ${previewActiveImage === vImg ? 'border-[#FFAFA8] bg-gradient-to-r from-rose-50 to-white text-[#ff8a80] shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'} rounded-full px-4 py-2.5 transition-all cursor-pointer font-medium text-sm`}
                                                      title={vImg ? "Click to view variant image" : ""}
                                                  >
                                                      {vImg && <img src={vImg} className="w-5 h-5 rounded-full object-cover border border-slate-200 shadow-sm" />}
                                                      <span>{vName}</span>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}

                      {/* --- ADMIN PREVIEW BOX CONTENTS --- */}
                      {String(previewProduct.id || previewProduct.itemid).startsWith('item_') && (
                          <div className="mb-8 border-t border-slate-100 pt-8">
                              <div className="flex items-center justify-between mb-5">
                                  <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                      <svg className="w-4 h-4 text-[#FFAFA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                      Box Contents
                                  </h4>
                                  <span className="text-[10px] bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-3 py-1 rounded-full font-bold shadow-sm">
                                      Items included
                                  </span>
                              </div>

                              <p className="text-sm text-slate-500 italic bg-slate-50 p-6 rounded-2xl text-center border border-slate-100 shadow-inner">
                                 Please refer to the frontend store to view dynamically loaded box contents.
                              </p>
                          </div>
                      )}

                      <div className="mt-auto pt-8 border-t border-slate-100">
                          <h4 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2">
                              <svg className="w-4 h-4 text-[#FFAFA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                              Customer Reviews
                          </h4>
                          {(!previewProduct.actualReviews || previewProduct.actualReviews.length === 0) ? (
                              <p className="text-slate-500 text-sm italic bg-slate-50 p-6 rounded-2xl text-center border border-slate-100 shadow-sm">No reviews yet for this product.</p>
                          ) : (
                              <div className="flex flex-col gap-4">
                                  {previewProduct.actualReviews.map((review: any, idx: number) => {
                                      const reviewerName = review.author || review.userName || review.customer_name || review.customerName || review.name || "Verified Customer";
                                      const reviewText = review.text || review.comment || review.content || review.review_text || review.reviewText;
                                      
                                      return (
                                          <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                                              <div className="flex justify-between items-center mb-3">
                                                  <p className="text-slate-800 font-bold text-sm">{reviewerName}</p>
                                                  {renderStars(Number(review.rating) || 5)}
                                              </div>
                                              <p className="text-slate-600 text-sm italic mt-2 leading-relaxed">"{reviewText}"</p>
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

      {/* --- CUSTOM ELEGANT DIALOG BOX --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 text-slate-800 transform transition-all scale-100">
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 
                  ${alertState.type === 'error' ? 'bg-rose-50 border-white text-rose-500 shadow-rose-200' : 
                    alertState.type === 'confirm' ? 'bg-amber-50 border-white text-amber-500 shadow-amber-200' : 
                    'bg-emerald-50 border-white text-emerald-500 shadow-emerald-200'}`}>
                {alertState.type === 'error' ? <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> : 
                 alertState.type === 'confirm' ? <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> : 
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>

              <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">
                {alertState.title}
              </h3>
              
              <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">
                {alertState.message}
              </p>

              <div className="flex gap-3 justify-center">
                  {alertState.type === 'confirm' && (
                      <button 
                        onClick={closeAlert}
                        className="px-6 py-3 rounded-full font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                      >
                        Cancel
                      </button>
                  )}
                  
                  <button 
                    onClick={alertState.type === 'confirm' && alertState.onConfirm ? alertState.onConfirm : (alertState.type === 'success' && alertState.onConfirm ? alertState.onConfirm : closeAlert)}
                    className={`px-8 py-3 rounded-full font-bold shadow-md hover:opacity-90 hover:scale-105 transition-all text-white tracking-wide
                        ${alertState.type === 'error' ? 'bg-gradient-to-r from-rose-500 to-red-600' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80]'}`}
                  >
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