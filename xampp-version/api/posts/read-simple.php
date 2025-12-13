<?php
// Simple posts read script without .htaccess dependencies
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only GET allowed
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

try {
    // Read posts file
    $dataDir = __DIR__ . '/../../data/posts';
    $postsFile = $dataDir . '/posts.json';
    
    if (!file_exists($postsFile)) {
        echo json_encode([]);
        exit;
    }
    
    $postsData = file_get_contents($postsFile);
    if ($postsData === false) {
        throw new Exception('Error al leer las publicaciones');
    }
    
    $posts = json_decode($postsData, true);
    if ($posts === null) {
        echo json_encode([]);
        exit;
    }
    
    echo json_encode($posts);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>