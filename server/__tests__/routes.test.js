import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { initKociemba } from '../solvers/kociembaAdapter.js';
import { createSolvedState, applyMoves } from '../../src/engine/cubeState.js';

const SOLVED = createSolvedState();
let app;

beforeAll(() => {
  initKociemba();
  app = createApp();
});

describe('GET /api/health', () => {
  it('returns status and solver info', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.solvers.kociemba).toBe('ready');
    expect(res.body.solvers.layered).toBe('ready');
    expect(res.body.supportedFormats).toContain('faceMap');
    expect(res.body.supportedMethods).toContain('optimal');
  });
});

describe('POST /api/validate', () => {
  it('validates a solved cube string', async () => {
    const res = await request(app)
      .post('/api/validate')
      .send({ cube: SOLVED.join('') });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.isSolved).toBe(true);
  });

  it('validates a scrambled cube', async () => {
    const scrambled = applyMoves(SOLVED, ['R', 'U']);
    const res = await request(app)
      .post('/api/validate')
      .send({ cube: scrambled.join(''), format: 'faceletString' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.isSolved).toBe(false);
  });

  it('returns 400 for missing cube field', async () => {
    const res = await request(app)
      .post('/api/validate')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 422 for invalid cube state', async () => {
    const bad = [...SOLVED];
    bad[7] = 'F';
    bad[19] = 'U';
    const res = await request(app)
      .post('/api/validate')
      .send({ cube: bad.join(''), format: 'faceletString' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/solve', () => {
  it('solves a scramble string', async () => {
    const res = await request(app)
      .post('/api/solve')
      .send({ cube: "R U R' U'", format: 'scramble' });
    expect(res.status).toBe(200);
    expect(res.body.solved).toBe(true);
    expect(res.body.moveCount).toBeGreaterThan(0);
    expect(res.body.movesString).toBeTruthy();
  });

  it('solves with beginner method', async () => {
    const res = await request(app)
      .post('/api/solve')
      .send({ cube: "R U R' U'", format: 'scramble', method: 'beginner' });
    expect(res.status).toBe(200);
    expect(res.body.solved).toBe(true);
    expect(res.body.method).toBe('layered');
    expect(res.body.phases).not.toBeNull();
  });

  it('detects already-solved cube', async () => {
    const res = await request(app)
      .post('/api/solve')
      .send({ cube: SOLVED.join('') });
    expect(res.status).toBe(200);
    expect(res.body.alreadySolved).toBe(true);
  });

  it('solves with auto-detected faceMap format', async () => {
    const scrambled = applyMoves(SOLVED, ['R', 'U']);
    const faceMap = {};
    const faces = ['U', 'R', 'F', 'D', 'L', 'B'];
    const offsets = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
    for (const f of faces) {
      faceMap[f] = scrambled.slice(offsets[f], offsets[f] + 9);
    }
    const res = await request(app)
      .post('/api/solve')
      .send({ cube: faceMap });
    expect(res.status).toBe(200);
    expect(res.body.solved).toBe(true);
  });

  it('returns 400 for missing cube', async () => {
    const res = await request(app)
      .post('/api/solve')
      .send({});
    expect(res.status).toBe(400);
  });

  it('returns 422 for impossible cube', async () => {
    const bad = [...SOLVED];
    bad[7] = 'F';
    bad[19] = 'U';
    const res = await request(app)
      .post('/api/solve')
      .send({ cube: bad.join('') });
    expect(res.status).toBe(422);
  });
});
