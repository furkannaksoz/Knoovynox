<?php
require_once 'config.php';
header('Content-Type: application/json');

$projectId = $_GET['id'] ?? 0;
if ($projectId <= 0) {
    echo json_encode(["error" => "Geçersiz proje ID"]);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT p.*, u.username 
                             FROM projects p 
                             LEFT JOIN users u ON p.user_id = u.id 
                             WHERE p.id = ?");
    $stmt->bind_param("i", $projectId);
    $stmt->execute();
    $result = $stmt->get_result();
    $project = $result->fetch_assoc();

    if ($project) {
        echo json_encode($project);
    } else {
        echo json_encode(["error" => "Proje bulunamadı"]);
    }
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
$conn->close();
