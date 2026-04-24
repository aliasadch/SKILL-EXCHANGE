<?php
// =====================================================
// SKILLS API - Manage skills
// =====================================================

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

$request_method = $_SERVER['REQUEST_METHOD'];

switch ($request_method) {
    case 'GET':
        // Get all skills or search
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? '';
        
        $query = "SELECT * FROM skills WHERE 1=1";
        $params = [];
        
        if (!empty($search)) {
            $query .= " AND name LIKE ?";
            $params[] = "%$search%";
        }
        
        if (!empty($category)) {
            $query .= " AND category = ?";
            $params[] = $category;
        }
        
        $query .= " ORDER BY name ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $skills = $stmt->fetchAll();
        
        sendSuccess($skills);
        break;
        
    case 'POST':
        requireAuth();
        
        // Add new skill
        $input = json_decode(file_get_contents('php://input'), true);
        $name = sanitizeInput($input['name'] ?? '');
        $category = sanitizeInput($input['category'] ?? '');
        $icon = sanitizeInput($input['icon'] ?? '');
        
        if (empty($name)) {
            sendError('Skill name required');
        }
        
        // Check if skill exists
        $checkStmt = $db->prepare("SELECT id FROM skills WHERE name = ?");
        $checkStmt->execute([$name]);
        
        if ($checkStmt->fetch()) {
            sendError('Skill already exists');
        }
        
        $stmt = $db->prepare("INSERT INTO skills (name, category, icon) VALUES (?, ?, ?)");
        $result = $stmt->execute([$name, $category, $icon]);
        
        if ($result) {
            sendSuccess(['skill_id' => $db->lastInsertId()], 'Skill added successfully');
        } else {
            sendError('Failed to add skill');
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}