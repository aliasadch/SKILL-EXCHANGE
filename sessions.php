<?php
// =====================================================
// SESSIONS API - Manage learning sessions
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
        // Get all sessions for current user
        $stmt = $db->prepare("
            SELECT s.*, 
                   u1.first_name as teacher_first, u1.last_name as teacher_last,
                   u2.first_name as student_first, u2.last_name as student_last
            FROM sessions s
            JOIN users u1 ON s.teacher_id = u1.id
            JOIN users u2 ON s.student_id = u2.id
            WHERE s.teacher_id = ? OR s.student_id = ?
            ORDER BY s.session_date DESC, s.session_time DESC
        ");
        $stmt->execute([$userId, $userId]);
        $sessions = $stmt->fetchAll();
        
        // Format sessions
        foreach ($sessions as &$session) {
            $otherUserId = ($session['teacher_id'] == $userId) ? $session['student_id'] : $session['teacher_id'];
            $otherUserStmt = $db->prepare("SELECT id, first_name, last_name, avatar, rating FROM users WHERE id = ?");
            $otherUserStmt->execute([$otherUserId]);
            $session['other_user'] = $otherUserStmt->fetch();
        }
        
        sendSuccess($sessions);
        break;
        
    case 'POST':
        // Create new session request
        $input = json_decode(file_get_contents('php://input'), true);
        
        $required = ['teacher_id', 'student_id', 'title', 'date', 'time'];
        foreach ($required as $field) {
            if (empty($input[$field])) {
                sendError("$field is required");
            }
        }
        
        // Verify user is either teacher or student
        if ($input['teacher_id'] != $userId && $input['student_id'] != $userId) {
            sendError('Invalid session participants', 403);
        }
        
        $stmt = $db->prepare("
            INSERT INTO sessions (teacher_id, student_id, title, description, session_date, session_time, duration, mode, location)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $input['teacher_id'],
            $input['student_id'],
            sanitizeInput($input['title']),
            sanitizeInput($input['description'] ?? ''),
            $input['date'],
            $input['time'],
            $input['duration'] ?? 60,
            $input['mode'] ?? 'online',
            sanitizeInput($input['location'] ?? '')
        ]);
        
        if ($result) {
            $sessionId = $db->lastInsertId();
            
            // Create notification for the other user
            $otherUserId = ($input['teacher_id'] == $userId) ? $input['student_id'] : $input['teacher_id'];
            $notifStmt = $db->prepare("
                INSERT INTO notifications (user_id, type, title, message, link)
                VALUES (?, 'session_request', 'New Session Request', ?, 'sessions.html')
            ");
            $notifStmt->execute([$otherUserId, "You have a new session request from " . getCurrentUser()['first_name']]);
            
            sendSuccess(['session_id' => $sessionId], 'Session request sent successfully');
        } else {
            sendError('Failed to create session');
        }
        break;
        
    case 'PUT':
        // Update session status
        $input = json_decode(file_get_contents('php://input'), true);
        $sessionId = explode('/', $_SERVER['REQUEST_URI']);
        $sessionId = end($sessionId);
        
        if (strpos($_SERVER['REQUEST_URI'], '/status') !== false) {
            // Update status
            $status = $input['status'] ?? '';
            $allowedStatuses = ['accepted', 'cancelled', 'completed'];
            
            if (!in_array($status, $allowedStatuses)) {
                sendError('Invalid status');
            }
            
            // Verify user is part of the session
            $stmt = $db->prepare("SELECT teacher_id, student_id, status FROM sessions WHERE id = ?");
            $stmt->execute([$sessionId]);
            $session = $stmt->fetch();
            
            if (!$session) {
                sendError('Session not found', 404);
            }
            
            if ($session['teacher_id'] != $userId && $session['student_id'] != $userId) {
                sendError('Unauthorized', 403);
            }
            
            $stmt = $db->prepare("UPDATE sessions SET status = ? WHERE id = ?");
            if ($stmt->execute([$status, $sessionId])) {
                sendSuccess(null, "Session {$status} successfully");
            } else {
                sendError('Failed to update session');
            }
        } else {
            sendError('Invalid endpoint');
        }
        break;
        
    case 'DELETE':
        // Cancel session
        $sessionId = explode('/', $_SERVER['REQUEST_URI']);
        $sessionId = end($sessionId);
        
        $stmt = $db->prepare("SELECT teacher_id, student_id FROM sessions WHERE id = ?");
        $stmt->execute([$sessionId]);
        $session = $stmt->fetch();
        
        if (!$session) {
            sendError('Session not found', 404);
        }
        
        if ($session['teacher_id'] != $userId && $session['student_id'] != $userId) {
            sendError('Unauthorized', 403);
        }
        
        $stmt = $db->prepare("UPDATE sessions SET status = 'cancelled' WHERE id = ?");
        if ($stmt->execute([$sessionId])) {
            sendSuccess(null, 'Session cancelled successfully');
        } else {
            sendError('Failed to cancel session');
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}