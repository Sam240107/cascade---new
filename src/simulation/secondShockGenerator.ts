/**
 * secondShockGenerator.ts
 * ---------------------------------------------------------------------------
 * Produces the independent "second shock" used by verificationEngine.ts.
 * This is deliberately decoupled from the original risk/sensor seed stream —
 * it uses its own seeded PRNG so the post-fix stress test is a genuinely
 * unrelated event, not a replay of the original overload.
 */

import { SimEnvironment, PropagationResult } from '../types/domain';
import { DeterministicPRNG } from './prng';
import { cloneEnvironment, simulateCascade, round1 } from './propagationEngine';
import { SHOCK_MIN_FRACTION, SHOCK_MAX_FRACTION } from './modelConstants';

export interface IndependentShock {
  targetNodeId: string;
  targetNodeName: string;
  magnitude: number;
  seed: number;
}

/**
 * Picks a random surviving node in `env` and a random magnitude (15%-50% of
 * that node's own capacity) using the given seed. Returns null if every node
 * in the environment has already failed/isolated — there is nothing left to
 * meaningfully shock.
 */
export function generateIndependentShock(env: SimEnvironment, seed: number): IndependentShock | null {
  const rng = new DeterministicPRNG(seed >>> 0);
  const eligible = Object.values(env.nodes).filter((n) => !n.failed && !n.isolated);
  if (eligible.length === 0) return null;

  const target = eligible[rng.nextInt(0, eligible.length - 1)];
  const fraction = SHOCK_MIN_FRACTION + rng.next() * (SHOCK_MAX_FRACTION - SHOCK_MIN_FRACTION);
  const magnitude = round1(target.capacity * fraction);

  return { targetNodeId: target.id, targetNodeName: target.name, magnitude, seed: seed >>> 0 };
}

/** Applies the shock to a clone of `env` and runs the real propagation
 * engine against it, reporting whether the repaired network held. */
export function applyIndependentShock(env: SimEnvironment, shock: IndependentShock): PropagationResult {
  const shocked = cloneEnvironment(env);
  const node = shocked.nodes[shock.targetNodeId];
  if (node) {
    node.currentLoad = Math.max(0, node.currentLoad + shock.magnitude);
  }
  return simulateCascade(shocked, shock.targetNodeId, { forceInitialFailure: false });
}
