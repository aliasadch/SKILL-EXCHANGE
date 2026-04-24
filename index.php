<?php
// =====================================================
// API ROUTER - Main Entry Point
// =====================================================

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/functions.php';

// Get request URI
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove base path
$base_path = '/SKILL-EXCHANGE/api/';
$endpoint = str_replace($base_path, '', $request_uri);
$endpoint = strtok($endpoint, '?');

// Route to appropriate handler
switch ($endpoint) {
    case 'auth':
    case 'auth/login':
    case 'auth/register':
    case 'auth/logout':
        require_once 'auth.php';
        break;
        
    case 'users':
    case 'users/profile':
    case 'users/skills':
        require_once 'users.php';
        break;
        
    case 'skills':
        require_once 'skills.php';
        break;
        
    case 'matches':
        require_once 'matches.php';
        break;
        
    case 'sessions':
        require_once 'sessions.php';
        break;
        
    case 'messages':
        require_once 'messages.php';
        break;
        
    case 'reviews':
        require_once 'reviews.php';
        break;
        
    case 'progress':
        require_once 'progress.php';
        break;
        
    case 'admin':
        require_once 'admin.php';
        break;
        
    default:
        sendError('Endpoint not found', 404);
}