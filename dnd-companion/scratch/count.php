<?php
require 'backend/config.php';
$stmt = $pdo->query('SELECT COUNT(*) FROM items');
echo "Total items: " . $stmt->fetchColumn() . "\n";
?>
