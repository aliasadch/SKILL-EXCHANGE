<?php
// =====================================================
// VALIDATION FUNCTIONS
// =====================================================

/**
 * Validate email format
 * @param string $email
 * @return bool
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate password strength
 * @param string $password
 * @return array
 */
function validatePasswordStrength($password) {
    $minLength = 6;
    $hasUpper = preg_match('/[A-Z]/', $password);
    $hasLower = preg_match('/[a-z]/', $password);
    $hasNumber = preg_match('/\d/', $password);
    
    if (strlen($password) < $minLength) {
        return ['isValid' => false, 'message' => "Password must be at least $minLength characters"];
    }
    
    if (!$hasUpper) {
        return ['isValid' => false, 'message' => 'Password must contain at least one uppercase letter'];
    }
    
    if (!$hasLower) {
        return ['isValid' => false, 'message' => 'Password must contain at least one lowercase letter'];
    }
    
    if (!$hasNumber) {
        return ['isValid' => false, 'message' => 'Password must contain at least one number'];
    }
    
    return ['isValid' => true, 'message' => 'Password is strong'];
}

/**
 * Validate date format
 * @param string $date
 * @param string $format
 * @return bool
 */
function validateDate($date, $format = 'Y-m-d') {
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) === $date;
}

/**
 * Validate time format
 * @param string $time
 * @return bool
 */
function validateTime($time) {
    return preg_match('/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/', $time);
}

/**
 * Sanitize string input
 * @param string $input
 * @return string
 */
function sanitizeString($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}

/**
 * Validate phone number
 * @param string $phone
 * @return bool
 */
function validatePhone($phone) {
    return preg_match('/^[0-9+\-\s()]{10,20}$/', $phone);
}

/**
 * Validate URL
 * @param string $url
 * @return bool
 */
function validateUrl($url) {
    return filter_var($url, FILTER_VALIDATE_URL) !== false;
}

/**
 * Sanitize array input
 * @param array $input
 * @return array
 */
function sanitizeArray($input) {
    return array_map('sanitizeString', $input);
}