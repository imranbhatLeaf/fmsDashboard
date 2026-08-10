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
      {/* Logo Banner */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col items-center text-center gap-4">
          <img src={headerImg} alt="AFMS Header" className="w-full max-h-24 object-contain" />
          <div className="flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Tahoma, Geneva, sans-serif' }}>
              Asiatic Society for Social Science Research
            </h1>
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 mt-2" style={{ fontFamily: 'Tahoma, Geneva, sans-serif' }}>
              Finance Management System (AFMS)
            </h2>
          </div>
        </div>
      </div>

      {/* Nav Bar */}
      <div className="sticky top-0 z-50 bg-gray-100 shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-end">
          <button
            onClick={handleLoginNavigation}
            className="px-6 py-2 bg-black text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors uppercase tracking-wider shadow-sm"
          >
            Login
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col lg:flex-row gap-12 items-stretch">
        {/* Left Side: About */}
        <div className="lg:w-1/2 flex flex-col gap-5">
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
              A key feature of AFMS is the Unified Tracking Reference Number (UTRN), which provides a unique reference for each financial transaction. The UTRN enables users and authorised officials to track the status and movement of payments, verify transaction details, and monitor the progress of a payment from initiation to successful settlement.
            </p>
            <p>
              Through these integrated capabilities, AFMS provides a robust digital infrastructure for financial control, accountability, transparency, and evidence-based financial management, while strengthening the overall efficiency of institutional financial operations.
            </p>
          </div>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="lg:w-1/2 flex flex-col justify-center w-full mt-8 lg:mt-0 h-full">
          <div className="bg-white p-8 py-10 rounded-xl shadow-lg border border-gray-200 flex flex-col justify-center items-center gap-8">
            <h3 className="text-2xl font-bold text-gray-900 text-center uppercase tracking-wider">PAYMENT STATUS</h3>
            
            <div className="text-black opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-28 h-28">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            
            <button
              onClick={handleTrackNavigation}
              className="group relative w-full flex justify-center py-3 px-4 border border-black text-sm font-semibold rounded-md text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-300 uppercase tracking-widest"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.496 2.132a1 1 0 00-.992 0l-7 4A1 1 0 003 8v7a1 1 0 100 2h14a1 1 0 100-2V8a1 1 0 00.5-1.868l-7-4zM6 9a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm3 1a1 1 0 012 0v3a1 1 0 11-2 0v-3zm5-1a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                KNOW YOUR PAYMENTS
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