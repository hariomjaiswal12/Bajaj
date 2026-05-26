import axios from 'axios';

// Dynamically target the backend API url, falling back to localhost:5000 in dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10s timeout
});

// Response interceptor to normalize error handling across the application
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Standardize error formats for frontend consumption
    const errPayload = {
      message: error.response?.data?.message || 'A network error occurred. Please try again.',
      errors: error.response?.data?.errors || null,
      status: error.response?.status || null
    };
    return Promise.reject(errPayload);
  }
);

export const ticketService = {
  /**
   * Fetch tickets from backend based on filters
   * @param {Object} filters - optional status, priority, breached filters
   */
  getTickets: (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.breached !== undefined && filters.breached !== '') {
      params.append('breached', filters.breached.toString());
    }

    return apiClient.get('/tickets', { params });
  },

  /**
   * Create a new ticket
   * @param {Object} ticketData - subject, description, customerEmail, priority
   */
  createTicket: (ticketData) => {
    return apiClient.post('/tickets', ticketData);
  },

  /**
   * Update a ticket properties (e.g. status transition)
   * @param {string} id - Ticket mongoose ObjectId
   * @param {Object} updateData - properties to update
   */
  updateTicket: (id, updateData) => {
    return apiClient.patch(`/tickets/${id}`, updateData);
  },

  /**
   * Delete a ticket from system
   * @param {string} id - Ticket mongoose ObjectId
   */
  deleteTicket: (id) => {
    return apiClient.delete(`/tickets/${id}`);
  },

  /**
   * Fetch ticket distribution and breach metrics
   */
  getStats: () => {
    return apiClient.get('/tickets/stats');
  }
};

export default ticketService;
