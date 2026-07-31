<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    exit;
}

$host = 'localhost';
$dbname = 'dnd_project';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Auto-create character_logs table if not exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS `character_logs` (
        `log_id` INT AUTO_INCREMENT PRIMARY KEY,
        `char_id` INT NOT NULL,
        `user_id` INT DEFAULT 1,
        `category` ENUM('gameplay', 'inventory', 'build') DEFAULT 'gameplay',
        `action_type` VARCHAR(100) DEFAULT 'GENERAL',
        `log_text_th` TEXT NOT NULL,
        `metadata_json` LONGTEXT DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (`char_id`),
        INDEX (`category`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // -------------------------------------------------------------
    // [NEW] จัดการ POST Requests (Signup / Login)
    // -------------------------------------------------------------
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? '';

        if ($action === 'register') {
            $username = $data['username'] ?? '';
            $email = $data['email'] ?? '';
            $password = $data['password'] ?? '';
            $role = 'user'; // บังคับเป็น user เท่านั้นตามเงื่อนไข

            // 1. ตรวจสอบรูปแบบอีเมลจริงๆ
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                echo json_encode(['error' => 'รูปแบบอีเมลไม่ถูกต้อง']);
                exit;
            }

            // 2. ตรวจสอบ Username (ขั้นต่ำ 5 ตัว, ภาษาอังกฤษและตัวเลขเท่านั้น)
            if (!preg_match('/^[a-zA-Z0-9]{5,}$/', $username)) {
                echo json_encode(['error' => 'Username ต้องมีอย่างน้อย 5 ตัวอักษร และใช้ได้แค่ภาษาอังกฤษและตัวเลข']);
                exit;
            }

            // 3. ตรวจสอบ Password (ขั้นต่ำ 8 ตัว, ภาษาอังกฤษและตัวเลขเท่านั้น)
            if (!preg_match('/^[a-zA-Z0-9]{8,}$/', $password)) {
                echo json_encode(['error' => 'Password ต้องมีอย่างน้อย 8 ตัวอักษร และใช้ได้แค่ภาษาอังกฤษและตัวเลข']);
                exit;
            }

            // 4. ตรวจสอบว่า Username หรือ Email ซ้ำหรือไม่
            $stmt = $pdo->prepare("SELECT user_id FROM users WHERE user_name = ? OR user_email = ?");
            $stmt->execute([$username, $email]);
            if ($stmt->fetch()) {
                echo json_encode(['error' => 'Username หรือ Email นี้ถูกใช้งานแล้ว']);
                exit;
            }

            // 5. บันทึกข้อมูลพร้อม Hash รหัสผ่าน
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (user_name, user_email, user_password, role) VALUES (?, ?, ?, ?)");
            $stmt->execute([$username, $email, $hashedPassword, $role]);

            echo json_encode(['success' => 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ']);
            exit;
        }

        switch ($action) {
            case 'add_character_log':
                try {
                    $char_id = intval($data['char_id'] ?? 0);
                    $user_id = intval($data['user_id'] ?? 1);
                    $category = $data['category'] ?? 'gameplay';
                    $action_type = $data['action_type'] ?? 'GENERAL';
                    $log_text_th = trim($data['log_text_th'] ?? '');
                    $metadata_json = is_array($data['metadata_json'] ?? null) || is_object($data['metadata_json'] ?? null) 
                        ? json_encode($data['metadata_json'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
                        : ($data['metadata_json'] ?? null);

                    if (!$char_id || !$log_text_th) {
                        echo json_encode(['status' => 'error', 'message' => 'ข้อมูล char_id หรือ log_text_th ไม่ถูกต้อง']);
                        exit;
                    }

                    $stmt = $pdo->prepare("INSERT INTO character_logs (char_id, user_id, category, action_type, log_text_th, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())");
                    $stmt->execute([$char_id, $user_id, $category, $action_type, $log_text_th, $metadata_json]);
                    $log_id = $pdo->lastInsertId();

                    echo json_encode(['status' => 'success', 'message' => 'บันทึก Log สำเร็จ', 'log_id' => $log_id], JSON_UNESCAPED_UNICODE);
                } catch (Exception $e) {
                    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการบันทึก Log: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'get_character_logs':
                try {
                    $char_id = intval($data['char_id'] ?? $_GET['char_id'] ?? 0);
                    $category = $data['category'] ?? $_GET['category'] ?? 'all';
                    if (!$char_id) {
                        echo json_encode([]);
                        exit;
                    }

                    if ($category !== 'all' && in_array($category, ['gameplay', 'inventory', 'build'])) {
                        $stmt = $pdo->prepare("SELECT * FROM character_logs WHERE char_id = ? AND category = ? ORDER BY created_at DESC LIMIT 100");
                        $stmt->execute([$char_id, $category]);
                    } else {
                        $stmt = $pdo->prepare("SELECT * FROM character_logs WHERE char_id = ? ORDER BY created_at DESC LIMIT 100");
                        $stmt->execute([$char_id]);
                    }

                    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    foreach ($logs as &$l) {
                        if (!empty($l['metadata_json']) && is_string($l['metadata_json'])) {
                            $l['metadata_json'] = json_decode($l['metadata_json'], true) ?: $l['metadata_json'];
                        }
                    }
                    echo json_encode($logs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                } catch (Exception $e) {
                    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
                }
                break;

            case 'clear_character_logs':
                try {
                    $char_id = intval($data['char_id'] ?? 0);
                    if ($char_id) {
                        $stmt = $pdo->prepare("DELETE FROM character_logs WHERE char_id = ?");
                        $stmt->execute([$char_id]);
                        echo json_encode(['status' => 'success', 'message' => 'ลบประวัติ Log ทั้งหมดเรียบร้อยแล้ว']);
                    }
                } catch (Exception $e) {
                    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
                }
                break;
            case 'save_character':
                try {
                    $user_id = intval($data['user_id'] ?? 1);
                    $char_name = trim($data['char_name'] ?? 'Unnamed Hero');
                    $species_id = $data['species_id'] ?? null;
                    $lineage_id = $data['lineage_id'] ?? null;
                    $background_id = $data['background_id'] ?? null;
                    $primary_class_id = $data['primary_class_id'] ?? null;
                    $classes_data = is_string($data['classes_data'] ?? null) ? $data['classes_data'] : json_encode($data['classes_data'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $char_alignment = $data['char_alignment'] ?? 'True Neutral';
                    $char_level = intval($data['char_level'] ?? 1);
                    $hp_max = intval($data['hp_max'] ?? 10);
                    $hp_current = intval($data['hp_current'] ?? $hp_max);
                    $str_score = intval($data['str_score'] ?? 10);
                    $dex_score = intval($data['dex_score'] ?? 10);
                    $con_score = intval($data['con_score'] ?? 10);
                    $int_score = intval($data['int_score'] ?? 10);
                    $wis_score = intval($data['wis_score'] ?? 10);
                    $cha_score = intval($data['cha_score'] ?? 10);
                    $proficiencies_choices = is_string($data['proficiencies_choices'] ?? null) ? $data['proficiencies_choices'] : json_encode($data['proficiencies_choices'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $spellcasting_data = is_string($data['spellcasting_data'] ?? null) ? $data['spellcasting_data'] : json_encode($data['spellcasting_data'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $inventory = is_string($data['inventory'] ?? null) ? $data['inventory'] : json_encode($data['inventory'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $currency = is_string($data['currency'] ?? null) ? $data['currency'] : json_encode($data['currency'] ?? ["cp"=>0, "sp"=>0, "ep"=>0, "gp"=>0, "pp"=>0], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $feats_data = is_string($data['feats_data'] ?? null) ? $data['feats_data'] : json_encode($data['feats_data'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $hit_dice_current = is_string($data['hit_dice_current'] ?? null) ? $data['hit_dice_current'] : json_encode($data['hit_dice_current'] ?? [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    $death_save_success = intval($data['death_save_success'] ?? 0);
                    $death_save_failure = intval($data['death_save_failure'] ?? 0);
                    $inspiration = intval($data['inspiration'] ?? 0);
                    $exhaustion_level = intval($data['exhaustion_level'] ?? 0);
                    $base_ac = intval($data['base_ac'] ?? 10);
                    $build_data = isset($data['build_data']) ? (is_string($data['build_data']) ? $data['build_data'] : json_encode($data['build_data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) : null;
                    $play_data = isset($data['play_data']) ? (is_string($data['play_data']) ? $data['play_data'] : json_encode($data['play_data'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)) : null;

                    $char_id = !empty($data['char_id']) ? intval($data['char_id']) : null;
                    if ($char_id) {
                        $stmt = $pdo->prepare("UPDATE characters SET user_id=?, char_name=?, species_id=?, lineage_id=?, background_id=?, primary_class_id=?, classes_data=?, char_alignment=?, char_level=?, hp_max=?, hp_current=?, str_score=?, dex_score=?, con_score=?, int_score=?, wis_score=?, cha_score=?, proficiencies_choices=?, spellcasting_data=?, inventory=?, currency=?, feats_data=?, hit_dice_current=?, death_save_success=?, death_save_failure=?, inspiration=?, exhaustion_level=?, base_ac=?, build_data=?, play_data=?, updated_at=NOW() WHERE char_id=?");
                        $stmt->execute([$user_id, $char_name, $species_id, $lineage_id, $background_id, $primary_class_id, $classes_data, $char_alignment, $char_level, $hp_max, $hp_current, $str_score, $dex_score, $con_score, $int_score, $wis_score, $cha_score, $proficiencies_choices, $spellcasting_data, $inventory, $currency, $feats_data, $hit_dice_current, $death_save_success, $death_save_failure, $inspiration, $exhaustion_level, $base_ac, $build_data, $play_data, $char_id]);
                        echo json_encode(['status' => 'success', 'message' => 'บันทึกอัปเดตตัวละครลงฐานข้อมูลสำเร็จ', 'char_id' => $char_id], JSON_UNESCAPED_UNICODE);
                    } else {
                        $stmt = $pdo->prepare("INSERT INTO characters (user_id, char_name, species_id, lineage_id, background_id, primary_class_id, classes_data, char_alignment, char_level, hp_max, hp_current, str_score, dex_score, con_score, int_score, wis_score, cha_score, proficiencies_choices, spellcasting_data, inventory, currency, feats_data, hit_dice_current, death_save_success, death_save_failure, inspiration, exhaustion_level, base_ac, build_data, play_data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
                        $stmt->execute([$user_id, $char_name, $species_id, $lineage_id, $background_id, $primary_class_id, $classes_data, $char_alignment, $char_level, $hp_max, $hp_current, $str_score, $dex_score, $con_score, $int_score, $wis_score, $cha_score, $proficiencies_choices, $spellcasting_data, $inventory, $currency, $feats_data, $hit_dice_current, $death_save_success, $death_save_failure, $inspiration, $exhaustion_level, $base_ac, $build_data, $play_data]);
                        $new_id = $pdo->lastInsertId();
                        echo json_encode(['status' => 'success', 'message' => 'บันทึกตัวละครใหม่ลงฐานข้อมูลสำเร็จ', 'char_id' => $new_id], JSON_UNESCAPED_UNICODE);
                    }
                } catch (Exception $e) {
                    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการบันทึกตัวละคร: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
                }
                break;

            case 'delete_character':
                try {
                    $char_id = intval($data['char_id'] ?? 0);
                    $user_id = intval($data['user_id'] ?? 1);
                    if (!$char_id) {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่ระบุรหัสตัวละครที่ต้องการลบ']);
                        exit;
                    }
                    $stmt = $pdo->prepare("DELETE FROM characters WHERE char_id = ? AND user_id = ?");
                    $stmt->execute([$char_id, $user_id]);
                    echo json_encode(['status' => 'success', 'message' => 'ลบตัวละครสำเร็จ']);
                } catch (Exception $e) {
                    echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการลบ: ' . $e->getMessage()]);
                }
                break;


            case 'login':
                $email = $data['email'] ?? '';
                $password = $data['password'] ?? '';

                $stmt = $pdo->prepare("SELECT * FROM users WHERE user_email = ?");
                $stmt->execute([$email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user && password_verify($password, $user['user_password'])) {
                    unset($user['user_password']); // ไม่ส่ง password กลับไป
                    echo json_encode(['status' => 'success', 'user' => $user]);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาใส่ใหม่อีครั้ง']);
                }
                break;

            case 'verify_password':
                $user_id = $data['user_id'] ?? '';
                $password = $data['password'] ?? '';

                $stmt = $pdo->prepare("SELECT user_password FROM users WHERE user_id = ?");
                $stmt->execute([$user_id]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user && password_verify($password, $user['user_password'])) {
                    echo json_encode(['status' => 'success']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'รหัสผ่านไม่ถูกต้อง']);
                }
                break;

            case 'update_profile':
                $user_id = $data['user_id'] ?? '';
                $user_name = $data['user_name'] ?? '';
                $user_email = $data['user_email'] ?? '';
                $bio = $data['bio'] ?? '';

                if (empty($user_id) || empty($user_name) || empty($user_email)) {
                    echo json_encode(['status' => 'error', 'message' => 'กรุณากรอกข้อมูลให้ครบถ้วน']);
                    break;
                }

                // ตรวจสอบว่าชื่อผู้ใช้ซ้ำหรือไม่ (ยกเว้นของตัวเอง)
                $stmt = $pdo->prepare("SELECT user_id FROM users WHERE user_name = ? AND user_id != ?");
                $stmt->execute([$user_name, $user_id]);
                if ($stmt->fetch()) {
                    echo json_encode(['status' => 'error', 'message' => 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว']);
                    break;
                }

                // อัปเดตข้อมูล
                $stmt = $pdo->prepare("UPDATE users SET user_name = ?, user_email = ?, bio = ? WHERE user_id = ?");
                if ($stmt->execute([$user_name, $user_email, $bio, $user_id])) {
                    // ดึงข้อมูลใหม่ส่งกลับไป
                    $stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = ?");
                    $stmt->execute([$user_id]);
                    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
                    unset($updatedUser['user_password']);
                    echo json_encode(['status' => 'success', 'user' => $updatedUser]);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'ไม่สามารถอัปเดตข้อมูลได้']);
                }
                break;

            case 'change_password':
                $user_id = $data['user_id'] ?? '';
                $current_password = $data['current_password'] ?? '';
                $new_password = $data['new_password'] ?? '';

                if (empty($user_id) || empty($current_password) || empty($new_password)) {
                    echo json_encode(['status' => 'error', 'message' => 'กรุณากรอกข้อมูลให้ครบถ้วน']);
                    break;
                }

                $stmt = $pdo->prepare("SELECT user_password FROM users WHERE user_id = ?");
                $stmt->execute([$user_id]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user && password_verify($current_password, $user['user_password'])) {
                    $new_hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare("UPDATE users SET user_password = ? WHERE user_id = ?");
                    if ($stmt->execute([$new_hashed_password, $user_id])) {
                        echo json_encode(['status' => 'success', 'message' => 'เปลี่ยนรหัสผ่านสำเร็จ']);
                    } else {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่สามารถเปลี่ยนรหัสผ่านได้']);
                    }
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'รหัสผ่านปัจจุบันไม่ถูกต้อง']);
                }
                break;

            // -------------------------------------------------------------
            // [ADMIN ONLY] Master System Stats & Overview
            // -------------------------------------------------------------
            case 'get_admin_stats':
                $admin_id = $data['admin_id'] ?? '';
                $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
                $stmt->execute([$admin_id]);
                $admin = $stmt->fetch();

                if ($admin && $admin['role'] === 'admin') {
                    $totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
                    $totalChars = $pdo->query("SELECT COUNT(*) FROM characters")->fetchColumn();
                    $totalSpells = $pdo->query("SELECT COUNT(*) FROM spells")->fetchColumn();
                    $totalItems = $pdo->query("SELECT COUNT(*) FROM items")->fetchColumn();
                    $totalRaces = $pdo->query("SELECT COUNT(*) FROM species")->fetchColumn();
                    $totalClasses = $pdo->query("SELECT COUNT(*) FROM classes")->fetchColumn();
                    $totalFeats = $pdo->query("SELECT COUNT(*) FROM feats")->fetchColumn();
                    $totalBackgrounds = $pdo->query("SELECT COUNT(*) FROM backgrounds")->fetchColumn();
                    
                    $totalFeedbacks = $pdo->query("SELECT COUNT(*) FROM feedbacks")->fetchColumn();
                    $unreadFeedbacks = $pdo->query("SELECT COUNT(*) FROM feedbacks WHERE is_read = 0 OR is_read IS NULL")->fetchColumn();
                    $bugFeedbacks = $pdo->query("SELECT COUNT(*) FROM feedbacks WHERE LOWER(category) = 'bug'")->fetchColumn();

                    echo json_encode([
                        'status' => 'success',
                        'stats' => [
                            'users' => intval($totalUsers),
                            'characters' => intval($totalChars),
                            'spells' => intval($totalSpells),
                            'items' => intval($totalItems),
                            'races' => intval($totalRaces),
                            'classes' => intval($totalClasses),
                            'feats' => intval($totalFeats),
                            'backgrounds' => intval($totalBackgrounds),
                            'feedbacks' => intval($totalFeedbacks),
                            'unread_feedbacks' => intval($unreadFeedbacks),
                            'bug_feedbacks' => intval($bugFeedbacks)
                        ]
                    ], JSON_UNESCAPED_UNICODE);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'สิทธิ์การเข้าถึงไม่ถูกต้อง']);
                }
                break;

            // -------------------------------------------------------------
            // [ADMIN ONLY] ระบบจัดการผู้ใช้งาน (User Management)
            // -------------------------------------------------------------
            case 'get_users':
                $admin_id = $data['admin_id'] ?? '';
                
                $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
                $stmt->execute([$admin_id]);
                $admin = $stmt->fetch();

                if ($admin && $admin['role'] === 'admin') {
                    $stmt = $pdo->query("
                        SELECT u.user_id, u.user_name, u.user_email, u.role, COALESCE(u.status, 'active') as status, u.avatar_url, u.created_at, COUNT(c.char_id) as character_count 
                        FROM users u 
                        LEFT JOIN characters c ON u.user_id = c.user_id 
                        GROUP BY u.user_id 
                        ORDER BY u.created_at DESC
                    ");
                    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(['status' => 'success', 'users' => $users], JSON_UNESCAPED_UNICODE);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'สิทธิ์การเข้าถึงไม่ถูกต้อง']);
                }
                break;

            case 'update_user':
            case 'update_role':
                $admin_id = $data['admin_id'] ?? '';
                $target_user_id = $data['target_user_id'] ?? ($data['user_id'] ?? '');
                $new_role = $data['new_role'] ?? $data['role'] ?? 'user';
                $new_status = $data['new_status'] ?? $data['status'] ?? 'active';
                $user_name = $data['user_name'] ?? null;
                $user_email = $data['user_email'] ?? null;
                $new_password = $data['new_password'] ?? null;

                $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
                $stmt->execute([$admin_id]);
                $admin = $stmt->fetch();

                if ($admin && $admin['role'] === 'admin') {
                    $update_sql = "UPDATE users SET role = ?, status = ?";
                    $params = [$new_role, $new_status];

                    if (!empty($user_name)) {
                        $update_sql .= ", user_name = ?";
                        $params[] = $user_name;
                    }
                    if (!empty($user_email)) {
                        $update_sql .= ", user_email = ?";
                        $params[] = $user_email;
                    }
                    if (!empty($new_password)) {
                        $update_sql .= ", user_password = ?";
                        $params[] = password_hash($new_password, PASSWORD_DEFAULT);
                    }

                    $update_sql .= " WHERE user_id = ?";
                    $params[] = $target_user_id;

                    $stmtUpdate = $pdo->prepare($update_sql);
                    if ($stmtUpdate->execute($params)) {
                        echo json_encode(['status' => 'success', 'message' => 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ']);
                    } else {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่สามารถอัปเดตข้อมูลได้']);
                    }
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์ดำเนินการ']);
                }
                break;

            case 'delete_user':
                $admin_id = $data['admin_id'] ?? '';
                $target_user_id = $data['target_user_id'] ?? '';

                $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
                $stmt->execute([$admin_id]);
                $admin = $stmt->fetch();

                if ($admin && $admin['role'] === 'admin') {
                    if ($admin_id == $target_user_id) {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่สามารถลบบัญชีตัวเองได้']);
                        break;
                    }

                    $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = ?");
                    if ($stmt->execute([$target_user_id])) {
                        echo json_encode(['status' => 'success', 'message' => 'ลบผู้ใช้สำเร็จ']);
                    } else {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่สามารถลบผู้ใช้ได้']);
                    }
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์ดำเนินการ']);
                }
                break;

            case 'submit_feedback':
                $user_id = $data['user_id'] ?? '';
                $user_name = $data['user_name'] ?? '';
                $rating = $data['rating'] ?? 0;
                $category = $data['category'] ?? '';
                $message = $data['message'] ?? '';
                $title = $data['title'] ?? 'ไม่มีหัวข้อ';
                $priority = $data['priority'] ?? 'medium';
                $device_info = $data['device_info'] ?? 'Unknown';

                if (empty($user_id) || empty($user_name) || empty($rating) || empty($category) || empty($message) || empty($title)) {
                    echo json_encode(['status' => 'error', 'message' => 'กรุณากรอกข้อมูลให้ครบถ้วน']);
                    break;
                }

                $stmt = $pdo->prepare("INSERT INTO feedbacks (user_id, user_name, rating, category, title, priority, device_info, message, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')");
                if ($stmt->execute([$user_id, $user_name, $rating, $category, $title, $priority, $device_info, $message])) {
                    echo json_encode(['status' => 'success', 'message' => 'บันทึกข้อเสนอแนะสำเร็จ! ขอบคุณครับ']);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'ไม่สามารถบันทึกข้อเสนอแนะได้']);
                }
                break;

            case 'get_feedbacks':
                $admin_id = $data['admin_id'] ?? '';
                
                $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
                $stmt->execute([$admin_id]);
                $admin = $stmt->fetch();

                if ($admin && $admin['role'] === 'admin') {
                    $stmt = $pdo->query("SELECT feedback_id, user_id, user_name, rating, category, title, priority, device_info, message, COALESCE(status, 'new') as status, admin_response, is_read, created_at FROM feedbacks ORDER BY created_at DESC");
                    $feedbacks = $stmt->fetchAll(PDO::FETCH_ASSOC);
                    echo json_encode(['status' => 'success', 'feedbacks' => $feedbacks], JSON_UNESCAPED_UNICODE);
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'สิทธิ์การเข้าถึงไม่ถูกต้อง']);
                }
                break;

            case 'update_feedback':
                $admin_id = $data['admin_id'] ?? '';
                $feedback_id = $data['feedback_id'] ?? '';
                $status = $data['status'] ?? 'new';
                $priority = $data['priority'] ?? null;
                $admin_response = $data['admin_response'] ?? null;
                $is_read = isset($data['is_read']) ? intval($data['is_read']) : 1;

                $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
                $stmt->execute([$admin_id]);
                $admin = $stmt->fetch();

                if ($admin && $admin['role'] === 'admin') {
                    $update_sql = "UPDATE feedbacks SET status = ?, is_read = ?";
                    $params = [$status, $is_read];

                    if ($admin_response !== null) {
                        $update_sql .= ", admin_response = ?";
                        $params[] = $admin_response;
                    }
                    if ($priority !== null) {
                        $update_sql .= ", priority = ?";
                        $params[] = $priority;
                    }

                    $update_sql .= " WHERE feedback_id = ?";
                    $params[] = $feedback_id;

                    $stmtUpdate = $pdo->prepare($update_sql);
                    if ($stmtUpdate->execute($params)) {
                        echo json_encode(['status' => 'success', 'message' => 'อัปเดตข้อเสนอแนะสำเร็จ']);
                    } else {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่สามารถอัปเดตข้อเสนอแนะได้']);
                    }
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์ดำเนินการ']);
                }
                break;

            case 'delete_feedback':
                $admin_id = $data['admin_id'] ?? '';
                $feedback_id = $data['feedback_id'] ?? '';

                $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
                $stmt->execute([$admin_id]);
                $admin = $stmt->fetch();

                if ($admin && $admin['role'] === 'admin') {
                    $stmt = $pdo->prepare("DELETE FROM feedbacks WHERE feedback_id = ?");
                    if ($stmt->execute([$feedback_id])) {
                        echo json_encode(['status' => 'success', 'message' => 'ลบข้อเสนอแนะสำเร็จ']);
                    } else {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่สามารถลบข้อเสนอแนะได้']);
                    }
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์ดำเนินการ']);
                }
                break;

            case 'mark_feedback_read':
                $admin_id = $data['admin_id'] ?? '';
                $feedback_id = $data['feedback_id'] ?? '';

                $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
                $stmt->execute([$admin_id]);
                $admin = $stmt->fetch();

                if ($admin && $admin['role'] === 'admin') {
                    $stmt = $pdo->prepare("UPDATE feedbacks SET is_read = 1 WHERE feedback_id = ?");
                    if ($stmt->execute([$feedback_id])) {
                        echo json_encode(['status' => 'success', 'message' => 'อัปเดตสถานะการอ่านสำเร็จ']);
                    } else {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่สามารถอัปเดตสถานะได้']);
                    }
                } else {
                    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์ดำเนินการ']);
                }
                break;

            // -------------------------------------------------------------
            // [ADMIN ONLY] ระบบจัดการ Compendium / Data Catalog
            // -------------------------------------------------------------
            case 'create_compendium_item':
            case 'update_compendium_item':
            case 'delete_compendium_item':
                $admin_id = $data['admin_id'] ?? '';
                $target_table = $data['target_table'] ?? '';
                $item_data = $data['item_data'] ?? [];
                
                $stmt = $pdo->prepare("SELECT role FROM users WHERE user_id = ?");
                $stmt->execute([$admin_id]);
                $admin = $stmt->fetch();
                if (!$admin || $admin['role'] !== 'admin') {
                    echo json_encode(['status' => 'error', 'message' => 'ไม่มีสิทธิ์ดำเนินการ']);
                    break;
                }

                $allowed_tables = ['classes', 'subclasses', 'species', 'lineages', 'spells', 'items', 'backgrounds', 'feats'];
                if (!in_array($target_table, $allowed_tables)) {
                    echo json_encode(['status' => 'error', 'message' => 'ตารางข้อมูลไม่ถูกต้อง']);
                    break;
                }

                $id_field_map = [
                    'classes' => 'class_id',
                    'subclasses' => 'subclass_id',
                    'species' => 'species_id',
                    'lineages' => 'lineage_id',
                    'spells' => 'spell_id',
                    'items' => 'item_id',
                    'backgrounds' => 'background_id',
                    'feats' => 'feat_id'
                ];
                $pk = $id_field_map[$target_table];

                if ($action === 'create_compendium_item') {
                    if (empty($item_data[$pk])) {
                        $item_data[$pk] = strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', $item_data['name'] ?? $item_data[$target_table.'_name'] ?? 'custom_'.time()));
                    }
                    
                    $columns = array_keys($item_data);
                    $values = array_values($item_data);
                    $placeholders = array_fill(0, count($columns), '?');
                    
                    $col_string = implode(', ', array_map(function($col) { return "`$col`"; }, $columns));
                    $val_string = implode(', ', $placeholders);
                    
                    try {
                        $stmt = $pdo->prepare("INSERT INTO `$target_table` ($col_string) VALUES ($val_string)");
                        $stmt->execute($values);
                        echo json_encode(['status' => 'success', 'message' => 'เพิ่มข้อมูลสำเร็จ']);
                    } catch (Exception $e) {
                        echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการบันทึก: ' . $e->getMessage()]);
                    }
                } 
                else if ($action === 'update_compendium_item') {
                    if (empty($item_data[$pk])) {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่พบรหัสข้อมูลที่จะอัปเดต']);
                        break;
                    }
                    
                    $id_val = $item_data[$pk];
                    $update_fields = [];
                    $values = [];
                    
                    foreach ($item_data as $key => $val) {
                        if ($key !== $pk) {
                            $update_fields[] = "`$key` = ?";
                            $values[] = $val;
                        }
                    }
                    
                    $values[] = $id_val;
                    $set_string = implode(', ', $update_fields);
                    
                    try {
                        $stmt = $pdo->prepare("UPDATE `$target_table` SET $set_string WHERE `$pk` = ?");
                        $stmt->execute($values);
                        echo json_encode(['status' => 'success', 'message' => 'อัปเดตข้อมูลสำเร็จ']);
                    } catch (Exception $e) {
                        echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการอัปเดต: ' . $e->getMessage()]);
                    }
                }
                else if ($action === 'delete_compendium_item') {
                    $id_val = $data['item_id'] ?? '';
                    if (empty($id_val)) {
                        echo json_encode(['status' => 'error', 'message' => 'ไม่พบรหัสข้อมูลที่จะลบ']);
                        break;
                    }
                    try {
                        $stmt = $pdo->prepare("UPDATE `$target_table` SET `deleted_at` = NOW() WHERE `$pk` = ?");
                        $stmt->execute([$id_val]);
                        echo json_encode(['status' => 'success', 'message' => 'ลบข้อมูลสำเร็จ (Soft Delete)']);
                    } catch (Exception $e) {
                        echo json_encode(['status' => 'error', 'message' => 'เกิดข้อผิดพลาดในการลบ: ' . $e->getMessage()]);
                    }
                }
                break;
        }
        exit;
    }

    $id = $_GET['id'] ?? null;
    $search = $_GET['q'] ?? null;
    $category = $_GET['category'] ?? null;
    $index = $_GET['index'] ?? null;
    $action_get = $_GET['action'] ?? null;

    // -------------------------------------------------------------
    // [NEW] API for User Characters List (get_user_characters)
    // -------------------------------------------------------------
    if ($action_get === 'get_user_characters') {
        $user_id = intval($_GET['user_id'] ?? 1);
        $stmt = $pdo->prepare("SELECT char_id, user_id, char_name, species_id, lineage_id, background_id, primary_class_id, classes_data, char_alignment, char_level, hp_max, hp_current, str_score, dex_score, con_score, int_score, wis_score, cha_score, build_data, updated_at, created_at FROM characters WHERE user_id = ? ORDER BY updated_at DESC, char_id DESC");
        $stmt->execute([$user_id]);
        $chars = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($chars as &$c) {
            if (!empty($c['classes_data']) && is_string($c['classes_data'])) {
                $c['classes_data'] = json_decode($c['classes_data'], true) ?: json_decode(stripslashes($c['classes_data']), true) ?: $c['classes_data'];
            }
            if (!empty($c['build_data']) && is_string($c['build_data'])) {
                $c['build_data'] = json_decode($c['build_data'], true) ?: json_decode(stripslashes($c['build_data']), true) ?: $c['build_data'];
                if (is_array($c['build_data']) && isset($c['build_data']['description']['avatarUrl'])) {
                    $c['avatar_url'] = $c['build_data']['description']['avatarUrl'];
                }
            }
        }
        echo json_encode($chars, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -------------------------------------------------------------
    // [NEW] API for Single Character Detail (get_character_by_id)
    // -------------------------------------------------------------
    if ($action_get === 'get_character_by_id') {
        $char_id = intval($_GET['id'] ?? 0);
        $stmt = $pdo->prepare("SELECT * FROM characters WHERE char_id = ?");
        $stmt->execute([$char_id]);
        $char = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$char) {
            echo json_encode(['error' => 'Character not found'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $jsonFields = ['classes_data', 'proficiencies_choices', 'spellcasting_data', 'inventory', 'currency', 'hit_dice_current', 'feats_data', 'build_data', 'play_data'];
        foreach ($jsonFields as $f) {
            if (isset($char[$f]) && !empty($char[$f]) && is_string($char[$f])) {
                $decoded = json_decode($char[$f], true) ?: json_decode(stripslashes($char[$f]), true);
                if (is_string($decoded)) {
                    $decoded = json_decode($decoded, true) ?: $decoded;
                }
                $char[$f] = $decoded ?: $char[$f];
            }
        }
        echo json_encode($char, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -------------------------------------------------------------
    // [NEW] API for Character Builder (get_cc_data)
    // -------------------------------------------------------------
    if ($action_get === 'get_cc_data') {
        $races = $pdo->query("SELECT * FROM species WHERE deleted_at IS NULL")->fetchAll(PDO::FETCH_ASSOC);
        $lineages = $pdo->query("SELECT * FROM lineages WHERE deleted_at IS NULL")->fetchAll(PDO::FETCH_ASSOC);
        $classes = $pdo->query("SELECT * FROM classes WHERE deleted_at IS NULL")->fetchAll(PDO::FETCH_ASSOC);
        $subclasses = $pdo->query("SELECT * FROM subclasses WHERE deleted_at IS NULL")->fetchAll(PDO::FETCH_ASSOC);
        $backgrounds = $pdo->query("SELECT * FROM backgrounds WHERE deleted_at IS NULL")->fetchAll(PDO::FETCH_ASSOC);
        $spells = $pdo->query("SELECT * FROM spells WHERE deleted_at IS NULL")->fetchAll(PDO::FETCH_ASSOC);
        $feats = $pdo->query("SELECT * FROM feats WHERE deleted_at IS NULL")->fetchAll(PDO::FETCH_ASSOC);
        $items = $pdo->query("SELECT * FROM items WHERE deleted_at IS NULL")->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'races' => $races,
            'lineages' => $lineages,
            'classes' => $classes,
            'subclasses' => $subclasses,
            'backgrounds' => $backgrounds,
            'spells' => $spells,
            'feats' => $feats,
            'items' => $items
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -------------------------------------------------------------
    // [NEW] ฟังก์ชันดึงสารบัญทั้งหมด (สำหรับทำ Sidebar ใน React)
    // -------------------------------------------------------------
    if ($index === 'all') {
        $classes = $pdo->query("SELECT class_id as id, class_name as name, 'classes' as category FROM classes ORDER BY class_name")->fetchAll(PDO::FETCH_ASSOC);
        $weapons = $pdo->query("SELECT item_id as id, item_name as name, 'weapons' as category FROM items WHERE item_type = 'weapon' ORDER BY item_name")->fetchAll(PDO::FETCH_ASSOC);
        $armor = $pdo->query("SELECT item_id as id, item_name as name, 'armor' as category FROM items WHERE item_type = 'armor' ORDER BY item_name")->fetchAll(PDO::FETCH_ASSOC);
        $items = $pdo->query("SELECT item_id as id, item_name as name, 'items' as category FROM items ORDER BY item_name")->fetchAll(PDO::FETCH_ASSOC);
        
        // รวมทุกอย่างส่งกลับไปเป็น Array เดียว
        echo json_encode(array_merge($classes, $weapons, $armor, $items));
        exit;
    }

    // -------------------------------------------------------------
    // ฟังก์ชันค้นหา
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // ฟังก์ชันค้นหาครอบคลุมทุกหมวดหมู่
    // -------------------------------------------------------------
    if ($search) {
        $term = "%$search%";
        $results = [];
        
        // ค้นหา Classes
        $stmt = $pdo->prepare("SELECT class_id as id, class_name as name, 'classes' as category, 'อาชีพ' as type FROM classes WHERE class_name LIKE ? LIMIT 5");
        $stmt->execute([$term]);
        $results = array_merge($results, $stmt->fetchAll(PDO::FETCH_ASSOC));

        // ค้นหา Backgrounds
        $stmt = $pdo->prepare("SELECT background_id as id, background_name as name, 'backgrounds' as category, 'ภูมิหลัง' as type FROM backgrounds WHERE background_name LIKE ? LIMIT 5");
        $stmt->execute([$term]);
        $results = array_merge($results, $stmt->fetchAll(PDO::FETCH_ASSOC));

        // ค้นหา Species
        $stmt = $pdo->prepare("SELECT species_id as id, species_name as name, 'species' as category, 'เผ่าพันธุ์' as type FROM species WHERE species_name LIKE ? LIMIT 5");
        $stmt->execute([$term]);
        $results = array_merge($results, $stmt->fetchAll(PDO::FETCH_ASSOC));

        // ค้นหา Feats
        $stmt = $pdo->prepare("SELECT feat_id as id, feat_name as name, 'feats' as category, 'ความสามารถพิเศษ' as type FROM feats WHERE feat_name LIKE ? LIMIT 5");
        $stmt->execute([$term]);
        $results = array_merge($results, $stmt->fetchAll(PDO::FETCH_ASSOC));

        // ค้นหา Items
        $stmt = $pdo->prepare("SELECT item_id as id, item_name as name, 'items' as category, 'ไอเทม' as type FROM items WHERE item_name LIKE ? LIMIT 5");
        $stmt->execute([$term]);
        $results = array_merge($results, $stmt->fetchAll(PDO::FETCH_ASSOC));

        // ค้นหา Spells
        $stmt = $pdo->prepare("SELECT spell_id as id, spell_name as name, 'spells' as category, 'คาถา' as type FROM spells WHERE spell_name LIKE ? LIMIT 5");
        $stmt->execute([$term]);
        $results = array_merge($results, $stmt->fetchAll(PDO::FETCH_ASSOC));

        echo json_encode($results);
        exit;
    }

    // -------------------------------------------------------------
    // ดึงรายละเอียด อาชีพ (Classes)
    // -------------------------------------------------------------
    if ($id && $category === 'classes') {
        $stmt = $pdo->prepare("SELECT * FROM classes WHERE class_id = ?");
        $stmt->execute([$id]);
        $class = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$class) {
            echo json_encode(['error' => 'Class not found']);
            exit;
        }

        // แปลง JSON ให้รองรับ Backslash
        $jsonFields = ['hit_points', 'proficiencies', 'equipment', 'multiclassing', 'becoming', 'features', 'level_progression', 'spell_list'];
        foreach ($jsonFields as $f) {
            if (!empty($class[$f]) && is_string($class[$f])) {
                $class[$f] = json_decode($class[$f], true) ?: json_decode(stripslashes($class[$f]), true);
            } elseif (empty($class[$f])) {
                $class[$f] = null;
            }
        }

        // จัดการ Levels (ดึงจาก level_progression)
        $levels = $class['level_progression'] ?: [];
        $featuresByLevel = [];
        if (!empty($class['features'])) {
            foreach ($class['features'] as $f) {
                $featuresByLevel[$f['level']][] = $f;
            }
        }

        foreach ($levels as &$l) {
            $l['level'] = (int)$l['level'];
            $l['prof_bonus'] = (int)$l['prof_bonus'];
            $l['cantrips_known'] = isset($l['cantrips_known']) ? (int)$l['cantrips_known'] : 0;
            $l['spells_known'] = isset($l['spells_known']) ? (int)$l['spells_known'] : 0;
            $l['features'] = $featuresByLevel[$l['level']] ?? [];
        }
        $class['levels'] = $levels;

        // ดึง Subclasses
        $stmtSub = $pdo->prepare("SELECT * FROM subclasses WHERE class_id = ?");
        $stmtSub->execute([$id]);
        $subclasses = $stmtSub->fetchAll(PDO::FETCH_ASSOC);

        foreach ($subclasses as &$s) {
            if (!empty($s['features']) && is_string($s['features'])) {
                $s['features'] = json_decode($s['features'], true) ?: json_decode(stripslashes($s['features']), true);
            } elseif (empty($s['features'])) {
                $s['features'] = [];
            }
            $s['flavor'] = $s['subclass_desc'] ?? $s['description'] ?? '';
        }
        $class['subclasses'] = $subclasses;
        $class['data_type'] = 'classes'; // ส่งสถานะไปบอก React ว่านี่คือข้อมูล Class

        echo json_encode($class, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -------------------------------------------------------------
    // ดึงรายละเอียด ข้อมูลอื่นๆ (Items, Backgrounds, Species, ฯลฯ)
    // -------------------------------------------------------------
    if ($id && in_array($category, ['items', 'weapons', 'armor', 'backgrounds', 'species', 'feats', 'spells', 'conditions'])) {
        $idField = 'id';
        if ($category === 'backgrounds') $idField = 'background_id';
        elseif ($category === 'species') $idField = 'species_id';
        elseif ($category === 'feats') $idField = 'feat_id';
        elseif ($category === 'spells') $idField = 'spell_id';
        elseif ($category === 'conditions') $idField = 'condition_id';
        elseif ($category === 'items' || $category === 'weapons' || $category === 'armor') $idField = 'item_id';

        // For weapons and armor, they are technically in the `items` table but the React app might pass them as category. 
        // Our SQL schema has `items` table.
        $targetTable = in_array($category, ['weapons', 'armor']) ? 'items' : $category;

        $stmt = $pdo->prepare("SELECT * FROM `$targetTable` WHERE `$idField` = ?");
        $stmt->execute([$id]);
        $item = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$item) {
            echo json_encode(['error' => "Item not found in $category"]);
            exit;
        }

        // Parse common JSON fields
        $jsonFields = ['ability_scores', 'skill_proficiencies', 'tool_proficiencies', 'equipment', 'traits', 'granted_spells', 'feat_choices', 'mechanics'];
        foreach ($jsonFields as $f) {
            if (isset($item[$f]) && !empty($item[$f]) && is_string($item[$f])) {
                $item[$f] = json_decode($item[$f], true) ?: json_decode(stripslashes($item[$f]), true) ?: $item[$f];
            }
        }

        $item['data_type'] = $category; // ส่งสถานะไปบอก React ว่านี่คือข้อมูลตารางไหน
        echo json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    // -------------------------------------------------------------
    // ดึงลิสต์ทั้งตาราง
    // -------------------------------------------------------------
        // -------------------------------------------------------------
    // [NEW] ดึงข้อมูล Log ประวัติการเล่น
    // -------------------------------------------------------------
    if ($action_get === 'get_character_logs') {
        $char_id = intval($_GET['char_id'] ?? 0);
        $category = $_GET['category'] ?? 'all';
        if ($char_id) {
            if ($category !== 'all' && in_array($category, ['gameplay', 'inventory', 'build'])) {
                $stmt = $pdo->prepare("SELECT * FROM character_logs WHERE char_id = ? AND category = ? ORDER BY created_at DESC LIMIT 100");
                $stmt->execute([$char_id, $category]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM character_logs WHERE char_id = ? ORDER BY created_at DESC LIMIT 100");
                $stmt->execute([$char_id]);
            }
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($logs as &$l) {
                if (!empty($l['metadata_json']) && is_string($l['metadata_json'])) {
                    $l['metadata_json'] = json_decode($l['metadata_json'], true) ?: $l['metadata_json'];
                }
            }
            echo json_encode($logs, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            exit;
        }
    }

    if ($category) {
        $allowed_tables = ['items', 'weapons', 'armor', 'spells', 'backgrounds', 'species', 'feats', 'classes', 'conditions', 'weapon_masteries'];
        if (in_array($category, $allowed_tables)) {
            if ($category === 'classes') {
                $stmt = $pdo->query("SELECT class_id as id, class_name as name FROM classes ORDER BY class_name");
            } elseif ($category === 'backgrounds') {
                $stmt = $pdo->query("SELECT background_id as id, background_name as name FROM backgrounds ORDER BY background_name");
            } elseif ($category === 'species') {
                $stmt = $pdo->query("SELECT species_id as id, species_name as name FROM species ORDER BY species_name");
            } elseif ($category === 'feats') {
                $stmt = $pdo->query("SELECT feat_id as id, feat_name as name, feat_type as type, prerequisite FROM feats ORDER BY feat_name");
            } elseif ($category === 'spells') {
                $stmt = $pdo->query("SELECT spell_id as id, spell_name as name, spell_level as level, school FROM spells ORDER BY spell_level, spell_name");
            } else {
                $stmt = $pdo->query("SELECT * FROM `$category`"); // Simplified for now
            }
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } else {
            echo json_encode([], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    echo json_encode(['error' => 'Invalid params'], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
