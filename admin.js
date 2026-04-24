// ============================================
// ADMIN MODULE - COMPLETE
// ============================================

class Admin {
  constructor() {
    if (!auth.checkAuth()) {
      window.location.href = "index.html";
      return;
    }

    const user = auth.getCurrentUser();
    if (!user.isAdmin) {
      window.location.href = "dashboard.html";
      return;
    }

    this.init();
  }

  async init() {
    await this.loadStats();
    await this.loadUsers();
    await this.loadRecentActivity();
    this.setupEventListeners();
  }

  async loadStats() {
    try {
      const response = await api.admin.getStats();
      const stats = response.stats || {};

      const container = DOM.element("statsContainer");
      if (container) {
        container.innerHTML = `
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <h3>${stats.totalUsers || 0}</h3>
                            <p>Total Users</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-user-check"></i>
                            </div>
                            <h3>${stats.activeUsers || 0}</h3>
                            <p>Active Users</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                            <h3>${stats.totalSessions || 0}</h3>
                            <p>Total Sessions</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-star"></i>
                            </div>
                            <h3>${stats.averageRating || 0}</h3>
                            <p>Avg Rating</p>
                        </div>
                    </div>
                `;
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  }

  async loadUsers() {
    try {
      const response = await api.admin.getUsers();
      const users = response.users || [];

      const container = DOM.element("usersContainer");
      if (container) {
        if (users.length === 0) {
          container.innerHTML =
            '<tr><td colspan="5" class="text-center">No users found</td></tr>';
          return;
        }

        container.innerHTML = users
          .map(
            (user) => `
                    <tr>
                        <td>
                            <div class="d-flex align-items-center">
                                <div class="user-avatar-sm me-2">
                                    ${user.firstName[0]}${user.lastName[0]}
                                </div>
                                <div>
                                    <strong>${user.firstName} ${user.lastName}</strong>
                                    <br>
                                    <small class="text-muted">ID: ${user.id}</small>
                                </div>
                            </div>
                        </td>
                        <td>${user.email}</td>
                        <td>${user.teachSkills?.length || 0} taught / ${user.learnSkills?.length || 0} learning</td>
                        <td>
                            <span class="badge bg-${user.isActive !== false ? "success" : "danger"}">
                                ${user.isActive !== false ? "Active" : "Inactive"}
                            </span>
                            ${user.isAdmin ? '<span class="badge bg-primary ms-1">Admin</span>' : ""}
                        </td>
                        <td>
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-primary" onclick="admin.viewUser(${user.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-warning" onclick="admin.toggleUserStatus(${user.id})">
                                    <i class="fas ${user.isActive !== false ? "fa-ban" : "fa-check"}"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="admin.deleteUser(${user.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }

  async loadRecentActivity() {
    try {
      const sessions = await api.sessions.getAll();
      const allSessions = sessions.sessions || [];
      const recentSessions = allSessions.slice(0, 10);

      const container = DOM.element("recentActivityContainer");
      if (container) {
        if (recentSessions.length === 0) {
          container.innerHTML =
            '<tr><td colspan="4" class="text-center">No recent activity</td></tr>';
          return;
        }

        container.innerHTML = recentSessions
          .map(
            (session) => `
                    <tr>
                        <td>#${session.id}</td>
                        <td>${session.otherUser?.firstName} ${session.otherUser?.lastName}</td>
                        <td>${session.topic || "Learning Session"}</td>
                        <td><span class="badge bg-${session.status === "completed" ? "success" : session.status === "pending" ? "warning" : "secondary"}">${session.status}</span></td>
                        <td>${formatDate(session.createdAt)}</td>
                    </tr>
                `,
          )
          .join("");
      }
    } catch (error) {
      console.error("Failed to load activity:", error);
    }
  }

  async viewUser(userId) {
    showToast("View user feature coming soon!", "info");
  }

  async toggleUserStatus(userId) {
    if (!confirm("Toggle user status?")) return;

    try {
      await api.admin.updateUserStatus(userId, "toggle");
      showToast("User status updated", "success");
      await this.loadUsers();
    } catch (error) {
      showToast("Failed to update user status", "error");
    }
  }

  async deleteUser(userId) {
    if (
      !confirm(
        "Are you sure you want to permanently delete this user? This action cannot be undone.",
      )
    )
      return;

    try {
      await api.admin.deleteUser(userId);
      showToast("User deleted successfully", "success");
      await this.loadUsers();
      await this.loadStats();
    } catch (error) {
      showToast("Failed to delete user", "error");
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

    // Search functionality
    const searchInput = DOM.element("searchUsers");
    if (searchInput) {
      searchInput.addEventListener("keyup", (e) => {
        this.filterUsers(e.target.value);
      });
    }
  }

  filterUsers(searchTerm) {
    const rows = document.querySelectorAll("#usersContainer tr");
    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      if (text.includes(searchTerm.toLowerCase())) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }
}

// Global admin instance
window.admin = null;

// Initialize admin when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.admin = new Admin();
});
