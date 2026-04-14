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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#880e4f] font-bold">Loading Support Hub...</div>;

  return (
    <div className="min-h-screen bg-[#FFF0F5] font-sans pb-20">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
                <h1 className="text-3xl font-serif font-bold text-[#880e4f]">Support Hub</h1>
                <p className="text-gray-600 text-sm mt-1">Manage returns, complaints, and customer feedback.</p>
            </div>
            <button onClick={() => router.push('/admin/dashboard')} className="px-6 py-2.5 bg-white text-[#880e4f] font-bold text-sm rounded-full shadow-sm border border-pink-100 hover:bg-pink-50 transition">
                ← Back to Dashboard
            </button>
        </div>

        <div className="flex gap-4 mb-6 overflow-x-auto pb-2 custom-scrollbar">
            <button onClick={() => setActiveTab('returns')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm border whitespace-nowrap ${activeTab === 'returns' ? 'bg-[#880e4f] text-white border-[#880e4f]' : 'bg-white text-gray-500 border-pink-100 hover:bg-pink-50'}`}>
                ↩️ Return Requests ({data.returns.filter(r => r.status === 'Pending').length} Pending)
            </button>
            <button onClick={() => setActiveTab('complaints')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm border whitespace-nowrap ${activeTab === 'complaints' ? 'bg-[#880e4f] text-white border-[#880e4f]' : 'bg-white text-gray-500 border-pink-100 hover:bg-pink-50'}`}>
                ⚠️ Complaints ({data.complaints.filter(c => c.status === 'Pending').length} Pending)
            </button>
            <button onClick={() => setActiveTab('reviews')} className={`px-6 py-3 rounded-full font-bold text-sm transition-all shadow-sm border whitespace-nowrap ${activeTab === 'reviews' ? 'bg-[#880e4f] text-white border-[#880e4f]' : 'bg-white text-gray-500 border-pink-100 hover:bg-pink-50'}`}>
                🌟 Product Reviews ({data.reviews.length})
            </button>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl p-6 md:p-8 border border-white/60">
            
            {/* --- RETURNS TAB --- */}
            {activeTab === 'returns' && (
                <div className="space-y-4">
                    {data.returns.length === 0 ? <p className="text-center text-gray-400 py-10">No return requests found.</p> : 
                    data.returns.map((req) => (
                        <div key={req.returnid} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest block mb-1">Order #{req.orderid}</span>
                                    <h4 className="font-bold text-[#4A1D46]">{req.customer_name}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">{new Date(req.date).toLocaleString()}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                                    req.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                    req.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-200' :
                                    'bg-red-50 text-red-600 border-red-200'
                                }`}>{req.status}</span>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Reason for Return:</p>
                                <p className="text-sm text-[#7B2C62]">{req.reason}</p>
                            </div>
                            
                            {req.status === 'Pending' ? (
                                <div className="flex gap-3">
                                    <button onClick={() => setReturnModal({show: true, orderId: req.orderid, returnId: req.returnid, type: 'Approve', reply: ''})} className="flex-1 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold text-sm rounded-xl border border-green-200 transition">Approve Return</button>
                                    <button onClick={() => setReturnModal({show: true, orderId: req.orderid, returnId: req.returnid, type: 'Decline', reply: ''})} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-sm rounded-xl border border-red-200 transition">Decline Return</button>
                                </div>
                            ) : (
                                <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                                    <p className="text-xs font-bold text-[#D883B7] uppercase mb-1">Your Reply:</p>
                                    <p className="text-sm text-[#4A1D46] italic">{req.admin_reply || "No reply provided."}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* --- COMPLAINTS TAB --- */}
            {activeTab === 'complaints' && (
                <div className="space-y-4">
                    {data.complaints.length === 0 ? <p className="text-center text-gray-400 py-10">No complaints found. Great job!</p> : 
                    data.complaints.map((comp) => (
                        <div key={comp.complaintid} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-[10px] font-bold text-[#D883B7] uppercase tracking-widest block mb-1">Order #{comp.orderid}</span>
                                    <h4 className="font-bold text-[#4A1D46]">{comp.customer_name}</h4>
                                    <p className="text-xs text-gray-400 mt-0.5">{new Date(comp.date).toLocaleString()}</p>
                                </div>
                                <select 
                                    value={comp.status}
                                    onChange={(e) => handleUpdateComplaint(comp.complaintid, e.target.value)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border outline-none cursor-pointer ${
                                        comp.status === 'Pending' ? 'bg-red-50 text-red-600 border-red-200' :
                                        comp.status === 'Reviewed' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                        'bg-green-50 text-green-600 border-green-200'
                                    }`}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                            </div>
                            <div className="bg-red-50/30 p-4 rounded-xl border border-red-50">
                                <p className="text-sm text-[#7B2C62] whitespace-pre-line">{comp.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* --- REVIEWS TAB --- */}
            {activeTab === 'reviews' && (
                <div className="space-y-4">
                    {data.reviews.length === 0 ? <p className="text-center text-gray-400 py-10">No product reviews yet.</p> : 
                    data.reviews.map((rev) => (
                        <div key={rev.reviewid} className={`bg-white p-6 rounded-2xl border ${rev.is_hidden ? 'border-gray-400 bg-gray-50 opacity-80' : 'border-gray-100'} shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className={`font-bold ${rev.is_hidden ? 'text-gray-600' : 'text-[#4A1D46]'}`}>{rev.customer_name}</h4>
                                    <span className="text-yellow-400 text-sm">{'⭐'.repeat(rev.rating)}</span>
                                    {rev.is_hidden ? (
                                        <span className="ml-2 text-[9px] font-bold text-white bg-gray-500 px-2 py-0.5 rounded-full tracking-widest uppercase">Hidden</span>
                                    ) : (
                                        <span className="ml-2 text-[9px] font-bold text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-full tracking-widest uppercase">Visible</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400 font-mono tracking-widest mb-2">Order #{rev.orderid} | Product ID: {rev.productid || rev.itemid}</p>
                                <p className={`text-sm italic ${rev.is_hidden ? 'text-gray-500' : 'text-gray-600'}`}>"{rev.comment}"</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleToggleHideReview(rev.reviewid, rev.is_hidden)} className="text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition border border-gray-200 whitespace-nowrap">
                                    {rev.is_hidden ? '👁️ Unhide' : '🙈 Hide'}
                                </button>
                                <button onClick={() => handleDeleteReview(rev.reviewid)} className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl transition border border-red-100 whitespace-nowrap">
                                    Delete
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-md w-full relative animate-scale-up">
                  <button onClick={() => setReturnModal({...returnModal, show: false})} className="absolute top-5 right-5 text-gray-400 hover:text-[#880e4f] font-bold text-xl">✕</button>
                  <h2 className={`text-2xl font-serif font-bold mb-2 ${returnModal.type === 'Approve' ? 'text-green-600' : 'text-red-600'}`}>
                      {returnModal.type} Return
                  </h2>
                  <p className="text-xs text-gray-500 mb-6">Order #{returnModal.orderId}</p>
                  
                  <div className="mb-6">
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Message to Customer (Optional)</label>
                      <textarea 
                          rows={4}
                          placeholder={returnModal.type === 'Approve' ? "E.g., Please ship the item back to our store address..." : "E.g., Sorry, but cosmetics cannot be returned once opened..."}
                          value={returnModal.reply}
                          onChange={e => setReturnModal({...returnModal, reply: e.target.value})}
                          className="w-full p-3 rounded-xl border outline-none focus:border-[#880e4f] text-sm text-[#4A1D46] resize-none"
                      />
                  </div>

                  <button onClick={handleProcessReturn} className={`w-full py-3 text-white rounded-xl font-bold shadow-md transition ${returnModal.type === 'Approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                      Confirm & {returnModal.type}
                  </button>
              </div>
          </div>
      )}

      {/* --- BEAUTIFUL ALERT --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border ${alertState.type === 'success' ? 'bg-green-50 border-green-200 text-green-500' : 'bg-[#FFF9C4] border-[#FFF59D] text-yellow-600'}`}>
                {alertState.type === 'success' ? '✨' : '⚠️'}
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">{alertState.title}</h3>
              <p className="text-[#7B2C62] mb-8 font-medium text-sm">{alertState.message}</p>
              <button onClick={() => setAlertState({ ...alertState, show: false })} className="px-10 py-3 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all w-full bg-[#880e4f]">
                Close
              </button>
           </div>
        </div>
      )}
    </div>
  );
}