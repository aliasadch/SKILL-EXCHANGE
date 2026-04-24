<?php
// =====================================================
// REVIEW MODEL
// =====================================================

class Review {
    private $db;
    private $table = "reviews";
    
    public $id;
    public $session_id;
    public $reviewer_id;
    public $reviewee_id;
    public $rating;
    public $feedback;
    public $tags;
    public $created_at;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Create new review
     * @return bool
     */
    public function create() {
        $query = "INSERT INTO " . $this->table . "
                  SET session_id = :session_id,
                      reviewer_id = :reviewer_id,
                      reviewee_id = :reviewee_id,
                      rating = :rating,
                      feedback = :feedback,
                      tags = :tags";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":session_id", $this->session_id);
        $stmt->bindParam(":reviewer_id", $this->reviewer_id);
        $stmt->bindParam(":reviewee_id", $this->reviewee_id);
        $stmt->bindParam(":rating", $this->rating);
        $stmt->bindParam(":feedback", $this->feedback);
        $stmt->bindParam(":tags", $this->tags);
        
        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        return false;
    }
    
    /**
     * Check if user already reviewed a session
     * @param int $sessionId
     * @param int $userId
     * @return bool
     */
    public function hasReviewed($sessionId, $userId) {
        $query = "SELECT id FROM " . $this->table . "
                  WHERE session_id = :session_id AND reviewer_id = :user_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":session_id", $sessionId);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Get reviews for a user
     * @param int $userId
     * @return array
     */
    public function getUserReviews($userId) {
        $query = "SELECT r.*, 
                         u.first_name as reviewer_first, u.last_name as reviewer_last,
                         u.avatar as reviewer_avatar,
                         s.title as session_title
                  FROM " . $this->table . " r
                  JOIN users u ON r.reviewer_id = u.id
                  LEFT JOIN sessions s ON r.session_id = s.id
                  WHERE r.reviewee_id = :user_id
                  ORDER BY r.created_at DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get average rating for a user
     * @param int $userId
     * @return float
     */
    public function getAverageRating($userId) {
        $query = "SELECT AVG(rating) as avg_rating FROM " . $this->table . "
                  WHERE reviewee_id = :user_id";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return round($result['avg_rating'] ?? 0, 1);
    }
}