<?php
// =====================================================
// MATCHING ALGORITHM API
// =====================================================

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

requireAuth();

$userId = getCurrentUserId();
$request_method = $_SERVER['REQUEST_METHOD'];

switch ($request_method) {
    case 'GET':
        // Get matches for current user
        if (strpos($_SERVER['REQUEST_URI'], '/requests') !== false) {
            // Get match requests received
            $stmt = $db->prepare("
                SELECT mr.*, u.id as user_id, u.first_name, u.last_name, u.email, u.avatar, u.rating
                FROM match_requests mr
                JOIN users u ON mr.from_user_id = u.id
                WHERE mr.to_user_id = ? AND mr.status = 'pending'
                ORDER BY mr.created_at DESC
            ");
            $stmt->execute([$userId]);
            $requests = $stmt->fetchAll();
            
            sendSuccess($requests);
        } else {
            // Find matches
            // Get current user's skills
            $userSkills = getUserSkills($userId);
            
            // Find potential matches
            $stmt = $db->prepare("
                SELECT DISTINCT u.id, u.first_name, u.last_name, u.email, u.avatar, u.rating,
                GROUP_CONCAT(DISTINCT 
                    CASE WHEN us.skill_type = 'teach' AND ? 
                    THEN s.name END) as match_teach,
                GROUP_CONCAT(DISTINCT 
                    CASE WHEN us.skill_type = 'learn' AND ? 
                    THEN s.name END) as match_learn
                FROM users u
                JOIN user_skills us ON u.id = us.user_id
                JOIN skills s ON us.skill_id = s.id
                WHERE u.id != ? AND u.is_active = 1
                GROUP BY u.id
                HAVING match_teach IS NOT NULL OR match_learn IS NOT NULL
            ");
            
            // This is a simplified version - in production, use a more sophisticated query
            $allUsers = $db->prepare("SELECT id, first_name, last_name, rating FROM users WHERE id != ? AND is_active = 1");
            $allUsers->execute([$userId]);
            $potentialMatches = $allUsers->fetchAll();
            
            $matches = [];
            foreach ($potentialMatches as $potential) {
                $otherSkills = getUserSkills($potential['id']);
                $commonTeach = array_intersect($otherSkills['teach'], $userSkills['learn']);
                $commonLearn = array_intersect($otherSkills['learn'], $userSkills['teach']);
                
                if (!empty($commonTeach) || !empty($commonLearn)) {
                    $matches[] = [
                        'user' => $potential,
                        'score' => (count($commonTeach) + count($commonLearn)) * 10 + ($potential['rating'] * 2),
                        'common_teach' => array_values($commonTeach),
                        'common_learn' => array_values($commonLearn)
                    ];
                }
            }
            
            // Sort by score
            usort($matches, function($a, $b) {
                return $b['score'] - $a['score'];
            });
            
            sendSuccess($matches);
        }
        break;
        
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Send match request
        $toUserId = $input['to_user_id'] ?? null;
        $skillId = $input['skill_id'] ?? null;
        $message = sanitizeInput($input['message'] ?? '');
        
        if (!$toUserId) {
            sendError('User ID required');
        }
        
        // Check if request already exists
        $stmt = $db->prepare("
            SELECT id FROM match_requests 
            WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'
        ");
        $stmt->execute([$userId, $toUserId]);
        
        if ($stmt->fetch()) {
            sendError('Request already sent');
        }
        
        // Create request
        $stmt = $db->prepare("
            INSERT INTO match_requests (from_user_id, to_user_id, skill_id, message)
            VALUES (?, ?, ?, ?)
        ");
        
        if ($stmt->execute([$userId, $toUserId, $skillId, $message])) {
            sendSuccess(['request_id' => $db->lastInsertId()], 'Request sent successfully');
        } else {
            sendError('Failed to send request');
        }
        break;
        
    case 'PUT':
        // Accept or reject request
        $input = json_decode(file_get_contents('php://input'), true);
        $requestId = $input['request_id'] ?? null;
        $action = $input['action'] ?? '';
        
        if (!$requestId) {
            sendError('Request ID required');
        }
        
        $status = $action === 'accept' ? 'accepted' : 'rejected';
        
        $stmt = $db->prepare("
            UPDATE match_requests 
            SET status = ?, responded_at = NOW()
            WHERE id = ? AND to_user_id = ?
        ");
        
        if ($stmt->execute([$status, $requestId, $userId])) {
            sendSuccess(null, "Request {$action}ed successfully");
        } else {
            sendError('Failed to process request');
        }
        break;
        
    case 'DELETE':
        // Delete/cancel request
        $input = json_decode(file_get_contents('php://input'), true);
        $requestId = $input['request_id'] ?? null;
        
        if (!$requestId) {
            sendError('Request ID required');
        }
        
        $stmt = $db->prepare("
            DELETE FROM match_requests 
            WHERE id = ? AND (from_user_id = ? OR to_user_id = ?)
        ");
        
        if ($stmt->execute([$requestId, $userId, $userId])) {
            sendSuccess(null, 'Request cancelled successfully');
        } else {
            sendError('Failed to cancel request');
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}