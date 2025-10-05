<?php
require_once 'config.php';
session_start();

header('Content-Type: application/json');

// Hata işleme fonksiyonu
function sendError($message) {
    error_log("Hata: $message");
    echo json_encode(["error" => $message]);
    exit;
}

// Oturum kontrolü
if (!isset($_SESSION['user'])) {
    sendError("Oturum açık değil.");
}

$user_id = (int)$_SESSION['user']['id'];

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $method = $_SERVER['REQUEST_METHOD'];
    $input = json_decode(file_get_contents('php://input'), true);

    if ($method === 'POST' && isset($input['action']) && $input['action'] === 'add_payment') {
        // Ödeme ekle
        $project_id = (int)($input['project_id'] ?? 0);
        $amount     = (float)($input['amount'] ?? 0);
        $payment_method = $input['payment_method'] ?? 'Kredi Kartı';
        $card_number = $input['card_number'] ?? '';
        $card_expiry = $input['card_expiry'] ?? '';
        $card_cvc    = $input['card_cvc'] ?? '';

        // Girdi doğrulama
        if ($project_id <= 0) sendError("Geçersiz proje ID.");
        if ($amount <= 0) sendError("Geçersiz ödeme miktarı.");
        if (empty($card_number) || !preg_match('/^\d{16}$/', $card_number)) sendError("Geçerli bir 16 haneli kart numarası girin.");
        if (empty($card_expiry) || !preg_match('/^(0[1-9]|1[0-2])\/[0-9]{2}$/', $card_expiry)) sendError("Geçerli bir son kullanma tarihi girin (MM/YY).");
        if (empty($card_cvc) || !preg_match('/^\d{3}$/', $card_cvc)) sendError("Geçerli bir 3 haneli CVC kodu girin.");

        // Proje kontrolü
        $stmt = $conn->prepare("SELECT price FROM projects WHERE id = :id");
        $stmt->execute(['id' => $project_id]);
        $project = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$project) sendError("Proje bulunamadı.");
        if ((float)$project['price'] != $amount) sendError("Ödeme miktarı proje fiyatıyla eşleşmiyor.");

        // Daha önce satın alınmış mı?
        $stmt = $conn->prepare("SELECT id FROM payments WHERE user_id = :uid AND project_id = :pid LIMIT 1");
        $stmt->execute(['uid' => $user_id, 'pid' => $project_id]);
        if ($stmt->fetch()) {
            sendError("Bu projeyi zaten satın aldınız.");
        }

        // Ödeme işlemi (test amaçlı transaction id)
        $transaction_id = 'TXN_' . uniqid();

        // Ödemeyi kaydet
        $stmt = $conn->prepare("
            INSERT INTO payments (user_id, project_id, amount, payment_status, payment_method, transaction_id, created_at)
            VALUES (:uid, :pid, :amount, 'Completed', :method, :txid, NOW())
        ");
        $stmt->execute([
            'uid'   => $user_id,
            'pid'   => $project_id,
            'amount'=> $amount,
            'method'=> $payment_method,
            'txid'  => $transaction_id
        ]);

        echo json_encode(["message" => "Ödeme başarıyla kaydedildi!", "transaction_id" => $transaction_id]);
        exit;
    }

    elseif ($method === 'POST' && isset($input['action']) && $input['action'] === 'get_user_purchases') {
        // Kullanıcının satın aldığı projeleri getir
        $stmt = $conn->prepare("
            SELECT p.id as payment_id, pr.id as project_id, pr.title, pr.description, pr.type, pr.price, 
                   pr.zip_file_url, pr.zip_file_name, pr.image_file_url, p.created_at as purchase_date
            FROM payments p
            JOIN projects pr ON p.project_id = pr.id
            WHERE p.user_id = :uid
            ORDER BY p.created_at DESC
        ");
        $stmt->execute(['uid' => $user_id]);
        $purchases = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($purchases);
        exit;
    }

    else {
        sendError("Geçersiz istek.");
    }
} catch (Exception $e) {
    sendError("Sunucu hatası: " . $e->getMessage());
}
