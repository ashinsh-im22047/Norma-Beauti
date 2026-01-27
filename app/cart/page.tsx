"use client";
import CustomerHeader from '@/components/CustomerHeader';

export default function CartPage() {
  return (
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient (Matching Profile Page)
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46]">
      
      <CustomerHeader />
      
      {/* Decorative Background Glows */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="container mx-auto px-6 py-12 relative z-10 flex justify-center">
        
        {/* Glassmorphism Cart Container */}
        <div className="w-full max-w-5xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            
            <h1 className="text-3xl font-serif font-bold text-[#4A1D46] mb-8 border-b border-[#D883B7]/30 pb-4">
                Your Cart
            </h1>
            
            {/* Your cart content here... */}
            <div className="text-center py-10 opacity-70">
                <p className="text-[#7B2C62] italic">Cart items will appear here.</p>
            </div>

        </div>
      </main>
    </div>
  );
}