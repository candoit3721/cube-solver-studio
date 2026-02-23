export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Rubik\'s Cube Solver API',
    version: '1.0.0',
    description:
      'Validate and solve Rubik\'s Cube states. Accepts multiple input formats and supports both optimal (Kociemba) and beginner (layered) solving methods.',
  },
  servers: [{ url: '/' }],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        description: 'Returns server status, solver readiness, and supported formats/methods.',
        operationId: 'getHealth',
        tags: ['Health'],
        responses: {
          200: {
            description: 'Server is running',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/validate': {
      post: {
        summary: 'Validate a cube state',
        description:
          'Parses and validates a cube state. Returns whether the cube is valid, solved, and its normalized facelet representation.',
        operationId: 'validateCube',
        tags: ['Cube'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidateRequest' },
              examples: {
                faceletString: {
                  summary: '54-char facelet string (scrambled)',
                  value: { cube: 'UULUUFUUFRRUBRRURRFFDFFUFFFDDRDDDDDDBLLLLLLLLBRRBBBBBB', format: 'faceletString' },
                },
                faceMap: {
                  summary: 'Face map object (scrambled)',
                  value: {
                    cube: {
                      U: ['U','U','L','U','U','F','U','U','F'],
                      R: ['R','R','U','B','R','R','U','R','R'],
                      F: ['F','F','D','F','F','U','F','F','F'],
                      D: ['D','D','R','D','D','D','D','D','D'],
                      L: ['B','L','L','L','L','L','L','L','L'],
                      B: ['B','R','R','B','B','B','B','B','B'],
                    },
                    format: 'faceMap',
                  },
                },
                flatArray: {
                  summary: '54-element flat array (scrambled)',
                  value: {
                    cube: [
                      'U','U','L','U','U','F','U','U','F',
                      'R','R','U','B','R','R','U','R','R',
                      'F','F','D','F','F','U','F','F','F',
                      'D','D','R','D','D','D','D','D','D',
                      'B','L','L','L','L','L','L','L','L',
                      'B','R','R','B','B','B','B','B','B',
                    ],
                    format: 'flatArray',
                  },
                },
                singmaster: {
                  summary: 'Singmaster notation (scrambled)',
                  value: { cube: 'U:UULUUFUUF/R:RRUBRRURR/F:FFDFFUFFF/D:DDRDDDDDD/L:BLLLLLLLL/B:BRRBBBBBB', format: 'singmaster' },
                },
                scramble: {
                  summary: 'Scramble string (moves)',
                  value: { cube: "R U R' U'", format: 'scramble' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Cube is valid',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidateResponse' },
              },
            },
          },
          400: {
            description: 'Parse error (missing or malformed input)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          422: {
            description: 'Validation error (invalid cube state)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' },
              },
            },
          },
        },
      },
    },
    '/api/solve': {
      post: {
        summary: 'Solve a cube',
        description:
          'Parses, validates, and solves a cube state. Supports optimal (Kociemba two-phase) and beginner (layered) methods.',
        operationId: 'solveCube',
        tags: ['Cube'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SolveRequest' },
              examples: {
                faceletString: {
                  summary: '54-char facelet string',
                  value: { cube: 'UULUUFUUFRRUBRRURRFFDFFUFFFDDRDDDDDDBLLLLLLLLBRRBBBBBB', format: 'faceletString', method: 'optimal' },
                },
                faceMap: {
                  summary: 'Face map object',
                  value: {
                    cube: {
                      U: ['U','U','L','U','U','F','U','U','F'],
                      R: ['R','R','U','B','R','R','U','R','R'],
                      F: ['F','F','D','F','F','U','F','F','F'],
                      D: ['D','D','R','D','D','D','D','D','D'],
                      L: ['B','L','L','L','L','L','L','L','L'],
                      B: ['B','R','R','B','B','B','B','B','B'],
                    },
                    format: 'faceMap',
                    method: 'optimal',
                  },
                },
                flatArray: {
                  summary: '54-element flat array',
                  value: {
                    cube: [
                      'U','U','L','U','U','F','U','U','F',
                      'R','R','U','B','R','R','U','R','R',
                      'F','F','D','F','F','U','F','F','F',
                      'D','D','R','D','D','D','D','D','D',
                      'B','L','L','L','L','L','L','L','L',
                      'B','R','R','B','B','B','B','B','B',
                    ],
                    format: 'flatArray',
                    method: 'optimal',
                  },
                },
                singmaster: {
                  summary: 'Singmaster notation',
                  value: { cube: 'U:UULUUFUUF/R:RRUBRRURR/F:FFDFFUFFF/D:DDRDDDDDD/L:BLLLLLLLL/B:BRRBBBBBB', format: 'singmaster', method: 'optimal' },
                },
                scramble: {
                  summary: 'Scramble string (moves)',
                  value: { cube: "R U R' U'", format: 'scramble', method: 'optimal' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Cube solved successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SolveResponse' },
              },
            },
          },
          400: {
            description: 'Parse error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
          422: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' },
              },
            },
          },
          500: {
            description: 'Solver error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      SolveRequest: {
        type: 'object',
        required: ['cube'],
        properties: {
          cube: {
            description: 'Cube state in any supported format.',
            oneOf: [
              { type: 'string', description: 'Scramble moves, facelet string, or Singmaster notation' },
              { type: 'array', items: { type: 'string' }, description: '54-element flat array or array of moves' },
              { type: 'object', description: 'Face map with keys U, R, F, D, L, B' },
            ],
          },
          format: {
            type: 'string',
            enum: ['scramble', 'faceletString', 'flatArray', 'faceMap', 'singmaster'],
            description: 'Input format. Auto-detected if omitted.',
          },
          method: {
            type: 'string',
            enum: ['optimal', 'beginner'],
            default: 'optimal',
            description: '"optimal" uses Kociemba two-phase; "beginner" uses layered method.',
          },
        },
      },
      ValidateRequest: {
        type: 'object',
        required: ['cube'],
        properties: {
          cube: {
            description: 'Cube state in any supported format.',
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } },
              { type: 'object' },
            ],
          },
          format: {
            type: 'string',
            enum: ['scramble', 'faceletString', 'flatArray', 'faceMap', 'singmaster'],
            description: 'Input format. Auto-detected if omitted.',
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          solvers: {
            type: 'object',
            properties: {
              kociemba: { type: 'string', enum: ['ready', 'initializing'] },
              layered: { type: 'string', enum: ['ready'] },
            },
          },
          supportedFormats: {
            type: 'array',
            items: { type: 'string' },
            example: ['faceMap', 'faceletString', 'flatArray', 'scramble', 'singmaster'],
          },
          supportedMethods: {
            type: 'array',
            items: { type: 'string' },
            example: ['optimal', 'beginner'],
          },
        },
      },
      ValidateResponse: {
        type: 'object',
        properties: {
          valid: { type: 'boolean', example: true },
          isSolved: { type: 'boolean' },
          facelets: { type: 'string', description: '54-char normalized facelet string' },
          faceMap: {
            type: 'object',
            description: 'Face map with keys U, R, F, D, L, B, each a 9-element array',
          },
          format: { type: 'string' },
        },
      },
      SolveResponse: {
        type: 'object',
        properties: {
          solved: { type: 'boolean', example: true },
          alreadySolved: { type: 'boolean' },
          moves: { type: 'array', items: { type: 'string' }, example: ["U", "R", "U'", "R'"] },
          moveCount: { type: 'integer' },
          movesString: { type: 'string', example: "U R U' R'" },
          method: { type: 'string', enum: ['kociemba', 'layered'] },
          phases: {
            description: 'Phase breakdown (layered method only)',
            nullable: true,
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                moves: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          elapsedMs: { type: 'number', description: 'Solve time in milliseconds' },
          input: {
            type: 'object',
            properties: {
              format: { type: 'string' },
              facelets: { type: 'string' },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'PARSE_ERROR' },
              message: { type: 'string' },
            },
          },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              stage: { type: 'string', description: 'Validation stage that failed' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
