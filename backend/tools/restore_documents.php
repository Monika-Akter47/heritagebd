<?php
// Copies verification documents from a local uploads folder into stored_files, for documents whose
// file was lost from the API host. Only files that match a user_documents row are copied.
//   DATABASE_URL=postgresql://... php backend/tools/restore_documents.php heritagebd-data/uploads/private
require __DIR__ . '/../config/database.php';
require __DIR__ . '/../controllers/uploads_controller.php';

$dir = $argv[1] ?? '';
if (!is_dir($dir)) { fwrite(STDERR, "Usage: php restore_documents.php <folder with the document files>\n"); exit(1); }

$pdo = get_db();
$rows = $pdo->query(
    "SELECT d.storage_name, d.mime_type, u.name FROM user_documents d JOIN users u ON u.id = d.user_id
     LEFT JOIN stored_files f ON f.kind = 'document' AND f.name = d.storage_name WHERE f.name IS NULL"
)->fetchAll();

foreach ($rows as $row) {
    $path = $dir . '/' . $row['storage_name'];
    if (!is_file($path)) { echo "missing   {$row['name']}  {$row['storage_name']}\n"; continue; }
    stored_file_save($pdo, 'document', $row['storage_name'], $row['mime_type'], $path);
    echo "restored  {$row['name']}  {$row['storage_name']}\n";
}
