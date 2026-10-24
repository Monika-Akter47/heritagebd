<?php

function auth_register(PDO $pdo): void {
    $data = body();
    require_fields($data, ['name', 'email', 'password', 'role']);
    if (!is_string($data['email']) || !filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL)) json_error('Please enter a valid email address.', 422);
    if (!is_string($data['password']) || strlen($data['password']) < 8) json_error('Password must be at least 8 characters.', 422);
    if (!is_string($data['name']) || trim($data['name']) === '') json_error('Name is required.', 422);
    if (isset($data['phone']) && (!is_string($data['phone']) || !preg_match('/^01[3-9]\d{8}$/', preg_replace('/\s+/', '', $data['phone'])))) {
        json_error('Please enter a valid Bangladeshi phone number.', 422);
    }

    $email = strtolower(trim($data['email']));
    $role = $data['role'];
    if (!in_array($role, ['tourist', 'vendor', 'guide', 'admin'], true)) {
        json_error('Invalid role.', 422);
    }
    if ($role === 'admin') {
        json_error('Admin accounts cannot self-register.', 403);
    }

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) json_error('An account with this email already exists.', 409);

    $id   = id_with_prefix('u');
    $hash = password_hash($data['password'], PASSWORD_BCRYPT);
    // Vendors/guides start pending verification; tourists are active immediately.
    $status   = in_array($role, ['vendor', 'guide'], true) ? 'pending' : 'active';
    $verified = 0;

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO users (id, name, email, password_hash, phone, avatar, role, verified, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id, trim($data['name']), $email, $hash,
            $data['phone'] ?? null, $data['avatar'] ?? null, $role, $verified, $status,
        ]);

        if ($role === 'vendor') {
            $stmt = $pdo->prepare(
                "INSERT INTO vendors (user_id, shop_name, shop_description, location, nid_number, trade_license, verification_status)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')"
            );
            $stmt->execute([
                $id, $data['shopName'] ?? ($data['name'] . "'s Shop"), $data['shopDescription'] ?? null,
                $data['location'] ?? null, $data['nidNumber'] ?? null, $data['tradeLicense'] ?? null,
            ]);
        } elseif ($role === 'guide') {
            $stmt = $pdo->prepare(
                "INSERT INTO guides (user_id, bio, location, price_per_day, nid_number, guide_license, verification_status)
                 VALUES (?, ?, ?, ?, ?, ?, 'pending')"
            );
            $stmt->execute([
                $id, $data['bio'] ?? null, $data['location'] ?? null,
                $data['pricePerDay'] ?? 0, $data['nidNumber'] ?? null, $data['guideLicense'] ?? null,
            ]);
            foreach ((array)($data['languages'] ?? []) as $lang) {
                $pdo->prepare('INSERT INTO guide_languages (guide_id, language) VALUES (?, ?)')->execute([$id, $lang]);
            }
        }

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        if ($e instanceof PDOException && $e->getCode() === '23000') {
            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            if ($stmt->fetch()) json_error('An account with this email already exists.', 409);
        }
        throw $e;
    }

    $token = issue_token($pdo, $id);
    $stmt  = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    $message = in_array($role, ['vendor', 'guide'], true)
        ? 'Account created. Your account is pending verification by our team.'
        : 'Account created successfully.';

    json_ok(['user' => public_user($user), 'token' => $token], 201, ['message' => $message]);
}

function auth_login(PDO $pdo): void {
    $data = body();
    require_fields($data, ['email', 'password']);
    if (!is_string($data['email']) || !is_string($data['password'])) {
        json_error('Please enter a valid email address and password.', 422);
    }

    $email = strtolower(trim($data['email']));
    throttle_check($pdo, 'login_email', $email, 5);
    throttle_check($pdo, 'login_ip', client_ip(), 20);

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($data['password'], $user['password_hash'])) {
        throttle_hit($pdo, 'login_email', $email);
        throttle_hit($pdo, 'login_ip', client_ip());
        json_error('Invalid email or password.', 401);
    }
    if ($user['status'] === 'suspended') {
        json_error('This account has been suspended. Please contact support.', 403);
    }

    throttle_clear($pdo, 'login_email', $email);
    if (random_int(1, 50) === 1) purge_expired_auth_rows($pdo);
    $token = issue_token($pdo, $user['id']);
    json_ok(['user' => public_user($user), 'token' => $token]);
}

function auth_logout(PDO $pdo): void {
    $token = bearer_token();
    if ($token) {
        $pdo->prepare('DELETE FROM auth_tokens WHERE token = ?')->execute([token_hash($token)]);
    }
    json_ok(null, 200, ['message' => 'Logged out.']);
}

function auth_me(PDO $pdo): void {
    $user = require_auth($pdo);
    json_ok(['user' => public_user($user)]);
}

function auth_update_me(PDO $pdo): void {
    $user = require_auth($pdo);
    $data = body();
    $fields = [];
    $params = [];
    if (isset($data['name']) && (!is_string($data['name']) || trim($data['name']) === '')) json_error('Name cannot be empty.', 422);
    if (isset($data['phone']) && $data['phone'] !== '' && !preg_match('/^[+0-9][0-9 \-]{6,19}$/', (string)$data['phone'])) json_error('Please enter a valid phone number.', 422);
    foreach (['name', 'phone', 'avatar'] as $f) {
        if (isset($data[$f])) { $fields[] = "$f = ?"; $params[] = is_string($data[$f]) ? trim($data[$f]) : $data[$f]; }
    }
    if ($fields) {
        $params[] = $user['id'];
        $pdo->prepare('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    }
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    json_ok(['user' => public_user($stmt->fetch())]);
}

function auth_forgot_password(PDO $pdo): void {
    $data = body();
    require_fields($data, ['email']);
    if (!is_string($data['email']) || !filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL)) {
        json_error('Please enter a valid email address.', 422);
    }
    $email = strtolower(trim($data['email']));
    // Counted for every request (registered or not) so the limit reveals nothing about accounts.
    throttle_check($pdo, 'forgot_email', $email, 3);
    throttle_check($pdo, 'forgot_ip', client_ip(), 10);
    throttle_hit($pdo, 'forgot_email', $email);
    throttle_hit($pdo, 'forgot_ip', client_ip());

    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $otp = (string) random_int(100000, 999999);
        $otpHash = password_hash($otp, PASSWORD_DEFAULT);
        $pdo->prepare('INSERT INTO password_resets (email, otp_code, expires_at) VALUES (?, ?, ?)')
            ->execute([$email, $otpHash, date('Y-m-d H:i:s', time() + 15 * 60)]);
        $sent = mail(
            $email,
            'HeritageBD password reset code',
            "Your HeritageBD password reset code is: $otp\n\nThis code expires in 15 minutes."
        );
        if (!$sent) {
            $pdo->prepare('DELETE FROM password_resets WHERE email = ? AND otp_code = ?')
                ->execute([$email, $otpHash]);
            error_log('[HeritageBD] Password reset email could not be sent.');
        }
    }
    json_ok(null, 200, ['message' => 'If that email is registered, a verification code has been sent.']);
}

function auth_reset_password(PDO $pdo): void {
    $data = body();
    require_fields($data, ['email', 'otp', 'newPassword']);

    if (!is_string($data['email']) || !filter_var(trim($data['email']), FILTER_VALIDATE_EMAIL)
        || !is_string($data['otp']) || !preg_match('/^\d{6}$/', $data['otp'])
        || !is_string($data['newPassword']) || strlen($data['newPassword']) < 8) {
        json_error('Please enter a valid code and a password of at least 8 characters.', 422);
    }
    $email = strtolower(trim($data['email']));
    // 5 guesses per 15 minutes against a 6-digit code that lives 15 minutes.
    throttle_check($pdo, 'reset_email', $email, 5);
    throttle_check($pdo, 'reset_ip', client_ip(), 20);
    $stmt = $pdo->prepare(
        'SELECT id, otp_code FROM password_resets WHERE email = ? AND used = 0 AND expires_at > NOW()
         ORDER BY id DESC LIMIT 1'
    );
    $stmt->execute([$email]);
    $reset = $stmt->fetch();
    if (!$reset || !password_verify($data['otp'], $reset['otp_code'])) {
        throttle_hit($pdo, 'reset_email', $email);
        throttle_hit($pdo, 'reset_ip', client_ip());
        json_error('Invalid or expired verification code.', 422);
    }
    throttle_clear($pdo, 'reset_email', $email);

    $hash = password_hash($data['newPassword'], PASSWORD_BCRYPT);
    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE users SET password_hash = ? WHERE email = ?')->execute([$hash, $email]);
        $pdo->prepare('UPDATE password_resets SET used = 1 WHERE email = ?')->execute([$email]);
        $pdo->prepare('DELETE FROM auth_tokens WHERE user_id = (SELECT id FROM users WHERE email = ?)')->execute([$email]);
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }

    json_ok(null, 200, ['message' => 'Password reset successfully.']);
}


function auth_change_password(PDO $pdo): void {
    $user = require_auth($pdo);
    $d = body();
    require_fields($d, ['currentPassword', 'newPassword']);
    if (!password_verify((string)$d['currentPassword'], $user['password_hash'])) json_error('Your current password is incorrect.', 403);
    if (!is_string($d['newPassword']) || strlen($d['newPassword']) < 8) json_error('New password must be at least 8 characters.', 422);
    if ($d['newPassword'] === $d['currentPassword']) json_error('New password must be different from the current one.', 422);
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($d['newPassword'], PASSWORD_BCRYPT), $user['id']]);
    // Sign out every other session; keep the one making this request.
    $pdo->prepare('DELETE FROM auth_tokens WHERE user_id = ? AND token <> ?')->execute([$user['id'], token_hash((string)bearer_token())]);
    notify($pdo, $user['id'], 'Password changed', 'Your password was changed. If this was not you, reset it immediately.', 'system', null);
    json_ok(null, 200, ['message' => 'Password updated.']);
}
