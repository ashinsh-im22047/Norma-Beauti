"use client";
import CustomerHeader from '@/components/CustomerHeader';

export default function CartPage() {
  return (
    <div className="min-h-screen bg-[#F3E6EF] text-[#483D58]">
       {/* ✅ Uniform Header */}
      <CustomerHeader />
      
      <main className="container mx-auto px-6 py-10">
        <h1 className="text-3xl font-serif font-bold mb-6">Your Cart</h1>
        {/* Your cart content here... */}
      </main>
    </div>
  );
}