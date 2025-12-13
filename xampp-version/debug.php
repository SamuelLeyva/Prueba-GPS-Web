<?php
// Debug script to test PHP functionality
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>PHP Debug Information</h1>";

echo "<h2>Server Info:</h2>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "<br>";

echo "<h2>Directory Tests:</h2>";
$currentDir = __DIR__;
echo "Current Directory: " . $currentDir . "<br>";

$parentDir = dirname($currentDir);
echo "Parent Directory: " . $parentDir . "<br>";

$dataDir = $parentDir . '/data';
echo "Data Directory: " . $dataDir . "<br>";
echo "Data Directory Exists: " . (is_dir($dataDir) ? "Yes" : "No") . "<br>";

$usersDir = $dataDir . '/users';
echo "Users Directory: " . $usersDir . "<br>";
echo "Users Directory Exists: " . (is_dir($usersDir) ? "Yes" : "No") . "<br>";

echo "<h2>Permission Tests:</h2>";
echo "Current Dir Writable: " . (is_writable($currentDir) ? "Yes" : "No") . "<br>";

if (!is_dir($usersDir)) {
    echo "Attempting to create users directory...<br>";
    if (mkdir($usersDir, 0755, true)) {
        echo "Users directory created successfully!<br>";
    } else {
        echo "Failed to create users directory.<br>";
    }
}

echo "<h2>File Write Test:</h2>";
$testFile = $usersDir . '/test.json';
$testData = ['test' => 'data', 'timestamp' => time()];
if (file_put_contents($testFile, json_encode($testData, JSON_PRETTY_PRINT))) {
    echo "Test file created successfully!<br>";
    echo "File contents: " . file_get_contents($testFile) . "<br>";
    unlink($testFile); // Clean up
    echo "Test file deleted.<br>";
} else {
    echo "Failed to create test file.<br>";
}

echo "<h2>POST Test:</h2>";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    echo "POST data received: " . json_encode($input) . "<br>";
} else {
    echo '<form method="POST">
        <input type="text" name="test" value="test data">
        <button type="submit">Submit POST</button>
    </form>';
}

echo "<h2>Error Log:</h2>";
$errorLog = ini_get('error_log');
echo "Error Log Location: " . $errorLog . "<br>";
?>