import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { getSummaryById } from '../services/database';
import { getCurrentUser } from '../services/auth';
import CategoryDial from '../components/CategoryDial';
import SpendPie from '../components/SpendPie';
import LogoutButton from '../components/LogoutButton';
import capitalYouLogo from '../assets/CapitalYou_logo.png';

function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummary();
  }, [id]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verify user is authenticated
      const user = await getCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch the summary
      const data = await getSummaryById(id);
      
      if (!data) {
        setError('Report not found');
        return;
      }

      // Verify ownership (RLS should handle this, but double-check)
      if (data.user_id !== user.id) {
        setError('You do not have access to this report');
        return;
      }

      setSummary(data);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={capitalYouLogo} 
                alt="CapitalYou" 
                className="h-16 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#004977] transition-all group mb-8"
        >
          <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Dashboard</span>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-[#004977] mx-auto mb-4" />
              <p className="text-gray-600">Loading report...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-800 mb-2">{error}</h3>
              <button
                onClick={() => navigate('/manage')}
                className="mt-4 px-6 py-3 bg-[#004977] hover:bg-[#003557] text-white rounded-lg font-semibold transition-colors"
              >
                Go to Uploads
              </button>
            </div>
          )}

          {/* Report Content */}
          {!loading && !error && summary && (
            <>
              {/* Report Header */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-[#004977] mb-2">
                      {summary.title || 'Spending Summary'}
                    </h1>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Uploaded: {formatDate(summary.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#004977] to-[#003557] text-white rounded-xl p-6 text-center">
                    <p className="text-sm font-medium mb-1">Total Spent</p>
                    <p className="text-3xl font-bold">
                      ${parseFloat(summary.total_spent || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Spending Visualization */}
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-6">
                <h2 className="text-2xl font-bold text-[#004977] mb-6">
                  Spending Breakdown
                </h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                      Category Distribution
                    </h3>
                    <SpendPie categories={summary.categories} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                      Category Details
                    </h3>
                    <div className="space-y-3">
                      {summary.categories.map((category, index) => (
                        <div 
                          key={index}
                          className="border border-gray-200 rounded-lg p-4 hover:border-[#004977] transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-gray-800">
                              {category.category}
                            </span>
                            <span className="text-[#004977] font-bold">
                              ${parseFloat(category.total_spent || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span>{category.percentage_of_spend?.toFixed(1)}% of total</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards Preview removed per request */}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ReportPage;
