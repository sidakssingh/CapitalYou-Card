import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard } from 'lucide-react';
import { testApi } from '../services/api';

function LandingPage() {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestApi = async () => {
    setLoading(true);
    try {
      const response = await testApi();
      setApiResponse(response);
    } catch (error) {
      setApiResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 font-sans text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <motion.div 
          className="flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-emerald-400" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">CapitalYou Card</h1>
          </div>
        </motion.div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16 md:py-24">
        <div className="flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-6xl font-bold leading-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300">
              Your Financial Future Starts Here
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              CapitalYou Card helps you take control of your finances with smart spending insights and rewards.
            </p>
            
            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/dashboard/1"
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors text-center"
              >
                View Dashboard
              </Link>
              <button
                onClick={handleTestApi}
                disabled={loading}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Loading...' : 'Test Backend API'}
              </button>
            </div>
              
            {apiResponse && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-slate-800 rounded-lg text-left max-w-md mx-auto"
              >
                <pre className="text-sm text-slate-300 overflow-auto">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
