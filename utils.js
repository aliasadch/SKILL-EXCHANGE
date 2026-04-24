// ============================================
// UTILITY FUNCTIONS
// ============================================

// Show Toast Notification
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast-notification toast-${type}`;

  let icon = "";
  switch (type) {
    case "success":
      icon = '<i class="fas fa-check-circle me-2"></i>';
      break;
    case "error":
      icon = '<i class="fas fa-exclamation-circle me-2"></i>';
      break;
    case "warning":
      icon = '<i class="fas fa-exclamation-triangle me-2"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle me-2"></i>';
  }

  toast.innerHTML = `${icon}${message}`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Show Loading Spinner
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
            <div class="text-center py-5">
                <div class="loading-spinner mx-auto"></div>
                <p class="mt-3 text-muted">Loading...</p>
            </div>
        `;
  }
}

// Hide Loading Spinner
function hideLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
  }
}

// Format Date
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Format Time
function formatTime(timeString) {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Get Time Ago
function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  return formatDate(dateString);
}

// Generate Random ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validate Email
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Validate Password Strength
function validatePassword(password) {
  const minLength = 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers,
    strength:
      ((hasUpperCase + hasLowerCase + hasNumbers + hasSpecialChar) / 4) * 100,
  };
}

// Render Stars for Rating
function renderStars(rating, interactive = false, onRating = null) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    const isActive = i <= rating;
    const className = isActive ? "fas fa-star active" : "far fa-star";
    const clickHandler =
      interactive && onRating ? `onclick="${onRating}(${i})"` : "";
    stars += `<i class="${className}" style="cursor: ${interactive ? "pointer" : "default"}; color: ${isActive ? "#fbbf24" : "#d1d5db"};" ${clickHandler}></i>`;
  }
  return stars;
}

// Render Skill Tags
function renderSkillTags(
  skills,
  type = "teach",
  removable = false,
  onRemove = null,
) {
  if (!skills || skills.length === 0) {
    return '<span class="text-muted">No skills added</span>';
  }

  return skills
    .map(
      (skill) => `
        <span class="skill-tag ${type}">
            ${skill}
            ${removable ? `<i class="fas fa-times ms-2" style="cursor: pointer;" onclick="${onRemove}('${skill}')"></i>` : ""}
        </span>
    `,
    )
    .join("");
}

// Debounce Function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Local Storage Helpers
const Storage = {
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  get: (key) => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  },
  remove: (key) => {
    localStorage.removeItem(key);
  },
  clear: () => {
    localStorage.clear();
  },
};

// URL Helpers
const UrlHelper = {
  getParam: (param) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },
  setParam: (param, value) => {
    const url = new URL(window.location.href);
    url.searchParams.set(param, value);
    window.history.pushState({}, "", url);
  },
  removeParam: (param) => {
    const url = new URL(window.location.href);
    url.searchParams.delete(param);
    window.history.pushState({}, "", url);
  },
};

// DOM Helpers
const DOM = {
  element: (id) => document.getElementById(id),
  query: (selector) => document.querySelector(selector),
  queryAll: (selector) => document.querySelectorAll(selector),
  addClass: (element, className) => element.classList.add(className),
  removeClass: (element, className) => element.classList.remove(className),
  toggleClass: (element, className) => element.classList.toggle(className),
  hasClass: (element, className) => element.classList.contains(className),
};

// Export for use in other files
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.timeAgo = timeAgo;
window.validateEmail = validateEmail;
window.validatePassword = validatePassword;
window.renderStars = renderStars;
window.renderSkillTags = renderSkillTags;
window.Storage = Storage;
window.UrlHelper = UrlHelper;
window.DOM = DOM;
