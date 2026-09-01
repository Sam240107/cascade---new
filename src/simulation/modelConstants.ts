/**
 * Centralized model assumptions for the CASCADE simulation engine.
 *
 * These are *modeling parameters* (engineering assumptions about how the
 * physical world behaves), not derived results. Every scenario-specific
 * output (affected nodes, population impact, disruption score, etc.) is
 * calculated at runtime from these parameters plus the scenario's own data —
 * nothing here is a stand-in for a computed answer.
 */

/** A safety cap on propagation steps so a pathological topology (e.g. a
 * feedback loop of edges) can never spin the simulator into an infinite loop. */
export const MAX_PROPAGATION_STEPS = 200;

/** Reroute aims to bring an overloaded node's load down to this fraction of
 * its failure threshold, leaving a safety margin rather than shaving it down
 * to exactly the boundary. */
export const REROUTE_SAFE_STRESS_RATIO = 0.85;

/** Average time to reset/repair a node that tripped organically (overload or
 * cascade), in hours. */
export const HOURS_TO_RESTORE_FAILED_NODE = 1.5;

/** Average time to manually re-energize a node after a deliberate isolation
 * (switching operations tend to take longer than an automatic reset), in hours. */
export const HOURS_TO_RESTORE_ISOLATED_NODE = 3.0;

/** Default crew dispatch + travel time, in minutes, when a scenario does not
 * specify one. */
export const CREW_ETA_MINUTES_DEFAULT = 24;

/** An independent secondary shock (used for post-fix verification) stresses
 * a randomly chosen surviving node by somewhere between these two fractions
 * of that node's own capacity. */
export const SHOCK_MIN_FRACTION = 0.15;
export const SHOCK_MAX_FRACTION = 0.50;
