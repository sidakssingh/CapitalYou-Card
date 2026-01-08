import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import CategoryDial from '../components/CategoryDial';
import { getSpendingCategories } from '../services/api';

function DashboardPage() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Default to user_id 1 if no userId in params
        const id = userId || '1';
        const response = await getSpendingCategories(id);
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 font-sans text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-slate-300">Loading spending data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 font-sans text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto px-6">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <h2 className="text-2xl font-bold text-red-400">Error Loading Data</h2>
          <p className="text-slate-300 text-center">{error}</p>
          <p className="text-sm text-slate-400 text-center">
            Make sure the backend API is running and the endpoint is available.
          </p>
        </div>
      </div>
    );
  }

  if (!data || !data.categories || data.categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 font-sans text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <CreditCard className="w-12 h-12 text-slate-400" />
          <h2 className="text-2xl font-bold text-slate-300">No Spending Data</h2>
          <p className="text-slate-400">No categories found for this user.</p>
        </div>
      </div>
    );
  }

  // Get top 4 categories (or all if less than 4)
  const topCategories = data.categories.slice(0, 4);

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
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
              CapitalYou Card
            </h1>
          </div>
        </motion.div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Whiteboard-style container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="bg-white border-4 border-black rounded-lg p-8 md:p-12 shadow-2xl"
          style={{
            backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0'
          }}
        >
          {/* Title */}
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 text-center">
            Top Spending Categories
          </h2>

          {/* Category Dials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {topCategories.map((category, index) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <CategoryDial
                  category={category.category}
                  percentage={category.percentage_of_spend || category.percentage}
                  pointsMultiplier={category.points_multiplier || category.pointsMultiplier}
                  totalSpent={category.total_spent}
                />
              </motion.div>
            ))}
          </div>

          {/* Total Spent Summary */}
          {data.total_spent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-8 text-center"
            >
              <p className="text-lg text-gray-700">
                <span className="font-semibold">Total Spent: </span>
                <span className="text-2xl font-bold text-gray-900">
                  ${data.total_spent.toFixed(2)}
                </span>
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default DashboardPage;
