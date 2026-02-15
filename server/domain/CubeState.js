import { FACE_ORDER, FACE_OFFSET, isSolved as checkSolved } from '../../src/engine/cubeState.js';

/**
 * Immutable validated domain object wrapping a 54-element facelet array.
 * Only created through the validation pipeline — never constructed directly by routes.
 */
export class CubeState {
  #facelets;

  constructor(facelets) {
    if (!Array.isArray(facelets) || facelets.length !== 54) {
      throw new Error('CubeState requires a 54-element facelet array');
    }
    this.#facelets = Object.freeze([...facelets]);
  }

  get facelets() {
    return this.#facelets;
  }

  get faceMap() {
    const map = {};
    for (const face of FACE_ORDER) {
      const off = FACE_OFFSET[face];
      map[face] = this.#facelets.slice(off, off + 9);
    }
    return map;
  }

  isSolved() {
    return checkSolved(this.#facelets);
  }

  toString() {
    return this.#facelets.join('');
  }

  toJSON() {
    return {
      facelets: this.toString(),
      faceMap: this.faceMap,
      isSolved: this.isSolved(),
    };
  }
}
