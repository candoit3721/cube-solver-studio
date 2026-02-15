import { Router } from 'express';
import { isKociembaReady } from '../solvers/kociembaAdapter.js';
import { SUPPORTED_FORMATS } from '../parsers/index.js';
import { SUPPORTED_METHODS } from '../solvers/solverAdapter.js';

const router = Router();

router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    solvers: {
      kociemba: isKociembaReady() ? 'ready' : 'initializing',
      layered: 'ready',
    },
    supportedFormats: SUPPORTED_FORMATS,
    supportedMethods: SUPPORTED_METHODS,
  });
});

export default router;
