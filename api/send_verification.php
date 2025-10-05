<?php
require 'config.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/vendor/autoload.php'; // PHPMailer autoload

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $token = $_POST['token'] ?? '';

    if (empty($email) || empty($token)) {
        echo json_encode(["error" => "E-posta veya token eksik."]);
        exit;
    }

    $mail = new PHPMailer(true);
    $mail->SMTPDebug = 2;
    $mail->Debugoutput = 'html';

    try {
        // SMTP yapılandırması
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'furkan.aksoz12@gmail.com'; // Gmail adresin
        $mail->Password   = 'akxrtzwbjidcjzrq'; // 16 haneli Google App Şifren
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;

        // Gönderen ve alıcı bilgileri
        $mail->setFrom('seninmailin@gmail.com', 'Knoovynox');
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = 'E-posta Doğrulama - Knoovynox';
        $mail->Body = "
            <div style='font-family:Arial,sans-serif; padding:20px; border:1px solid #ddd; border-radius:8px;'>
                <h2 style='color:#007BFF;'>Knoovynox Hesabınızı Doğrulayın</h2>
                <p>Merhaba! Hesabınızı etkinleştirmek için aşağıdaki bağlantıya tıklayın:</p>
                <a href='http://localhost/api/verify.php?token=$token'
                   style='background-color:#007BFF; color:white; padding:10px 15px;
                          text-decoration:none; border-radius:5px;'>
                   Knoovynox Hesabımı Doğrula
                </a>
                <br><br>
                <small>Bu işlemi siz başlatmadıysanız, lütfen bu e-postayı dikkate almayın.</small>
            </div>
        ";

        $mail->send();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["error" => "E-posta gönderilemedi: {$mail->ErrorInfo}"]);
    }
}
?>
