export class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

export class ParseError extends AppError {
  constructor(message) {
    super(message, 400, 'PARSE_ERROR');
  }
}

export class ValidationError extends AppError {
  constructor(message, stage) {
    super(message, 422, 'VALIDATION_ERROR');
    this.stage = stage;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        stage: this.stage,
        message: this.message,
      },
    };
  }
}

export class SolverError extends AppError {
  constructor(message) {
    super(message, 500, 'SOLVER_ERROR');
  }
}
