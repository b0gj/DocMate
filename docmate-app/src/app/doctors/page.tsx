"use client";

import { useEffect, useState } from 'react';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // When the page loads, fetch data from our own Next.js API!
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const response = await fetch('/api/doctors');
        const result = await response.json();
        
        if (result.success) {
          setDoctors(result.data);
        } else {
          setError(result.error);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDoctors();
  }, []);

  async function seedDatabase() {
    try {
      setLoading(true);
      const demoDoctors = [
        { name: "Dr. Gregory House", specialty: "Diagnostician", city: "Princeton", price: 250 },
        { name: "Dr. Meredith Grey", specialty: "General Surgery", city: "Seattle", price: 200 },
        { name: "Dr. Stephen Strange", specialty: "Neurosurgery", city: "New York", price: 500 },
        { name: "Dr. John Watson", specialty: "General Practice", city: "London", price: 150 },
      ];
      
      for (const doc of demoDoctors) {
        await fetch('/api/doctors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc)
        });
      }
      
      // Refetch after seeding
      const response = await fetch('/api/doctors');
      const result = await response.json();
      if (result.success) {
        setDoctors(result.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 text-gray-900 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b pb-4">
          <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight">Find Your Doctor</h1>
          <p className="text-gray-500 font-medium">DocMate Platform</p>
        </div>

        {/* seed */}
        {!loading && !error && doctors.length === 0 && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={seedDatabase}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all hover:-translate-y-1"
            >
              🌱 Seed Demo Doctors
            </button>
          </div>
        )}
        {/*  */}
        
        {loading && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
            <div className="flex items-start">
              <div className="ml-3">
                <h3 className="text-red-800 font-bold">Database Connection Error</h3>
                <div className="mt-2 text-red-700 text-sm">
                  <p>{error}</p>
                  <p className="mt-2 font-medium">Did you configure your MongoDB connection?</p>
                  <ol className="list-decimal ml-5 mt-1">
                    <li>Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file in your project root.</li>
                    <li>Add your connection string: <code className="bg-red-100 px-1 rounded">MONGODB_URI="mongodb+srv://..."</code></li>
                    <li>Install Mongoose: <code className="bg-red-100 px-1 rounded">npm install mongoose</code></li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && doctors.length === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="text-blue-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Connected Successfully!</h3>
            <p className="text-gray-600 mb-6">Database connection is working, but no doctors exist in your collection yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {doctors.map((doc: any) => (
            <div key={doc._id} className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{doc.name}</h2>
                  <p className="text-blue-600 font-medium">{doc.specialty}</p>
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{doc.city}</span>
              </div>
              <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
                <span className="text-sm text-gray-500">Consultation Fee</span>
                <span className="font-bold text-lg text-gray-900">${doc.price} <span className="text-sm font-normal text-gray-500">/ hr</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
