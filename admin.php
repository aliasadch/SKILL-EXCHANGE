<?php
// =====================================================
// ADMIN API - Platform management
// =====================================================

require_once __DIR__ . '/../config/database.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Start session
session_start();

// Check if user is logged in and is admin
function isAdmin() {
    if (!isset($_SESSION['user_id'])) {
        return false;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    $stmt = $db->prepare("SELECT is_admin FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $user && $user['is_admin'] == 1;
}

// Send JSON response
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Check admin access
if (!isAdmin()) {
    sendResponse(['success' => false, 'message' => 'Unauthorized access'], 403);
}

$database = new Database();
$db = $database->getConnection();
$request_method = $_SERVER['REQUEST_METHOD'];

switch ($request_method) {
    case 'GET':
        // Get platform statistics
        if (strpos($_SERVER['REQUEST_URI'], '/stats') !== false) {
            try {
                // Total users
                $userStmt = $db->query("SELECT COUNT(*) as total, SUM(is_active) as active FROM users");
                $userStats = $userStmt->fetch(PDO::FETCH_ASSOC);
                
                // Total sessions
                $sessionStmt = $db->query("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
                    FROM sessions
                ");
                $sessionStats = $sessionStmt->fetch(PDO::FETCH_ASSOC);
                
                // Average rating
                $reviewStmt = $db->query("SELECT AVG(rating) as avg_rating FROM reviews");
                $reviewStats = $reviewStmt->fetch(PDO::FETCH_ASSOC);
                
                $stats = [
                    'totalUsers' => (int)$userStats['total'],
                    'activeUsers' => (int)$userStats['active'],
                    'totalSessions' => (int)$sessionStats['total'],
                    'completedSessions' => (int)$sessionStats['completed'],
                    'averageRating' => round($reviewStats['avg_rating'] ?? 0, 1)
                ];
                
                sendResponse(['success' => true, 'data' => $stats]);
            } catch (Exception $e) {
                sendResponse(['success' => false, 'message' => $e->getMessage()], 500);
            }
        }
        // Get all users
        elseif (strpos($_SERVER['REQUEST_URI'], '/users') !== false) {
            try {
                $search = $_GET['search'] ?? '';
                
                $query = "SELECT id, email, first_name, last_name, bio, avatar, rating, is_active, is_admin, created_at FROM users";
                $params = [];
                
                if (!empty($search)) {
                    $query .= " WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?";
                    $searchParam = "%$search%";
                    $params = [$searchParam, $searchParam, $searchParam];
                }
                
                $query .= " ORDER BY created_at DESC";
                
                $stmt = $db->prepare($query);
                $stmt->execute($params);
                $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Get skill counts for each user
                foreach ($users as &$user) {
                    // Get teach skills count
                    $teachStmt = $db->prepare("
                        SELECT COUNT(*) as count FROM user_skills 
                        WHERE user_id = ? AND skill_type = 'teach'
                    ");
                    $teachStmt->execute([$user['id']]);
                    $user['teach_skills_count'] = (int)$teachStmt->fetch(PDO::FETCH_ASSOC)['count'];
                    
                    // Get learn skills count
                    $learnStmt = $db->prepare("
                        SELECT COUNT(*) as count FROM user_skills 
                        WHERE user_id = ? AND skill_type = 'learn'
                    ");
                    $learnStmt->execute([$user['id']]);
                    $user['learn_skills_count'] = (int)$learnStmt->fetch(PDO::FETCH_ASSOC)['count'];
                }
                
                sendResponse(['success' => true, 'data' => $users]);
            } catch (Exception $e) {
                sendResponse(['success' => false, 'message' => $e->getMessage()], 500);
            }
        }
        else {
            sendResponse(['success' => false, 'message' => 'Invalid endpoint'], 404);
        }
        break;
        
    case 'PUT':
        // Update user status
        $uri_parts = explode('/', $_SERVER['REQUEST_URI']);
        $targetUserId = end($uri_parts);
        
        if (strpos($_SERVER['REQUEST_URI'], '/status') !== false) {
            $input = json_decode(file_get_contents('php://input'), true);
            
            try {
                // Get current status
                $stmt = $db->prepare("SELECT is_active FROM users WHERE id = ?");
                $stmt->execute([$targetUserId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user) {
                    sendResponse(['success' => false, 'message' => 'User not found'], 404);
                }
                
                $newStatus = $user['is_active'] ? 0 : 1;
                $updateStmt = $db->prepare("UPDATE users SET is_active = ? WHERE id = ?");
                
                if ($updateStmt->execute([$newStatus, $targetUserId])) {
                    sendResponse(['success' => true, 'message' => 'User status updated']);
                } else {
                    sendResponse(['success' => false, 'message' => 'Failed to update status'], 500);
                }
            } catch (Exception $e) {
                sendResponse(['success' => false, 'message' => $e->getMessage()], 500);
            }
        } else {
            sendResponse(['success' => false, 'message' => 'Invalid endpoint'], 404);
        }
        break;
        
    case 'DELETE':
        // Delete user
        $uri_parts = explode('/', $_SERVER['REQUEST_URI']);
        $targetUserId = end($uri_parts);
        $currentUserId = $_SESSION['user_id'];
        
        if ($targetUserId == $currentUserId) {
            sendResponse(['success' => false, 'message' => 'Cannot delete yourself'], 403);
        }
        
        try {
            $db->beginTransaction();
            
            // Delete user skills
            $stmt = $db->prepare("DELETE FROM user_skills WHERE user_id = ?");
            $stmt->execute([$targetUserId]);
            
            // Delete messages
            $stmt = $db->prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?");
            $stmt->execute([$targetUserId, $targetUserId]);
            
            // Delete sessions
            $stmt = $db->prepare("DELETE FROM sessions WHERE teacher_id = ? OR student_id = ?");
            $stmt->execute([$targetUserId, $targetUserId]);
            
            // Delete reviews
            $stmt = $db->prepare("DELETE FROM reviews WHERE reviewer_id = ? OR reviewee_id = ?");
            $stmt->execute([$targetUserId, $targetUserId]);
            
            // Delete match requests
            $stmt = $db->prepare("DELETE FROM match_requests WHERE from_user_id = ? OR to_user_id = ?");
            $stmt->execute([$targetUserId, $targetUserId]);
            
            // Delete progress tracking
            $stmt = $db->prepare("DELETE FROM progress_tracking WHERE user_id = ?");
            $stmt->execute([$targetUserId]);
            
            // Delete notifications
            $stmt = $db->prepare("DELETE FROM notifications WHERE user_id = ?");
            $stmt->execute([$targetUserId]);
            
            // Delete user
            $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$targetUserId]);
            
            $db->commit();
            sendResponse(['success' => true, 'message' => 'User deleted successfully']);
        } catch (Exception $e) {
            $db->rollBack();
            sendResponse(['success' => false, 'message' => 'Failed to delete user: ' . $e->getMessage()], 500);
        }
        break;
        
    default:
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}
?>