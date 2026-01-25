'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminName, setAdminName] = useState('Admin');

  // Simple check to ensure only admins are here
  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (role !== 'ADMIN') {
      // If not admin, kick them out
      router.push('/login');
    }
    
    // Get name for greeting
    const email = localStorage.getItem('userEmail');
    if (email) {
      const name = email.split('@')[0];
      setAdminName(name.charAt(0).toUpperCase() + name.slice(1));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // Dashboard Menu Items
  const menuItems = [
    { 
      title: "Manage Inventory", 
      desc: "Products, Ready-made & Custom Boxes.", 
      icon: "📦", 
      path: "/admin/inventory" 
    },
    { 
      title: "Manage Orders", 
      desc: "View and process pending customer orders.", 
      icon: "🚚", 
      path: "/admin/orders",
      badge: "2 New" 
    },
    { 
      title: "Manage Offers", 
      desc: "Create discount codes, sale banners, and promos.", 
      icon: "🏷️", 
      path: "/admin/offers" 
    },
    { 
      title: "Notifications", 
      desc: "Check system alerts and stock warnings.", 
      icon: "🔔", 
      path: "/admin/notifications",
      badge: "3" 
    },
    { 
      title: "Sales Reports", 
      desc: "View monthly earnings and analytics.", 
      icon: "📊", 
      path: "/admin/reports" 
    },
    { 
      title: "Customer List", 
      desc: "View registered users and history.", 
      icon: "👥", 
      path: "/admin/customers" 
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F3E6FA] to-[#E6D5EB] font-sans">
      
      {/* --- TOP NAVIGATION BAR --- */}
      <nav className="bg-[#134B5F] text-white px-8 py-4 flex justify-between items-center shadow-lg">
        
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white">
             <Image src="/logo.jpeg" alt="Logo" width={40} height={40} className="object-cover" />
           </div>
           <span className="text-xl font-bold tracking-widest uppercase">Admin Panel</span>
        </div>

        {/* Right: User & Logout */}
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium opacity-90">Hello, {adminName}</span>
          <button 
            onClick={handleLogout}
            className="bg-[#EF4444] hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-full transition shadow-md"
          >
            LOGOUT
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <div className="container mx-auto px-8 py-10">
        
        {/* Header Section */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1a1a1a]">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Manage your store, check reports, and update offers.</p>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="bg-[#134B5F] hover:bg-[#0f3c4c] text-white px-5 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition"
          >
            👀 View Live Store
          </button>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {menuItems.map((item, index) => (
            <div 
              key={index}
              onClick={() => item.path && router.push(item.path)}
              className="relative bg-[#9CA3AF] p-6 rounded-2xl shadow-lg hover:shadow-2xl hover:bg-[#8e95a1] transition-all cursor-pointer group h-48 flex flex-col justify-center"
            >
              {/* Badge */}
              {item.badge && (
                <div className="absolute top-4 right-4 bg-[#EF4444] text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                  {item.badge}
                </div>
              )}

              {/* Icon */}
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold text-black mb-1">{item.title}</h3>
              <p className="text-gray-800 text-sm leading-tight">{item.desc}</p>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}