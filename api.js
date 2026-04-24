// ============================================
// API SERVICE LAYER - CONNECTS TO PHP BACKEND
// ============================================

class API {
  constructor() {
    // ✅ CHANGE THIS: Use real backend instead of mock data
    this.useMock = false; // ← SET TO false FOR REAL BACKEND

    // ✅ CHANGE THIS: Match your folder structure
    // If your project is at: http://localhost/skill-exchange/
    this.baseUrl = "http://localhost/SKILL-EXCHANGE/api";

    // Alternative: Use relative path
    // this.baseUrl = "/skill-exchange/api";
  }

  // Generic request method
  async request(endpoint, method = "GET", data = null) {
    // ✅ If mock mode is disabled, use real API
    if (this.useMock) {
      return this.mockRequest(endpoint, method, data);
    }

    const url = `${this.baseUrl}${endpoint}`;

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ IMPORTANT: For PHP session cookies
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    try {
      console.log(`API Request: ${method} ${url}`); // Debug log
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Request failed");
      }

      return result;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Mock request handler (kept for fallback, but won't be used)
  mockRequest(endpoint, method, data) {
    console.warn(
      "⚠️ Mock mode is disabled. Set useMock = true to use mock data.",
    );
    return Promise.reject(
      new Error("Backend not connected. Please start PHP server."),
    );
  }

  // ============================================
  // AUTHENTICATION ENDPOINTS
  // ============================================
  auth = {
    login: (email, password) =>
      this.request("/auth/login", "POST", { email, password }),
    register: (userData) => this.request("/auth/register", "POST", userData),
    logout: () => this.request("/auth/logout", "POST"),
    verify: () => this.request("/auth/verify", "GET"),
  };

  // ============================================
  // USER ENDPOINTS
  // ============================================
  users = {
    getProfile: () => this.request("/users/profile", "GET"),
    updateProfile: (data) => this.request("/users/profile", "PUT", data),
    getSkills: () => this.request("/users/skills", "GET"),
    updateSkills: (teach, learn) =>
      this.request("/users/skills", "PUT", { teach, learn }), // ✅ Changed POST to PUT
    uploadAvatar: async (file) => {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(`${this.baseUrl}/users/avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      return response.json();
    },
  };

  // ============================================
  // MATCHES ENDPOINTS
  // ============================================
  matches = {
    getMatches: () => this.request("/matches", "GET"),
    sendRequest: (toUserId, skillId, message) =>
      this.request("/matches", "POST", {
        to_user_id: toUserId,
        skill_id: skillId,
        message,
      }),
    getRequests: () => this.request("/matches/requests", "GET"),
    acceptRequest: (requestId) =>
      this.request("/matches", "PUT", {
        request_id: requestId,
        action: "accept",
      }),
    rejectRequest: (requestId) =>
      this.request("/matches", "PUT", {
        request_id: requestId,
        action: "reject",
      }),
  };

  // ============================================
  // SESSIONS ENDPOINTS
  // ============================================
  sessions = {
    getAll: () => this.request("/sessions", "GET"),
    getById: (id) => this.request(`/sessions/${id}`, "GET"),
    create: (data) => this.request("/sessions", "POST", data),
    updateStatus: (id, status) =>
      this.request(`/sessions/${id}/status`, "PUT", { status }),
    cancel: (id) => this.request(`/sessions/${id}`, "DELETE"),
  };

  // ============================================
  // MESSAGES ENDPOINTS
  // ============================================
  messages = {
    getConversations: () => this.request("/messages", "GET"),
    getMessages: (userId) => this.request(`/messages/${userId}`, "GET"),
    send: (receiverId, message, sessionId = null) =>
      this.request("/messages", "POST", {
        receiver_id: receiverId,
        message,
        session_id: sessionId,
      }),
    markAsRead: (messageId) =>
      this.request("/messages/read", "PUT", { message_id: messageId }),
  };

  // ============================================
  // REVIEWS ENDPOINTS
  // ============================================
  reviews = {
    addReview: (sessionId, rating, feedback, revieweeId) =>
      this.request("/reviews", "POST", {
        session_id: sessionId,
        rating,
        feedback,
        reviewee_id: revieweeId,
      }),
    getUserReviews: (userId) => this.request(`/reviews/user/${userId}`, "GET"),
  };

  // ============================================
  // PROGRESS ENDPOINTS
  // ============================================
  progress = {
    getStats: () => this.request("/progress/stats", "GET"),
    updateSkill: (skillId, proficiency) =>
      this.request("/progress", "POST", {
        skill_id: skillId,
        proficiency_level: proficiency,
      }),
  };

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================
  admin = {
    getStats: () => this.request("/admin/stats", "GET"),
    getUsers: () => this.request("/admin/users", "GET"),
    deleteUser: (userId) => this.request(`/admin/users/${userId}`, "DELETE"),
    updateUserStatus: (userId, status) =>
      this.request(`/admin/users/${userId}/status`, "PUT", { status }),
  };
}

// Initialize API
const api = new API();
window.api = api;

// Test connection on load (optional)
console.log("API Service initialized. Mode:", api.useMock ? "MOCK" : "LIVE");
console.log("API Base URL:", api.baseUrl);
