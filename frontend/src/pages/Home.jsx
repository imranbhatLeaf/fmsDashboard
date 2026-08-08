import React from 'react';
import { useNavigate } from 'react-router-dom';
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

  const handleLoginNavigation = () => {
    navigate('/login');
  };

  const handleTrackNavigation = () => {
    navigate('/track');
  };

  return (
    <div 
      className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between selection:bg-black selection:text-white"
      style={{ fontFamily: 'Tahoma, Geneva, sans-serif' }}
    >
      {/* Header Banner */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-center">
          <img src={headerImg} alt="AFMS Header" className="w-full max-h-24 object-contain" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col lg:flex-row gap-12 items-start">
        {/* Left Side: About */}
        <div className="lg:w-2/3 flex flex-col gap-5">
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900 border-b-2 border-black pb-3 inline-block w-fit">
            Know About AFMS?
          </h1>
          <div className="text-sm lg:text-[14px] leading-relaxed text-gray-700 space-y-4 text-justify">
            <p>
              The Asiatic Society for Social Science Research Financial Management System (AFMS) is a comprehensive web-based financial management platform designed, developed, owned, and implemented by the Office of the Finance Department, Asiatic Society for Social Science Research. The system facilitates efficient and transparent management of public funds across the complete financial lifecycle. The portal is also used for processing and managing payments relating to Salary, Honorarium, Fellowships, TA/DA, and Refunds for the Asiatic Society for Social Science Research and its constituent components.
            </p>
            <p>
              AFMS provides an integrated framework for digital payments, Direct Benefit Transfer (DBT), receipt management, fund-flow monitoring, accounting, reconciliation, financial reporting, and dissemination of financial information. It also facilitates seamless integration with the financial management systems of States, banks, and other external financial and administrative platforms.
            </p>
            <p>
              The system enables end-to-end digital processing of payments and receipts, ensuring greater efficiency, transparency, accountability, and real-time visibility of financial transactions. It supports effective cash and fund management through the “Just-in-Time” transfer of funds, while enabling complete tracking of funds from their release through their eventual credit to the designated beneficiary’s bank account.
            </p>
            <p>
              A key feature of PFMS is the Unified Tracking Reference Number (UTRN), which provides a unique reference for each financial transaction. The UTRN enables users and authorised officials to track the status and movement of payments, verify transaction details, and monitor the progress of a payment from initiation to successful settlement.
            </p>
            <p>
              Through these integrated capabilities, PFMS provides a robust digital infrastructure for financial control, accountability, transparency, and evidence-based financial management, while strengthening the overall efficiency of institutional financial operations.
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="lg:w-1/3 flex flex-col gap-6 w-full lg:sticky lg:top-12 mt-8 lg:mt-0">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col gap-5">
            <h3 className="text-lg font-semibold text-gray-900 text-center uppercase tracking-wide">Quick Actions</h3>
            
            <button
              onClick={handleTrackNavigation}
              className="group relative w-full flex justify-center py-3 px-4 border border-black text-sm font-semibold rounded-md text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-300 uppercase tracking-widest"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                Track Status
              </span>
            </button>

            <button
              onClick={handleLoginNavigation}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-300 uppercase tracking-widest shadow-md hover:shadow-lg"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L6.414 9H17a1 1 0 110 2H6.414l4.293 4.293a1 1 0 01-1.414 1.414l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Portal Login
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Components Grid */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3 uppercase tracking-tight">Constituent Components</h2>
          <div className="w-16 h-1 bg-black mx-auto rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {COMPONENTS.map((comp) => (
            <div
              key={comp.code}
              onClick={handleLoginNavigation}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col h-full"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center justify-center h-10 w-10 rounded bg-gray-100 text-gray-800 font-semibold text-lg border border-gray-200">
                    {comp.code.substring(0,2)}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{comp.code}</h3>
                <p className="text-xs font-medium text-black mb-2">{comp.name}</p>
                <p className="text-[13px] text-gray-600 leading-relaxed">{comp.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-gray-500 py-6 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] font-medium tracking-wider uppercase">
          <span>© {new Date().getFullYear()} AFMS. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            System Online • Restricted Access
          </span>
        </div>
      </footer>
    </div>
  );
}