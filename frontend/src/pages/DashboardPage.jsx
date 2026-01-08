import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, TestTube, Database, ChevronLeft, Upload, ArrowRight, ChevronDown, Settings } from 'lucide-react';
import CategoryDial from '../components/CategoryDial';
import LogoutButton from '../components/LogoutButton';
import SettingsMenu from '../components/SettingsMenu';
import SpendPie from '../components/SpendPie';
import { getCurrentMonthSummary, getAggregatedSummary, getMonthlySpendingData, deleteAllSummaries } from '../services/database';
import { getCurrentUser, deleteUserAccount } from '../services/auth';
import capitalYouLogo from '../assets/CapitalYou_logo.png';
import virtualCard from '../assets/virtual-card.png';

// Demo user UID for Capital One login
const DEMO_USER_UID = 'bf75c74b-e9ae-490c-9fe8-14a1313cda4e';

// Sample test data (used for demo user)
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

const HISTOGRAM_COLORS = ['#0ea5e9','#14b8a6','#2563eb','#c084fc','#fb7185','#f59e0b','#10b981','#22d3ee','#f97316','#a855f7'];

const computeMultipliers = (categories = []) => {
  if (!categories || categories.length === 0) {
    return [];
  }

  const normalized = categories.map((entry) => ({
    ...entry,
    percentage_of_spend: Number(entry.percentage_of_spend) || 0,
  }));

  const maxPercentage = Math.max(...normalized.map((entry) => entry.percentage_of_spend), 0);
  if (maxPercentage === 0) {
    return normalized.map((entry) => ({
      ...entry,
      points_multiplier: 1,
    }));
  }

  return normalized.map((entry) => ({
    ...entry,
    points_multiplier: Math.max(1, Math.round((5 * (entry.percentage_of_spend / maxPercentage)) * 10) / 10),
  }));
};

const SegmentedHistogram = ({ months }) => {
  const [hoverInfo, setHoverInfo] = useState(null);
  if (!months || months.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
      <div className="relative mb-4 min-h-[24px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            key={hoverInfo ? hoverInfo.category : 'default'}
            className="bg-white/90 border border-slate-200 rounded-full px-4 py-2 shadow-lg text-center text-sm text-slate-600 backdrop-blur"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            {hoverInfo ? (
              <>
                <p className="font-semibold text-slate-900">{hoverInfo.category}</p>
                <p className="text-xs text-slate-500">
                  {hoverInfo.percentage.toFixed(1)}% • ${hoverInfo.amount?.toFixed(2) ?? '0.00'}
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold text-slate-600">Hover to explore</p>
            )}
          </motion.div>
        </div>
      </div>
      <div className="space-y-5">
        {months.map((month) => (
          <div key={month.monthKey} className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{month.monthName} {month.year}</span>
              <span>${month.total_spent.toFixed(2)}</span>
            </div>
            <div className="h-10 rounded-full overflow-hidden bg-slate-100 flex">
              {month.categories.map((category, index) => {
                const width = Math.max(0, Math.min(100, category.percentage_of_spend || 0));
                if (width === 0) return null;
                return (
                  <motion.div
                    key={`${month.monthKey}-${category.category}`}
                    className="h-full"
                    style={{
                      width: `${width}%`,
                      backgroundColor: HISTOGRAM_COLORS[index % HISTOGRAM_COLORS.length],
                    }}
                    onMouseEnter={() =>
                      setHoverInfo({
                        category: category.category,
                        percentage: category.percentage_of_spend || 0,
                        amount: category.total_spent || 0,
                      })
                    }
                    onMouseLeave={() => setHoverInfo(null)}
                    title={`${category.category}: ${category.percentage_of_spend?.toFixed(1) ?? '0.0'}%`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.03 }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Reusable Header Component
const Header = ({ testMode, setTestMode, showToggle = true, onDeleteAccount, isDemoUser = false }) => (
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
          {!isDemoUser && (
            <Link
              to="/upload"
              className="flex items-center gap-2 px-4 py-2 bg-[#D03027] hover:bg-[#B02820] text-white rounded-full font-medium text-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload Data</span>
            </Link>
          )}
          
          <SettingsMenu onDeleteAccount={onDeleteAccount} />
          
          {/* Removed API/Test mode toggle button */}
        </div>
      </motion.div>
    </div>
  </header>
);

function DashboardPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [allTimeData, setAllTimeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  const [showMonthlyDetails, setShowMonthlyDetails] = useState(false);

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // Delete all user summaries first
      await deleteAllSummaries(user.id);
      
      // Delete the user account
      await deleteUserAccount();
      
      // Navigate to landing page after successful deletion
      navigate('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert('Failed to delete account. Please try again or contact support.');
    }
  };
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const categoriesToShow = useMemo(() => {
    if (!data || !data.categories) {
      return [];
    }
    return computeMultipliers(data.categories);
  }, [data]);

  useEffect(() => {
    const fetchData = async () => {
      if (testMode) {
        setLoading(false);
        setError(null);
        setData(TEST_DATA);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Get current user and fetch current month summary
        const user = await getCurrentUser();
        if (!user) {
          setError('Please log in to view your dashboard');
          return;
        }
        
        // Check if this is the demo user (hide upload/manage buttons but still fetch real data)
        setIsDemoUser(user.id === DEMO_USER_UID);
        
        const currentMonthData = await getCurrentMonthSummary(user.id);
        const aggregatedData = await getAggregatedSummary(user.id);
        const monthly = await getMonthlySpendingData(user.id);
        setData(currentMonthData);
        setAllTimeData(aggregatedData);
        setMonthlyData(monthly);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [testMode]);

  if (loading && !testMode) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <Header testMode={testMode} setTestMode={setTestMode} onDeleteAccount={handleDeleteAccount} isDemoUser={isDemoUser} />
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
        <Header testMode={testMode} setTestMode={setTestMode} onDeleteAccount={handleDeleteAccount} isDemoUser={isDemoUser} />
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
        <Header testMode={testMode} setTestMode={setTestMode} onDeleteAccount={handleDeleteAccount} isDemoUser={isDemoUser} />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md mx-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-[#004977] mb-2">No Data Uploaded</h2>
            <p className="text-gray-600 mb-6">
              Upload your transaction data to see personalized spending insights and rewards.
            </p>
            {!isDemoUser && (
              <div className="flex flex-col gap-3">
                <Link
                  to="/upload"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#D03027] hover:bg-[#B02820] text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  <Upload className="w-5 h-5" />
                  Upload Data
                </Link>
                <Link
                  to="/manage"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-[#004977] border-2 border-[#004977] rounded-full font-semibold transition-all"
                >
                  Manage Uploads
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header testMode={testMode} setTestMode={setTestMode} onDeleteAccount={handleDeleteAccount} isDemoUser={isDemoUser} />

      {/* Combined Dashboard Header with Card */}
      <div className="bg-gradient-to-br from-[#004977] to-[#003557] text-white py-8 md:py-12">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8"
          >
            {/* Left side - Dashboard info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Your Spending Dashboard
              </h1>
              <p className="text-white/70 mb-6">
                See your top spending categories and how you're earning rewards.
              </p>
              
              {data.total_spent && (
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <div>
                    <p className="text-white/60 text-sm font-medium uppercase tracking-wide">Total Spent This Month</p>
                    <p className="text-5xl md:text-6xl font-bold mt-1">
                      ${data.total_spent.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-2 rounded-full border border-white/20">
                    <span className="font-medium text-sm">Earning rewards on {categoriesToShow.length} categories</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Right side - Virtual Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-shrink-0 hidden md:block"
            >
              <img 
                src={virtualCard} 
                alt="CapitalYou Card" 
                className="w-80 lg:w-96 drop-shadow-2xl"
              />
            </motion.div>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8"
        >
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#004977]">Spending Overview</h2>
              <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>
            {!isDemoUser && (
              <Link
                to="/manage"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 text-[#004977] border-2 border-[#004977] rounded-full font-semibold transition-all whitespace-nowrap"
              >
                Manage Uploads
              </Link>
            )}
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Pie Chart - Left Side */}
            <div className="flex-shrink-0">
              <SpendPie categories={categoriesToShow} />
            </div>
            
            {/* Bonus Categories List - Right Side */}
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-[#004977] mb-4">
                Bonus Rewards Categories
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Categories earning more than 1x points. Points are based on your spending this month.
              </p>
              <div className="space-y-3">
                {categoriesToShow
                  .filter(cat => (cat.points_multiplier || cat.pointsMultiplier || 1) > 1)
                  .sort((a, b) => (b.points_multiplier || b.pointsMultiplier || 1) - (a.points_multiplier || a.pointsMultiplier || 1))
                  .map((category, index) => {
                    const multiplier = category.points_multiplier || category.pointsMultiplier || 1;
                    return (
                      <motion.div
                        key={category.category}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ 
                              backgroundColor: ['#0ea5e9', '#14b8a6', '#2563eb', '#c084fc', '#fb7185', '#f59e0b', '#10b981', '#22d3ee', '#f97316', '#a855f7'][
                                categoriesToShow.findIndex(c => c.category === category.category) % 10
                              ] 
                            }}
                          />
                          <span className="font-medium text-gray-800">{category.category}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-500 text-sm">
                            ${category.total_spent?.toFixed(2) || '—'}
                          </span>
                          <span className="bg-[#D03027] text-white text-sm font-bold px-3 py-1 rounded-full">
                            {multiplier}x
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                {categoriesToShow.filter(cat => (cat.points_multiplier || cat.pointsMultiplier || 1) > 1).length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    No bonus categories yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {monthlyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#004977]">Monthly Category Mix</h2>
                <p className="text-sm text-gray-500 mt-1">Each bar represents the percent of monthly spend per category.</p>
              </div>
              <button
                type="button"
                aria-label="Toggle monthly detail breakdown"
                onClick={() => setShowMonthlyDetails((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  {showMonthlyDetails ? 'Hide' : 'Show'}
                </span>
                <ChevronDown
                  className="w-5 h-5 text-[#004977] transition-transform duration-200"
                  style={{ transform: showMonthlyDetails ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
            </div>
            {showMonthlyDetails && <SegmentedHistogram months={monthlyData} />}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-[#004977]">Lifetime Spending</h2>
            <p className="text-sm text-gray-500 mt-1">All-time spending across all statements since the opening of your card.</p>
          </div>
          <button
            type="button"
            aria-label="Toggle detailed breakdown"
            onClick={() => setShowCategoryGrid((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white shadow-sm hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700">
              {showCategoryGrid ? 'Hide' : 'Show'}
            </span>
            <ChevronDown
              className="w-5 h-5 text-[#004977] transition-transform duration-200"
              style={{ transform: showCategoryGrid ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
        </motion.div>

        {showCategoryGrid && allTimeData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {allTimeData.categories.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
              >
                <CategoryDial
                  category={category.category}
                  percentage={category.percentage_of_spend || category.percentage}
                  totalSpent={category.total_spent}
                  rank={index + 1}
                />
              </motion.div>
            ))}
          </div>
        )}
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
