<?php

function uploads_roots(): array {
    $configured = getenv('HERITAGE_UPLOAD_DIR');
    if ($configured !== false && trim($configured) !== '') return [rtrim($configured, '/\\')];

    $projectRoot = dirname(__DIR__, 2);
    return [
        $projectRoot . DIRECTORY_SEPARATOR . 'heritagebd-data' . DIRECTORY_SEPARATOR . 'uploads',
        dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'heritagebd-data' . DIRECTORY_SEPARATOR . 'uploads',
    ];
}

function find_uploaded_file(string $directory, string $filename): ?string {
    foreach (uploads_roots() as $root) {
        $path = $root . DIRECTORY_SEPARATOR . $directory . DIRECTORY_SEPARATOR . basename($filename);
        if (is_file($path)) return $path;
    }
    return null;
}

function upload_error_message(int $error): string {
    return match ($error) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'The selected file is too large.',
        UPLOAD_ERR_PARTIAL => 'The file upload was interrupted. Please try again.',
        UPLOAD_ERR_NO_FILE => 'Choose a file to upload.',
        UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE => 'The server could not store the uploaded file.',
        default => 'The file could not be uploaded.',
    };
}

function validate_uploaded_file(string $field, int $maxSize, array $allowedTypes): array {
    if (!isset($_FILES[$field]) || !is_array($_FILES[$field])) json_error('Choose a file to upload.', 422);
    $file = $_FILES[$field];
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        json_error(upload_error_message((int)$file['error']), 422);
    }
    if (!is_uploaded_file($file['tmp_name']) || (int)$file['size'] < 1 || (int)$file['size'] > $maxSize) {
        json_error('The selected file is empty or exceeds the upload size limit.', 422);
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    if (!isset($allowedTypes[$mime])) json_error('The selected file type is not supported.', 422);
    return [$file, $mime, $allowedTypes[$mime]];
}

function ensure_upload_directory(string $directory): void {
    if (!is_dir($directory) && !mkdir($directory, 0700, true) && !is_dir($directory)) {
        json_error('The server could not prepare secure file storage.', 500);
    }
}

function documents_upload(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['tourist', 'vendor', 'guide']);

    $documentType = $_POST['documentType'] ?? '';
    $allowedDocumentTypes = ['identity', 'business_license', 'guide_license', 'other'];
    if (!is_string($documentType) || !in_array($documentType, $allowedDocumentTypes, true)) {
        json_error('Choose a valid document type.', 422);
    }
    if ($user['role'] === 'tourist' && $documentType !== 'identity' && $documentType !== 'other') {
        json_error('Tourists may upload identity or supporting documents only.', 422);
    }
    if ($user['role'] === 'vendor' && !in_array($documentType, ['identity', 'business_license', 'other'], true)) {
        json_error('Vendors may upload identity, business license, or supporting documents only.', 422);
    }

    [$file, $mime, $extension] = validate_uploaded_file('file', 10 * 1024 * 1024, [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
    ]);
    $directory = uploads_roots()[0] . '/private';
    ensure_upload_directory($directory);
    $storageName = bin2hex(random_bytes(16)) . '.' . $extension;
    if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $storageName)) {
        json_error('The server could not store your document. Please try again.', 500);
    }

    try {
        $id = id_with_prefix('doc');
        $stmt = $pdo->prepare(
            'INSERT INTO user_documents (id, user_id, document_type, original_name, storage_name, mime_type, file_size)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $id, $user['id'], $documentType, substr(basename((string)$file['name']), 0, 255),
            $storageName, $mime, (int)$file['size'],
        ]);
    } catch (Throwable $error) {
        if (is_file($directory . '/' . $storageName) && !unlink($directory . '/' . $storageName)) {
            error_log('[HeritageBD] Could not remove an unregistered uploaded document.');
        }
        throw $error;
    }

    json_ok([
        'id' => $id,
        'documentType' => $documentType,
        'fileName' => substr(basename((string)$file['name']), 0, 255),
        'createdAt' => date('Y-m-d H:i:s'),
    ], 201);
}

function documents_index(PDO $pdo): void {
    $user = require_auth($pdo);
    $stmt = $pdo->prepare(
        'SELECT id, document_type, original_name, mime_type, file_size, created_at
         FROM user_documents WHERE user_id = ? ORDER BY created_at DESC'
    );
    $stmt->execute([$user['id']]);
    json_ok(array_map(fn($row) => [
        'id' => $row['id'], 'documentType' => $row['document_type'],
        'fileName' => $row['original_name'], 'mimeType' => $row['mime_type'],
        'fileSize' => (int)$row['file_size'], 'createdAt' => $row['created_at'],
    ], $stmt->fetchAll()));
}

function admin_documents_index(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $stmt = $pdo->query(
        'SELECT d.id, d.user_id, d.document_type, d.original_name, d.storage_name, d.mime_type, d.file_size, d.created_at,
                u.name, u.email, u.role
         FROM user_documents d JOIN users u ON u.id = d.user_id
         ORDER BY d.created_at DESC LIMIT 500'
    );
    json_ok(array_map(fn($row) => [
        'id' => $row['id'], 'userId' => $row['user_id'], 'name' => $row['name'], 'email' => $row['email'],
        'role' => $row['role'], 'documentType' => $row['document_type'],
        'fileName' => $row['original_name'], 'mimeType' => $row['mime_type'],
        'fileAvailable' => find_uploaded_file('private', $row['storage_name']) !== null,
        'fileSize' => (int)$row['file_size'], 'createdAt' => $row['created_at'],
    ], $stmt->fetchAll()));
}

function admin_document_download(PDO $pdo, string $id): void {
    $user = require_auth($pdo);
    require_role($user, ['admin']);
    $stmt = $pdo->prepare('SELECT original_name, storage_name, mime_type FROM user_documents WHERE id = ?');
    $stmt->execute([$id]);
    $document = $stmt->fetch();
    if (!$document) json_error('Document not found.', 404);

    $path = find_uploaded_file('private', $document['storage_name']);
    if ($path === null) json_error('The stored document is unavailable.', 404);
    header_remove('Content-Type');
    header('Content-Type: ' . $document['mime_type']);
    $safeFileName = preg_replace('/[^A-Za-z0-9._-]/', '_', basename($document['original_name']));
    header('Content-Disposition: inline; filename="' . $safeFileName . '"');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . filesize($path));
    readfile($path);
    exit;
}

function product_image_upload(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['vendor', 'admin']);
    [$file, $mime, $extension] = validate_uploaded_file('file', 5 * 1024 * 1024, [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ]);
    $directory = uploads_roots()[0] . '/products';
    ensure_upload_directory($directory);
    $id = bin2hex(random_bytes(16));
    if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $id . '.' . $extension)) {
        json_error('The server could not store this product image. Please try again.', 500);
    }
    json_ok(['url' => '/api/product-images/' . $id], 201);
}

function product_image_show(PDO $pdo, string $id): void {
    if (!preg_match('/^[a-f0-9]{32}$/', $id)) json_error('Image not found.', 404);
    foreach (uploads_roots() as $root) {
        foreach (['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'] as $extension => $mime) {
            $path = $root . '/products/' . $id . '.' . $extension;
            if (!is_file($path)) continue;
            header_remove('Content-Type');
            header('Content-Type: ' . $mime);
            header('X-Content-Type-Options: nosniff');
            header('Cache-Control: public, max-age=86400');
            header('Content-Length: ' . filesize($path));
            readfile($path);
            exit;
        }
    }
    json_error('Image not found.', 404);
}

function profile_image_upload(PDO $pdo): void {
    $user = require_auth($pdo);
    require_role($user, ['vendor', 'guide']);
    [, , $extension] = validate_uploaded_file('file', 5 * 1024 * 1024, [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ]);
    $file = $_FILES['file'];
    $directory = uploads_roots()[0] . '/profiles';
    ensure_upload_directory($directory);
    $id = bin2hex(random_bytes(16));
    if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $id . '.' . $extension)) {
        json_error('The server could not store your profile photo. Please try again.', 500);
    }
    json_ok(['url' => '/api/profile-images/' . $id], 201);
}

function profile_image_show(PDO $pdo, string $id): void {
    if (!preg_match('/^[a-f0-9]{32}$/', $id)) json_error('Image not found.', 404);
    foreach (uploads_roots() as $root) {
        foreach (['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'] as $extension => $mime) {
            $path = $root . '/profiles/' . $id . '.' . $extension;
            if (!is_file($path)) continue;
            header_remove('Content-Type');
            header('Content-Type: ' . $mime);
            header('X-Content-Type-Options: nosniff');
            header('Cache-Control: public, max-age=86400');
            header('Content-Length: ' . filesize($path));
            readfile($path);
            exit;
        }
    }
    json_error('Image not found.', 404);
}
