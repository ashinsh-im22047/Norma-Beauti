"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#880e4f] bg-[#fff0f5]">Loading Customers...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4a1d46] pb-20">
      
      {/* HEADER */}
      <header className="bg-gradient-to-r from-[#2E1029] to-[#4A1D46] text-white py-4 px-8 flex justify-between items-center shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-3">
           <button onClick={() => router.push('/admin/dashboard')} className="text-xl hover:bg-white/10 p-2 rounded-full transition">←</button>
           <h1 className="text-xl font-bold tracking-wider text-[#F3E5F5] uppercase">Customer List</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* TOP CONTROL BAR */}
        <div className="bg-[#4A1D46]/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl border border-white/20 mb-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-3xl font-serif text-white tracking-wide">Registered Users</h2>
                <p className="text-sm text-[#D883B7] mt-1 font-medium">Manage your growing customer base.</p>
            </div>
            
            <div className="relative w-full md:w-72">
                <span className="absolute left-4 top-3 text-[#4A1D46]">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search name, email, phone..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-full bg-[#F3E5F5] text-[#2E1029] font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#D883B7] shadow-inner placeholder-[#4A1D46]/50"
                />
            </div>
        </div>

        {/* CUSTOMER TABLE */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] shadow-xl overflow-hidden border border-white/60">
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead>
                      <tr className="bg-gradient-to-r from-[#880e4f] to-[#ad1457] text-white text-xs uppercase tracking-widest">
                          <th className="p-5 font-bold">ID</th>
                          <th className="p-5 font-bold">Name</th>
                          <th className="p-5 font-bold">Email</th>
                          <th className="p-5 font-bold">Phone</th>
                          <th className="p-5 font-bold">Joined Date</th>
                          <th className="p-5 text-center font-bold">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-pink-100/50">
                      {filteredCustomers.length === 0 ? (
                          <tr>
                              <td colSpan={6} className="p-10 text-center text-[#7B2C62] italic opacity-70">
                                  No customers found.
                              </td>
                          </tr>
                      ) : (
                          filteredCustomers.map((customer, index) => (
                              <tr key={index} className="hover:bg-pink-50/50 transition-colors group">
                                  <td className="p-5 font-bold text-[#ad1457]">{customer.customer_id || '-'}</td>
                                  <td className="p-5 font-bold text-[#4A1D46]">{customer.name || 'Profile Pending'}</td>
                                  <td className="p-5 text-gray-500 text-sm">{customer.email}</td>
                                  <td className="p-5 text-gray-500 text-sm font-mono">{customer.phone || '-'}</td>
                                  <td className="p-5 text-sm text-[#7B2C62] font-medium">
                                      {customer.joined_date ? new Date(customer.joined_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                  </td>
                                  <td className="p-5 text-center">
                                      <button 
                                        onClick={() => setSelectedCustomer(customer)} 
                                        className="px-5 py-2 border border-pink-200 text-[#880e4f] rounded-full text-xs font-bold hover:bg-[#fce4ec] hover:border-[#f8bbd0] transition-all shadow-sm whitespace-nowrap"
                                      >
                                          More Details
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
        </div>
      </main>

      {/* --- EXPANDED CUSTOMER DETAILS MODAL --- */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full relative animate-scale-up border border-white/60 max-h-[90vh] flex flex-col">
                
                <button onClick={() => setSelectedCustomer(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 font-bold text-2xl transition">✕</button>
                
                <div className="flex flex-col items-center text-center mb-6 shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-tr from-[#D883B7] to-[#9B5DE5] rounded-full flex items-center justify-center text-3xl text-white shadow-lg mb-3 border-4 border-pink-50">
                        {selectedCustomer.name ? selectedCustomer.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#4A1D46]">{selectedCustomer.name || 'User'}</h2>
                    <p className="text-xs font-bold text-[#D883B7] uppercase tracking-widest mt-1">Customer Profile</p>
                </div>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="overflow-y-auto pr-2 pb-2 space-y-6 flex-grow custom-scrollbar">
                    
                    {/* Contact Info */}
                    <div className="bg-pink-50/50 p-5 rounded-2xl border border-pink-100 space-y-3">
                        <div className="flex justify-between items-center border-b border-pink-100/50 pb-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email</span>
                            <span className="text-gray-700 font-medium text-sm">{selectedCustomer.email}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-pink-100/50 pb-2">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone</span>
                            <span className="text-gray-700 font-medium text-sm">{selectedCustomer.phone || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Joined</span>
                            <span className="text-gray-700 font-medium text-sm">
                                {selectedCustomer.joined_date ? new Date(selectedCustomer.joined_date).toLocaleDateString() : 'Unknown'}
                            </span>
                        </div>
                    </div>

                    {/* Order History */}
                    <div>
                        <h3 className="text-lg font-serif font-bold text-[#4A1D46] mb-3 flex items-center gap-2">
                            🛍️ Order History 
                            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{selectedCustomer.orders?.length || 0}</span>
                        </h3>
                        
                        <div className="space-y-3">
                            {selectedCustomer.orders && selectedCustomer.orders.length > 0 ? (
                                selectedCustomer.orders.map((order: any) => (
                                    <div key={order.orderid} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center hover:border-pink-300 transition-colors">
                                        <div>
                                            <p className="font-bold text-[#880e4f] text-sm">#{order.orderid}</p>
                                            <p className="text-xs text-gray-400">{new Date(order.orderdate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[#4A1D46] text-sm mb-1">LKR {parseFloat(order.totalamount).toLocaleString()}</p>
                                            <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                                                order.status === 'Pending' ? 'bg-orange-100 text-orange-600' :
                                                order.status === 'Processing' ? 'bg-blue-100 text-blue-600' :
                                                order.status === 'Delivered' ? 'bg-green-100 text-green-600' :
                                                'bg-red-100 text-red-600'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400 text-sm italic">
                                    No past orders found.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <button 
                  onClick={() => setSelectedCustomer(null)}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-[#880e4f] to-[#ad1457] text-white rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all shrink-0"
                >
                  Close Profile
                </button>
            </div>
        </div>
      )}

    </div>
  );
}