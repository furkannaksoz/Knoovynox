<?php
require_once 'config.php';
session_start();

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'GET') {
    if (isset($_SESSION['user'])) {
        echo json_encode(["user" => $_SESSION['user']]);
    } else {
        echo json_encode([]);
    }
} elseif ($method === 'POST') {
    if (!isset($input['action'])) {
        echo json_encode(["error" => "Geçersiz işlem."]);
        exit;
    }

    if ($input['action'] === 'register') {
        $email = $input['email'] ?? '';
        $username = $input['username'] ?? '';
        $password = $input['password'] ?? '';
        $age = $input['age'] ?? null;
        $birth_date = $input['birth_date'] ?? null;
        $image_file_url = $input['image_file_url'] ?? '/assets/default-avatar.png';

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(["error" => "Geçerli bir e-posta girin."]);
            exit;
        }
        if (strlen($username) < 3) {
            echo json_encode(["error" => "Kullanıcı adı en az 3 karakter olmalı."]);
            exit;
        }
        if (strlen($password) < 6) {
            echo json_encode(["error" => "Şifre en az 6 karakter olmalı."]);
            exit;
        }

        try {
            $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
            $stmt->bind_param("ss", $email, $username);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                echo json_encode(["error" => "E-posta veya kullanıcı adı zaten kayıtlı."]);
                exit;
            }

            // 🔹 Token ve verified sütunlarını ekledik
            $token = bin2hex(random_bytes(16));
            $verified = 0;
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);

            // 🔹 Yeni kullanıcı kaydı
            $stmt = $conn->prepare("INSERT INTO users (email, username, password, age, birth_date, image_file_url, token, verified)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssisssi", $email, $username, $hashed_password, $age, $birth_date, $image_file_url, $token, $verified);

            if ($stmt->execute()) {
                // 🔹 Mail gönderimi - send_verification.php çağrısı
                $postdata = http_build_query([
                    'email' => $email,
                    'token' => $token
                ]);
                $opts = [
                    'http' => [
                        'method'  => 'POST',
                        'header'  => "Content-type: application/x-www-form-urlencoded",
                        'content' => $postdata
                    ]
                ];
                $context = stream_context_create($opts);
                file_get_contents('http://localhost/api/send_verification.php', false, $context);

                echo json_encode(["message" => "Kayıt başarılı! E-posta doğrulaması için gelen kutunuzu kontrol edin."]);
            } else {
                echo json_encode(["error" => "Kayıt başarısız."]);
            }
        } catch (Exception $e) {
            echo json_encode(["error" => "Kayıt hatası: " . $e->getMessage()]);
        }
    } elseif ($input['action'] === 'login') {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        try {
            $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();

            if ($user && password_verify($password, $user['password'])) {
                // 🔹 Doğrulama kontrolü
                if ($user['verified'] == 0) {
                    echo json_encode(["error" => "E-posta doğrulanmadı. Lütfen e-postanızı kontrol edin."]);
                    exit;
                }

                $_SESSION['user'] = $user;
                echo json_encode(["message" => "Giriş başarılı!", "user" => $user]);
            } else {
                echo json_encode(["error" => "E-posta veya şifre yanlış."]);
            }
        } catch (Exception $e) {
            echo json_encode(["error" => "Giriş hatası: " . $e->getMessage()]);
        }
    } elseif ($input['action'] === 'update_profile') {
        if (!isset($_SESSION['user'])) {
            echo json_encode(["error" => "Oturum açık değil."]);
            exit;
        }

        $user_id = $_SESSION['user']['id'];
        $email = $input['email'] ?? '';
        $username = $input['username'] ?? '';
        $age = $input['age'] ?? null;
        $birth_date = $input['birth_date'] ?? null;
        $image_file_url = $input['image_file_url'] ?? $_SESSION['user']['image_file_url'];

        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo json_encode(["error" => "Geçerli bir e-posta girin."]);
            exit;
        }
        if (strlen($username) < 3) {
            echo json_encode(["error" => "Kullanıcı adı en az 3 karakter olmalı."]);
            exit;
        }

        try {
            $stmt = $conn->prepare("SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?");
            $stmt->bind_param("ssi", $email, $username, $user_id);
            $stmt->execute();
            if ($stmt->get_result()->num_rows > 0) {
                echo json_encode(["error" => "E-posta veya kullanıcı adı zaten kullanılıyor."]);
                exit;
            }

            $stmt = $conn->prepare("UPDATE users SET email = ?, username = ?, age = ?, birth_date = ?, image_file_url = ? WHERE id = ?");
            $stmt->bind_param("ssissi", $email, $username, $age, $birth_date, $image_file_url, $user_id);
            if ($stmt->execute()) {
                $_SESSION['user'] = [
                    'id' => $user_id,
                    'email' => $email,
                    'username' => $username,
                    'age' => $age,
                    'birth_date' => $birth_date,
                    'image_file_url' => $image_file_url
                ];
                echo json_encode(["message" => "Profil güncellendi!"]);
            } else {
                echo json_encode(["error" => "Profil güncelleme başarısız."]);
            }
        } catch (Exception $e) {
            echo json_encode(["error" => "Profil güncelleme hatası: " . $e->getMessage()]);
        }
    } elseif ($input['action'] === 'logout') {
        session_destroy();
        echo json_encode(["message" => "Çıkış yapıldı."]);
    } else {
        echo json_encode(["error" => "Geçersiz işlem."]);
    }
} else {
    echo json_encode(["error" => "Geçersiz istek yöntemi."]);
}
$conn->close();
?>
