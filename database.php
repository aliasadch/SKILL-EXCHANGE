<?php
// =====================================================
// DATABASE CONNECTION
// =====================================================

class Database {
    private $host = "localhost";
    private $db_name = "skill_exchange_db";
    private $username = "root";
    private $password = "";
    public $conn;

    /**
     * Get database connection
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->exec("set names utf8mb4");
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed'
            ]);
            exit();
        }
        
        return $this->conn;
    }
    
    /**
     * Test database connection
     * @return bool
     */
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            return $conn !== null;
        } catch(Exception $e) {
            return false;
        }
    }
    
    /**
     * Begin transaction
     */
    public function beginTransaction() {
        if ($this->conn) {
            $this->conn->beginTransaction();
        }
    }
    
    /**
     * Commit transaction
     */
    public function commit() {
        if ($this->conn) {
            $this->conn->commit();
        }
    }
    
    /**
     * Rollback transaction
     */
    public function rollback() {
        if ($this->conn) {
            $this->conn->rollBack();
        }
    }
}

// Initialize database connection
$database = new Database();
$db = $database->getConnection();
?>