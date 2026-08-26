<?php
$pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
$stmt = $pdo->query("DELETE FROM items WHERE item_name LIKE 'Ability%' OR item_name LIKE 'Utilize%' OR item_name LIKE 'Craft%' OR item_name LIKE 'Variants%'");
echo "Deleted junk items: " . $stmt->rowCount() . "\n";
?>
