<?php
// Versión ultra-simplificada sin dependencias
// Configurar headers básicos
if (!headers_sent()) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Salir si es OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Obtener datos
$inputJSON = file_get_contents('php://input');
if ($inputJSON === false) {
    http_response_code(400);
    echo json_encode(['error' => 'No se pueden leer los datos']);
    exit;
}

$input = json_decode($inputJSON, true);
if ($input === null) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido']);
    exit;
}

$phone = isset($input['phone']) ? trim($input['phone']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Validación básica
if (empty($phone) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Teléfono y contraseña son obligatorios']);
    exit;
}

// Directorio de datos
$dataDir = __DIR__ . '/../../data/users';

// Nombre de archivo
$filename = str_replace(['+', ' '], ['', ''], $phone) . '.json';
$filepath = $dataDir . '/' . $filename;

// Verificar si existe
if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

// Leer usuario
$userData = file_get_contents($filepath);
if ($userData === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al leer usuario']);
    exit;
}

$user = json_decode($userData, true);
if ($user === null) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al procesar datos']);
    exit;
}

// Verificar contraseña
if ($user['password'] !== hash('sha256', $password)) {
    http_response_code(401);
    echo json_encode(['error' => 'Contraseña incorrecta']);
    exit;
}

// Responder éxito (sin contraseña)
unset($user['password']);
echo json_encode($user);
?>