<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

// Hata raporlamasını aç
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/laragon/logs/php_error.log');

// Hata işleme fonksiyonu
function sendError($message) {
    error_log("Hata: $message");
    echo json_encode(['error' => $message]);
    exit;
}

// Oturum kontrolü: Kayıt işlemi için oturum zorunluluğunu kaldır
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    // Dosya yükleme ayarları
    $uploadDir = 'C:/laragon/www/Uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    try {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            sendError('Geçersiz HTTP yöntemi.');
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] === UPLOAD_ERR_NO_FILE) {
            sendError('Dosya yüklenmedi.');
        }

        $file = $_FILES['file'];
        $fileName = $file['name'];
        $fileTmpName = $file['tmp_name'];
        $fileSize = $file['size'];
        $fileError = $file['error'];
        $fileType = mime_content_type($fileTmpName);

        error_log("Dosya yükleme denemesi: name=$fileName, type=$fileType, size=$fileSize");

        // Dosya türü kontrolü
        $allowedTypes = [
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            'application/zip' => 'zip'
        ];

        if (!array_key_exists($fileType, $allowedTypes)) {
            sendError('Sadece PNG, JPEG veya ZIP dosyaları yüklenebilir. Algılanan tür: ' . $fileType);
        }

        // Dosya boyutu kontrolü
        if ($fileSize > 10 * 1024 * 1024) { // 10MB limit
            sendError('Dosya boyutu 10MB\'dan büyük olamaz.');
        }

        // Dosya uzantısını al
        $fileExt = $allowedTypes[$fileType];
        $uniqueFileName = uniqid('file_', true) . '.' . $fileExt;
        $destination = $uploadDir . $uniqueFileName;

        // Dosyayı taşı
        if (!move_uploaded_file($fileTmpName, $destination)) {
            sendError('Dosya yüklenirken bir hata oluştu.');
        }

        // Dosya URL'sini oluştur
        $fileUrl = '/Uploads/' . $uniqueFileName;
        echo json_encode([
            'message' => 'Dosya başarıyla yüklendi.',
            'file_url' => $fileUrl,
            'file_name' => $fileName
        ]);
    } catch (Exception $e) {
        sendError('Sunucu hatası: ' . $e->getMessage());
    }
} else {
    sendError('Geçersiz istek.');
}
?>