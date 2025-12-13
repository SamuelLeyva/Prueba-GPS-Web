<?php
// Simple login script without .htaccess dependencies
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only POST allowed
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Get input
    $json = file_get_contents('php://input');
    $input = json_decode($json, true);
    
    if (!$input) {
        throw new Exception('Invalid JSON');
    }
    
    $phone = $input['phone'] ?? '';
    $password = $input['password'] ?? '';
    
    // Validate
    if (empty($phone) || empty($password)) {
        throw new Exception('El teléfono y la contraseña son obligatorios');
    }
    
    // Find user file
    $dataDir = __DIR__ . '/../../data/users';
    $filename = str_replace(['+', ' '], ['', ''], $phone) . '.json';
    $filepath = $dataDir . '/' . $filename;
    
    if (!file_exists($filepath)) {
        throw new Exception('Usuario no encontrado');
    }
    
    // Read user
    $userData = file_get_contents($filepath);
    if ($userData === false) {
        throw new Exception('Error al leer el usuario');
    }
    
    $user = json_decode($userData, true);
    if ($user === null) {
        throw new Exception('Error al procesar los datos del usuario');
    }
    
    // Verify password
    if ($user['password'] !== hash('sha256', $password)) {
        throw new Exception('Contraseña incorrecta');
    }
    
    // Return success (without password)
    unset($user['password']);
    echo json_encode($user);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>