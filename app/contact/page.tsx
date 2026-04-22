// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client";

import React, { useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState({ 
    show: false, title: '', message: '', type: 'success' 
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeAlert = () => {
      setAlertState({ ...alertState, show: false });
      if (alertState.type === 'success') {
          router.push('/shop'); // Redirect to shop or home after success
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setAlertState({ show: true, title: 'Missing Info', message: 'Please fill out all fields before sending.', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setAlertState({ 
            show: true, 
            title: 'Message Sent!', 
            message: 'Thank you for reaching out to Norma Beauti. We will get back to you to your email as soon as possible!', 
            type: 'success' 
        });
        setFormData({ name: '', email: '', subject: '', message: '' }); // Reset form
      } else {
        throw new Error(data.error || 'Something went wrong');
      }
    } catch (err: any) {
      setAlertState({ show: true, title: 'Error', message: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <CustomerHeader /> 

      {/* Clean, Modern Header - Reduced padding to save vertical space */}
      <header className="relative pt-20 pb-24 px-4 text-center bg-gradient-to-br from-white via-[#fffafa] to-[#ffe8e6] border-b border-slate-200 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[#fff5f4] to-transparent rounded-tr-full pointer-events-none opacity-70"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">Get in Touch</h2>
          <p className="text-[#ff8a80] text-sm font-bold tracking-widest uppercase">We'd love to hear from you</p>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 relative z-20 -mt-14 mb-12 flex-grow">
        {/* Reduced overall card padding from p-12 to p-8 */}
        <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-[2rem] shadow-lg border border-slate-200">
            
            {/* Reduced margin and icon size */}
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-[#FFAFA8] shadow-inner">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Send us a Message</h3>
                <p className="text-slate-500 text-sm mt-2 font-medium leading-relaxed max-w-lg mx-auto">Have a question about our products, a custom gift box, or an order? Fill out the form below and our team will contact you shortly.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 ml-1">Your Name</label>
                        <div className="relative">
                            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {/* Adjusted input height from py-3.5 to py-3 */}
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-6 py-3 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm placeholder-slate-400 text-sm"
                                placeholder="Prabhani Maheeka"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 ml-1">Your Email</label>
                        <div className="relative">
                            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-6 py-3 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm placeholder-slate-400 text-sm"
                                placeholder="Prabhani@example.com"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 ml-1">Subject</label>
                    <div className="relative">
                        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                        <input 
                            type="text" 
                            name="subject" 
                            value={formData.subject} 
                            onChange={handleChange} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-6 py-3 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm placeholder-slate-400 text-sm"
                            placeholder="Question about Custom Boxes..."
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mb-1.5 ml-1">Message</label>
                    <div className="relative">
                        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        {/* Reduced rows from 6 to 4 to save vertical space */}
                        <textarea 
                            name="message" 
                            value={formData.message} 
                            onChange={handleChange} 
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-200 rounded-3xl pl-12 pr-6 py-3 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm resize-none custom-scrollbar placeholder-slate-400 text-sm"
                            placeholder="How can we help you today?"
                            required
                        ></textarea>
                    </div>
                </div>

                <div className="pt-4 text-center border-t border-slate-100">
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className={`w-full md:w-auto px-12 py-3.5 rounded-full font-bold shadow-md tracking-wide transition-all duration-300 flex items-center justify-center gap-2 mx-auto text-sm
                            ${isSubmitting ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white hover:shadow-lg hover:scale-[1.02]'}`}
                    >
                        {isSubmitting ? (
                            <><div className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div> Sending...</>
                        ) : (
                            <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg> Send Message</>
                        )}
                    </button>
                </div>
            </form>
        </div>
      </main>

      {/* --- ALERT MODAL --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 relative transform transition-all scale-100">
              <button onClick={closeAlert} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm" aria-label="Close">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
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
              
              <button onClick={closeAlert} className="px-10 py-3.5 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all w-full tracking-wide">
                OK
              </button>
           </div>
        </div>
      )}
    </div>
  );
}