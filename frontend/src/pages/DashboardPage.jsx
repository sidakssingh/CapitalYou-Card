import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, TestTube, Database, ChevronLeft, Upload } from 'lucide-react';
import CategoryDial from '../components/CategoryDial';
import LogoutButton from '../components/LogoutButton';
import { getSpendingCategories } from '../services/api';
import capitalYouLogo from '../assets/CapitalYou_logo.png';

// Sample test data
const TEST_DATA = {
  "user_id": 1,
  "total_spent": 648.31,
  "categories": [
    {
      "category": "E-Commerce",
      "total_spent": 227.0,
      "percentage_of_spend": 35.0,
      "points_multiplier": 5
    },
    {
      "category": "Fuel",
      "total_spent": 129.6,
      "percentage_of_spend": 20.0,
      "points_multiplier": 4
    },
    {
      "category": "Travel",
      "total_spent": 97.2,
      "percentage_of_spend": 15.0,
      "points_multiplier": 3
    },
    {
      "category": "Fine Dining",
      "total_spent": 32.4,
      "percentage_of_spend": 5.0,
      "points_multiplier": 2
    }
  ]
};

// Reusable Header Component
const Header = ({ testMode, setTestMode, showToggle = true }) => (
  <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
    <div className="container mx-auto px-6 py-2">
      <motion.div 
        className="flex justify-between items-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center">
            <img 
              src={capitalYouLogo} 
              alt="CapitalYou" 
              className="h-16 md:h-20 w-auto"
            />
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-[#D03027] hover:bg-[#B02820] text-white rounded-full font-medium text-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Data</span>
          </Link>
          
          <LogoutButton />
          
          {showToggle && (
            <button
              onClick={() => setTestMode(!testMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                testMode
                  ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={testMode ? 'Switch to API mode' : 'Switch to test mode with sample data'}
            >
              {testMode ? (
                <>
                  <TestTube className="w-4 h-4" />
                  <span className="hidden sm:inline">Test Mode</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span className="hidden sm:inline">API Mode</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  </header>
);

function DashboardPage() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testMode, setTestMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (testMode) {
        setLoading(false);
        setError(null);
        setData(TEST_DATA);
        return;
      }
      // If no userId provided, show no data state
      if (!userId) {
        setLoading(false);
        setError(null);
        setData(null);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await getSpendingCategories(userId);
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, testMode]);

  if (loading && !testMode) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Header testMode={testMode} setTestMode={setTestMode} />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#D03027]" />
            <p className="text-gray-600 font-medium">Loading your spending data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !testMode) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Header testMode={testMode} setTestMode={setTestMode} />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md mx-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-[#D03027]" />
            </div>
            <h2 className="text-xl font-bold text-[#004977] mb-2">Unable to Load Data</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Make sure the backend API is running, or try Test Mode to see sample data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Header testMode={testMode} setTestMode={setTestMode} />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md mx-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-[#004977] mb-2">No Data Uploaded</h2>
            <p className="text-gray-600 mb-6">
              Upload your transaction data to see personalized spending insights and rewards.
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#D03027] hover:bg-[#B02820] text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              <Upload className="w-5 h-5" />
              Upload Data
            </Link>
            {!testMode && (
              <p className="text-sm text-gray-500 mt-4">
                Or switch to Test Mode to see sample data
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  const topCategories = data.categories.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header testMode={testMode} setTestMode={setTestMode} />

      {/* Page Header */}
      <div className="bg-[#004977] text-white py-8">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold">
              Your Spending Dashboard
            </h1>
            <p className="text-gray-300 mt-2">
              See your top spending categories and how you're earning rewards.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Test Mode Banner */}
      {testMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-b border-amber-200"
        >
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center gap-2 text-amber-800">
              <TestTube className="w-5 h-5" />
              <span className="font-medium text-sm">You're viewing sample data in Test Mode</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-10">
        {/* Summary Card */}
        {data.total_spent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">Total Spent This Period</p>
                <p className="text-4xl font-bold text-[#004977] mt-1">
                  ${data.total_spent.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
                <span className="font-semibold">Earning rewards on {topCategories.length} categories</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold text-[#004977]">Top Spending Categories</h2>
          <p className="text-gray-600 mt-1">Your highest spending categories this period, ranked by total amount.</p>
        </motion.div>

        {/* Category Dials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topCategories.map((category, index) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
            >
              <CategoryDial
                category={category.category}
                percentage={category.percentage_of_spend || category.percentage}
                pointsMultiplier={category.points_multiplier || category.pointsMultiplier}
                totalSpent={category.total_spent}
                rank={index + 1}
              />
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 mt-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <img 
              src={capitalYouLogo} 
              alt="CapitalYou" 
              className="h-8 w-auto opacity-50"
            />
            <p className="text-sm text-gray-500">
              Disclaimer: This is a demo application built for the Capital One Tech Summit hackathon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default DashboardPage;
