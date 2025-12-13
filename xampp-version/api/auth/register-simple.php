<?php
// Simple register script without .htaccess dependencies
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
    
    $username = $input['username'] ?? '';
    $phone = $input['phone'] ?? '';
    $password = $input['password'] ?? '';
    
    // Validate
    if (empty($username) || empty($phone) || empty($password)) {
        throw new Exception('Todos los campos son obligatorios');
    }
    
    if (strlen($password) < 6) {
        throw new Exception('La contraseña debe tener al menos 6 caracteres');
    }
    
    // Create data directory if not exists
    $dataDir = __DIR__ . '/../../data/users';
    if (!file_exists($dataDir)) {
        if (!mkdir($dataDir, 0777, true)) {
            throw new Exception('No se puede crear el directorio de datos');
        }
    }
    
    // Create user file
    $filename = str_replace(['+', ' '], ['', ''], $phone) . '.json';
    $filepath = $dataDir . '/' . $filename;
    
    if (file_exists($filepath)) {
        throw new Exception('Ya existe un usuario con este número de teléfono');
    }
    
    // Save user
    $user = [
        'username' => $username,
        'phone' => $phone,
        'password' => hash('sha256', $password),
        'createdAt' => date('Y-m-d H:i:s')
    ];
    
    if (file_put_contents($filepath, json_encode($user, JSON_PRETTY_PRINT)) === false) {
        throw new Exception('Error al guardar el usuario');
    }
    
    // Return success (without password)
    unset($user['password']);
    echo json_encode($user);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>