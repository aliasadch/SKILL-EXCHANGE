// ============================================
// MATCHES MODULE - COMPLETE
// ============================================

class Matches {
  constructor() {
    if (!auth.checkAuth()) {
      window.location.href = "index.html";
      return;
    }
    this.init();
  }

  async init() {
    await this.loadUserInfo();
    await this.loadMatches();
    await this.loadMatchRequests();
    this.setupEventListeners();
  }

  async loadUserInfo() {
    const user = auth.getCurrentUser();
    const userInfo = DOM.element("userInfo");

    if (userInfo) {
      userInfo.innerHTML = `
                <div class="user-avatar-large">
                    ${user.firstName[0]}${user.lastName[0]}
                </div>
                <h5 class="mb-0 text-white">${user.firstName} ${user.lastName}</h5>
                <small class="text-white-50">${user.email}</small>
                <div class="mt-2">
                    ${this.renderStars(user.rating || 0)}
                </div>
            `;
    }
  }

  renderStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars +=
          '<i class="fas fa-star" style="color: #fbbf24; font-size: 0.8rem;"></i>';
      } else {
        stars +=
          '<i class="far fa-star" style="color: #d1d5db; font-size: 0.8rem;"></i>';
      }
    }
    return stars;
  }

  async loadMatches() {
    try {
      showLoading("matchesContainer");
      const response = await api.matches.getMatches();
      const matches = response.matches || [];

      const container = DOM.element("matchesContainer");
      if (!container) return;

      if (matches.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-users fa-4x text-muted mb-3"></i>
                        <h5>No Matches Found</h5>
                        <p class="text-muted">Add more skills to your profile to find better matches!</p>
                        <a href="profile.html" class="btn btn-primary-gradient">Update Your Skills</a>
                    </div>
                `;
        return;
      }

      container.innerHTML = `
                <div class="row g-4">
                    ${matches
                      .map(
                        (match) => `
                        <div class="col-md-6 col-lg-4">
                            <div class="match-card">
                                <div class="match-header">
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="match-avatar-large me-3">
                                            ${match.user.firstName[0]}${match.user.lastName[0]}
                                        </div>
                                        <div>
                                            <h5 class="mb-1">${match.user.firstName} ${match.user.lastName}</h5>
                                            <div class="rating small">
                                                ${this.renderStars(match.user.rating || 0)}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span class="badge bg-light text-dark">Match Score: ${match.score}%</span>
                                        <span class="badge bg-success">${match.commonTeach.length + match.commonLearn.length} Common Skills</span>
                                    </div>
                                </div>
                                <div class="match-body">
                                    ${
                                      match.commonTeach.length > 0
                                        ? `
                                        <div class="mb-3">
                                            <strong class="text-primary"><i class="fas fa-chalkboard-user me-1"></i> Can teach you:</strong>
                                            <div class="mt-2">
                                                ${match.commonTeach.map((skill) => `<span class="skill-tag teach">${skill}</span>`).join("")}
                                            </div>
                                        </div>
                                    `
                                        : ""
                                    }
                                    ${
                                      match.commonLearn.length > 0
                                        ? `
                                        <div class="mb-3">
                                            <strong class="text-success"><i class="fas fa-graduation-cap me-1"></i> Wants to learn:</strong>
                                            <div class="mt-2">
                                                ${match.commonLearn.map((skill) => `<span class="skill-tag learn">${skill}</span>`).join("")}
                                            </div>
                                        </div>
                                    `
                                        : ""
                                    }
                                    <div class="d-flex gap-2 mt-3">
                                        <button class="btn btn-primary flex-grow-1" onclick="matches.connectWithUser(${match.user.id})">
                                            <i class="fas fa-handshake me-2"></i>Connect
                                        </button>
                                        <button class="btn btn-outline-secondary" onclick="matches.viewProfile(${match.user.id})">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            `;
    } catch (error) {
      console.error("Failed to load matches:", error);
      const container = DOM.element("matchesContainer");
      if (container) {
        container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-exclamation-circle fa-4x text-danger mb-3"></i>
                        <h5>Unable to Load Matches</h5>
                        <p class="text-muted">Please try again later.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                    </div>
                `;
      }
    }
  }

  async loadMatchRequests() {
    try {
      const response = await api.matches.getRequests();
      const requests = response.requests || [];

      const container = DOM.element("requestsContainer");
      if (!container) return;

      if (requests.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-inbox fa-3x text-muted mb-2"></i>
                        <p class="text-muted mb-0">No pending requests</p>
                    </div>
                `;
        return;
      }

      container.innerHTML = requests
        .map(
          (request) => `
                <div class="request-item p-3 border-bottom">
                    <div class="d-flex align-items-center">
                        <div class="request-avatar me-3">
                            ${request.fromUser?.firstName[0]}${request.fromUser?.lastName[0]}
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-1">${request.fromUser?.firstName} ${request.fromUser?.lastName}</h6>
                            <small class="text-muted">${request.message || "Would like to connect with you!"}</small>
                            <div class="mt-1">
                                ${this.renderStars(request.fromUser?.rating || 0)}
                            </div>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-success me-2" onclick="matches.acceptRequest(${request.id})">
                                <i class="fas fa-check"></i> Accept
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="matches.rejectRequest(${request.id})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `,
        )
        .join("");
    } catch (error) {
      console.error("Failed to load requests:", error);
    }
  }

  async connectWithUser(userId) {
    try {
      const response = await api.matches.sendRequest(
        userId,
        null,
        "I would like to connect and learn from you!",
      );
      if (response.success) {
        showToast("Connection request sent successfully!", "success");
      }
    } catch (error) {
      showToast("Failed to send request. Please try again.", "error");
    }
  }

  async acceptRequest(requestId) {
    try {
      const response = await api.matches.acceptRequest(requestId);
      if (response.success) {
        showToast(
          "Request accepted! You can now schedule a session.",
          "success",
        );
        await this.loadMatchRequests();
        await this.loadMatches();
      }
    } catch (error) {
      showToast("Failed to accept request", "error");
    }
  }

  async rejectRequest(requestId) {
    if (!confirm("Reject this connection request?")) return;

    try {
      const response = await api.matches.rejectRequest(requestId);
      if (response.success) {
        showToast("Request rejected", "info");
        await this.loadMatchRequests();
      }
    } catch (error) {
      showToast("Failed to reject request", "error");
    }
  }

  viewProfile(userId) {
    // Implement view profile functionality
    showToast("Profile view coming soon!", "info");
  }

  setupEventListeners() {
    const logoutBtn = DOM.element("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        auth.logout();
      });
    }
  }
}

// Global matches instance
window.matches = null;

// Initialize matches when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.matches = new Matches();
});

// Make functions globally accessible
window.connectWithUser = (userId) => {
  if (window.matches) {
    window.matches.connectWithUser(userId);
  }
};
