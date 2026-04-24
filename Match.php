<?php
// =====================================================
// MATCH MODEL
// =====================================================

class Match {
    private $db;
    private $table = "match_requests";
    
    public $id;
    public $from_user_id;
    public $to_user_id;
    public $skill_id;
    public $message;
    public $status;
    public $created_at;
    public $responded_at;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Create match request
     * @return bool
     */
    public function create() {
        $query = "INSERT INTO " . $this->table . "
                  SET from_user_id = :from_user_id,
                      to_user_id = :to_user_id,
                      skill_id = :skill_id,
                      message = :message";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":from_user_id", $this->from_user_id);
        $stmt->bindParam(":to_user_id", $this->to_user_id);
        $stmt->bindParam(":skill_id", $this->skill_id);
        $stmt->bindParam(":message", $this->message);
        
        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }
    
    /**
     * Get pending requests for user
     * @param int $userId
     * @return array
     */
    public function getPendingRequests($userId) {
        $query = "SELECT mr.*, u.first_name, u.last_name, u.email, u.rating
                  FROM " . $this->table . " mr
                  JOIN users u ON mr.from_user_id = u.id
                  WHERE mr.to_user_id = :user_id AND mr.status = 'pending'
                  ORDER BY mr.created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Update request status
     * @param int $requestId
     * @param string $status
     * @param int $userId
     * @return bool
     */
    public function updateStatus($requestId, $status, $userId) {
        $query = "UPDATE " . $this->table . "
                  SET status = :status, responded_at = NOW()
                  WHERE id = :id AND to_user_id = :user_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $requestId);
        $stmt->bindParam(":user_id", $userId);
        
        return $stmt->execute();
    }
    
    /**
     * Check if request already exists
     * @param int $fromUserId
     * @param int $toUserId
     * @return bool
     */
    public function requestExists($fromUserId, $toUserId) {
        $query = "SELECT id FROM " . $this->table . "
                  WHERE from_user_id = :from_user_id 
                    AND to_user_id = :to_user_id 
                    AND status = 'pending'";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":from_user_id", $fromUserId);
        $stmt->bindParam(":to_user_id", $toUserId);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Delete request
     * @param int $requestId
     * @param int $userId
     * @return bool
     */
    public function delete($requestId, $userId) {
        $query = "DELETE FROM " . $this->table . "
                  WHERE id = :id AND (from_user_id = :user_id OR to_user_id = :user_id)";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id", $requestId);
        $stmt->bindParam(":user_id", $userId);
        
        return $stmt->execute();
    }
}