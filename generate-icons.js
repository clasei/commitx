// Simple icon generator for commitx PWA
// Creates a minimal icon with the commitx branding

const canvas192 = document.createElement('canvas');
const canvas512 = document.createElement('canvas');

function generateIcon(canvas, size) {
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, size, size);

  // Draw a simple grid pattern representing commits
  const cellSize = size / 8;
  const colors = ['#6b9bd1', '#88c0d0', '#8fbc8f'];

  for (let i = 0; i < 7; i++) {
    const x = cellSize + (i * cellSize * 0.9);
    const y = size / 2 - cellSize / 2;

    ctx.fillStyle = i < 4 ? colors[i % 3] : '#30363d';
    ctx.fillRect(x, y, cellSize * 0.8, cellSize * 0.8);
  }

  return canvas.toDataURL('image/png');
}

// Generate 192x192
const icon192Data = generateIcon(canvas192, 192);
console.log('192x192 icon generated');

// Generate 512x512
const icon512Data = generateIcon(canvas512, 512);
console.log('512x512 icon generated');

// Download function
function downloadIcon(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

// Auto download (run in browser console)
if (typeof window !== 'undefined') {
  setTimeout(() => downloadIcon(icon192Data, 'icon-192.png'), 100);
  setTimeout(() => downloadIcon(icon512Data, 'icon-512.png'), 200);
}

