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
error_log("Login.php - Request received");
error_log("Login.php - Raw input: " . file_get_contents('php://input'));

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    error_log("Login.php - Invalid JSON received");
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$phone = $input['phone'] ?? '';
$password = $input['password'] ?? '';

error_log("Login.php - Phone: " . $phone);
error_log("Login.php - Password length: " . strlen($password));

// Validation
if (empty($phone) || empty($password)) {
    error_log("Login.php - Validation failed: empty fields");
    http_response_code(400);
    echo json_encode(['error' => 'El teléfono y la contraseña son obligatorios']);
    exit;
}

// Data directory
$dataDir = '../data/users';
error_log("Login.php - Data directory: " . $dataDir);

// Create filename from phone
$filename = preg_replace('/\s/', '', $phone) . '.json';
$filepath = $dataDir . '/' . $filename;

error_log("Login.php - Filepath: " . $filepath);

// Check if user exists
if (!file_exists($filepath)) {
    error_log("Login.php - User not found");
    http_response_code(404);
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

// Read user data
$userData = file_get_contents($filepath);
if ($userData === false) {
    error_log("Login.php - Error reading user file");
    http_response_code(500);
    echo json_encode(['error' => 'Error al leer el usuario']);
    exit;
}

$user = json_decode($userData, true);
if ($user === null) {
    error_log("Login.php - Error parsing user JSON");
    http_response_code(500);
    echo json_encode(['error' => 'Error al procesar los datos del usuario']);
    exit;
}

// Verify password
$hashedPassword = hash('sha256', $password);
if ($user['password'] !== $hashedPassword) {
    error_log("Login.php - Password mismatch");
    http_response_code(401);
    echo json_encode(['error' => 'Contraseña incorrecta']);
    exit;
}

error_log("Login.php - Login successful");

// Return user without password
unset($user['password']);
echo json_encode($user);
?>