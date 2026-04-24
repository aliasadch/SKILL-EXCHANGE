<?php
// =====================================================
// AUTHENTICATION API ENDPOINTS
// =====================================================

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/validation.php';

$request_method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Handle based on request method
switch ($request_method) {
    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Login
        if (strpos($_SERVER['REQUEST_URI'], '/login') !== false) {
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            
            if (empty($email) || empty($password)) {
                sendError('Email and password required');
            }
            
            if (!validateEmail($email)) {
                sendError('Invalid email format');
            }
            
            $result = loginUser($email, $password);
            if ($result['success']) {
                sendSuccess($result['user'], 'Login successful');
            } else {
                sendError($result['message'], 401);
            }
        }
        
        // Register
        elseif (strpos($_SERVER['REQUEST_URI'], '/register') !== false) {
            $required = ['email', 'password', 'first_name', 'last_name'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    sendError("$field is required");
                }
            }
            
            if (!validateEmail($input['email'])) {
                sendError('Invalid email format');
            }
            
            $passwordValidation = validatePasswordStrength($input['password']);
            if (!$passwordValidation['isValid']) {
                sendError($passwordValidation['message']);
            }
            
            $userData = [
                'email' => $input['email'],
                'password' => $input['password'],
                'first_name' => sanitizeInput($input['first_name']),
                'last_name' => sanitizeInput($input['last_name']),
                'bio' => sanitizeInput($input['bio'] ?? ''),
                'teach_skills' => $input['teach_skills'] ?? [],
                'learn_skills' => $input['learn_skills'] ?? []
            ];
            
            $result = registerUser($userData);
            if ($result['success']) {
                sendSuccess(['user_id' => $result['user_id']], 'Registration successful');
            } else {
                sendError($result['message'], 400);
            }
        }
        
        // Logout
        elseif (strpos($_SERVER['REQUEST_URI'], '/logout') !== false) {
            $result = logoutUser();
            sendSuccess(null, 'Logged out successfully');
        }
        
        else {
            sendError('Invalid endpoint', 404);
        }
        break;
        
    case 'GET':
        if (strpos($_SERVER['REQUEST_URI'], '/verify') !== false) {
            requireAuth();
            $user = getCurrentUser();
            sendSuccess($user, 'Authenticated');
        } else {
            sendError('Invalid endpoint', 404);
        }
        break;
        
    default:
        sendError('Method not allowed', 405);
}