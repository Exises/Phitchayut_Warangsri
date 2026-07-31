<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
$stmt = $pdo->prepare("SELECT * FROM items WHERE item_name = 'Tinker\'s Tools'");
$stmt->execute();
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
