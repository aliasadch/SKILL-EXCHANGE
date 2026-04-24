<?php
// =====================================================
// MESSAGES API - Chat between users
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
        // Get conversations or messages with specific user
        $uri_parts = explode('/', $_SERVER['REQUEST_URI']);
        $last_part = end($uri_parts);
        
        if (is_numeric($last_part)) {
            // Get messages with specific user
            $otherUserId = $last_part;
            
            $stmt = $db->prepare("
                SELECT * FROM messages 
                WHERE (sender_id = ? AND receiver_id = ?) 
                   OR (sender_id = ? AND receiver_id = ?)
                ORDER BY created_at ASC
            ");
            $stmt->execute([$userId, $otherUserId, $otherUserId, $userId]);
            $messages = $stmt->fetchAll();
            
            // Mark messages as read
            $updateStmt = $db->prepare("
                UPDATE messages SET is_read = 1 
                WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
            ");
            $updateStmt->execute([$userId, $otherUserId]);
            
            sendSuccess($messages);
        } else {
            // Get all conversations
            $stmt = $db->prepare("
                SELECT DISTINCT 
                    CASE 
                        WHEN sender_id = ? THEN receiver_id
                        ELSE sender_id
                    END as other_user_id,
                    MAX(created_at) as last_message_time,
                    (SELECT message FROM messages m2 
                     WHERE (m2.sender_id = ? AND m2.receiver_id = other_user_id)
                        OR (m2.sender_id = other_user_id AND m2.receiver_id = ?)
                     ORDER BY m2.created_at DESC LIMIT 1) as last_message,
                    SUM(CASE WHEN receiver_id = ? AND is_read = 0 THEN 1 ELSE 0 END) as unread_count
                FROM messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY other_user_id
                ORDER BY last_message_time DESC
            ");
            $stmt->execute([$userId, $userId, $userId, $userId, $userId, $userId]);
            $conversations = $stmt->fetchAll();
            
            // Get user details for each conversation
            foreach ($conversations as &$conv) {
                $userStmt = $db->prepare("SELECT id, first_name, last_name, avatar, rating FROM users WHERE id = ?");
                $userStmt->execute([$conv['other_user_id']]);
                $conv['user'] = $userStmt->fetch();
            }
            
            sendSuccess($conversations);
        }
        break;
        
    case 'POST':
        // Send new message
        $input = json_decode(file_get_contents('php://input'), true);
        
        $receiverId = $input['receiver_id'] ?? null;
        $message = trim($input['message'] ?? '');
        $sessionId = $input['session_id'] ?? null;
        
        if (!$receiverId) {
            sendError('Receiver ID required');
        }
        
        if (empty($message)) {
            sendError('Message cannot be empty');
        }
        
        $stmt = $db->prepare("
            INSERT INTO messages (sender_id, receiver_id, session_id, message)
            VALUES (?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([$userId, $receiverId, $sessionId, sanitizeInput($message)]);
        
        if ($result) {
            $messageId = $db->lastInsertId();
            
            // Create notification for receiver
            $notifStmt = $db->prepare("
                INSERT INTO notifications (user_id, type, title, message, link)
                VALUES (?, 'message', 'New Message', ?, 'chat.html')
            ");
            $notifStmt->execute([$receiverId, "You have a new message from " . getCurrentUser()['first_name']]);
            
            sendSuccess(['message_id' => $messageId], 'Message sent successfully');
        } else {
            sendError('Failed to send message');
        }
        break;
        
    case 'PUT':
        // Mark messages as read
        $input = json_decode(file_get_contents('php://input'), true);
        $senderId = $input['sender_id'] ?? null;
        
        if ($senderId) {
            $stmt = $db->prepare("
                UPDATE messages SET is_read = 1 
                WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
            ");
            $stmt->execute([$senderId, $userId]);
            sendSuccess(null, 'Messages marked as read');
        } else {
            sendError('Sender ID required');
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}