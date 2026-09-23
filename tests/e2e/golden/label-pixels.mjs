import { PNG } from 'pngjs';

const MAX_PIXELS = 1_000_000;
const MIN_INK_PIXELS = 8;
const CHANNEL_DIFFERENCE = 48;

export function countContrastingPixels(pngBuffer) {
  const image = PNG.sync.read(pngBuffer);
  if (image.width * image.height > MAX_PIXELS) throw new Error('Label pixel sample exceeds the bounded image area.');

  const colors = new Map();
  for (let offset = 0; offset < image.data.length; offset += 4) {
    if (image.data[offset + 3] < 160) continue;
    const key = `${image.data[offset]},${image.data[offset + 1]},${image.data[offset + 2]}`;
    colors.set(key, (colors.get(key) ?? 0) + 1);
  }
  const background = [...colors.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
  if (!background) return 0;

  const [red, green, blue] = background.split(',').map(Number);
  let contrasting = 0;
  for (let offset = 0; offset < image.data.length; offset += 4) {
    if (image.data[offset + 3] < 160) continue;
    const difference = Math.max(
      Math.abs(image.data[offset] - red),
      Math.abs(image.data[offset + 1] - green),
      Math.abs(image.data[offset + 2] - blue),
    );
    if (difference >= CHANNEL_DIFFERENCE) contrasting += 1;
  }
  return contrasting;
}

export function assertLabelHasVisiblePixels(pngBuffer, label) {
  const count = countContrastingPixels(pngBuffer);
  if (count < MIN_INK_PIXELS) {
    throw new Error(`Forced-colors label pixels absent or indistinguishable for "${label}" (${count} contrasting pixels).`);
  }
  return count;
}
