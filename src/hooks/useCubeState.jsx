/**
 * Central cube state manager using React Context + useReducer.
 */
import { createContext, useContext, useReducer, useRef, useCallback } from 'react';
import { FACES, INVERT } from '../engine/constants.js';
import { doMoveAnimated, doMoveInstant, isBusy } from '../engine/animator.js';
import { solveFaceMap } from '../engine/solver.js';
import { solveLayered } from '../engine/layeredSolver.js';
import { createSolvedState, applyMoves as applyMovesState, faceMapToState } from '../engine/cubeState.js';

const CubeCtx = createContext(null);

const initialState = {
    mode: 'idle',        // idle | scrambling | ready | solving | paused
    scramble: [],
    solution: [],
    step: 0,
    playing: false,
    sidePanel: '',       // overview text
    sidePanelErr: '',    // error text
    sidePanelSolved: false,
    customPattern: null, // Store custom pattern to solve later
    solverMethod: 'optimal', // 'optimal' | 'beginner'
    phases: null,        // beginner solver phase data
    scrambleMoves: null, // raw scramble moves for beginner solver
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET':
            return { ...state, ...action.payload };
        case 'RESET':
            return { ...initialState, solverMethod: state.solverMethod };
        default:
            return state;
    }
}

export function CubeProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const engineRef = useRef(null);
    const speedRef = useRef(5);
    const stateRef = useRef(state);
    stateRef.current = state;

    const set = useCallback((payload) => dispatch({ type: 'SET', payload }), []);

    /** Get animation duration based on current speed */
    const solveDur = useCallback(() => 600 - (speedRef.current - 1) * 55, []);

    /** Generate a random scramble sequence */
    const genScramble = useCallback((len) => {
        const out = [];
        let last = '';
        for (let i = 0; i < len; i++) {
            let f;
            do { f = FACES[Math.random() * 6 | 0]; } while (f === last);
            out.push(Math.random() < 0.5 ? f : f + "'");
            last = f;
        }
        return out;
    }, []);

    /** Scramble the cube */
    const scramble = useCallback(async () => {
        const eng = engineRef.current;
        if (!eng || isBusy()) return;

        eng.createCube();
        const moves = genScramble(22);

        set({
            mode: 'scrambling', scramble: moves, solution: [], step: 0, playing: false,
            sidePanel: '', sidePanelErr: '', sidePanelSolved: false,
            phases: null, scrambleMoves: moves, customPattern: null,
        });

        for (const mv of moves) {
            await doMoveAnimated(eng.scene, eng.cubies, mv, 70);
        }

        // Compute solution based on current solver method
        const method = stateRef.current.solverMethod;
        if (method === 'beginner') {
            const scrambledState = applyMovesState(createSolvedState(), moves);
            const result = solveLayered(scrambledState);
            if (result.error) {
                set({ mode: 'ready', solution: [], step: 0, sidePanelErr: result.error, phases: null });
            } else {
                set({ mode: 'ready', solution: result.moves, step: 0, phases: result.phases });
            }
        } else {
            const solution = [...moves].reverse().map(INVERT);
            set({ mode: 'ready', solution, step: 0, phases: null });
        }
    }, [genScramble, set]);

    /** Start or resume solving */
    const solve = useCallback(async (currentSolution, currentStep, customPattern) => {
        const eng = engineRef.current;
        if (!eng) return;

        let sol = currentSolution;

        // If no solution yet, try to compute it (Custom Pattern case)
        if ((!sol || sol.length === 0) && customPattern) {
            const method = stateRef.current.solverMethod;
            set({ mode: 'solving', sidePanel: 'Computing solution...', sidePanelErr: '', phases: null });

            // Yield to UI
            await new Promise(r => setTimeout(r, 50));

            if (method === 'beginner') {
                const cubeState = faceMapToState(customPattern);
                const result = solveLayered(cubeState);
                if (result.error) {
                    set({ mode: 'idle', sidePanel: '', sidePanelErr: result.error, phases: null });
                    return;
                }
                if (result.moves.length === 0) {
                    set({ mode: 'idle', sidePanelSolved: true, sidePanel: 'Already solved!', sidePanelErr: '', phases: null });
                    return;
                }
                sol = result.moves;
                set({ solution: sol, step: 0, mode: 'ready', sidePanel: `Solution: ${sol.length} moves`, phases: result.phases });
            } else {
                // Log for debug
                console.time('solve');
                const result = await solveFaceMap(customPattern);
                console.timeEnd('solve');

                if (result.error) {
                    set({ mode: 'idle', sidePanel: '', sidePanelErr: result.error });
                    return;
                } else if (result.solved) {
                    set({ mode: 'idle', sidePanelSolved: true, sidePanel: 'Already solved!', sidePanelErr: '' });
                    return;
                }

                sol = result.moves;
                set({ solution: sol, step: 0, mode: 'ready', sidePanel: `Solution: ${sol.length} moves`, phases: null });
            }

            // Wait a bit before playing
            await new Promise(r => setTimeout(r, 500));
        }

        if (!sol || sol.length === 0) return;

        set({ mode: 'solving', playing: true });

        eng._playing = true;

        return new Promise((resolve) => {
            const runStep = async (stepIdx, s) => {
                if (!eng._playing || stepIdx >= s.length) {
                    eng._playing = false;
                    const done = stepIdx >= s.length;
                    set({ playing: false, mode: done ? 'idle' : 'paused' });
                    resolve();
                    return;
                }

                await doMoveAnimated(eng.scene, eng.cubies, s[stepIdx], solveDur());
                const next = stepIdx + 1;
                set({ step: next });

                if (eng._playing && next < s.length) {
                    await new Promise(r => setTimeout(r, 250));
                }
                runStep(next, s);
            };

            runStep(currentStep || 0, sol);
        });
    }, [set, solveDur]);

    /** Stop playing */
    const stopPlaying = useCallback(() => {
        const eng = engineRef.current;
        if (eng) eng._playing = false;
        set({ playing: false });
    }, [set]);

    /** Step forward */
    const nextStep = useCallback(async (currentStep, solution) => {
        const eng = engineRef.current;
        if (!eng || isBusy() || currentStep >= solution.length) return;
        await doMoveAnimated(eng.scene, eng.cubies, solution[currentStep], solveDur());
        const newStep = currentStep + 1;
        set({ step: newStep, mode: newStep >= solution.length ? 'idle' : 'paused' });
    }, [set, solveDur]);

    /** Step backward */
    const prevStep = useCallback(async (currentStep, solution) => {
        const eng = engineRef.current;
        if (!eng || isBusy() || currentStep <= 0) return;
        const newStep = currentStep - 1;
        await doMoveAnimated(eng.scene, eng.cubies, INVERT(solution[newStep]), solveDur());
        set({ step: newStep, mode: 'paused' });
    }, [set, solveDur]);

    /** Jump to first step */
    const firstStep = useCallback((currentStep, solution) => {
        const eng = engineRef.current;
        if (!eng || isBusy()) return;
        let s = currentStep;
        while (s > 0) { s--; doMoveInstant(eng.scene, eng.cubies, INVERT(solution[s])); }
        set({ step: 0, mode: 'ready' });
    }, [set]);

    /** Jump to last step */
    const lastStep = useCallback((currentStep, solution) => {
        const eng = engineRef.current;
        if (!eng || isBusy()) return;
        let s = currentStep;
        while (s < solution.length) { doMoveInstant(eng.scene, eng.cubies, solution[s]); s++; }
        set({ step: solution.length, mode: 'idle' });
    }, [set]);

    /** Jump to a specific step */
    const jumpToStep = useCallback((targetStep, currentStep, solution) => {
        const eng = engineRef.current;
        if (!eng || isBusy()) return;
        let s = currentStep;
        while (s > targetStep) { s--; doMoveInstant(eng.scene, eng.cubies, INVERT(solution[s])); }
        while (s < targetStep) { doMoveInstant(eng.scene, eng.cubies, solution[s]); s++; }
        set({ step: targetStep, mode: targetStep >= solution.length ? 'idle' : 'paused' });
    }, [set]);

    /** Reset to solved cube */
    const reset = useCallback(() => {
        const eng = engineRef.current;
        if (!eng) return;
        eng.createCube();
        dispatch({ type: 'RESET' });
    }, []);

    /** Switch solver method */
    const setMethod = useCallback((method) => {
        set({ solverMethod: method, phases: null });
    }, [set]);

    /** Apply a custom faceMap pattern w/o solving immediately */
    const applyColorState = useCallback(async (faceMap) => {
        const eng = engineRef.current;
        if (!eng) return;

        eng.createCube(faceMap);

        // Reset state, store pattern, let user click Solve
        set({
            playing: false, scramble: [], solution: [], step: 0,
            mode: 'idle', sidePanel: 'Custom pattern applied. Click Solve to begin.',
            sidePanelErr: '', sidePanelSolved: false,
            customPattern: faceMap
        });
    }, [set]);

    const value = {
        state, set, engineRef, speedRef,
        scramble, solve, stopPlaying,
        nextStep, prevStep, firstStep, lastStep, jumpToStep,
        reset, applyColorState, setMethod,
    };

    return <CubeCtx.Provider value={value}>{children}</CubeCtx.Provider>;
}

export function useCubeState() {
    const ctx = useContext(CubeCtx);
    if (!ctx) throw new Error('useCubeState must be inside CubeProvider');
    return ctx;
}
