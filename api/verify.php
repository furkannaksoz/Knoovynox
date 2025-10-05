<?php
require 'config.php';

if (isset($_GET['token'])) {
    $token = $_GET['token'];

    // Kullanıcı doğrulama
    $stmt = $conn->prepare("UPDATE users SET verified = 1 WHERE token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo "
        <div style='
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: 100px auto;
            border: 1px solid #ccc;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        '>
            <h2 style='color: green;'>✅ Knoovynox hesabınız başarıyla doğrulandı!</h2>
            <p>Artık giriş yapabilirsiniz.</p>
            <a href='http://localhost/index.html' 
               style='
                   display: inline-block;
                   background-color: #007BFF;
                   color: white;
                   padding: 10px 20px;
                   border-radius: 6px;
                   text-decoration: none;
               '>Giriş Sayfasına Git</a>
        </div>";
    } else {
        echo "
        <div style='
            font-family: Arial, sans-serif;
            max-width: 500px;
            margin: 100px auto;
            border: 1px solid #ccc;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        '>
            <h2 style='color: red;'>❌ Geçersiz veya daha önce kullanılmış bağlantı.</h2>
            <p>Bu bağlantı zaten doğrulanmış olabilir veya süresi dolmuş olabilir.</p>
        </div>";
    }
} else {
    echo "
    <div style='
        font-family: Arial, sans-serif;
        max-width: 500px;
        margin: 100px auto;
        border: 1px solid #ccc;
        padding: 30px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
    '>
        <h2 style='color: red;'>⚠️ Geçersiz istek.</h2>
        <p>Doğrulama bağlantısı hatalı veya eksik.</p>
    </div>";
}
?>
