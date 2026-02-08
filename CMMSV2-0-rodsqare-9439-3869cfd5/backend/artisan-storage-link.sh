#!/bin/bash
# Script to create storage symlink for Laravel
# Run this from the backend directory: bash artisan-storage-link.sh

php artisan storage:link
echo "Storage link created successfully!"
