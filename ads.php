<?php
// ads.php
header('Content-Type: application/json');
session_start();

$host = 'localhost'; $db = 'catalogo_geo'; $user = 'root'; $pass = ''; 
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
} catch (\PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error BD']); exit;
}

$action = $_POST['action'] ?? '';

// --- CREAR ANUNCIO ---
if ($action === 'create') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['status' => 'error', 'message' => 'No autorizado']); exit;
    }

    $lat = $_POST['lat'];
    $lng = $_POST['lng'];
    $title = $_POST['title'];
    $desc = $_POST['description'];
    $price = $_POST['price'];

    $sql = "INSERT INTO ads (user_id, lat, lng, title, description, price) VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    
    if ($stmt->execute([$_SESSION['user_id'], $lat, $lng, $title, $desc, $price])) {
        echo json_encode(['status' => 'success', 'id' => $pdo->lastInsertId()]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Error al guardar']);
    }
}

// --- OBTENER ANUNCIOS (Para cargar el mapa) ---
if ($action === 'fetch_all') {
    $stmt = $pdo->query("SELECT id, lat, lng, title, price FROM ads");
    $ads = $stmt->fetchAll();
    echo json_encode(['status' => 'success', 'ads' => $ads]);
}
?>