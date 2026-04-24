<?php
// =====================================================
// MESSAGE MODEL
// =====================================================

class Message {
    private $db;
    private $table = "messages";
    
    public $id;
    public $sender_id;
    public $receiver_id;
    public $session_id;
    public $message;
    public $is_read;
    public $created_at;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Send new message
     * @return bool
     */
    public function send() {
        $query = "INSERT INTO " . $this->table . "
                  SET sender_id = :sender_id,
                      receiver_id = :receiver_id,
                      session_id = :session_id,
                      message = :message";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":sender_id", $this->sender_id);
        $stmt->bindParam(":receiver_id", $this->receiver_id);
        $stmt->bindParam(":session_id", $this->session_id);
        $stmt->bindParam(":message", $this->message);
        
        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }
    
    /**
     * Get conversation between two users
     * @param int $user1
     * @param int $user2
     * @return array
     */
    public function getConversation($user1, $user2) {
        $query = "SELECT * FROM " . $this->table . "
                  WHERE (sender_id = :user1 AND receiver_id = :user2)
                     OR (sender_id = :user2 AND receiver_id = :user1)
                  ORDER BY created_at ASC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user1", $user1);
        $stmt->bindParam(":user2", $user2);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get all conversations for a user
     * @param int $userId
     * @return array
     */
    public function getConversations($userId) {
        $query = "SELECT DISTINCT 
                    CASE 
                        WHEN sender_id = :user_id THEN receiver_id
                        ELSE sender_id
                    END as other_user_id,
                    MAX(created_at) as last_message_time,
                    (SELECT message FROM messages m2 
                     WHERE (m2.sender_id = :user_id AND m2.receiver_id = other_user_id)
                        OR (m2.sender_id = other_user_id AND m2.receiver_id = :user_id)
                     ORDER BY m2.created_at DESC LIMIT 1) as last_message,
                    SUM(CASE WHEN receiver_id = :user_id AND is_read = 0 THEN 1 ELSE 0 END) as unread_count
                  FROM messages
                  WHERE sender_id = :user_id OR receiver_id = :user_id
                  GROUP BY other_user_id
                  ORDER BY last_message_time DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Mark messages as read
     * @param int $senderId
     * @param int $receiverId
     * @return bool
     */
    public function markAsRead($senderId, $receiverId) {
        $query = "UPDATE " . $this->table . "
                  SET is_read = 1
                  WHERE sender_id = :sender_id AND receiver_id = :receiver_id AND is_read = 0";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":sender_id", $senderId);
        $stmt->bindParam(":receiver_id", $receiverId);
        
        return $stmt->execute();
    }
    
    /**
     * Get unread count for user
     * @param int $userId
     * @return int
     */
    public function getUnreadCount($userId) {
        $query = "SELECT COUNT(*) as count FROM " . $this->table . "
                  WHERE receiver_id = :user_id AND is_read = 0";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['count'] ?? 0;
    }
}