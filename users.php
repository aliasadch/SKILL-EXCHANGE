<?php
// =====================================================
// USER MANAGEMENT API ENDPOINTS
// =====================================================

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

requireAuth();

$request_method = $_SERVER['REQUEST_METHOD'];
$userId = getCurrentUserId();

switch ($request_method) {
    case 'GET':
        // Get current user profile
        if (strpos($_SERVER['REQUEST_URI'], '/profile') !== false) {
            $stmt = $db->prepare("
                SELECT id, email, first_name, last_name, bio, avatar, rating, total_sessions, created_at 
                FROM users WHERE id = ?
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch();
            
            if ($user) {
                $user['skills'] = getUserSkills($userId);
                sendSuccess($user);
            } else {
                sendError('User not found', 404);
            }
        }
        
        // Get user skills
        elseif (strpos($_SERVER['REQUEST_URI'], '/skills') !== false) {
            $skills = getUserSkills($userId);
            sendSuccess($skills);
        }
        
        // Get specific user
        else {
            $parts = explode('/', $_SERVER['REQUEST_URI']);
            $targetId = end($parts);
            if (is_numeric($targetId) && $targetId != $userId) {
                $stmt = $db->prepare("
                    SELECT id, first_name, last_name, email, bio, avatar, rating 
                    FROM users WHERE id = ? AND is_active = 1
                ");
                $stmt->execute([$targetId]);
                $user = $stmt->fetch();
                
                if ($user) {
                    $user['skills'] = getUserSkills($targetId);
                    sendSuccess($user);
                } else {
                    sendError('User not found', 404);
                }
            } else {
                sendError('Invalid request', 400);
            }
        }
        break;
        
    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Update profile
        if (strpos($_SERVER['REQUEST_URI'], '/profile') !== false) {
            $updateFields = [];
            $params = [];
            
            if (isset($input['first_name'])) {
                $updateFields[] = "first_name = ?";
                $params[] = sanitizeInput($input['first_name']);
            }
            if (isset($input['last_name'])) {
                $updateFields[] = "last_name = ?";
                $params[] = sanitizeInput($input['last_name']);
            }
            if (isset($input['bio'])) {
                $updateFields[] = "bio = ?";
                $params[] = sanitizeInput($input['bio']);
            }
            if (isset($input['avatar'])) {
                $updateFields[] = "avatar = ?";
                $params[] = $input['avatar'];
            }
            
            if (empty($updateFields)) {
                sendError('No fields to update');
            }
            
            $params[] = $userId;
            $query = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?";
            $stmt = $db->prepare($query);
            
            if ($stmt->execute($params)) {
                sendSuccess(null, 'Profile updated successfully');
            } else {
                sendError('Failed to update profile');
            }
        }
        
        // Update skills
        elseif (strpos($_SERVER['REQUEST_URI'], '/skills') !== false) {
            // Delete existing skills
            $stmt = $db->prepare("DELETE FROM user_skills WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            // Add new skills
            if (!empty($input['teach'])) {
                addUserSkills($userId, $input['teach'], 'teach');
            }
            if (!empty($input['learn'])) {
                addUserSkills($userId, $input['learn'], 'learn');
            }
            
            sendSuccess(null, 'Skills updated successfully');
        }
        
        else {
            sendError('Invalid endpoint', 404);
        }
        break;
        
    case 'POST':
        // Upload avatar
        if (strpos($_SERVER['REQUEST_URI'], '/avatar') !== false) {
            if (isset($_FILES['avatar'])) {
                $uploadDir = UPLOAD_PATH . 'avatars/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $filename = uploadFile($_FILES['avatar'], $uploadDir);
                if ($filename) {
                    $avatarUrl = BASE_URL . 'uploads/avatars/' . $filename;
                    $stmt = $db->prepare("UPDATE users SET avatar = ? WHERE id = ?");
                    $stmt->execute([$avatarUrl, $userId]);
                    sendSuccess(['avatar' => $avatarUrl], 'Avatar uploaded successfully');
                } else {
                    sendError('Failed to upload avatar');
                }
            } else {
                sendError('No file uploaded');
            }
        }
        else {
            sendError('Invalid endpoint', 404);
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}