<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Data directory
$dataDir = '../data/posts';
$postsFile = $dataDir . '/posts.json';

// Ensure data directory exists
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Read posts
if (file_exists($postsFile)) {
    $postsData = file_get_contents($postsFile);
    if ($postsData !== false) {
        $posts = json_decode($postsData, true);
        if ($posts !== null) {
            echo json_encode($posts);
            exit;
        }
    }
}

// Return empty array if file doesn't exist or is invalid
echo json_encode([]);
?>