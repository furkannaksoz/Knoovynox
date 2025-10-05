<?php
session_start();
header('Content-Type: application/json');

require_once 'config.php';

ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/laragon/logs/php_error.log');

function sendError($message) {
    error_log("Hata: $message");
    echo json_encode(['error' => $message]);
    exit;
}

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    sendError('Veritabanı bağlantı hatası: ' . $e->getMessage());
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // 🔹 Tek proje detay
        if (!empty($_GET['id'])) {
            $stmt = $conn->prepare("
                SELECT p.*, u.username 
                FROM projects p 
                LEFT JOIN users u ON p.user_id = u.id 
                WHERE p.id = :id
            ");
            $stmt->execute(['id' => (int)$_GET['id']]);
            $project = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$project) {
                echo json_encode(['error' => 'Proje bulunamadı.']);
                exit;
            }

            // 🔹 Satın alınmış mı?
            $isPurchased = false;
            if (isset($_SESSION['user']['id'])) {
                $buyerId = (int)$_SESSION['user']['id'];
                $check = $conn->prepare("SELECT id FROM payments WHERE user_id = :uid AND project_id = :pid LIMIT 1");
                $check->execute(['uid' => $buyerId, 'pid' => $project['id']]);
                if ($check->fetch()) {
                    $isPurchased = true;
                }
            }
            $project['isPurchased'] = $isPurchased;

            echo json_encode($project);
            exit;
        }

        // 🔹 Tüm projeler
        $query  = "SELECT p.*, u.username 
                   FROM projects p 
                   LEFT JOIN users u ON p.user_id = u.id";
        $where  = [];
        $params = [];

        // Tür filtreleme
        if (!empty($_GET['types'])) {
            $types = array_map('trim', explode(',', $_GET['types']));
            $types = array_filter($types, fn($v) => $v !== '');
            if (!empty($types)) {
                $placeholders = implode(',', array_fill(0, count($types), '?'));
                $where[] = "p.type IN ($placeholders)";
                $params = array_merge($params, $types);
            }
        }

        // Alt tür filtreleme
        if (!empty($_GET['subtypes'])) {
            $subtypes = array_map('trim', explode(',', $_GET['subtypes']));
            $subtypes = array_filter($subtypes, fn($v) => $v !== '');
            if (!empty($subtypes)) {
                $placeholders = implode(',', array_fill(0, count($subtypes), '?'));
                $where[] = "p.subtype IN ($placeholders)";
                $params = array_merge($params, $subtypes);
            }
        }

        if (!empty($where)) {
            $query .= " WHERE " . implode(' AND ', $where);
        }

        $stmt = $conn->prepare($query);
        $stmt->execute($params);
        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($projects);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);

        if (!isset($data['action'])) sendError('Geçersiz istek: action belirtilmedi.');
        $action  = $data['action'];
        $user_id = $_SESSION['user']['id'] ?? 0;

        switch ($action) {
            case 'add':
                if ($user_id === 0) sendError('Oturum açmanız gerekiyor.');
                foreach (['title','description','price','type','zip_file_url','zip_file_name','image_file_url'] as $f) {
                    if (!isset($data[$f])) sendError("Eksik alan: $f");
                }
                $stmt = $conn->prepare("INSERT INTO projects
                        (user_id, title, description, price, type, subtype, zip_file_url, zip_file_name, image_file_url, created_at)
                        VALUES (:user_id, :title, :description, :price, :type, :subtype, :zip_file_url, :zip_file_name, :image_file_url, NOW())");
                $stmt->execute([
                    'user_id'        => $user_id,
                    'title'          => $data['title'],
                    'description'    => $data['description'],
                    'price'          => $data['price'],
                    'type'           => $data['type'],
                    'subtype'        => $data['subtype'] ?? null,
                    'zip_file_url'   => $data['zip_file_url'],
                    'zip_file_name'  => $data['zip_file_name'],
                    'image_file_url' => $data['image_file_url'],
                ]);
                echo json_encode(['message' => 'Proje başarıyla eklendi.']);
                exit;

            case 'edit':
                if ($user_id === 0) sendError('Oturum açmanız gerekiyor.');
                if (empty($data['id'])) sendError('Proje ID belirtilmedi.');
                $stmt = $conn->prepare("SELECT * FROM projects WHERE id = :id");
                $stmt->execute(['id' => $data['id']]);
                $project = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$project) sendError('Proje bulunamadı.');
                if ((int)$project['user_id'] !== (int)$user_id) sendError('Yetkiniz yok.');

                $stmt = $conn->prepare("UPDATE projects 
                                        SET title=:title, description=:description, price=:price, type=:type, subtype=:subtype,
                                            zip_file_url=:zip_file_url, zip_file_name=:zip_file_name, image_file_url=:image_file_url
                                        WHERE id=:id");
                $stmt->execute([
                    'id'             => $data['id'],
                    'title'          => $data['title'],
                    'description'    => $data['description'],
                    'price'          => $data['price'],
                    'type'           => $data['type'],
                    'subtype'        => $data['subtype'] ?? null,
                    'zip_file_url'   => $data['zip_file_url'] ?? $project['zip_file_url'],
                    'zip_file_name'  => $data['zip_file_name'] ?? $project['zip_file_name'],
                    'image_file_url' => $data['image_file_url'] ?? $project['image_file_url'],
                ]);
                echo json_encode(['message' => 'Proje başarıyla güncellendi.']);
                exit;

            case 'delete':
                if ($user_id === 0) sendError('Oturum açmanız gerekiyor.');
                if (empty($data['id'])) sendError('Proje ID belirtilmedi.');
                $stmt = $conn->prepare("SELECT user_id FROM projects WHERE id = :id");
                $stmt->execute(['id' => $data['id']]);
                $project = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$project) sendError('Proje bulunamadı.');
                if ((int)$project['user_id'] !== (int)$user_id) sendError('Yetkiniz yok.');

                $stmt = $conn->prepare("DELETE FROM projects WHERE id = :id");
                $stmt->execute(['id' => $data['id']]);
                echo json_encode(['message' => 'Proje başarıyla silindi.']);
                exit;

            default:
                sendError('Geçersiz action: ' . $action);
        }
    }

    sendError('Geçersiz HTTP yöntemi.');
} catch (Exception $e) {
    sendError('Sunucu hatası: ' . $e->getMessage());
}
