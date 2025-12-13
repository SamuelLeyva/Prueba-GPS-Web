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

$title = isset($input['title']) ? trim($input['title']) : '';
$description = isset($input['description']) ? trim($input['description']) : '';
$price = isset($input['price']) ? $input['price'] : 0;
$lat = isset($input['lat']) ? $input['lat'] : 0;
$lng = isset($input['lng']) ? $input['lng'] : 0;
$username = isset($input['username']) ? trim($input['username']) : '';
$phone = isset($input['phone']) ? trim($input['phone']) : '';

// Validación básica
if (empty($title) || empty($description) || empty($username) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['error' => 'Todos los campos son obligatorios']);
    exit;
}

if (!is_numeric($price) || $price <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'El precio debe ser un número positivo']);
    exit;
}

// Directorio de datos
$dataDir = __DIR__ . '/../../data/posts';

// Crear directorio si no existe
if (!file_exists($dataDir)) {
    if (!mkdir($dataDir, 0777, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'No se puede crear el directorio']);
        exit;
    }
}

$postsFile = $dataDir . '/posts.json';

// Leer posts existentes
$posts = [];
if (file_exists($postsFile)) {
    $postsData = file_get_contents($postsFile);
    if ($postsData !== false) {
        $decoded = json_decode($postsData, true);
        if ($decoded !== null) {
            $posts = $decoded;
        }
    }
}

// Crear nuevo post
$newPost = [
    'id' => time() . '_' . uniqid(),
    'title' => $title,
    'description' => $description,
    'price' => (float)$price,
    'lat' => (float)$lat,
    'lng' => (float)$lng,
    'username' => $username,
    'phone' => $phone,
    'timestamp' => time() * 1000
];

$posts[] = $newPost;

// Guardar posts
$jsonData = json_encode($posts, JSON_PRETTY_PRINT);
if (file_put_contents($postsFile, $jsonData) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar post']);
    exit;
}

echo json_encode($newPost);
?>