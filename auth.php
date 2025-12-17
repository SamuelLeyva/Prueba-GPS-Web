<?php
// auth.php
session_start();
header('Content-Type: application/json'); // Indicamos que la respuesta será JSON

// --- CONFIGURACIÓN DE LA BASE DE DATOS (XAMPP por defecto) ---
$host = 'localhost';
$db   = 'catalogo_geo';
$user = 'root';
$pass = ''; // Por defecto en XAMPP la contraseña está vacía
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    // Conexión a la base de datos
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error de conexión a la BD: ' . $e->getMessage()]);
    exit;
}

// --- RECIBIR DATOS DEL FRONTEND ---
$username = preg_replace('/[^a-zA-Z0-9_]/', '', $_POST['username'] ?? ''); // Solo letras, números y guion bajo

// Verificamos si hay datos POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    $action = $_POST['action'] ?? '';
    // --- VERIFICAR SI USUARIO EXISTE (AJAX al escribir) ---
    if ($action === 'check_username') {
        if (empty($username)) { exit; }
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            echo json_encode(['status' => 'taken', 'message' => 'Nombre no disponible']);
        } else {
            echo json_encode(['status' => 'available', 'message' => 'Disponible']);
        }
        exit;
    }

    // --- VERIFICAR SESIÓN ACTIVA (Al cargar página) ---
    if ($action === 'check_session') {
        if (isset($_SESSION['user_id'])) {
            // Obtener datos frescos del usuario
            $stmt = $pdo->prepare("SELECT email, username, phone FROM users WHERE id = ?");
            $stmt->execute([$_SESSION['user_id']]);
            $userData = $stmt->fetch();
            echo json_encode(['status' => 'logged_in', 'user' => $userData]);
        } else {
            echo json_encode(['status' => 'guest']);
        }
        exit;
    }

    // --- CERRAR SESIÓN ---
    if ($action === 'logout') {
        session_destroy();
        echo json_encode(['status' => 'success']);
        exit;
    }
    $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'] ?? '';

    // Validaciones básicas
    if (empty($email) || empty($password)) {
        echo json_encode(['status' => 'error', 'message' => 'Email y contraseña son obligatorios.']);
        exit;
    }

    // --- LÓGICA DE REGISTRO ---
    if ($action === 'register') {
        
        // 1. Verificar si el usuario ya existe
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->fetch()) {
            echo json_encode(['status' => 'error', 'message' => 'Este correo ya está registrado.']);
        } else {
            // 2. Encriptar contraseña (NUNCA guardar texto plano)
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            // 3. Insertar usuario (El teléfono se queda NULL por ahora)
           $sql = "INSERT INTO users (email, username, password) VALUES (?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            
           if ($stmt->execute([$email, $username, $passwordHash])) {
                echo json_encode(['status' => 'success', 'message' => '¡Registro exitoso! Ahora puedes iniciar sesión.']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Error al registrar usuario.']);
            }
        }

    // --- LÓGICA DE LOGIN ---
    } elseif ($action === 'login') {
        
        // 1. Buscar usuario por email
        $stmt = $pdo->prepare("SELECT id, password FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // 2. Verificar si existe y si la contraseña coincide
        if ($user && password_verify($password, $user['password'])) {
            
            // ¡LOGIN EXITOSO!
            // Aquí podrías iniciar variables de sesión PHP: session_start(); $_SESSION['user_id'] = $user['id'];
            // Guardar sesión en el servidor (esto crea la cookie automáticamente)
            $_SESSION['user_id'] = $user['id'];
            
            // Obtener datos extra para mostrar en el perfil
            $stmt = $pdo->prepare("SELECT username, phone FROM users WHERE id = ?");
            $stmt->execute([$user['id']]);
            $extraData = $stmt->fetch();


           echo json_encode([
                'status' => 'success', 
                'message' => 'Inicio de sesión correcto.',
                'user' => [
                    'email' => $email,
                    'username' => $extraData['username'],
                    'phone' => $extraData['phone']
                ]
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Credenciales incorrectas.']);
        }

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Acción no válida.']);
    }

} else {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
}
?>