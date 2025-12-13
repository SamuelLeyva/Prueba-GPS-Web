<?php
// Simple posts create script without .htaccess dependencies
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
    
    $title = $input['title'] ?? '';
    $description = $input['description'] ?? '';
    $price = $input['price'] ?? '';
    $lat = $input['lat'] ?? '';
    $lng = $input['lng'] ?? '';
    $username = $input['username'] ?? '';
    $phone = $input['phone'] ?? '';
    
    // Validate
    if (empty($title) || empty($description) || empty($price) || empty($lat) || empty($lng) || empty($username) || empty($phone)) {
        throw new Exception('Todos los campos son obligatorios');
    }
    
    if (!is_numeric($price) || $price <= 0) {
        throw new Exception('El precio debe ser un número positivo');
    }
    
    // Create data directory if not exists
    $dataDir = __DIR__ . '/../../data/posts';
    if (!file_exists($dataDir)) {
        if (!mkdir($dataDir, 0777, true)) {
            throw new Exception('No se puede crear el directorio de posts');
        }
    }
    
    // Read existing posts
    $postsFile = $dataDir . '/posts.json';
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
    
    // Create new post
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
    
    // Save posts
    if (file_put_contents($postsFile, json_encode($posts, JSON_PRETTY_PRINT)) === false) {
        throw new Exception('Error al guardar la publicación');
    }
    
    echo json_encode($newPost);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['error' => $e->getMessage()]);
}
?>