<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
$stmt = $pdo->query("SELECT item_name, mechanics FROM items WHERE mechanics IS NOT NULL AND mechanics != '' AND mechanics != '[]' AND mechanics != 'null' LIMIT 5");
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
