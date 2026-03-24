import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const serveMain = path.join(root, 'node_modules', 'serve', 'build', 'main.js');
const port = String(process.env.PORT || '3000');

const child = spawn(process.execPath, [serveMain, 'dist', '-n', '-l', `tcp://0.0.0.0:${port}`], {
	stdio: 'inherit',
	cwd: root,
});

child.on('exit', (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	process.exit(code ?? 1);
});
