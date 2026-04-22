// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

export default function RegisteredUsersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to load customers", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-24">
      
      <AdminHeader />

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-10 relative z-10">
        
        {/* TOP CONTROL BAR - Clean White Card */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Registered Users</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">Manage and review your growing customer base.</p>
            </div>
            
            <div className="relative w-full md:w-80 z-10">
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input 
                  type="text" 
                  placeholder="Search name, email, phone..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-5 py-3.5 rounded-full bg-slate-50 border border-slate-200 text-slate-800 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:bg-white shadow-inner placeholder-slate-400 transition-all"
                />
            </div>
        </div>

        {/* CUSTOMER TABLE */}
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-200">
          <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-200 font-bold">
                          <th className="p-5 pl-8 whitespace-nowrap">ID</th>
                          <th className="p-5 whitespace-nowrap">Name</th>
                          <th className="p-5">Email</th>
                          <th className="p-5 whitespace-nowrap">Phone</th>
                          <th className="p-5 whitespace-nowrap">Joined Date</th>
                          <th className="p-5 pr-8 text-center">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.length === 0 ? (
                          <tr>
                              <td colSpan={6} className="p-16 text-center">
                                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300">
                                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                  </div>
                                  <p className="text-slate-800 font-bold text-xl tracking-tight mb-1">No customers found.</p>
                                  <p className="text-slate-500 text-sm font-medium">Try adjusting your search criteria.</p>
                              </td>
                          </tr>
                      ) : (
                          filteredCustomers.map((customer, index) => (
                              <tr key={index} className="hover:bg-slate-50 transition-colors duration-200 group">
                                  <td className="p-5 pl-8 font-bold text-slate-400 font-mono tracking-wider">{customer.customer_id || '-'}</td>
                                  <td className="p-5 font-bold text-slate-800 tracking-wide">{customer.name || <span className="text-slate-400 italic font-medium">Profile Pending</span>}</td>
                                  <td className="p-5 text-slate-500 font-medium text-sm">{customer.email}</td>
                                  <td className="p-5 text-slate-500 text-sm font-medium">{customer.phone || '-'}</td>
                                  <td className="p-5 text-sm text-slate-600 font-bold">
                                      {customer.joined_date ? new Date(customer.joined_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                  </td>
                                  <td className="p-5 pr-8 text-center">
                                      <button 
                                        onClick={() => setSelectedCustomer(customer)} 
                                        className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-50 hover:text-[#ff8a80] hover:border-[#FFAFA8] transition-all shadow-sm whitespace-nowrap"
                                      >
                                          View Profile
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
              
              {filteredCustomers.length > 0 && (
                  <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-sm px-8">
                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Total Users</span>
                      <span className="font-bold text-slate-700 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">{filteredCustomers.length}</span>
                  </div>
              )}
          </div>
        </div>
      </main>

      {/* --- EXPANDED CUSTOMER DETAILS MODAL --- */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedCustomer(null)}>
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full relative animate-scale-up border border-slate-100 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                
                <button onClick={() => setSelectedCustomer(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shadow-sm z-10">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="flex flex-col items-center text-center mb-8 shrink-0 relative mt-2">
                    <div className="w-24 h-24 bg-gradient-to-tr from-[#FFAFA8] to-[#ff8a80] rounded-full flex items-center justify-center text-4xl text-white shadow-lg mb-4 border-4 border-white relative z-10 font-bold uppercase">
                        {selectedCustomer.name ? selectedCustomer.name.charAt(0) : <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{selectedCustomer.name || 'User'}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">Customer ID: {selectedCustomer.customer_id || '-'}</p>
                </div>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="overflow-y-auto pr-2 pb-2 space-y-6 flex-grow custom-scrollbar">
                    
                    {/* Contact Info */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Email</span>
                            <span className="text-slate-800 font-bold text-sm">{selectedCustomer.email}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Phone</span>
                            <span className="text-slate-800 font-bold text-sm">{selectedCustomer.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Joined</span>
                            <span className="text-slate-800 font-bold text-sm">
                                {selectedCustomer.joined_date ? new Date(selectedCustomer.joined_date).toLocaleDateString() : 'Unknown'}
                            </span>
                        </div>
                    </div>

                    {/* Order History */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            Order History 
                            <span className="bg-slate-100 text-slate-600 text-[10px] px-2.5 py-0.5 rounded-md border border-slate-200 shadow-sm ml-1">{selectedCustomer.orders?.length || 0}</span>
                        </h3>
                        
                        <div className="space-y-3">
                            {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                                selectedCustomer.orders.map((order: any) => (
                                    <div key={order.orderid} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-[#FFAFA8] transition-colors group">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm group-hover:text-[#ff8a80] transition-colors">#{order.orderid}</p>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">{new Date(order.orderdate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 text-sm mb-1.5">LKR {parseFloat(order.totalamount).toLocaleString()}</p>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                                order.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                order.status === 'Processing' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                'bg-rose-50 text-rose-600 border-rose-200'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                                    <svg className="w-6 h-6 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    <p className="text-slate-500 text-sm font-medium">No past orders found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Visual anchor point for the scroll area */}
                <div className="h-4 w-full bg-gradient-to-t from-white to-transparent absolute bottom-0 left-0 pointer-events-none"></div>
            </div>
        </div>
      )}

    </div>
  );
}