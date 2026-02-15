import { Router } from 'express';
import { parseCube } from '../parsers/index.js';
import { validate } from '../validators/validationPipeline.js';
import { solve } from '../solvers/solverAdapter.js';

const router = Router();

router.post('/api/solve', (req, res, next) => {
  try {
    const { cube, format, method } = req.body;

    if (cube === undefined || cube === null) {
      return res.status(400).json({
        error: { code: 'PARSE_ERROR', message: 'Missing "cube" field in request body' },
      });
    }

    const { facelets, detectedFormat } = parseCube(cube, format);
    const cubeState = validate(facelets);
    const result = solve([...cubeState.facelets], method || 'optimal');

    res.json({
      ...result,
      input: {
        format: format || detectedFormat,
        facelets: cubeState.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
