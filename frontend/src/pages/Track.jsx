import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logomain.avif";
import headerImg from "../assets/header.png";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

export default function Track() {
  const [utrn, setUtrn] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleTrack(e) {
    e.preventDefault();
    setError("");
    if (!utrn.trim()) {
      setError("Please enter your UTRN.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/form/${utrn.trim()}`);
      if (!res.ok) {
        setError("No record found for this UTRN. Please check and try again.");
        setLoading(false);
        return;
      }
      navigate(`/form/${utrn.trim()}`);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <img src={headerImg} alt="Header" className="w-full object-cover" />
      </div>
      <div className="w-full max-w-md mt-10 bg-white border border-gray-200 rounded-xl shadow p-8">
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-14 object-contain" />
        </div>
        <h1 className="text-center text-lg font-bold uppercase tracking-widest text-black mb-1">
          Track Your Application
        </h1>
        <p className="text-center text-xs text-gray-500 mb-6">
          Enter your UTRN to view your form status
        </p>
        <form onSubmit={handleTrack} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter UTRN"
            value={utrn}
            onChange={(e) => setUtrn(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          {error && (
            <p className="text-xs text-red-600 font-semibold">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white font-bold text-sm py-3 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Searching..." : "Track"}
          </button>
        </form>
      </div>
    </div>
  );
}
