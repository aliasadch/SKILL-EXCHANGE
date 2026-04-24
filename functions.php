<?php
// =====================================================
// GENERAL HELPER FUNCTIONS
// =====================================================

/**
 * Send JSON response
 * @param mixed $data
 * @param int $statusCode
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Send success response
 * @param mixed $data
 * @param string $message
 */
function sendSuccess($data = null, $message = 'Success') {
    sendResponse([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
}

/**
 * Send error response
 * @param string $message
 * @param int $statusCode
 */
function sendError($message, $statusCode = 400) {
    sendResponse([
        'success' => false,
        'message' => $message
    ], $statusCode);
}

/**
 * Validate email
 * @param string $email
 * @return bool
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Sanitize input
 * @param string $input
 * @return string
 */
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}

/**
 * Generate random token
 * @param int $length
 * @return string
 */
function generateToken($length = 32) {
    return bin2hex(random_bytes($length));
}

/**
 * Format date for display
 * @param string $date
 * @param string $format
 * @return string
 */
function formatDate($date, $format = 'M d, Y') {
    return date($format, strtotime($date));
}

/**
 * Calculate match score between two users
 * @param array $user1
 * @param array $user2
 * @return int
 */
function calculateMatchScore($user1, $user2) {
    $score = 0;
    
    // Common skills where user2 teaches and user1 wants to learn
    $commonTeach = array_intersect($user2['teach_skills'], $user1['learn_skills']);
    $score += count($commonTeach) * 10;
    
    // Common skills where user2 wants to learn and user1 teaches
    $commonLearn = array_intersect($user2['learn_skills'], $user1['teach_skills']);
    $score += count($commonLearn) * 10;
    
    // Rating bonus
    $score += ($user2['rating'] ?? 0) * 2;
    
    return $score;
}

/**
 * Upload file
 * @param array $file
 * @param string $directory
 * @return string|false
 */
function uploadFile($file, $directory) {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return false;
    }
    
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        return false;
    }
    
    if ($file['size'] > MAX_FILE_SIZE) {
        return false;
    }
    
    $filename = uniqid() . '.' . $extension;
    $destination = $directory . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $destination)) {
        return $filename;
    }
    
    return false;
}

/**
 * Get user skills
 * @param int $userId
 * @return array
 */
function getUserSkills($userId) {
    global $db;
    
    $stmt = $db->prepare("
        SELECT s.name, us.skill_type 
        FROM user_skills us 
        JOIN skills s ON us.skill_id = s.id 
        WHERE us.user_id = ?
    ");
    $stmt->execute([$userId]);
    $results = $stmt->fetchAll();
    
    $skills = ['teach' => [], 'learn' => []];
    foreach ($results as $row) {
        $skills[$row['skill_type']][] = $row['name'];
    }
    
    return $skills;
}

/**
 * Get user rating
 * @param int $userId
 * @return float
 */
function getUserRating($userId) {
    global $db;
    
    $stmt = $db->prepare("SELECT AVG(rating) as avg_rating FROM reviews WHERE reviewee_id = ?");
    $stmt->execute([$userId]);
    $result = $stmt->fetch();
    
    return round($result['avg_rating'] ?? 0, 1);
}

/**
 * Update user rating
 * @param int $userId
 */
function updateUserRating($userId) {
    global $db;
    
    $rating = getUserRating($userId);
    $stmt = $db->prepare("UPDATE users SET rating = ? WHERE id = ?");
    $stmt->execute([$rating, $userId]);
}