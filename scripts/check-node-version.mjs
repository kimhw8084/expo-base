const minimum = [22, 13, 0];
const current = process.versions.node.split('.').map(Number);

const supported =
  current[0] > minimum[0] ||
  (current[0] === minimum[0] && current[1] > minimum[1]) ||
  (current[0] === minimum[0] &&
    current[1] === minimum[1] &&
    current[2] >= minimum[2]);

if (!supported) {
  console.error('');
  console.error('Expo Base requires Node.js >= 22.13.0.');
  console.error(`Current Node.js: ${process.versions.node}`);
  console.error('Switch to Node 22 LTS, then reinstall dependencies.');
  console.error('');
  process.exit(1);
}

console.log(
  `Node.js ${process.versions.node} satisfies Expo Base >= 22.13.0`
);
