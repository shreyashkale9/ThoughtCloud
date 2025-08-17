/**
 * Utility functions for making API requests to the backend.
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000/api';

export const api = {
  /**
   * Make a GET request.
   * @param endpoint API endpoint (e.g., '/notes')
   * @param token JWT token for authentication
   */
  get: async (endpoint: string, token?: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Unauthorized - Please log in');
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  },

  /**
   * Make a POST request.
   * @param endpoint API endpoint
   * @param data Request body
   * @param token JWT token for authentication
   */
  post: async (endpoint: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Unauthorized - Please log in');
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  },

  /**
   * Make a PUT request.
   * @param endpoint API endpoint
   * @param data Request body
   * @param token JWT token for authentication
   */
  put: async (endpoint: string, data: any, token?: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Unauthorized - Please log in');
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  },

  /**
   * Make a DELETE request.
   * @param endpoint API endpoint
   * @param token JWT token for authentication
   */
  delete: async (endpoint: string, token?: string) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Unauthorized - Please log in');
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return res.json();
  },
};
