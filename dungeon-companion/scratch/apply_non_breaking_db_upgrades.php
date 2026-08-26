<?php
try {
    $pdo = new PDO("mysql:host=localhost;dbname=dnd_project;charset=utf8mb4", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "--- Phase 1: Applying Non-Breaking DB Upgrades ---\n";

    // 1. Add deleted_at columns for Soft Delete
    $tables = ['items', 'feats', 'species', 'classes', 'backgrounds', 'spells', 'subclasses', 'lineages'];
    foreach ($tables as $t) {
        $stmt = $pdo->query("SHOW COLUMNS FROM `$t` LIKE 'deleted_at'");
        if ($stmt->rowCount() === 0) {
            $pdo->exec("ALTER TABLE `$t` ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL");
            echo "Added `deleted_at` column to `$t` table.\n";
        } else {
            echo "`deleted_at` column already exists in `$t`.\n";
        }
    }

    // 2. Create entity_modifiers secondary index table
    $sqlEntityMods = "CREATE TABLE IF NOT EXISTS `entity_modifiers` (
        `modifier_id` INT AUTO_INCREMENT PRIMARY KEY,
        `entity_type` ENUM('species', 'class', 'subclass', 'background', 'feat', 'item', 'spell') NOT NULL,
        `entity_id` VARCHAR(100) NOT NULL,
        `mod_type` VARCHAR(50) NOT NULL,
        `mod_sub_type` VARCHAR(50) NOT NULL,
        `mod_target` VARCHAR(100) NOT NULL,
        `mod_value` VARCHAR(100) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX `idx_entity` (`entity_type`, `entity_id`),
        INDEX `idx_target` (`mod_type`, `mod_target`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $pdo->exec($sqlEntityMods);
    echo "Created/Verified `entity_modifiers` secondary index table.\n";

    echo "--- Phase 1 Migration Applied Successfully! ---\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
