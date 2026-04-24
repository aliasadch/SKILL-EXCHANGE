// ============================================
// PROFILE MODULE - COMPLETE
// ============================================

class Profile {
  constructor() {
    if (!auth.checkAuth()) {
      window.location.href = "index.html";
      return;
    }
    this.currentUser = auth.getCurrentUser();
    this.init();
  }

  calculateProfileCompletion(user) {
    let completion = 0;
    if (user.firstName && user.lastName) completion += 15;
    if (user.bio && user.bio.length > 10) completion += 20;
    if (user.teachSkills && user.teachSkills.length > 0) completion += 25;
    if (user.learnSkills && user.learnSkills.length > 0) completion += 25;
    if (user.avatar) completion += 15;
    return completion;
  }

  async init() {
    await this.loadProfile();
    this.setupEventListeners();
    this.loadSessionHistory();
  }

  async loadProfile() {
    try {
      const response = await api.users.getProfile();
      this.currentUser = response.data;
      this.renderProfile();
    } catch (error) {
      console.error("Failed to load profile:", error);
      this.renderProfileFallback();
    }
  }

  renderProfileFallback() {
    this.currentUser = auth.getCurrentUser();
    this.renderProfile();
  }

  renderProfile() {
    const user = this.currentUser;
    const completion = this.calculateProfileCompletion(user);

    const container = DOM.element("profileContainer");
    if (!container) return;

    container.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar" id="profileAvatar">
                    ${user.avatar ? `<img src="${user.avatar}" alt="Avatar">` : `${user.firstName[0]}${user.lastName[0]}`}
                    <button class="avatar-edit-btn" onclick="document.getElementById('avatarInput').click()">
                        <i class="fas fa-camera"></i>
                    </button>
                    <input type="file" id="avatarInput" accept="image/*" style="display: none;" onchange="uploadAvatar(this)">
                </div>
                <h2>${user.firstName} ${user.lastName}</h2>
                <p class="mb-2">${user.email}</p>
                <div class="mb-3 rating">
                    ${this.renderStars(user.rating || 0)}
                    <span class="ms-2 text-white-50">(${user.totalSessions || 0} sessions)</span>
                </div>
                <p class="mb-3 bio-text">${user.bio || "No bio added yet. Click edit to add your bio."}</p>
                <button class="btn btn-light mt-2" onclick="profile.showEditModal()">
                    <i class="fas fa-edit me-2"></i>Edit Profile
                </button>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="profile-section">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0"><i class="fas fa-chalkboard-user me-2 text-primary"></i>Skills I Can Teach</h5>
                            <button class="btn btn-sm btn-primary" onclick="profile.showAddSkillModal('teach')">
                                <i class="fas fa-plus"></i> Add Skill
                            </button>
                        </div>
                        <div id="teachSkillsContainer" class="skills-container">
                            ${this.renderSkillTags(user.teachSkills || [], "teach", true)}
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="profile-section">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="mb-0"><i class="fas fa-graduation-cap me-2 text-success"></i>Skills I Want to Learn</h5>
                            <button class="btn btn-sm btn-primary" onclick="profile.showAddSkillModal('learn')">
                                <i class="fas fa-plus"></i> Add Skill
                            </button>
                        </div>
                        <div id="learnSkillsContainer" class="skills-container">
                            ${this.renderSkillTags(user.learnSkills || [], "learn", true)}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="profile-section">
                <h5 class="mb-3"><i class="fas fa-chart-line me-2"></i>Profile Completion</h5>
                <div class="progress mb-2" style="height: 10px; background: var(--gray-200);">
                    <div class="progress-bar" style="width: ${completion}%; background: var(--gradient-primary);"></div>
                </div>
                <p class="mb-0">${completion}% Complete - ${this.getCompletionMessage(completion)}</p>
            </div>
            
            <div class="profile-section">
                <h5 class="mb-3"><i class="fas fa-history me-2"></i>Session History</h5>
                <div id="sessionHistoryContainer">
                    <div class="text-center py-3">
                        <div class="loading-spinner mx-auto"></div>
                        <p class="mt-2 text-muted">Loading sessions...</p>
                    </div>
                </div>
            </div>
        `;
  }

  getCompletionMessage(completion) {
    if (completion === 100) return "Perfect! Your profile is complete! 🎉";
    if (completion >= 75) return "Great progress! Just a few more details.";
    if (completion >= 50) return "Good start! Keep adding your skills.";
    if (completion >= 25)
      return "Getting there! Add your skills to find better matches.";
    return "Let's get started! Add your bio and skills.";
  }

  renderStars(rating) {
    let stars = "";
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="fas fa-star" style="color: #fbbf24;"></i>';
      } else if (i - 0.5 <= rating) {
        stars += '<i class="fas fa-star-half-alt" style="color: #fbbf24;"></i>';
      } else {
        stars += '<i class="far fa-star" style="color: #d1d5db;"></i>';
      }
    }
    return stars;
  }

  renderSkillTags(skills, type, removable = false) {
    if (!skills || skills.length === 0) {
      return '<p class="text-muted mb-0">No skills added yet. Click "Add Skill" to get started.</p>';
    }

    return skills
      .map(
        (skill) => `
            <span class="skill-tag ${type}" data-skill="${skill}">
                ${skill}
                ${removable ? `<i class="fas fa-times ms-2" style="cursor: pointer;" onclick="profile.removeSkill('${skill}', '${type}')"></i>` : ""}
            </span>
        `,
      )
      .join("");
  }

  async loadSessionHistory() {
    try {
      const response = await api.sessions.getAll();
      const sessions = response.sessions || [];

      const container = DOM.element("sessionHistoryContainer");
      if (!container) return;

      if (sessions.length === 0) {
        container.innerHTML =
          '<p class="text-muted text-center py-3">No sessions yet. Start by finding matches!</p>';
        return;
      }

      const completedSessions = sessions.filter(
        (s) => s.status === "completed",
      );
      const pendingSessions = sessions.filter((s) => s.status !== "completed");

      container.innerHTML = `
                <div class="mb-3">
                    <strong>Completed: ${completedSessions.length}</strong> | 
                    <strong>Pending: ${pendingSessions.length}</strong>
                </div>
                ${sessions
                  .slice(0, 5)
                  .map(
                    (session) => `
                    <div class="session-card ${session.status} mb-2">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <p class="mb-1 small">
                                    <i class="fas fa-user me-2"></i>${session.otherUser?.firstName} ${session.otherUser?.lastName}
                                </p>
                                <p class="mb-1 small">
                                    <i class="fas fa-calendar me-2"></i>${formatDate(session.date)}
                                    <i class="fas fa-clock ms-3 me-2"></i>${session.time}
                                </p>
                                <p class="mb-0 small text-muted">${session.topic || "Learning Session"}</p>
                            </div>
                            <span class="badge bg-${session.status === "completed" ? "success" : session.status === "pending" ? "warning" : "primary"}">
                                ${session.status}
                            </span>
                        </div>
                        ${
                          session.feedback
                            ? `
                            <div class="mt-2 pt-2 border-top">
                                <small class="text-muted">Your feedback: "${session.feedback}"</small>
                            </div>
                        `
                            : ""
                        }
                    </div>
                `,
                  )
                  .join("")}
                ${sessions.length > 5 ? `<p class="text-center mt-2"><small class="text-muted">+${sessions.length - 5} more sessions</small></p>` : ""}
            `;
    } catch (error) {
      console.error("Failed to load session history:", error);
      const container = DOM.element("sessionHistoryContainer");
      if (container) {
        container.innerHTML =
          '<p class="text-muted text-center py-3">Unable to load session history</p>';
      }
    }
  }

  showEditModal() {
    const user = this.currentUser;

    const modalHtml = `
            <div class="modal fade" id="editProfileModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title">Edit Profile</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="editProfileForm">
                                <div class="mb-3">
                                    <label class="form-label">First Name</label>
                                    <input type="text" class="form-control" id="editFirstName" value="${user.firstName}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Last Name</label>
                                    <input type="text" class="form-control" id="editLastName" value="${user.lastName}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Bio</label>
                                    <textarea class="form-control" id="editBio" rows="4" placeholder="Tell others about yourself, your experience, and what you're passionate about...">${user.bio || ""}</textarea>
                                </div>
                                <button type="submit" class="btn btn-primary-gradient w-100">Save Changes</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Remove existing modal if any
    const existingModal = document.getElementById("editProfileModal");
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(
      document.getElementById("editProfileModal"),
    );
    modal.show();

    document
      .getElementById("editProfileForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.updateProfile();
      });
  }

  async updateProfile() {
    const updatedData = {
      firstName: document.getElementById("editFirstName").value,
      lastName: document.getElementById("editLastName").value,
      bio: document.getElementById("editBio").value,
    };

    try {
      await api.users.updateProfile(updatedData);
      this.currentUser = { ...this.currentUser, ...updatedData };
      auth.updateUser(updatedData);

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editProfileModal"),
      );
      modal.hide();

      await this.loadProfile();
      showToast("Profile updated successfully!", "success");
    } catch (error) {
      showToast("Failed to update profile", "error");
    }
  }

  showAddSkillModal(type) {
    const allSkills = [
      "JavaScript",
      "Python",
      "React",
      "Node.js",
      "HTML/CSS",
      "UI/UX Design",
      "Data Science",
      "Machine Learning",
      "Digital Marketing",
      "SEO",
      "SQL",
      "MongoDB",
      "Express.js",
      "Vue.js",
      "Angular",
      "TypeScript",
      "PHP",
      "Laravel",
      "Ruby on Rails",
      "Swift",
      "Kotlin",
      "Flutter",
      "React Native",
      "AWS",
      "Docker",
      "Kubernetes",
      "DevOps",
      "Testing",
      "GraphQL",
      "Figma",
      "Adobe XD",
      "Photoshop",
      "Illustrator",
      "Video Editing",
      "Public Speaking",
      "Leadership",
      "Project Management",
      "Agile",
      "Scrum",
      "Excel",
      "Power BI",
      "Tableau",
      "Salesforce",
      "HubSpot",
    ];

    const currentSkills =
      type === "teach"
        ? this.currentUser.teachSkills
        : this.currentUser.learnSkills;
    const availableSkills = allSkills.filter((s) => !currentSkills.includes(s));

    const modalHtml = `
            <div class="modal fade" id="addSkillModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0">
                            <h5 class="modal-title">Add ${type === "teach" ? "Teaching" : "Learning"} Skill</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addSkillForm">
                                <div class="mb-3">
                                    <label class="form-label">Select Skill</label>
                                    <select class="form-select" id="skillSelect" required>
                                        <option value="">Choose a skill...</option>
                                        ${availableSkills.map((skill) => `<option value="${skill}">${skill}</option>`).join("")}
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Or Add Custom Skill</label>
                                    <input type="text" class="form-control" id="customSkill" placeholder="Enter custom skill">
                                </div>
                                <button type="submit" class="btn btn-primary-gradient w-100">Add Skill</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

    const existingModal = document.getElementById("addSkillModal");
    if (existingModal) {
      existingModal.remove();
    }

    document.body.insertAdjacentHTML("beforeend", modalHtml);

    const modal = new bootstrap.Modal(document.getElementById("addSkillModal"));
    modal.show();

    document
      .getElementById("addSkillForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        const selectSkill = document.getElementById("skillSelect").value;
        const customSkill = document.getElementById("customSkill").value.trim();
        const skill = customSkill || selectSkill;

        if (!skill) {
          showToast("Please select or enter a skill", "warning");
          return;
        }

        await this.addSkill(skill, type);
        modal.hide();
      });
  }

  async addSkill(skill, type) {
    try {
      if (type === "teach") {
        this.currentUser.teachSkills.push(skill);
      } else {
        this.currentUser.learnSkills.push(skill);
      }

      await api.users.updateSkills(
        this.currentUser.teachSkills,
        this.currentUser.learnSkills,
      );
      auth.updateUser(this.currentUser);

      await this.loadProfile();
      showToast(
        `"${skill}" added to ${type === "teach" ? "teaching" : "learning"} skills!`,
        "success",
      );
    } catch (error) {
      showToast("Failed to add skill", "error");
    }
  }

  async removeSkill(skill, type) {
    if (
      !confirm(
        `Remove "${skill}" from your ${type === "teach" ? "teaching" : "learning"} skills?`,
      )
    ) {
      return;
    }

    try {
      if (type === "teach") {
        this.currentUser.teachSkills = this.currentUser.teachSkills.filter(
          (s) => s !== skill,
        );
      } else {
        this.currentUser.learnSkills = this.currentUser.learnSkills.filter(
          (s) => s !== skill,
        );
      }

      await api.users.updateSkills(
        this.currentUser.teachSkills,
        this.currentUser.learnSkills,
      );
      auth.updateUser(this.currentUser);

      await this.loadProfile();
      showToast(`"${skill}" removed from your skills`, "success");
    } catch (error) {
      showToast("Failed to remove skill", "error");
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

// Global functions for profile
window.profile = null;

// Upload avatar function
window.uploadAvatar = async (input) => {
  if (input.files && input.files[0]) {
    const file = input.files[0];

    if (file.size > 2 * 1024 * 1024) {
      showToast("Image size must be less than 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const avatarUrl = e.target.result;

      try {
        await api.users.updateProfile({ avatar: avatarUrl });
        auth.updateUser({ avatar: avatarUrl });
        showToast("Avatar updated successfully!", "success");

        if (window.profile) {
          await window.profile.loadProfile();
        }
      } catch (error) {
        showToast("Failed to update avatar", "error");
      }
    };
    reader.readAsDataURL(file);
  }
};

// Initialize profile when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.profile = new Profile();
});

// Make functions globally accessible for onclick handlers
window.removeSkill = (skill, type) => {
  if (window.profile) {
    window.profile.removeSkill(skill, type);
  }
};
