import { createApp } from './app.js';
import { initKociemba } from './solvers/kociembaAdapter.js';

const PORT = process.env.PORT || 3001;

console.log('Initializing Kociemba solver tables...');
const initStart = Date.now();
initKociemba();
console.log(`Kociemba solver ready in ${Date.now() - initStart}ms`);

const app = createApp();

app.listen(PORT, () => {
  console.log(`Rubik's Cube Solver API listening on port ${PORT}`);
});
