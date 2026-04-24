<?php
// =====================================================
// USER MODEL
// =====================================================

class User {
    private $db;
    private $table = "users";
    
    public $id;
    public $email;
    public $password_hash;
    public $first_name;
    public $last_name;
    public $bio;
    public $avatar;
    public $rating;
    public $is_active;
    public $is_admin;
    public $created_at;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Create new user
     * @return bool
     */
    public function create() {
        $query = "INSERT INTO " . $this->table . "
                  SET email = :email,
                      password_hash = :password_hash,
                      first_name = :first_name,
                      last_name = :last_name,
                      bio = :bio";
        
        $stmt = $this->db->prepare($query);
        
        $this->password_hash = password_hash($this->password_hash, PASSWORD_DEFAULT);
        
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $this->password_hash);
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":bio", $this->bio);
        
        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        
        return false;
    }
    
    /**
     * Get user by email
     * @return bool
     */
    public function getByEmail() {
        $query = "SELECT * FROM " . $this->table . " WHERE email = :email LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->mapData($row);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get user by ID
     * @param int $id
     * @return bool
     */
    public function getById($id) {
        $query = "SELECT * FROM " . $this->table . " WHERE id = :id LIMIT 1";
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
     * Update user
     * @return bool
     */
    public function update() {
        $query = "UPDATE " . $this->table . "
                  SET first_name = :first_name,
                      last_name = :last_name,
                      bio = :bio,
                      avatar = :avatar
                  WHERE id = :id";
        
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":bio", $this->bio);
        $stmt->bindParam(":avatar", $this->avatar);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }
    
    /**
     * Delete user
     * @return bool
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id", $this->id);
        return $stmt->execute();
    }
    
    /**
     * Verify password
     * @param string $password
     * @return bool
     */
    public function verifyPassword($password) {
        return password_verify($password, $this->password_hash);
    }
    
    /**
     * Map database row to object properties
     * @param array $data
     */
    private function mapData($data) {
        $this->id = $data['id'];
        $this->email = $data['email'];
        $this->password_hash = $data['password_hash'];
        $this->first_name = $data['first_name'];
        $this->last_name = $data['last_name'];
        $this->bio = $data['bio'];
        $this->avatar = $data['avatar'];
        $this->rating = $data['rating'];
        $this->is_active = $data['is_active'];
        $this->is_admin = $data['is_admin'];
        $this->created_at = $data['created_at'];
    }
    
    /**
     * Get full name
     * @return string
     */
    public function getFullName() {
        return $this->first_name . ' ' . $this->last_name;
    }
    
    /**
     * Get user skills
     * @return array
     */
    public function getSkills() {
        return getUserSkills($this->id);
    }
}