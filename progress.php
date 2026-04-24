<?php
// =====================================================
// PROGRESS API - Track learning progress
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
        if (strpos($_SERVER['REQUEST_URI'], '/stats') !== false) {
            // Get progress statistics
            $skills = getUserSkills($userId);
            
            // Get session statistics
            $sessionStmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_sessions,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_sessions
                FROM sessions
                WHERE teacher_id = ? OR student_id = ?
            ");
            $sessionStmt->execute([$userId, $userId]);
            $sessionStats = $sessionStmt->fetch();
            
            // Get skill progress
            $progressStmt = $db->prepare("
                SELECT s.name, pt.sessions_completed, pt.proficiency_level
                FROM progress_tracking pt
                JOIN skills s ON pt.skill_id = s.id
                WHERE pt.user_id = ?
                ORDER BY pt.proficiency_level DESC
            ");
            $progressStmt->execute([$userId]);
            $skillProgress = $progressStmt->fetchAll();
            
            $stats = [
                'teach_skills_count' => count($skills['teach']),
                'learn_skills_count' => count($skills['learn']),
                'total_sessions' => $sessionStats['total_sessions'],
                'completed_sessions' => $sessionStats['completed_sessions'],
                'pending_sessions' => $sessionStats['pending_sessions'],
                'skill_progress' => $skillProgress
            ];
            
            sendSuccess($stats);
        } else {
            // Get skill progress for a specific skill
            $uri_parts = explode('/', $_SERVER['REQUEST_URI']);
            $skillId = end($uri_parts);
            
            if (is_numeric($skillId)) {
                $stmt = $db->prepare("
                    SELECT pt.*, s.name 
                    FROM progress_tracking pt
                    JOIN skills s ON pt.skill_id = s.id
                    WHERE pt.user_id = ? AND pt.skill_id = ?
                ");
                $stmt->execute([$userId, $skillId]);
                $progress = $stmt->fetch();
                
                if (!$progress) {
                    // Return default progress
                    $progress = [
                        'sessions_completed' => 0,
                        'proficiency_level' => 1,
                        'name' => 'Skill'
                    ];
                }
                
                sendSuccess($progress);
            } else {
                sendError('Invalid skill ID');
            }
        }
        break;
        
    case 'POST':
        // Update progress for a skill
        $input = json_decode(file_get_contents('php://input'), true);
        
        $skillId = $input['skill_id'] ?? null;
        $proficiencyLevel = $input['proficiency_level'] ?? null;
        $sessionsCompleted = $input['sessions_completed'] ?? null;
        
        if (!$skillId) {
            sendError('Skill ID required');
        }
        
        // Check if progress exists
        $checkStmt = $db->prepare("SELECT id FROM progress_tracking WHERE user_id = ? AND skill_id = ?");
        $checkStmt->execute([$userId, $skillId]);
        
        if ($checkStmt->fetch()) {
            // Update existing
            $updates = [];
            $params = [];
            
            if ($proficiencyLevel !== null) {
                $updates[] = "proficiency_level = ?";
                $params[] = $proficiencyLevel;
            }
            if ($sessionsCompleted !== null) {
                $updates[] = "sessions_completed = ?";
                $params[] = $sessionsCompleted;
            }
            
            if (empty($updates)) {
                sendError('No updates provided');
            }
            
            $params[] = $userId;
            $params[] = $skillId;
            
            $stmt = $db->prepare("UPDATE progress_tracking SET " . implode(', ', $updates) . " WHERE user_id = ? AND skill_id = ?");
            $result = $stmt->execute($params);
        } else {
            // Insert new
            $stmt = $db->prepare("
                INSERT INTO progress_tracking (user_id, skill_id, sessions_completed, proficiency_level)
                VALUES (?, ?, ?, ?)
            ");
            $result = $stmt->execute([
                $userId,
                $skillId,
                $sessionsCompleted ?? 0,
                $proficiencyLevel ?? 1
            ]);
        }
        
        if ($result) {
            sendSuccess(null, 'Progress updated successfully');
        } else {
            sendError('Failed to update progress');
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}