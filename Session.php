<?php
// =====================================================
// SESSION MODEL
// =====================================================

class Session {
    private $db;
    private $table = "sessions";
    
    public $id;
    public $teacher_id;
    public $student_id;
    public $skill_id;
    public $title;
    public $description;
    public $session_date;
    public $session_time;
    public $duration;
    public $mode;
    public $meeting_link;
    public $location;
    public $status;
    public $created_at;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Create new session
     * @return bool
     */
    public function create() {
        $query = "INSERT INTO " . $this->table . "
                  SET teacher_id = :teacher_id,
                      student_id = :student_id,
                      skill_id = :skill_id,
                      title = :title,
                      description = :description,
                      session_date = :session_date,
                      session_time = :session_time,
                      duration = :duration,
                      mode = :mode,
                      meeting_link = :meeting_link,
                      location = :location";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":teacher_id", $this->teacher_id);
        $stmt->bindParam(":student_id", $this->student_id);
        $stmt->bindParam(":skill_id", $this->skill_id);
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":session_date", $this->session_date);
        $stmt->bindParam(":session_time", $this->session_time);
        $stmt->bindParam(":duration", $this->duration);
        $stmt->bindParam(":mode", $this->mode);
        $stmt->bindParam(":meeting_link", $this->meeting_link);
        $stmt->bindParam(":location", $this->location);
        
        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        
        return false;
    }
    
    /**
     * Get session by ID
     * @param int $id
     * @return bool
     */
    public function getById($id) {
        $query = "SELECT s.*, 
                         u1.first_name as teacher_first, u1.last_name as teacher_last,
                         u2.first_name as student_first, u2.last_name as student_last
                  FROM " . $this->table . " s
                  JOIN users u1 ON s.teacher_id = u1.id
                  JOIN users u2 ON s.student_id = u2.id
                  WHERE s.id = :id LIMIT 1";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->mapData($row);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get user sessions
     * @param int $userId
     * @param string $status
     * @return array
     */
    public function getUserSessions($userId, $status = '') {
        $query = "SELECT s.*, 
                         u1.first_name as teacher_first, u1.last_name as teacher_last,
                         u2.first_name as student_first, u2.last_name as student_last
                  FROM " . $this->table . " s
                  JOIN users u1 ON s.teacher_id = u1.id
                  JOIN users u2 ON s.student_id = u2.id
                  WHERE s.teacher_id = :userId OR s.student_id = :userId";
        
        if (!empty($status)) {
            $query .= " AND s.status = :status";
        }
        
        $query .= " ORDER BY s.session_date DESC, s.session_time DESC";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":userId", $userId);
        
        if (!empty($status)) {
            $stmt->bindParam(":status", $status);
        }
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Update session status
     * @param string $status
     * @return bool
     */
    public function updateStatus($status) {
        $query = "UPDATE " . $this->table . " SET status = :status WHERE id = :id";
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }
    
    /**
     * Update session
     * @return bool
     */
    public function update() {
        $query = "UPDATE " . $this->table . "
                  SET title = :title,
                      description = :description,
                      session_date = :session_date,
                      session_time = :session_time,
                      duration = :duration,
                      mode = :mode,
                      meeting_link = :meeting_link,
                      location = :location
                  WHERE id = :id";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":title", $this->title);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":session_date", $this->session_date);
        $stmt->bindParam(":session_time", $this->session_time);
        $stmt->bindParam(":duration", $this->duration);
        $stmt->bindParam(":mode", $this->mode);
        $stmt->bindParam(":meeting_link", $this->meeting_link);
        $stmt->bindParam(":location", $this->location);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }
    
    /**
     * Cancel session
     * @return bool
     */
    public function cancel() {
        return $this->updateStatus('cancelled');
    }
    
    /**
     * Complete session
     * @return bool
     */
    public function complete() {
        return $this->updateStatus('completed');
    }
    
    /**
     * Accept session
     * @return bool
     */
    public function accept() {
        return $this->updateStatus('accepted');
    }
    
    /**
     * Map database row to object properties
     * @param array $data
     */
    private function mapData($data) {
        $this->id = $data['id'];
        $this->teacher_id = $data['teacher_id'];
        $this->student_id = $data['student_id'];
        $this->skill_id = $data['skill_id'];
        $this->title = $data['title'];
        $this->description = $data['description'];
        $this->session_date = $data['session_date'];
        $this->session_time = $data['session_time'];
        $this->duration = $data['duration'];
        $this->mode = $data['mode'];
        $this->meeting_link = $data['meeting_link'];
        $this->location = $data['location'];
        $this->status = $data['status'];
        $this->created_at = $data['created_at'];
    }
}