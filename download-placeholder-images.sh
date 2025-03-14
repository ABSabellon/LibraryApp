#!/bin/bash

# Create directories if they don't exist
mkdir -p ./src/assets

# Download placeholder images
echo "Downloading placeholder images for the app..."

# App icon (1024x1024)
curl "https://via.placeholder.com/1024x1024.png?text=Library+App+Icon" -o ./src/assets/icon.png

# Splash screen (2048x2048)
curl "https://via.placeholder.com/2048x2048.png?text=Library+App" -o ./src/assets/splash.png

# Adaptive icon for Android (1024x1024)
curl "https://via.placeholder.com/1024x1024.png?text=Library+App+Adaptive" -o ./src/assets/adaptive-icon.png

# Favicon for web (192x192)
curl "https://via.placeholder.com/192x192.png?text=Lib" -o ./src/assets/favicon.png

# Also create a logo for the login screen (300x300)
curl "https://via.placeholder.com/300x300.png?text=Library+Logo" -o ./src/assets/logo.png

echo "Placeholder images downloaded successfully!"
echo "You should replace these with your actual app images before building for production."