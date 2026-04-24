// ============================================
// SESSIONS MODULE - COMPLETE
// ============================================

class Sessions {
  constructor() {
    if (!auth.checkAuth()) {
      window.location.href = "index.html";
      return;
    }
    this.currentUser = auth.getCurrentUser();
    this.init();
  }

  async init() {
    await this.loadUserInfo();
    await this.loadSessions();
    this.setupEventListeners();
    this.setupFilters();
  }

  async loadUserInfo() {
    const user = this.currentUser;
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

  async loadSessions(filter = "all") {
    try {
      showLoading("sessionsContainer");
      const response = await api.sessions.getAll();
      let sessions = response.sessions || [];

      // Apply filter
      if (filter !== "all") {
        sessions = sessions.filter((s) => s.status === filter);
      }

      const container = DOM.element("sessionsContainer");
      if (!container) return;

      if (sessions.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-calendar-times fa-4x text-muted mb-3"></i>
                        <h5>No Sessions Found</h5>
                        <p class="text-muted">${filter === "all" ? "You don't have any sessions yet." : `No ${filter} sessions found.`}</p>
                        <button class="btn btn-primary-gradient" onclick="sessions.showNewSessionModal()">
                            <i class="fas fa-plus me-2"></i>Schedule a Session
                        </button>
                    </div>
                `;
        return;
      }

      // Separate sessions by status
      const pendingSessions = sessions.filter((s) => s.status === "pending");
      const acceptedSessions = sessions.filter((s) => s.status === "accepted");
      const completedSessions = sessions.filter(
        (s) => s.status === "completed",
      );
      const cancelledSessions = sessions.filter(
        (s) => s.status === "cancelled",
      );

      container.innerHTML = `
                ${
                  pendingSessions.length > 0
                    ? `
                    <div class="mb-4">
                        <h5 class="mb-3"><span class="badge bg-warning me-2">${pendingSessions.length}</span> Pending Requests</h5>
                        ${pendingSessions.map((session) => this.renderSessionCard(session)).join("")}
                    </div>
                `
                    : ""
                }
                
                ${
                  acceptedSessions.length > 0
                    ? `
                    <div class="mb-4">
                        <h5 class="mb-3"><span class="badge bg-success me-2">${acceptedSessions.length}</span> Upcoming Sessions</h5>
                        ${acceptedSessions.map((session) => this.renderSessionCard(session)).join("")}
                    </div>
                `
                    : ""
                }
                
                ${
                  completedSessions.length > 0
                    ? `
                    <div class="mb-4">
                        <h5 class="mb-3"><span class="badge bg-secondary me-2">${completedSessions.length}</span> Completed Sessions</h5>
                        ${completedSessions.map((session) => this.renderSessionCard(session)).join("")}
                    </div>
                `
                    : ""
                }
                
                ${
                  cancelledSessions.length > 0
                    ? `
                    <div class="mb-4">
                        <h5 class="mb-3"><span class="badge bg-danger me-2">${cancelledSessions.length}</span> Cancelled Sessions</h5>
                        ${cancelledSessions.map((session) => this.renderSessionCard(session)).join("")}
                    </div>
                `
                    : ""
                }
            `;
    } catch (error) {
      console.error("Failed to load sessions:", error);
      const container = DOM.element("sessionsContainer");
      if (container) {
        container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-exclamation-circle fa-4x text-danger mb-3"></i>
                        <h5>Unable to Load Sessions</h5>
                        <p class="text-muted">Please try again later.</p>
                        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                    </div>
                `;
      }
    }
  }

  renderSessionCard(session) {
    const isTeacher = session.teacherId === this.currentUser.id;
    const otherPerson = session.otherUser;
    const statusColors = {
      pending: "warning",
      accepted: "success",
      completed: "secondary",
      cancelled: "danger",
    };

    const statusIcons = {
      pending: "clock",
      accepted: "check-circle",
      completed: "check-double",
      cancelled: "times-circle",
    };

    return `
            <div class="session-card ${session.status} mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center mb-2">
                            <div class="session-avatar me-2">
                                ${otherPerson?.firstName[0]}${otherPerson?.lastName[0]}
                            </div>
                            <div>
                                <h6 class="mb-0">${otherPerson?.firstName} ${otherPerson?.lastName}</h6>
                                <small class="text-muted">${isTeacher ? "You are teaching" : "You are learning"}</small>
                            </div>
                        </div>
                        
                        <div class="session-details ms-4">
                            <p class="mb-1">
                                <i class="fas fa-tag me-2 text-primary"></i>
                                <strong>${session.topic || "Learning Session"}</strong>
                            </p>
                            <p class="mb-1 small">
                                <i class="fas fa-calendar me-2"></i>${formatDate(session.date)}
                                <i class="fas fa-clock ms-3 me-2"></i>${session.time}
                                <i class="fas ${session.mode === "online" ? "fa-video" : "fa-building"} ms-3 me-2"></i>
                                ${session.mode === "online" ? "Online" : "Offline"}
                            </p>
                            ${
                              session.mode === "online" && session.meetingLink
                                ? `
                                <p class="mb-1 small">
                                    <i class="fas fa-link me-2"></i>
                                    <a href="${session.meetingLink}" target="_blank">Join Meeting</a>
                                </p>
                            `
                                : ""
                            }
                            ${
                              session.location
                                ? `
                                <p class="mb-1 small">
                                    <i class="fas fa-map-marker-alt me-2"></i>${session.location}
                                </p>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-${statusColors[session.status]} mb-2">
                            <i class="fas fa-${statusIcons[session.status]} me-1"></i>${session.status}
                        </span>
                    </div>
                </div>
                
                ${
                  session.status === "pending" &&
                  session.studentId === this.currentUser.id
                    ? `
                    <div class="mt-3 pt-2 border-top d-flex gap-2">
                        <button class="btn btn-sm btn-success" onclick="sessions.updateStatus(${session.id}, 'accepted')">
                            <i class="fas fa-check me-1"></i>Accept
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="sessions.updateStatus(${session.id}, 'cancelled')">
                            <i class="fas fa-times me-1"></i>Decline
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="sessions.rescheduleSession(${session.id})">
                            <i class="fas fa-calendar-alt me-1"></i>Reschedule
                        </button>
                    </div>
                `
                    : ""
                }
                
                ${
                  session.status === "accepted" &&
                  session.teacherId === this.currentUser.id
                    ? `
                    <div class="mt-3 pt-2 border-top d-flex gap-2">
                        <button class="btn btn-sm btn-primary" onclick="sessions.startSession(${session.id})">
                            <i class="fas fa-video me-1"></i>Start Session
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="sessions.cancelSession(${session.id})">
                            <i class="fas fa-ban me-1"></i>Cancel
                        </button>
                    </div>
                `
                    : ""
                }
                
                ${
                  session.status === "completed" &&
                  !session.feedback &&
                  session.teacherId === this.currentUser.id
                    ? `
                    <div class="mt-3 pt-2 border-top">
                        <button class="btn btn-sm btn-outline-primary" onclick="sessions.showFeedbackModal(${session.id}, ${otherPerson?.id})">
                            <i class="fas fa-star me-1"></i>Leave Feedback
                        </button>
                    </div>
                `
                    : ""
                }
                
                ${
                  session.feedback
                    ? `
                    <div class="mt-3 pt-2 border-top">
                        <div class="feedback-box p-2 bg-light rounded">
                            <div class="d-flex align-items-center mb-1">
                                <small class="text-muted me-2">Your feedback:</small>
                                <div class="rating small">
                                    ${this.renderStars(session.rating)}
                                </div>
                            </div>
                            <p class="mb-0 small">"${session.feedback}"</p>
                        </div>
                    </div>
                `
                    : ""
                }
            </div>
        `;
  }

  showNewSessionModal() {
    // Get all users except current user for dropdown
    const users = Storage.get("users") || [];
    const otherUsers = users.filter((u) => u.id !== this.currentUser.id);

    const modalHtml = `
            <div class="modal fade" id="newSessionModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title"><i class="fas fa-calendar-plus me-2"></i>Schedule New Session</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="newSessionForm">
                                <div class="mb-3">
                                    <label class="form-label">Learning Partner <span class="text-danger">*</span></label>
                                    <select class="form-select" id="sessionPartner" required>
                                        <option value="">Select a partner...</option>
                                        ${otherUsers
                                          .map(
                                            (user) => `
                                            <option value="${user.id}">${user.firstName} ${user.lastName} (${user.teachSkills?.join(", ") || "No skills listed"})</option>
                                        `,
                                          )
                                          .join("")}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Topic / Subject <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="sessionTopic" placeholder="e.g., React Basics, Python Programming" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Date <span class="text-danger">*</span></label>
                                        <input type="date" class="form-control" id="sessionDate" min="${new Date().toISOString().split("T")[0]}" required>
                                    </div>
                                    <div class="col-md-6 mb-3">
                                        <label class="form-label">Time <span class="text-danger">*</span></label>
                                        <input type="time" class="form-control" id="sessionTime" required>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Duration</label>
                                    <select class="form-select" id="sessionDuration">
                                        <option value="30">30 minutes</option>
                                        <option value="60" selected>1 hour</option>
                                        <option value="90">1.5 hours</option>
                                        <option value="120">2 hours</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Session Mode</label>
                                    <div class="d-flex gap-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sessionMode" id="modeOnline" value="online" checked>
                                            <label class="form-check-label" for="modeOnline">
                                                <i class="fas fa-video me-1"></i> Online
                                            </label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="sessionMode" id="modeOffline" value="offline">
                                            <label class="form-check-label" for="modeOffline">
                                                <i class="fas fa-building me-1"></i> Offline
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3" id="locationField" style="display: none;">
                                    <label class="form-label">Location</label>
                                    <input type="text" class="form-control" id="sessionLocation" placeholder="Enter meeting location">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Additional Notes</label>
                                    <textarea class="form-control" id="sessionNotes" rows="3" placeholder="Any specific topics or requirements..."></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary-gradient w-100">Send Request</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

    const existingModal = document.getElementById("newSessionModal");
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Show/hide location field based on mode selection
    document.querySelectorAll('input[name="sessionMode"]').forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const locationField = document.getElementById("locationField");
        if (e.target.value === "offline") {
          locationField.style.display = "block";
        } else {
          locationField.style.display = "none";
        }
      });
    });

    const modal = new bootstrap.Modal(
      document.getElementById("newSessionModal"),
    );
    modal.show();

    document
      .getElementById("newSessionForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.createSession();
      });
  }

  async createSession() {
    const partnerId = parseInt(document.getElementById("sessionPartner").value);
    const topic = document.getElementById("sessionTopic").value;
    const date = document.getElementById("sessionDate").value;
    const time = document.getElementById("sessionTime").value;
    const duration = parseInt(document.getElementById("sessionDuration").value);
    const mode = document.querySelector(
      'input[name="sessionMode"]:checked',
    ).value;
    const location = document.getElementById("sessionLocation")?.value || "";
    const notes = document.getElementById("sessionNotes").value;

    if (!partnerId || !topic || !date || !time) {
      showToast("Please fill all required fields", "warning");
      return;
    }

    const sessionData = {
      teacherId: partnerId, // Assuming current user is student
      studentId: this.currentUser.id,
      title: topic,
      topic: topic,
      date: date,
      time: time,
      duration: duration,
      mode: mode,
      location: mode === "offline" ? location : null,
      description: notes,
    };

    try {
      const response = await api.sessions.create(sessionData);
      if (response.success || response.data) {
        showToast("Session request sent successfully!", "success");
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("newSessionModal"),
        );
        modal.hide();
        await this.loadSessions();
      }
    } catch (error) {
      showToast("Failed to create session request", "error");
    }
  }

  async updateStatus(sessionId, status) {
    try {
      const response = await api.sessions.updateStatus(sessionId, status);
      if (response.success) {
        showToast(`Session ${status} successfully`, "success");
        await this.loadSessions();
      }
    } catch (error) {
      showToast("Failed to update session status", "error");
    }
  }

  async cancelSession(sessionId) {
    if (!confirm("Are you sure you want to cancel this session?")) return;

    try {
      const response = await api.sessions.updateStatus(sessionId, "cancelled");
      if (response.success) {
        showToast("Session cancelled", "info");
        await this.loadSessions();
      }
    } catch (error) {
      showToast("Failed to cancel session", "error");
    }
  }

  rescheduleSession(sessionId) {
    showToast("Reschedule feature coming soon!", "info");
  }

  startSession(sessionId) {
    showToast("Starting session... Video call feature coming soon!", "info");
  }

  showFeedbackModal(sessionId, revieweeId) {
    const modalHtml = `
            <div class="modal fade" id="feedbackModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title"><i class="fas fa-star me-2"></i>Rate Your Experience</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="feedbackForm">
                                <div class="text-center mb-3">
                                    <label class="form-label d-block mb-2">How was your session?</label>
                                    <div class="rating-input" id="ratingStars">
                                        ${[1, 2, 3, 4, 5]
                                          .map(
                                            (i) => `
                                            <i class="far fa-star" data-rating="${i}" style="font-size: 2rem; cursor: pointer; margin: 0 5px;"></i>
                                        `,
                                          )
                                          .join("")}
                                    </div>
                                    <input type="hidden" id="feedbackRating" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Write a Review</label>
                                    <textarea class="form-control" id="feedbackText" rows="4" placeholder="Share your experience... What did you learn? How was the teaching style?" required></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Quick Tags (Optional)</label>
                                    <div class="d-flex flex-wrap gap-2" id="feedbackTags">
                                        ${[
                                          "Excellent teacher",
                                          "Clear explanations",
                                          "Patient",
                                          "Knowledgeable",
                                          "Punctual",
                                          "Friendly",
                                          "Helpful",
                                          "Professional",
                                        ]
                                          .map(
                                            (tag) => `
                                            <span class="badge bg-light text-dark p-2" style="cursor: pointer;" onclick="this.classList.toggle('bg-primary'); this.classList.toggle('text-white')">${tag}</span>
                                        `,
                                          )
                                          .join("")}
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary-gradient w-100">Submit Feedback</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

    const existingModal = document.getElementById("feedbackModal");
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // Star rating functionality
    let selectedRating = 0;
    document.querySelectorAll("#ratingStars i").forEach((star) => {
      star.addEventListener("mouseenter", function () {
        const rating = parseInt(this.dataset.rating);
        document.querySelectorAll("#ratingStars i").forEach((s, index) => {
          if (index < rating) {
            s.className = "fas fa-star";
            s.style.color = "#fbbf24";
          } else {
            s.className = "far fa-star";
            s.style.color = "#d1d5db";
          }
        });
      });

      star.addEventListener("click", function () {
        selectedRating = parseInt(this.dataset.rating);
        document.getElementById("feedbackRating").value = selectedRating;
        document.querySelectorAll("#ratingStars i").forEach((s, index) => {
          if (index < selectedRating) {
            s.className = "fas fa-star";
            s.style.color = "#fbbf24";
          } else {
            s.className = "far fa-star";
            s.style.color = "#d1d5db";
          }
        });
      });
    });

    const modal = new bootstrap.Modal(document.getElementById("feedbackModal"));
    modal.show();

    document
      .getElementById("feedbackForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const rating = document.getElementById("feedbackRating").value;
        const feedback = document.getElementById("feedbackText").value;

        if (!rating) {
          showToast("Please select a rating", "warning");
          return;
        }

        if (!feedback) {
          showToast("Please write your feedback", "warning");
          return;
        }

        await this.submitFeedback(
          sessionId,
          revieweeId,
          parseInt(rating),
          feedback,
        );
        modal.hide();
      });
  }

  async submitFeedback(sessionId, revieweeId, rating, feedback) {
    try {
      const response = await api.reviews.addReview(
        sessionId,
        rating,
        feedback,
        revieweeId,
      );
      if (response.success) {
        showToast("Thank you for your feedback!", "success");
        await this.loadSessions();
      }
    } catch (error) {
      showToast("Failed to submit feedback", "error");
    }
  }

  setupFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.dataset.filter;
        this.loadSessions(filter);
      });
    });
  }

  setupEventListeners() {
    const logoutBtn = DOM.element("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        auth.logout();
      });
    }

    const newSessionBtn = DOM.element("newSessionBtn");
    if (newSessionBtn) {
      newSessionBtn.addEventListener("click", () => {
        this.showNewSessionModal();
      });
    }
  }
}

// Global sessions instance
window.sessions = null;

// Initialize sessions when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.sessions = new Sessions();
});
