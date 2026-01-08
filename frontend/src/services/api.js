const API_BASE_URL = 'http://localhost:8000';

/**
 * Tests the backend API connection by calling a test endpoint.
 * 
 * @returns {Promise<Object>} Response containing success status and test data
 * @throws {Error} If the API request fails
 */
export const testApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/test`);
  if (!response.ok) {
    throw new Error('API request failed');
  }
  return response.json();
};

/**
 * Checks if the backend server is running and healthy.
 * 
 * @returns {Promise<Object>} Response containing health status and message
 * @throws {Error} If the health check fails
 */
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
};

/**
 * Retrieves spending categories for a specific user, including total spent,
 * percentage of spend, and points multipliers for each category.
 * 
 * @param {number|string} userId - The ID of the user whose spending data to fetch
 * @returns {Promise<Object>} User spending data with categories, totals, and percentages
 * @throws {Error} If the request fails or user is not found
 */
export const getSpendingCategories = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/spending-categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch spending categories');
  }
  return response.json();
};

/**
 * Uploads a CSV file containing transaction data to the backend for processing.
 * The CSV must include 'merchant' and 'amount' columns at minimum.
 * 
 * @param {File} file - CSV file containing transaction data
 * @returns {Promise<Object>} Upload result with success status, rows processed, and columns found
 *          Expected Format:
 *        {
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
              ...
            ]
          };
 * @throws {Error} If upload fails, file is invalid, or required columns are missing
 */
export const uploadTransactions = async (file) => {
  console.log('Uploading CSV file to backend');
  
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/api/transactions/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.log('Upload failed with status:', response.status);
    throw new Error(errorData.detail || 'Failed to upload transactions');
  }
  
  const data = await response.json();
  console.log('Upload response:', data);
  return data;
};
