import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logomain.avif';
import headerImg from '../assets/header.png';

const COMPONENTS = [
  {
    code: 'ASSSR',
    name: 'Asiatic Society for Social Science Research',
    description: 'Access financial services, honorarium payments, and allowances for ASSSR.'
  },
  {
    code: 'VMI',
    name: 'Varāhamihira Multidisciplinary Institute',
    description: 'Manage VMI academic fellowship disbursements, salaries, and travel reimbursements.'
  },
  {
    code: 'DHC',
    name: 'Deccan History Congress',
    description: 'Process honoraria and daily allowances for Deccan History Congress expert panels.'
  },
  {
    code: 'JASSSR',
    name: 'Journal of ASSSR',
    description: 'Submit and track reviewer honoraria, editor salaries, and related refunds.'
  }
];

export default function Home() {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate('/login');
  };

  return (
    <div 
      className="min-h-screen bg-white text-black flex flex-col justify-between selection:bg-black selection:text-white"
      style={{ fontFamily: 'Tahoma, Geneva, sans-serif' }}
    >
      {/* Header Banner */}
      <div className="border-b border-black/10 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-center">
          <img src={headerImg} alt="AFMS Header" className="w-full max-h-24 object-contain" />
        </div>
      </div>

      {/* Login Button Area */}
      <div className="max-w-6xl mx-auto w-full px-6 pt-4 flex justify-end">
        <button
          onClick={handleNavigation}
          className="text-xs uppercase tracking-wider px-4 py-2 border border-black hover:bg-black hover:text-white transition-all duration-300 font-bold"
        >
          Login
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl tracking-tighter uppercase font-bold mb-4">
            AFMS Portal
          </h1>
          <p className="text-xs tracking-widest uppercase text-black/50">
            Select a component to access the system
          </p>
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {COMPONENTS.map((comp) => (
            <div
              key={comp.code}
              onClick={handleNavigation}
              className="group border border-black/10 p-8 cursor-pointer hover:border-black transition-all duration-300 flex flex-col justify-between hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white"
            >
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-2xl tracking-tight uppercase font-bold group-hover:translate-x-1 transition-transform duration-300">
                    {comp.code}
                  </h2>
                  <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    →
                  </span>
                </div>
                <p className="text-sm font-bold tracking-tight mb-2">
                  {comp.name}
                </p>
                <p className="text-xs text-black/50 leading-relaxed">
                  {comp.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] tracking-widest uppercase text-black/40">
          <span>© {new Date().getFullYear()} AFMS. All rights reserved.</span>
          <span>Restricted Access</span>
        </div>
      </footer>
    </div>
  );
}