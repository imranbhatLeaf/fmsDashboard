import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import headerImg from '../assets/header.png';
import logo from '../assets/logomain.avif';
import asssrLogo from '../assets/asssrFav.avif';

const SERVICES = [
  {
    key: 'honorarium',
    title: 'Honorarium',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    description: 'Payments for experts, resource persons, and guest lecturers for academic programmes.',
    tds: '10% TDS applicable',
  },
  {
    key: 'tada',
    title: 'Travel Allowance / Daily Allowance',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    description: 'Reimbursement of travel and daily expenses for official duty, workshops, and seminars.',
    tds: 'No TDS deduction',
  },
  {
    key: 'fellowship',
    title: 'Fellowship',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
      </svg>
    ),
    description: 'Monthly fellowship disbursements for research scholars and academic fellows.',
    tds: '10% TDS applicable',
  },
  {
    key: 'salary',
    title: 'Salary',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
      </svg>
    ),
    description: 'Processing of monthly salary payments for contracted staff and employees.',
    tds: '10% TDS applicable',
  },
  {
    key: 'refund',
    title: 'Refund',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
      </svg>
    ),
    description: 'Reimbursement for approved expenditures with payment receipts and supporting documents.',
    tds: 'No TDS deduction',
  },
];

const COMPONENTS = ['ASSSR', 'VMI', 'DHC', 'JASSSR'];

export default function Home() {
  const navigate = useNavigate();
  const servicesRef = useRef(null);

  return (
    <div className="min-h-screen bg-white text-black font-sans">

      {/* Navbar */}
      <nav className="bg-white border-b border-black/10 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="AFMS" className="h-8 w-8 object-contain" />
            <img src={asssrLogo} alt="ASSSR" className="h-8 w-8 object-contain" />
            <span className="font-semibold text-sm text-black hidden sm:block">AFMS Financial Portal</span>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-bold px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800 transition-colors tracking-wide"
          >
            Staff Login
          </button>
        </div>
      </nav>

      {/* Header image */}
      <div className="border-b border-black/10 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-center">
          <img src={headerImg} alt="AFMS Header" className="w-full max-h-24 object-contain" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">

        {/* Hero */}
        <div className="py-20 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-black/30 mb-4">
            Armed Forces Medical Services
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-black mb-4 leading-tight tracking-tight">
            Financial Management Portal
          </h1>
          <p className="text-black/50 text-sm max-w-lg mx-auto mb-10 leading-relaxed">
            A unified platform for processing honoraria, allowances, fellowships, salary, and refunds across AFMS components.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 rounded-md bg-black text-white font-bold text-sm hover:bg-gray-800 transition-colors"
            >
              Login to Portal
            </button>
            <button
              onClick={() => servicesRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 rounded-md border border-black/20 text-black/60 font-semibold text-sm hover:border-black hover:text-black transition-colors"
            >
              View Services ↓
            </button>
          </div>
        </div>

        {/* Divider with component names */}
        <div className="flex items-center gap-4 mb-16">
          <div className="flex-1 h-px bg-black/10" />
          <div className="flex gap-3">
            {COMPONENTS.map(c => (
              <span key={c} className="text-[10px] font-bold tracking-widest text-black/40 uppercase">{c}</span>
            ))}
          </div>
          <div className="flex-1 h-px bg-black/10" />
        </div>

        {/* Services */}
        <div ref={servicesRef} className="pb-20">
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30 mb-1">What we process</p>
            <h2 className="text-xl font-bold text-black">Payment Categories</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((svc, i) => (
              <div
                key={svc.key}
                className="group border border-black/10 rounded-xl p-5 hover:border-black transition-all duration-200 bg-white flex flex-col gap-4"
              >
                {/* Number + icon */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-black/20 tracking-widest">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-8 h-8 rounded-md border border-black/10 flex items-center justify-center text-black/50 group-hover:text-black group-hover:border-black/30 transition-colors">
                    {svc.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-bold text-black text-sm mb-2">{svc.title}</h3>
                  <p className="text-black/50 text-xs leading-relaxed">{svc.description}</p>
                </div>

                {/* TDS tag */}
                <div className="pt-3 border-t border-black/8" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
                    svc.tds.startsWith('No')
                      ? 'bg-black/5 text-black/40'
                      : 'bg-black text-white'
                  }`}>
                    {svc.tds}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mb-20 border border-black rounded-xl px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-black/30 mb-2">For Authorised Staff Only</p>
            <h3 className="text-black text-lg font-bold mb-1">Access the Admin or Registrar Dashboard</h3>
            <p className="text-black/40 text-sm">Upload records, approve claims, and process payments securely.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="shrink-0 px-7 py-3 rounded-md bg-black text-white font-bold text-sm hover:bg-gray-800 transition-colors"
          >
            Staff Login →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-black/10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-black/30">
          <span>© {new Date().getFullYear()} Armed Forces Medical Services. All rights reserved.</span>
          <span>Financial Management Portal · Restricted Access</span>
        </div>
      </footer>
    </div>
  );
}