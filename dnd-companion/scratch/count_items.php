<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
$stmt = $pdo->query("SELECT COUNT(*) FROM items");
echo "Total Items: " . $stmt->fetchColumn() . "\n";

$stmt2 = $pdo->query("SELECT item_name FROM items");
$items = $stmt2->fetchAll(PDO::FETCH_COLUMN);
echo "Samples: " . implode(", ", array_slice($items, 0, 10)) . "\n";
?>
