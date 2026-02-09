"use client";
import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/orders').then(res => res.json()).then(data => {
        if (Array.isArray(data)) setOrders(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#fff0f5]">
      <CustomerHeader />
      <main className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-serif font-bold text-[#880e4f] mb-8 text-center">My Orders</h1>
        <div className="space-y-6 max-w-3xl mx-auto">
            {orders.length === 0 ? <p className="text-center text-gray-500">No orders yet.</p> : orders.map(order => (
                <div key={order.orderid} className="bg-white/80 p-6 rounded-2xl shadow-md border border-white">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-xs font-bold text-gray-400">ORDER #{order.orderid}</span>
                            <p className="text-sm text-gray-500">{new Date(order.orderdate).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-4 py-1 rounded-full text-xs font-bold ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                        }`}>
                            {order.status}
                        </span>
                    </div>

                    {/* DYNAMIC STATUS MESSAGE */}
                    {order.status === 'Delivered' && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-green-800 text-sm font-medium mb-4">
                            🚚 Estimated Arrival: Within 2-5 working days.
                        </div>
                    )}
                    {order.status === 'Rejected' && (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200 text-red-800 text-sm font-medium mb-4">
                            ❌ Order Rejected: {order.rejectreason}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                        <p className="text-sm text-gray-600">Payment: {order.paymentmethod}</p>
                        <p className="text-xl font-bold text-[#880e4f]">LKR {order.totalamount}</p>
                    </div>
                </div>
            ))}
        </div>
      </main>
    </div>
  );
}