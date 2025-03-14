const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'src', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
  console.log('Created assets directory');
}

// Function to create a very simple SVG placeholder
function createSvgPlaceholder(text, size, filename) {
  const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#4A90E2"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size/10}px" fill="white" text-anchor="middle" dy=".3em">${text}</text>
</svg>
  `.trim();
  
  fs.writeFileSync(path.join(assetsDir, filename), svg);
  console.log(`Created ${filename}`);
}

// Create the placeholder images
createSvgPlaceholder('Library App Icon', 1024, 'icon.svg');
createSvgPlaceholder('Library App', 2048, 'splash.svg');
createSvgPlaceholder('Library App Adaptive', 1024, 'adaptive-icon.svg');
createSvgPlaceholder('Lib', 192, 'favicon.svg');
createSvgPlaceholder('Library Logo', 300, 'logo.svg');

// Create empty PNG files (to prevent app crashes)
['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png', 'logo.png'].forEach(file => {
  // Create a 1x1 transparent PNG as a fallback
  const emptyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64'
  );
  fs.writeFileSync(path.join(assetsDir, file), emptyPng);
  console.log(`Created ${file} as fallback`);
});

console.log('Placeholder images created successfully!');
console.log('You should replace these with your actual app images before building for production.');