<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Debug: Log the request
error_log("Register.php - Request received");
error_log("Register.php - Request method: " . $_SERVER['REQUEST_METHOD']);
error_log("Register.php - Raw input: " . file_get_contents('php://input'));

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    error_log("Register.php - Invalid JSON received");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$username = $input['username'] ?? '';
$phone = $input['phone'] ?? '';
$password = $input['password'] ?? '';

error_log("Register.php - Username: " . $username);
error_log("Register.php - Phone: " . $phone);
error_log("Register.php - Password length: " . strlen($password));

// Validation
if (empty($username) || empty($phone) || empty($password)) {
    error_log("Register.php - Validation failed: empty fields");
    http_response_code(400);
    echo json_encode(['error' => 'Todos los campos son obligatorios']);
    exit;
}

// Validate Cuban phone number
if (!preg_match('/^\+53\s?[57]\d{7}$/', preg_replace('/\s/', '', $phone))) {
    error_log("Register.php - Invalid phone format: " . $phone);
    http_response_code(400);
    echo json_encode(['error' => 'El número de teléfono debe ser de Cuba (formato: +53 5XXXXXXX o +53 7XXXXXXX)']);
    exit;
}

// Validate password length
if (strlen($password) < 6) {
    error_log("Register.php - Password too short");
    http_response_code(400);
    echo json_encode(['error' => 'La contraseña debe tener al menos 6 caracteres']);
    exit;
}

// Ensure data directory exists
$dataDir = '../data/users';
error_log("Register.php - Data directory: " . $dataDir);

if (!is_dir($dataDir)) {
    error_log("Register.php - Creating directory: " . $dataDir);
    if (!mkdir($dataDir, 0755, true)) {
        error_log("Register.php - Failed to create directory");
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear el directorio de usuarios']);
        exit;
    }
}

// Create filename from phone
$filename = preg_replace('/\s/', '', $phone) . '.json';
$filepath = $dataDir . '/' . $filename;

error_log("Register.php - Filepath: " . $filepath);

// Check if user already exists
if (file_exists($filepath)) {
    error_log("Register.php - User already exists");
    http_response_code(409);
    echo json_encode(['error' => 'Ya existe un usuario con este número de teléfono']);
    exit;
}

// Hash password
$hashedPassword = hash('sha256', $password);
error_log("Register.php - Password hashed successfully");

// Create user object
$user = [
    'username' => $username,
    'phone' => $phone,
    'password' => $hashedPassword,
    'createdAt' => date('c')
];

error_log("Register.php - User object created");

// Save user to file
$jsonData = json_encode($user, JSON_PRETTY_PRINT);
if (file_put_contents($filepath, $jsonData) === false) {
    error_log("Register.php - Failed to save file");
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar el usuario: ' . error_get_last()['message'] ?? 'Unknown error']);
    exit;
}

error_log("Register.php - User saved successfully");

// Return user without password
unset($user['password']);
echo json_encode($user);
?>