import * as THREE from 'three';

/**
 * Procedural Texture Generators
 * Fully self-contained, zero-404 external asset dependencies.
 */

// Generate realistic light Japanese oak floor texture
export function createWoodFloorTexture(colorHex = '#DFD2C2'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.colorSpace = THREE.SRGBColorSpace;
    return fallback;
  }

  // Base floor tone
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 1024, 1024);

  // Draw wood planks
  const plankHeight = 128;
  const plankWidth = 512;
  const rows = 1024 / plankHeight;

  for (let r = 0; r < rows; r++) {
    const y = r * plankHeight;
    const offset = (r % 2) * 256;

    for (let x = -256 + offset; x < 1024 + 256; x += plankWidth) {
      // Subtle tone variation per plank
      const tint = (Math.random() - 0.5) * 16;
      ctx.fillStyle = `rgba(${220 + tint}, ${205 + tint}, ${185 + tint}, 0.25)`;
      ctx.fillRect(x, y, plankWidth, plankHeight);

      // Fine wood grain lines inside plank
      ctx.strokeStyle = 'rgba(150, 130, 110, 0.08)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 14; g++) {
        const grainY = y + Math.random() * plankHeight;
        ctx.beginPath();
        ctx.moveTo(x, grainY);
        ctx.bezierCurveTo(
          x + plankWidth * 0.33, grainY + (Math.random() - 0.5) * 6,
          x + plankWidth * 0.66, grainY + (Math.random() - 0.5) * 6,
          x + plankWidth, grainY + (Math.random() - 0.5) * 4
        );
        ctx.stroke();
      }

      // Plank bevel / seam shadow
      ctx.strokeStyle = 'rgba(90, 75, 60, 0.22)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, plankWidth, plankHeight);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate subtle Japandi linen / plaster wall texture
export function createPlasterWallTexture(colorHex = '#F4F1EA'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.colorSpace = THREE.SRGBColorSpace;
    return fallback;
  }

  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 512);

  // Subtle natural plaster grain
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate Berber wool rug texture with diamond pattern
export function createRugTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    fallback.colorSpace = THREE.SRGBColorSpace;
    return fallback;
  }

  // Soft off-white wool base
  ctx.fillStyle = '#F5EFE6';
  ctx.fillRect(0, 0, 512, 512);

  // Soft diagonal diamond grid
  ctx.strokeStyle = 'rgba(110, 95, 80, 0.28)';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);

  const step = 80;
  for (let i = -512; i < 1024; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 512, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 512);
    ctx.lineTo(i + 512, 0);
    ctx.stroke();
  }

  // Border border frame
  ctx.setLineDash([]);
  ctx.strokeStyle = 'rgba(120, 105, 90, 0.4)';
  ctx.lineWidth = 6;
  ctx.strokeRect(12, 12, 488, 488);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
