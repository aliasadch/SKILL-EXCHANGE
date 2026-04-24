// ============================================
// CHAT MODULE - COMPLETE WITH REAL-TIME MESSAGING
// ============================================

class Chat {
  constructor() {
    if (!auth.checkAuth()) {
      window.location.href = "index.html";
      return;
    }
    this.currentUser = auth.getCurrentUser();
    this.currentChatUser = null;
    this.pollingInterval = null;
    this.init();
  }

  async init() {
    await this.loadUserInfo();
    await this.loadConversations();
    this.setupEventListeners();
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

  async loadConversations() {
    try {
      const response = await api.messages.getConversations();
      const conversations = response.conversations || [];

      const container = DOM.element("conversationsList");
      if (!container) return;

      if (conversations.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-comments fa-3x text-muted mb-2"></i>
                        <p class="text-muted mb-0">No conversations yet</p>
                        <small class="text-muted">Start by connecting with matches!</small>
                    </div>
                `;
        return;
      }

      container.innerHTML = conversations
        .map(
          (conv) => `
                <div class="conversation-item d-flex align-items-center p-3 ${this.currentChatUser === conv.userId ? "active" : ""}" 
                     data-user-id="${conv.userId}" onclick="chat.selectConversation(${conv.userId})">
                    <div class="conversation-avatar me-3">
                        ${conv.user?.firstName[0]}${conv.user?.lastName[0]}
                        ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ""}
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h6 class="mb-0">${conv.user?.firstName} ${conv.user?.lastName}</h6>
                            <small class="text-muted">${timeAgo(conv.lastMessageTime)}</small>
                        </div>
                        <p class="mb-0 small text-muted">${conv.lastMessage?.substring(0, 50)}${conv.lastMessage?.length > 50 ? "..." : ""}</p>
                    </div>
                </div>
            `,
        )
        .join("");
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }

  async selectConversation(userId) {
    this.currentChatUser = userId;

    // Update active state in conversation list
    document.querySelectorAll(".conversation-item").forEach((item) => {
      item.classList.remove("active");
      if (parseInt(item.dataset.userId) === userId) {
        item.classList.add("active");
      }
    });

    await this.loadMessages(userId);
    this.startPolling(userId);

    // Show chat area
    const chatArea = DOM.element("chatArea");
    if (chatArea) {
      chatArea.style.display = "flex";
    }
  }

  async loadMessages(userId) {
    try {
      const response = await api.messages.getMessages(userId);
      const messages = response.messages || [];

      const container = DOM.element("chatMessages");
      if (!container) return;

      if (messages.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-5">
                        <i class="fas fa-comment-dots fa-3x text-muted mb-2"></i>
                        <p class="text-muted">No messages yet</p>
                        <small class="text-muted">Send a message to start the conversation!</small>
                    </div>
                `;
        return;
      }

      container.innerHTML = messages
        .map((msg) => this.renderMessage(msg))
        .join("");
      container.scrollTop = container.scrollHeight;
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }

  renderMessage(message) {
    const isSent = message.senderId === this.currentUser.id;
    const user = isSent ? this.currentUser : null;

    return `
            <div class="message ${isSent ? "message-sent" : "message-received"}">
                <div class="message-content">
                    <p class="mb-1">${this.escapeHtml(message.message)}</p>
                    <small class="message-time">${formatTime(message.createdAt)}</small>
                    ${isSent ? `<i class="fas fa-check-double ms-1" style="font-size: 0.7rem;"></i>` : ""}
                </div>
            </div>
        `;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async sendMessage() {
    const input = DOM.element("messageInput");
    const message = input.value.trim();

    if (!message || !this.currentChatUser) return;

    // Clear input
    input.value = "";

    // Optimistically add message to UI
    const tempMessage = {
      id: Date.now(),
      senderId: this.currentUser.id,
      receiverId: this.currentChatUser,
      message: message,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const container = DOM.element("chatMessages");
    if (container) {
      const messageHtml = this.renderMessage(tempMessage);
      container.insertAdjacentHTML("beforeend", messageHtml);
      container.scrollTop = container.scrollHeight;
    }

    try {
      await api.messages.send(this.currentChatUser, message);
      await this.loadMessages(this.currentChatUser);
    } catch (error) {
      showToast("Failed to send message", "error");
      // Remove the optimistic message
      await this.loadMessages(this.currentChatUser);
    }
  }

  startPolling(userId) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(async () => {
      if (this.currentChatUser === userId) {
        await this.loadMessages(userId);
        await this.loadConversations(); // Update unread counts
      }
    }, 3000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  setupEventListeners() {
    // Send message on Enter key
    const messageInput = DOM.element("messageInput");
    if (messageInput) {
      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    // Send button
    const sendBtn = DOM.element("sendMessageBtn");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => {
        this.sendMessage();
      });
    }

    // Logout
    const logoutBtn = DOM.element("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.stopPolling();
        auth.logout();
      });
    }
  }
}

// Global chat instance
window.chat = null;

// Initialize chat when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.chat = new Chat();
});
