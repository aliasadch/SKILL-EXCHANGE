<?php
// =====================================================
// SKILL MODEL
// =====================================================

class Skill {
    private $db;
    private $table = "skills";
    
    public $id;
    public $name;
    public $category;
    public $icon;
    public $created_at;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Create new skill
     * @return bool
     */
    public function create() {
        $query = "INSERT INTO " . $this->table . " (name, category, icon) VALUES (:name, :category, :icon)";
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":icon", $this->icon);
        
        if ($stmt->execute()) {
            $this->id = $this->db->lastInsertId();
            return true;
        }
        
        return false;
    }
    
    /**
     * Get skill by ID
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
     * Get skill by name
     * @param string $name
     * @return bool
     */
    public function getByName($name) {
        $query = "SELECT * FROM " . $this->table . " WHERE name = :name LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":name", $name);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->mapData($row);
            return true;
        }
        
        return false;
    }
    
    /**
     * Get all skills
     * @param string $search
     * @return array
     */
    public function getAll($search = '') {
        $query = "SELECT * FROM " . $this->table;
        
        if (!empty($search)) {
            $query .= " WHERE name LIKE :search";
        }
        
        $query .= " ORDER BY name ASC";
        
        $stmt = $this->db->prepare($query);
        
        if (!empty($search)) {
            $searchParam = "%$search%";
            $stmt->bindParam(":search", $searchParam);
        }
        
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Update skill
     * @return bool
     */
    public function update() {
        $query = "UPDATE " . $this->table . " SET name = :name, category = :category, icon = :icon WHERE id = :id";
        $stmt = $this->db->prepare($query);
        
        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":icon", $this->icon);
        $stmt->bindParam(":id", $this->id);
        
        return $stmt->execute();
    }
    
    /**
     * Delete skill
     * @return bool
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":id", $this->id);
        return $stmt->execute();
    }
    
    /**
     * Map database row to object properties
     * @param array $data
     */
    private function mapData($data) {
        $this->id = $data['id'];
        $this->name = $data['name'];
        $this->category = $data['category'];
        $this->icon = $data['icon'];
        $this->created_at = $data['created_at'];
    }
    
    /**
     * Get popular skills
     * @param int $limit
     * @return array
     */
    public function getPopular($limit = 10) {
        $query = "SELECT s.*, COUNT(us.skill_id) as usage_count
                  FROM " . $this->table . " s
                  JOIN user_skills us ON s.id = us.skill_id
                  GROUP BY s.id
                  ORDER BY usage_count DESC
                  LIMIT :limit";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}