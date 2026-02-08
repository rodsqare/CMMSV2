<?php
// Run this file once to create the storage symlink
// In your terminal, run: php backend/artisan-storage-link.php

$target = __DIR__ . '/storage/app/public';
$link = __DIR__ . '/public/storage';

if (file_exists($link)) {
    echo "Storage link already exists.\n";
    exit(0);
}

if (symlink($target, $link)) {
    echo "Storage link created successfully.\n";
} else {
    echo "Failed to create storage link. Try running: php artisan storage:link\n";
}
