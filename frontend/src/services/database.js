import { supabase } from './supabase';

/**
 * Saves spending summary to Supabase database
 * @param {string} userId - Supabase auth user ID
 * @param {Object} summaryData - Summary data from backend
 * @param {number} summaryData.total_spent - Total amount spent
 * @param {Array} summaryData.categories - Array of category summaries
 * @param {string} title - Optional title for the upload
 * @returns {Promise<Object>} Inserted record
 */
export const saveSummary = async (userId, summaryData, title = null) => {
  const { data, error } = await supabase
    .from('category_summaries')
    .insert({
      user_id: userId,
      total_spent: summaryData.total_spent,
      categories: summaryData.categories,
      title: title
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Gets a single summary by ID
 * @param {string} summaryId - Summary ID
 * @returns {Promise<Object|null>} Summary or null if not found
 */
export const getSummaryById = async (summaryId) => {
  const { data, error } = await supabase
    .from('category_summaries')
    .select('*')
    .eq('id', summaryId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
};

/**
 * Gets the latest spending summary for a user
 * @param {string} userId - Supabase auth user ID
 * @returns {Promise<Object|null>} Latest summary or null if none exists
 */
export const getLatestSummary = async (userId) => {
  const { data, error } = await supabase
    .from('category_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data;
};

/**
 * Gets all spending summaries for a user
 * @param {string} userId - Supabase auth user ID
 * @returns {Promise<Array>} Array of summaries
 */
export const getAllSummaries = async (userId) => {
  const { data, error } = await supabase
    .from('category_summaries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Gets aggregated spending summary across all user uploads
 * Combines all summaries and totals spending per category
 * @param {string} userId - Supabase auth user ID
 * @returns {Promise<Object>} Aggregated summary with total_spent and categories
 */
export const getAggregatedSummary = async (userId) => {
  const summaries = await getAllSummaries(userId);
  
  if (!summaries || summaries.length === 0) {
    return {
      total_spent: 0,
      categories: []
    };
  }

  // Sum total spent across all summaries
  const totalSpent = summaries.reduce((sum, s) => sum + parseFloat(s.total_spent || 0), 0);

  // Aggregate categories
  const categoryMap = {};
  summaries.forEach(summary => {
    (summary.categories || []).forEach(cat => {
      const categoryName = cat.category;
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          category: categoryName,
          total_spent: 0,
          points_multiplier: cat.points_multiplier || 1
        };
      }
      categoryMap[categoryName].total_spent += parseFloat(cat.total_spent || 0);
    });
  });

  // Convert to array and calculate percentages
  const categories = Object.values(categoryMap).map(cat => ({
    ...cat,
    percentage_of_spend: totalSpent > 0 ? (cat.total_spent / totalSpent) * 100 : 0
  }));

  return {
    total_spent: totalSpent,
    categories: categories.sort((a, b) => b.total_spent - a.total_spent)
  };
};

/**
 * Deletes a spending summary by ID
 * @param {string} summaryId - The ID of the summary to delete
 * @returns {Promise<void>}
 */
export const deleteSummary = async (summaryId) => {
  const { error } = await supabase
    .from('category_summaries')
    .delete()
    .eq('id', summaryId);

  if (error) throw error;
};

/**
 * Deletes all summaries for a user
 * @param {string} userId - Supabase auth user ID
 * @returns {Promise<void>}
 */
export const deleteAllSummaries = async (userId) => {
  const { error } = await supabase
    .from('category_summaries')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Gets summaries for the current month only
 * @param {string} userId - Supabase auth user ID
 * @returns {Promise<Object>} Aggregated summary for current month with total_spent and categories
 */
export const getCurrentMonthSummary = async (userId) => {
  // Get current month/year
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0 = January, 11 = December)
  
  // Create start and end dates for the current month
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
  
  // Fetch summaries created in this month
  const { data: summaries, error } = await supabase
    .from('category_summaries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())
    .lte('created_at', endOfMonth.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  if (!summaries || summaries.length === 0) {
    return {
      total_spent: 0,
      categories: []
    };
  }

  // Sum total spent across all summaries
  const totalSpent = summaries.reduce((sum, s) => sum + parseFloat(s.total_spent || 0), 0);

  // Aggregate categories
  const categoryMap = {};
  summaries.forEach(summary => {
    (summary.categories || []).forEach(cat => {
      const categoryName = cat.category;
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          category: categoryName,
          total_spent: 0,
          points_multiplier: cat.points_multiplier || 1
        };
      }
      categoryMap[categoryName].total_spent += parseFloat(cat.total_spent || 0);
    });
  });

  // Convert to array and calculate percentages
  const categories = Object.values(categoryMap).map(cat => ({
    ...cat,
    percentage_of_spend: totalSpent > 0 ? (cat.total_spent / totalSpent) * 100 : 0
  }));

  return {
    total_spent: totalSpent,
    categories: categories.sort((a, b) => b.total_spent - a.total_spent)
  };
};

/**
 * Gets spending data grouped by month for charting
 * @param {string} userId - Supabase auth user ID
 * @returns {Promise<Array>} Array of monthly summaries with month, year, total_spent, and categories
 */
export const getMonthlySpendingData = async (userId) => {
  const summaries = await getAllSummaries(userId);
  
  if (!summaries || summaries.length === 0) {
    return [];
  }

  // Group summaries by month/year
  const monthlyMap = {};
  
  summaries.forEach(summary => {
    const date = new Date(summary.created_at);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // e.g., "2026-01"
    
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        month: month + 1, // 1-indexed for display (1 = January)
        year: year,
        monthKey: monthKey,
        monthName: date.toLocaleString('default', { month: 'long' }), // "January", "February", etc.
        total_spent: 0,
        categoryMap: {}
      };
    }
    
    // Add to total spent
    monthlyMap[monthKey].total_spent += parseFloat(summary.total_spent || 0);
    
    // Aggregate categories for this month
    (summary.categories || []).forEach(cat => {
      const categoryName = cat.category;
      if (!monthlyMap[monthKey].categoryMap[categoryName]) {
        monthlyMap[monthKey].categoryMap[categoryName] = {
          category: categoryName,
          total_spent: 0,
          points_multiplier: cat.points_multiplier || 1
        };
      }
      monthlyMap[monthKey].categoryMap[categoryName].total_spent += parseFloat(cat.total_spent || 0);
    });
  });

  // Convert to array and format
  const monthlyData = Object.values(monthlyMap).map(monthData => {
    const categories = Object.values(monthData.categoryMap).map(cat => ({
      ...cat,
      percentage_of_spend: monthData.total_spent > 0 
        ? (cat.total_spent / monthData.total_spent) * 100 
        : 0
    }));
    
    return {
      month: monthData.month,
      year: monthData.year,
      monthKey: monthData.monthKey,
      monthName: monthData.monthName,
      total_spent: monthData.total_spent,
      categories: categories.sort((a, b) => b.total_spent - a.total_spent)
    };
  });

  // Sort by date (newest first)
  return monthlyData.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
};
