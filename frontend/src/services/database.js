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
