/**
 * Case-study registry.
 * ---------------------------------------------------------------------------
 * Central place new case studies are registered. Adding a new domain (e.g.
 * MICROGRID) or a new case is purely additive here — push another CaseStudy
 * object into `CASE_STUDIES`; no other file in this layer needs to change.
 */

import { CaseStudy } from './types';
import { tamilNaduPowerGridCase } from './tamilNaduGrid';
import { chennaiHospitalCase } from './chennaiHospital';
import { dataCenterUpsCase } from './dataCenterUPS';

export const CASE_STUDIES: CaseStudy[] = [tamilNaduPowerGridCase, chennaiHospitalCase, dataCenterUpsCase];

/** Returns all registered case studies. */
export function getCaseStudies(): CaseStudy[] {
  return CASE_STUDIES;
}

/** Returns a single case study by id, or undefined if not registered. */
export function getCaseStudy(id: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.id === id);
}
