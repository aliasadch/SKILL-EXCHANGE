// ============================================
// DASHBOARD MODULE
// ============================================

class Dashboard {
  constructor() {
    this.checkAuth();
    this.init();
  }

  checkAuth() {
    if (!auth.checkAuth()) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  }

  async init() {
    await this.loadUserInfo();
    await this.loadStats();
    await this.loadUpcomingSessions();
    await this.loadMatchSuggestions();
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
                    ${renderStars(user.rating || 0)}
                </div>
            `;
    }
  }

  async loadStats() {
    try {
      const response = await api.progress.getStats();
      const stats = response.stats;

      const statsContainer = DOM.element("statsContainer");
      if (statsContainer) {
        statsContainer.innerHTML = `
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-chalkboard-user"></i>
                            </div>
                            <h3>${stats.teach_skills_count}</h3>
                            <p>Skills to Teach</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-graduation-cap"></i>
                            </div>
                            <h3>${stats.learn_skills_count}</h3>
                            <p>Skills to Learn</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3>${stats.completed_sessions}</h3>
                            <p>Sessions Completed</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <h3>${stats.pending_sessions}</h3>
                            <p>Pending Sessions</p>
                        </div>
                    </div>
                `;
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
      showToast("Failed to load statistics", "error");
    }
  }

  async loadUpcomingSessions() {
    try {
      const response = await api.sessions.getAll();
      const sessions = response.sessions || [];
      const upcoming = sessions
        .filter((s) => s.status !== "completed")
        .slice(0, 5);

      const container = DOM.element("upcomingSessions");
      if (container) {
        if (upcoming.length === 0) {
          container.innerHTML =
            '<p class="text-muted text-center py-4">No upcoming sessions</p>';
          return;
        }

        container.innerHTML = upcoming
          .map(
            (session) => `
                    <div class="session-card ${session.status}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="mb-1">${session.title || "Learning Session"}</h6>
                                <p class="mb-1 small">
                                    <i class="fas fa-user me-2"></i>${session.otherUser?.firstName} ${session.otherUser?.lastName}
                                </p>
                                <p class="mb-0 small">
                                    <i class="fas fa-calendar me-2"></i>${formatDate(session.date)}
                                    <i class="fas fa-clock ms-3 me-2"></i>${session.time}
                                </p>
                            </div>
                            <span class="badge bg-${session.status === "pending" ? "warning" : session.status === "accepted" ? "success" : "secondary"}">
                                ${session.status}
                            </span>
                        </div>
                    </div>
                `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  }

  async loadMatchSuggestions() {
    try {
      const response = await api.matches.getMatches();
      const matches = (response.matches || []).slice(0, 3);

      const container = DOM.element("matchSuggestions");
      if (container) {
        if (matches.length === 0) {
          container.innerHTML =
            '<p class="text-muted text-center py-4">No matches found. Add more skills to get better matches!</p>';
          return;
        }

        container.innerHTML = matches
          .map(
            (match) => `
                    <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                        <div class="match-avatar me-3">
                            ${match.user.firstName[0]}${match.user.lastName[0]}
                        </div>
                        <div class="flex-grow-1">
                            <h6 class="mb-0">${match.user.firstName} ${match.user.lastName}</h6>
                            <small class="text-muted">${match.score}% Match</small>
                            <div class="mt-1">
                                ${renderStars(match.user.rating || 0)}
                            </div>
                        </div>
                        <button class="btn btn-sm btn-primary" onclick="connectWithUser(${match.user.id})">
                            <i class="fas fa-handshake"></i> Connect
                        </button>
                    </div>
                `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Failed to load matches:", error);
    }
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

// Global function for connecting with user
window.connectWithUser = async (userId) => {
  try {
    const response = await api.matches.sendRequest(
      userId,
      null,
      "I would like to connect and learn from you!",
    );
    if (response.success) {
      showToast("Connection request sent!", "success");
    }
  } catch (error) {
    showToast("Failed to send request", "error");
  }
};

// Initialize dashboard when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new Dashboard();
});
