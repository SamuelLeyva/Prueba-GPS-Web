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

$username = isset($input['username']) ? trim($input['username']) : '';
$phone = isset($input['phone']) ? trim($input['phone']) : '';
$password = isset($input['password']) ? $input['password'] : '';

// Validación básica
if (empty($username) || empty($phone) || empty($password)) {
    http_response_code(400);
    echo json_encode(['error' => 'Todos los campos son obligatorios']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['error' => 'La contraseña debe tener al menos 6 caracteres']);
    exit;
}

// Directorio de datos
$dataDir = __DIR__ . '/../../data/users';

// Crear directorio si no existe
if (!file_exists($dataDir)) {
    if (!mkdir($dataDir, 0777, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'No se puede crear el directorio']);
        exit;
    }
}

// Nombre de archivo
$filename = str_replace(['+', ' '], ['', ''], $phone) . '.json';
$filepath = $dataDir . '/' . $filename;

// Verificar si ya existe
if (file_exists($filepath)) {
    http_response_code(409);
    echo json_encode(['error' => 'El usuario ya existe']);
    exit;
}

// Crear usuario
$user = [
    'username' => $username,
    'phone' => $phone,
    'password' => hash('sha256', $password),
    'createdAt' => date('Y-m-d H:i:s')
];

// Guardar archivo
$jsonData = json_encode($user, JSON_PRETTY_PRINT);
if (file_put_contents($filepath, $jsonData) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar usuario']);
    exit;
}

// Responder éxito (sin contraseña)
unset($user['password']);
echo json_encode($user);
?>