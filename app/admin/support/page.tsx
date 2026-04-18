"use client";

import React, { useEffect, useState } from 'react';
import AdminHeader from '@/components/AdminHeader';
import { useRouter } from 'next/navigation';

export default function AdminSupportPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'returns' | 'complaints' | 'reviews'>('returns');
  
  const [data, setData] = useState({
      reviews: [] as any[],
      complaints: [] as any[],
      returns: [] as any[]
  });

  const [alertState, setAlertState] = useState({ show: false, type: 'success', title: '', message: '' });
  
  const [returnModal, setReturnModal] = useState<{show: boolean, orderId: string, returnId: string, type: 'Approve' | 'Decline', reply: string}>({
      show: false, orderId: '', returnId: '', type: 'Approve', reply: ''
  });

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const res = await fetch('/api/admin/support');
      if (res.ok) setData(await res.json());
    } catch (error) {
      console.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateComplaint = async (id: string, status: string) => {
      try {
          const res = await fetch('/api/admin/support', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'complaint', id, status })
          });
          if (res.ok) fetchSupportData();
      } catch (error) {
          setAlertState({ show: true, type: 'error', title: 'Error', message: 'Failed to update complaint.' });
      }
  };

  // --- NEW: TOGGLE HIDE/UNHIDE REVIEW ---
  const handleToggleHideReview = async (id: string, currentHiddenStatus: boolean) => {
      try {
          const res = await fetch('/api/admin/support', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'review', id, is_hidden: !currentHiddenStatus })
          });
          if (res.ok) {
              const result = await res.json();
              setAlertState({ show: true, type: 'success', title: 'Success', message: result.message });
              fetchSupportData();
          }
      } catch (error) {
          setAlertState({ show: true, type: 'error', title: 'Error', message: 'Failed to update review visibility.' });
      }
  };

  const handleDeleteReview = async (id: string) => {
      if (!confirm("Are you sure you want to permanently delete this review?")) return;
      try {
          const res = await fetch(`/api/admin/support?type=review&id=${id}`, { method: 'DELETE' });
          if (res.ok) {
              setAlertState({ show: true, type: 'success', title: 'Deleted', message: 'Review has been permanently removed.' });
              fetchSupportData();
          }
      } catch (error) {
          setAlertState({ show: true, type: 'error', title: 'Error', message: 'Failed to delete review.' });
      }
  };

  const handleProcessReturn = async () => {
      try {
          const res = await fetch('/api/admin/support', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  type: 'return', 
                  id: returnModal.returnId, 
                  status: returnModal.type === 'Approve' ? 'Approved' : 'Declined',
                  admin_reply: returnModal.reply 
              })
          });
          if (res.ok) {
              setAlertState({ show: true, type: 'success', title: 'Success', message: `Return request ${returnModal.type.toLowerCase()}d.` });
              setReturnModal({ ...returnModal, show: false });
              fetchSupportData();
          }
      } catch (error) {
          setAlertState({ show: true, type: 'error', title: 'Error', message: 'Failed to process return.' });
      }
  };

  if (loading) return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-24 text-slate-800">
      <AdminHeader />
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 relative z-10">
        
        {/* HEADER CARD */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-200 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70"></div>
            
            <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Support Hub</h1>
                <p className="text-sm text-slate-500 mt-2 font-medium">Manage returns, complaints, and customer feedback.</p>
            </div>
            <div className="relative z-10">
                <button 
                    onClick={() => router.push('/admin/dashboard')} 
                    className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-full shadow-sm text-sm font-bold hover:bg-slate-50 hover:text-[#ff8a80] hover:border-[#FFAFA8] transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Dashboard
                </button>
            </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            <button 
                onClick={() => setActiveTab('returns')} 
                className={`px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm border whitespace-nowrap flex items-center gap-2 ${activeTab === 'returns' ? 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                Return Requests ({data.returns.filter(r => r.status === 'Pending').length})
            </button>
            <button 
                onClick={() => setActiveTab('complaints')} 
                className={`px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm border whitespace-nowrap flex items-center gap-2 ${activeTab === 'complaints' ? 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Complaints ({data.complaints.filter(c => c.status === 'Pending').length})
            </button>
            <button 
                onClick={() => setActiveTab('reviews')} 
                className={`px-8 py-3.5 rounded-full font-bold text-sm transition-all shadow-sm border whitespace-nowrap flex items-center gap-2 ${activeTab === 'reviews' ? 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                Product Reviews ({data.reviews.length})
            </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm p-8 md:p-10 border border-slate-200 min-h-[500px]">
            
            {/* --- RETURNS TAB --- */}
            {activeTab === 'returns' && (
                <div className="space-y-6">
                    {data.returns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            <p className="text-lg font-bold text-slate-600">No return requests found.</p>
                        </div>
                    ) : 
                    data.returns.map((req) => (
                        <div key={req.returnid} className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200 group">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Order #{req.orderid}</span>
                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-[#ff8a80] transition-colors">{req.customer_name}</h4>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{new Date(req.date).toLocaleString()}</p>
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                                    req.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                    req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                    'bg-rose-50 text-rose-600 border-rose-200'
                                }`}>{req.status}</span>
                            </div>
                            
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2 tracking-widest flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Reason for Return:
                                </p>
                                <p className="text-sm text-slate-700 font-medium leading-relaxed">{req.reason}</p>
                            </div>
                            
                            {req.status === 'Pending' ? (
                                <div className="flex flex-col sm:flex-row gap-3 mt-auto">
                                    <button onClick={() => setReturnModal({show: true, orderId: req.orderid, returnId: req.returnid, type: 'Approve', reply: ''})} className="flex-1 py-3 bg-white hover:bg-emerald-50 text-emerald-600 font-bold text-sm rounded-full border border-emerald-200 transition-colors shadow-sm flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Approve Return
                                    </button>
                                    <button onClick={() => setReturnModal({show: true, orderId: req.orderid, returnId: req.returnid, type: 'Decline', reply: ''})} className="flex-1 py-3 bg-white hover:bg-rose-50 text-rose-600 font-bold text-sm rounded-full border border-rose-200 transition-colors shadow-sm flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg> Decline Return
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-[#fff5f4] p-5 rounded-2xl border border-[#FFAFA8]/30">
                                    <p className="text-xs font-bold text-[#ff8a80] uppercase mb-2 tracking-widest flex items-center gap-1.5">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                        Your Reply:
                                    </p>
                                    <p className="text-sm text-slate-800 font-medium italic">{req.admin_reply || "No reply provided."}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* --- COMPLAINTS TAB --- */}
            {activeTab === 'complaints' && (
                <div className="space-y-6">
                    {data.complaints.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <svg className="w-16 h-16 mb-4 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <p className="text-lg font-bold text-slate-600">No complaints found. Great job!</p>
                        </div>
                    ) : 
                    data.complaints.map((comp) => (
                        <div key={comp.complaintid} className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-slate-200 group">
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Order #{comp.orderid}</span>
                                    <h4 className="font-bold text-slate-800 text-lg group-hover:text-[#ff8a80] transition-colors">{comp.customer_name}</h4>
                                    <p className="text-xs text-slate-500 font-medium mt-1">{new Date(comp.date).toLocaleString()}</p>
                                </div>
                                <div className="relative">
                                    <select 
                                        value={comp.status}
                                        onChange={(e) => handleUpdateComplaint(comp.complaintid, e.target.value)}
                                        className={`pl-4 pr-8 py-2 rounded-full text-xs font-bold uppercase tracking-wider border outline-none cursor-pointer shadow-sm appearance-none ${
                                            comp.status === 'Pending' ? 'bg-rose-50 text-rose-600 border-rose-200 focus:ring-2 focus:ring-rose-200' :
                                            comp.status === 'Reviewed' ? 'bg-amber-50 text-amber-600 border-amber-200 focus:ring-2 focus:ring-amber-200' :
                                            'bg-emerald-50 text-emerald-600 border-emerald-200 focus:ring-2 focus:ring-emerald-200'
                                        }`}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="Reviewed">Reviewed</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                    <svg className={`w-4 h-4 absolute right-3 top-2 pointer-events-none ${
                                        comp.status === 'Pending' ? 'text-rose-500' : comp.status === 'Reviewed' ? 'text-amber-500' : 'text-emerald-500'
                                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 shadow-inner">
                                <p className="text-sm text-slate-700 font-medium whitespace-pre-line leading-relaxed">{comp.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- REVIEWS TAB --- */}
            {activeTab === 'reviews' && (
                <div className="space-y-5">
                    {data.reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <svg className="w-16 h-16 mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                            <p className="text-lg font-bold text-slate-600">No product reviews yet.</p>
                        </div>
                    ) : 
                    data.reviews.map((rev) => (
                        <div key={rev.reviewid} className={`p-6 rounded-[2rem] border shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all duration-300 ${rev.is_hidden ? 'border-slate-300 bg-slate-100 opacity-80' : 'border-slate-200 bg-white hover:border-[#FFAFA8] hover:shadow-md'}`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                    <h4 className={`font-bold text-lg ${rev.is_hidden ? 'text-slate-600' : 'text-slate-900'}`}>{rev.customer_name}</h4>
                                    
                                    <div className="flex items-center gap-0.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <svg key={i} className={`w-4 h-4 ${i < rev.rating ? 'text-amber-400' : 'text-slate-200'} fill-current`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        ))}
                                    </div>
                                    
                                    {rev.is_hidden ? (
                                        <span className="ml-2 text-[9px] font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-md tracking-widest uppercase border border-slate-300 shadow-sm flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> Hidden
                                        </span>
                                    ) : (
                                        <span className="ml-2 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md tracking-widest uppercase shadow-sm flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Visible
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono tracking-widest mb-2 border-b border-slate-100 pb-2 inline-block">Order #{rev.orderid} | Product ID: {rev.productid || rev.itemid}</p>
                                <p className={`text-sm font-medium leading-relaxed ${rev.is_hidden ? 'text-slate-500 italic' : 'text-slate-700'}`}>"{rev.comment}"</p>
                            </div>
                            
                            <div className="flex gap-2 w-full md:w-auto shrink-0">
                                <button 
                                    onClick={() => handleToggleHideReview(rev.reviewid, rev.is_hidden)} 
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-full transition-colors border shadow-sm ${rev.is_hidden ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-200'}`}
                                >
                                    {rev.is_hidden ? (
                                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> Unhide</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> Hide</>
                                    )}
                                </button>
                                <button 
                                    onClick={() => handleDeleteReview(rev.reviewid)} 
                                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-xs font-bold text-rose-500 bg-white hover:bg-rose-50 hover:border-rose-200 px-5 py-2.5 rounded-full transition-colors border border-slate-200 shadow-sm"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </main>

      {/* --- RETURN ACTION MODAL --- */}
      {returnModal.show && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full relative animate-scale-up border border-slate-100">
                  <button onClick={() => setReturnModal({...returnModal, show: false})} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <h2 className={`text-2xl font-bold mb-1 tracking-tight ${returnModal.type === 'Approve' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {returnModal.type} Return
                  </h2>
                  <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-6">Order #{returnModal.orderId}</p>
                  
                  <div className="mb-8">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 ml-1">Message to Customer (Optional)</label>
                      <textarea 
                          rows={4}
                          placeholder={returnModal.type === 'Approve' ? "E.g., Please ship the item back to our store address..." : "E.g., Sorry, but cosmetics cannot be returned once opened..."}
                          value={returnModal.reply}
                          onChange={e => setReturnModal({...returnModal, reply: e.target.value})}
                          className="w-full p-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-sm text-slate-800 font-medium resize-none shadow-sm transition-all"
                      />
                  </div>

                  <button 
                    onClick={handleProcessReturn} 
                    className={`w-full py-3.5 text-white rounded-full font-bold shadow-md tracking-wide transition-all hover:shadow-lg hover:scale-[1.02] ${returnModal.type === 'Approve' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-rose-500 to-rose-600'}`}
                  >
                      Confirm & {returnModal.type}
                  </button>
              </div>
          </div>
      )}

      {/* --- ELEGANT ALERT MODAL --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 text-slate-800 transform transition-all scale-100">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 
                  ${alertState.type === 'success' ? 'bg-emerald-50 border-white text-emerald-500 shadow-emerald-200' : 'bg-rose-50 border-white text-rose-500 shadow-rose-200'}`}>
                {alertState.type === 'success' ? (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">{alertState.title}</h3>
              <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">{alertState.message}</p>
              <button 
                  onClick={() => setAlertState({ ...alertState, show: false })} 
                  className="px-10 py-3 text-white rounded-full font-bold shadow-md tracking-wide hover:shadow-lg hover:scale-105 transition-all w-full bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80]"
              >
                Close
              </button>
           </div>
        </div>
      )}
    </div>
  );
}