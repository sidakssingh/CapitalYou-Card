const API_BASE_URL = 'http://localhost:8000';

export const testApi = async () => {
  const response = await fetch(`${API_BASE_URL}/api/test`);
  if (!response.ok) {
    throw new Error('API request failed');
  }
  return response.json();
};

export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error('Health check failed');
  }
  return response.json();
};

export const getSpendingCategories = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}/spending-categories`);
  if (!response.ok) {
    throw new Error('Failed to fetch spending categories');
  }
  return response.json();
};
