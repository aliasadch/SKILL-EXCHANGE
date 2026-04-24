// ============================================
// AUTHENTICATION MODULE
// ============================================

// Mock User Data (Will be replaced with API calls)
const MOCK_USERS = [
  {
    id: 1,
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "password123",
    bio: "Full-stack developer passionate about teaching",
    teachSkills: ["JavaScript", "React", "Node.js"],
    learnSkills: ["Python", "Machine Learning"],
    rating: 4.5,
    avatar: null,
    isAdmin: false,
    createdAt: "2024-01-15T10:30:00Z",
  },
  {
    id: 2,
    firstName: "Jane",
    lastName: "Smith",
    email: "jane@example.com",
    password: "password123",
    bio: "Data scientist sharing knowledge",
    teachSkills: ["Python", "Data Science", "SQL"],
    learnSkills: ["React", "JavaScript"],
    rating: 5.0,
    avatar: null,
    isAdmin: false,
    createdAt: "2024-01-20T14:45:00Z",
  },
  {
    id: 3,
    firstName: "Admin",
    lastName: "User",
    email: "admin@skillswap.com",
    password: "admin123",
    bio: "Platform Administrator",
    teachSkills: [],
    learnSkills: [],
    rating: 5.0,
    avatar: null,
    isAdmin: true,
    createdAt: "2024-01-01T00:00:00Z",
  },
];

// Initialize localStorage with mock data if empty
function initMockData() {
  if (!Storage.get("users")) {
    Storage.set("users", MOCK_USERS);
  }
  if (!Storage.get("sessions")) {
    Storage.set("sessions", []);
  }
  if (!Storage.get("matchRequests")) {
    Storage.set("matchRequests", []);
  }
  if (!Storage.get("messages")) {
    Storage.set("messages", []);
  }
  if (!Storage.get("reviews")) {
    Storage.set("reviews", []);
  }
}

// Auth Class
class Auth {
  constructor() {
    initMockData();
    this.currentUser = null;
    this.checkAuth();
  }

  // Check if user is authenticated
  checkAuth() {
    const user = Storage.get("currentUser");
    if (user) {
      this.currentUser = user;
      return true;
    }
    return false;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Login user
  login(email, password) {
    const users = Storage.get("users");
    const user = users.find(
      (u) => u.email === email && u.password === password,
    );

    if (user) {
      // Don't store password in currentUser
      const { password, ...userWithoutPassword } = user;
      this.currentUser = userWithoutPassword;
      Storage.set("currentUser", userWithoutPassword);
      return { success: true, user: userWithoutPassword };
    }

    return { success: false, message: "Invalid email or password" };
  }

  // Register user
  register(userData) {
    const users = Storage.get("users");

    // Check if email already exists
    if (users.some((u) => u.email === userData.email)) {
      return { success: false, message: "Email already exists" };
    }

    const newUser = {
      id: users.length + 1,
      ...userData,
      rating: 0,
      avatar: null,
      isAdmin: false,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    Storage.set("users", users);

    // Don't store password in return
    const { password, ...userWithoutPassword } = newUser;
    return { success: true, user: userWithoutPassword };
  }

  // Logout user
  logout() {
    Storage.remove("currentUser");
    this.currentUser = null;
    window.location.href = "index.html";
  }

  // Update current user
  updateUser(updatedData) {
    const users = Storage.get("users");
    const index = users.findIndex((u) => u.id === this.currentUser.id);

    if (index !== -1) {
      users[index] = { ...users[index], ...updatedData };
      Storage.set("users", users);

      const { password, ...userWithoutPassword } = users[index];
      this.currentUser = userWithoutPassword;
      Storage.set("currentUser", userWithoutPassword);

      return true;
    }
    return false;
  }

  // Check if user is admin
  isAdmin() {
    return this.currentUser && this.currentUser.isAdmin;
  }

  // Get all users (for admin)
  getAllUsers() {
    if (!this.isAdmin()) return [];
    return Storage.get("users");
  }

  // Delete user (admin only)
  deleteUser(userId) {
    if (!this.isAdmin()) return false;

    let users = Storage.get("users");
    users = users.filter((u) => u.id !== userId);
    Storage.set("users", users);

    return true;
  }
}

// Initialize auth instance
const auth = new Auth();

// Make auth available globally
window.auth = auth;

// Login Form Handler
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = DOM.element("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = DOM.element("loginEmail").value;
      const password = DOM.element("loginPassword").value;

      const result = auth.login(email, password);

      if (result.success) {
        showToast("Login successful! Redirecting...", "success");
        setTimeout(() => {
          if (auth.isAdmin()) {
            window.location.href = "admin.html";
          } else {
            window.location.href = "dashboard.html";
          }
        }, 1000);
      } else {
        showToast(result.message, "error");
      }
    });
  }

  // Register Form Handler
  const registerForm = DOM.element("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const password = DOM.element("registerPassword").value;
      const confirmPassword = DOM.element("confirmPassword").value;

      if (password !== confirmPassword) {
        showToast("Passwords do not match!", "error");
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        showToast(
          "Password must be at least 6 characters with uppercase, lowercase, and numbers",
          "error",
        );
        return;
      }

      const userData = {
        firstName: DOM.element("firstName").value,
        lastName: DOM.element("lastName").value,
        email: DOM.element("registerEmail").value,
        password: password,
        bio: "",
        teachSkills: DOM.element("teachSkills")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        learnSkills: DOM.element("learnSkills")
          .value.split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      };

      if (!validateEmail(userData.email)) {
        showToast("Please enter a valid email address", "error");
        return;
      }

      const result = auth.register(userData);

      if (result.success) {
        showToast("Registration successful! Please login.", "success");

        // Close register modal and open login modal
        const registerModal = bootstrap.Modal.getInstance(
          DOM.element("registerModal"),
        );
        registerModal.hide();

        const loginModal = new bootstrap.Modal(DOM.element("loginModal"));
        loginModal.show();

        registerForm.reset();
      } else {
        showToast(result.message, "error");
      }
    });
  }
});
