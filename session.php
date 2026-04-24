<?php
// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Start secure session
 */
function startSecureSession() {
    // Set secure session parameters
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', 0); // Set to 1 in production with HTTPS
    
    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * Regenerate session ID to prevent fixation
 */
function regenerateSession() {
    session_regenerate_id(true);
}

/**
 * Destroy session
 */
function destroySession() {
    $_SESSION = array();
    
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    session_destroy();
}

/**
 * Set session variable
 * @param string $key
 * @param mixed $value
 */
function setSession($key, $value) {
    startSecureSession();
    $_SESSION[$key] = $value;
}

/**
 * Get session variable
 * @param string $key
 * @param mixed $default
 * @return mixed
 */
function getSession($key, $default = null) {
    startSecureSession();
    return $_SESSION[$key] ?? $default;
}

/**
 * Check if session variable exists
 * @param string $key
 * @return bool
 */
function hasSession($key) {
    startSecureSession();
    return isset($_SESSION[$key]);
}

/**
 * Delete session variable
 * @param string $key
 */
function deleteSession($key) {
    startSecureSession();
    unset($_SESSION[$key]);
}

/**
 * Get all session data
 * @return array
 */
function getAllSession() {
    startSecureSession();
    return $_SESSION;
}

/**
 * Set flash message (temporary message that disappears after next request)
 * @param string $key
 * @param string $message
 */
function setFlash($key, $message) {
    setSession("flash_$key", $message);
}

/**
 * Get flash message
 * @param string $key
 * @return string|null
 */
function getFlash($key) {
    $message = getSession("flash_$key");
    deleteSession("flash_$key");
    return $message;
}