<?php
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

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$title = $input['title'] ?? '';
$description = $input['description'] ?? '';
$price = $input['price'] ?? '';
$lat = $input['lat'] ?? '';
$lng = $input['lng'] ?? '';
$username = $input['username'] ?? '';
$phone = $input['phone'] ?? '';

// Validation
if (empty($title) || empty($description) || empty($price) || empty($lat) || empty($lng) || empty($username) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['error' => 'Todos los campos son obligatorios']);
    exit;
}

// Validate price
if (!is_numeric($price) || $price <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'El precio debe ser un número positivo']);
    exit;
}

// Data directory
$dataDir = '../data/posts';
$postsFile = $dataDir . '/posts.json';

// Ensure data directory exists
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Read existing posts
$posts = [];
if (file_exists($postsFile)) {
    $postsData = file_get_contents($postsFile);
    if ($postsData !== false) {
        $decodedPosts = json_decode($postsData, true);
        if ($decodedPosts !== null) {
            $posts = $decodedPosts;
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
    'timestamp' => time() * 1000 // JavaScript timestamp
];

// Add to posts array
$posts[] = $newPost;

// Save posts
if (file_put_contents($postsFile, json_encode($posts, JSON_PRETTY_PRINT)) === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar la publicación']);
    exit;
}

// Return created post
echo json_encode($newPost);
?>