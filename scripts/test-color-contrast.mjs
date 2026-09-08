import fs from 'node:fs';

const source = fs.readFileSync('packages/tokens/src/colors.ts', 'utf8');
const failures = [];

function palette(name) {
  const start = source.indexOf(`export const ${name} =`);
  const end = source.indexOf('satisfies PrecisionColors;', start);
  if (start < 0 || end < 0) throw new Error(`Could not parse ${name}`);
  return source.slice(start, end);
}

function color(block, section, key) {
  const sectionMatch = block.match(new RegExp(`${section}: \\{([\\s\\S]*?)\\n  \\},`));
  if (!sectionMatch) throw new Error(`Missing ${section} block`);
  const keyMatch = sectionMatch[1].match(new RegExp(`${key}: '([^']+)'`));
  if (!keyMatch) throw new Error(`Missing ${section}.${key}`);
  return keyMatch[1];
}

function rgb(hex) {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
}

function luminance(hex) {
  const [r, g, b] = rgb(hex).map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function expectContrast(label, foreground, background, minimum = 4.5) {
  const ratio = contrast(foreground, background);
  if (ratio + 1e-9 < minimum) failures.push(`${label}: ${ratio.toFixed(2)}:1 < ${minimum}:1 (${foreground} on ${background})`);
}

for (const name of ['lightColors', 'darkColors']) {
  const block = palette(name);
  const textPrimary = color(block, 'text', 'primary');
  const textSecondary = color(block, 'text', 'secondary');
  const textTertiary = color(block, 'text', 'tertiary');
  const canvas = color(block, 'background', 'canvas');
  const surface = color(block, 'background', 'surface');
  const inverseSurface = color(block, 'background', 'inverse');
  const inverseText = color(block, 'text', 'inverse');
  const primary = color(block, 'interactive', 'primary');
  const onPrimary = color(block, 'interactive', 'onPrimary');
  const negative = color(block, 'feedback', 'negative');
  const negativeHover = color(block, 'feedback', 'negativeHover');
  const negativePressed = color(block, 'feedback', 'negativePressed');
  const negativeSurfaceHover = color(block, 'feedback', 'negativeSurfaceHover');
  const negativeSurfacePressed = color(block, 'feedback', 'negativeSurfacePressed');

  for (const [tone, value] of [['primary', textPrimary], ['secondary', textSecondary], ['tertiary', textTertiary]]) {
    expectContrast(`${name} text.${tone} / canvas`, value, canvas);
    expectContrast(`${name} text.${tone} / surface`, value, surface);
  }
  expectContrast(`${name} inverse text`, inverseText, inverseSurface);
  expectContrast(`${name} primary button`, onPrimary, primary);
  expectContrast(`${name} danger button hover`, onPrimary, negativeHover);
  expectContrast(`${name} danger button pressed`, onPrimary, negativePressed);
  expectContrast(`${name} danger icon hover`, negative, negativeSurfaceHover, 3);
  expectContrast(`${name} danger icon pressed`, negative, negativeSurfacePressed, 3);

  for (const feedback of ['positive', 'warning', 'negative', 'info']) {
    expectContrast(`${name} feedback.${feedback}`, color(block, 'feedback', feedback), color(block, 'feedback', `${feedback}Surface`));
  }
}

if (failures.length) {
  console.error('Color contrast contract violations:\n' + failures.map((failure) => `- ${failure}`).join('\n'));
  process.exit(1);
}
console.log('Color contrast contracts passed (small-text threshold >= 4.5:1).');
