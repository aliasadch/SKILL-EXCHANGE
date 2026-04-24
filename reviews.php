<?php
// =====================================================
// REVIEWS API - Rating and feedback
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
        // Get reviews for a user or all reviews
        $uri_parts = explode('/', $_SERVER['REQUEST_URI']);
        $last_part = end($uri_parts);
        
        if (strpos($_SERVER['REQUEST_URI'], '/user/') !== false) {
            // Get reviews for specific user
            $targetUserId = $last_part;
            
            $stmt = $db->prepare("
                SELECT r.*, 
                       u.first_name as reviewer_first, u.last_name as reviewer_last,
                       u.avatar as reviewer_avatar
                FROM reviews r
                JOIN users u ON r.reviewer_id = u.id
                WHERE r.reviewee_id = ?
                ORDER BY r.created_at DESC
            ");
            $stmt->execute([$targetUserId]);
            $reviews = $stmt->fetchAll();
            
            sendSuccess($reviews);
        } else {
            // Get user's own reviews (received)
            $stmt = $db->prepare("
                SELECT r.*, 
                       u.first_name as reviewer_first, u.last_name as reviewer_last,
                       s.title as session_title
                FROM reviews r
                JOIN users u ON r.reviewer_id = u.id
                LEFT JOIN sessions s ON r.session_id = s.id
                WHERE r.reviewee_id = ?
                ORDER BY r.created_at DESC
            ");
            $stmt->execute([$userId]);
            $reviews = $stmt->fetchAll();
            
            sendSuccess($reviews);
        }
        break;
        
    case 'POST':
        // Add new review
        $input = json_decode(file_get_contents('php://input'), true);
        
        $sessionId = $input['session_id'] ?? null;
        $rating = $input['rating'] ?? null;
        $feedback = $input['feedback'] ?? '';
        $revieweeId = $input['reviewee_id'] ?? null;
        
        if (!$sessionId) {
            sendError('Session ID required');
        }
        
        if (!$rating || $rating < 1 || $rating > 5) {
            sendError('Rating must be between 1 and 5');
        }
        
        // Check if review already exists
        $checkStmt = $db->prepare("SELECT id FROM reviews WHERE session_id = ? AND reviewer_id = ?");
        $checkStmt->execute([$sessionId, $userId]);
        if ($checkStmt->fetch()) {
            sendError('You have already reviewed this session');
        }
        
        // Verify user is part of the session
        $sessionStmt = $db->prepare("SELECT teacher_id, student_id FROM sessions WHERE id = ?");
        $sessionStmt->execute([$sessionId]);
        $session = $sessionStmt->fetch();
        
        if (!$session) {
            sendError('Session not found', 404);
        }
        
        if ($session['teacher_id'] != $userId && $session['student_id'] != $userId) {
            sendError('You are not part of this session', 403);
        }
        
        // Determine reviewee (the other person)
        if (!$revieweeId) {
            $revieweeId = ($session['teacher_id'] == $userId) ? $session['student_id'] : $session['teacher_id'];
        }
        
        $stmt = $db->prepare("
            INSERT INTO reviews (session_id, reviewer_id, reviewee_id, rating, feedback)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([$sessionId, $userId, $revieweeId, $rating, sanitizeInput($feedback)]);
        
        if ($result) {
            // Update user rating
            updateUserRating($revieweeId);
            
            // Update session status to completed if not already
            $updateSession = $db->prepare("UPDATE sessions SET status = 'completed' WHERE id = ?");
            $updateSession->execute([$sessionId]);
            
            sendSuccess(null, 'Review submitted successfully');
        } else {
            sendError('Failed to submit review');
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}