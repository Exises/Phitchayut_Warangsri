<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
$stmt = $pdo->prepare("SELECT * FROM feats WHERE feat_id = 'skilled'");
$stmt->execute();
$feat = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($feat, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
