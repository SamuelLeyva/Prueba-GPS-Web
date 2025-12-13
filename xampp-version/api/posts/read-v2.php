<?php
// Versión ultra-simplificada sin dependencias
// Configurar headers básicos
if (!headers_sent()) {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// Salir si es OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Solo permitir GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Directorio de datos
$dataDir = __DIR__ . '/../../data/posts';
$postsFile = $dataDir . '/posts.json';

// Si no existe, retornar vacío
if (!file_exists($postsFile)) {
    echo json_encode([]);
    exit;
}

// Leer posts
$postsData = file_get_contents($postsFile);
if ($postsData === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al leer posts']);
    exit;
}

$posts = json_decode($postsData, true);
if ($posts === null) {
    echo json_encode([]);
    exit;
}

echo json_encode($posts);
?>