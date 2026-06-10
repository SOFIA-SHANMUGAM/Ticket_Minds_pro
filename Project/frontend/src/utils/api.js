const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // --- Auth APIs ---
  async login(username, password) {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Login failed.');
    }
    return response.json();
  },

  async signup(username, password, role, preferredLanguage) {
    const response = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role, preferred_language: preferredLanguage }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Signup failed.');
    }
    return response.json();
  },

  async getMe() {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      localStorage.removeItem('token');
      throw new Error('Session expired.');
    }
    return response.json();
  },

  // --- Ticket APIs ---
  async getTickets() {
    const response = await fetch(`${API_URL}/api/tickets`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch tickets.');
    return response.json();
  },

  async getMyTickets() {
    const response = await fetch(`${API_URL}/api/tickets/my`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch your tickets.');
    return response.json();
  },

  async getTicket(ticketId) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch ticket details.');
    return response.json();
  },

  async createTicket(title, initialMessage) {
    const response = await fetch(`${API_URL}/api/tickets`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title, initial_message: initialMessage }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to create ticket.');
    }
    return response.json();
  },

  async resolveTicket(ticketId) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/resolve`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to resolve ticket.');
    return response.json();
  },

  // --- Message APIs ---
  async getMessages(ticketId) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/messages`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch messages.');
    return response.json();
  },

  async sendMessage(ticketId, text) {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Failed to send message.');
    }
    return response.json();
  }
};
