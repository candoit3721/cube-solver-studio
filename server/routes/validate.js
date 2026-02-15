import { Router } from 'express';
import { parseCube } from '../parsers/index.js';
import { validate } from '../validators/validationPipeline.js';

const router = Router();

router.post('/api/validate', (req, res, next) => {
  try {
    const { cube, format } = req.body;

    if (cube === undefined || cube === null) {
      return res.status(400).json({
        error: { code: 'PARSE_ERROR', message: 'Missing "cube" field in request body' },
      });
    }

    const { facelets, detectedFormat } = parseCube(cube, format);
    const cubeState = validate(facelets);

    res.json({
      valid: true,
      isSolved: cubeState.isSolved(),
      facelets: cubeState.toString(),
      faceMap: cubeState.faceMap,
      format: format || detectedFormat,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
