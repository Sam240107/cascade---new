# Real-World Case Study Layer

Feeds real-world documented incidents/operational contexts into CASCADE's
**existing, unmodified** propagation / intervention / recommendation /
verification engine. Nothing in `src/simulation/**` was changed to build
this layer.

## What is real, what is modelled, what CASCADE calculates

Every value carried by a `CaseStudy` (see `types.ts`) is tagged with exactly
one of four classifications:

| Classification | Meaning | Where it lives |
|---|---|---|
| **VERIFIED** | This session directly fetched and read the cited source's own content, and confirmed it supports the statement | `caseStudy.verifiedFacts` entries whose cited `evidence[].verificationMethod === 'direct-read'` |
| **UNCONFIRMED_SECONDARY_EXTRACTION** | The cited document could not be directly rendered this session (fetch/TLS failure, unreadable scanned PDF, etc.); the statement rests on a search engine's own snippet synthesis of that document instead — never treat this as independently confirmed | `caseStudy.verifiedFacts` entries whose cited `evidence[].verificationMethod === 'secondary-extraction'` |
| **MODELLED** | Reconstructed for this demonstration because the facility's real, private topology/measurements are not publicly available | `caseStudy.network` (nodes/edges/capacities/loads), `caseStudy.modeledAssumptions`, `caseStudy.initiatingContingency` |
| **DERIVED** | Calculated by CASCADE's engine from the modelled network — never a measured or historical value | Everything under `runCaseStudy(...).cascadeCounterfactual` (baseline, interventions, recommendation, verification) |

`CaseStudyRunResult` keeps these sections physically separate
(`realIncidentContext` / `modelledNetwork` / `cascadeCounterfactual`).
`realIncidentContext.classification` is **computed**, not hardcoded: it is
`'VERIFIED'` only if every one of the case's `verifiedFacts` is itself
VERIFIED; if even one rests on secondary extraction, the whole section is
labeled `'UNCONFIRMED_SECONDARY_EXTRACTION'` so a weak citation can never be
silently upgraded by sitting next to strong ones.

**CASCADE did not predict, cause, or prevent any of these real incidents.**
The historical incident is validation context for why the case is
interesting; CASCADE's counterfactual is a brand-new calculation run over a
representative network, computed the same way for a historical case as for
any hypothetical scenario.

## Why there's no synthetic "live" sensor data

The existing `SensorGenerator` intentionally injects noise/dropout to
emulate live telemetry. Doing that for a documented historical case would
misrepresent modelled ground truth as fake "live" readings, so
`caseStudyRunner.ts` never calls it. Instead — exactly like
`computeBaselineCascade()` already does for ordinary scenarios — case
studies run interventions and verification directly against ground truth via
`InterventionEngine.simulateActionWithEnvironment(action, scenario)` and
`VerificationEngine.runVerification(..., testRunsCount)`, both called
**without** an `observation` argument (an optional parameter added for
exactly this purpose; see `src/simulation/interventionEngine.ts` and
`verificationEngine.ts`).

## How a case flows through the existing engine

```
real case
    v
documented contingency        (caseStudy.initiatingContingency)
    v
representative network        (caseStudy.network — a plain Scenario)
    v
buildEnvironmentFromScenario / computeBaselineCascade   <- existing, unchanged
    v
InterventionEngine.getCandidateActions / simulateActionWithEnvironment  <- existing, unchanged
    v
RecommendationEngine.evaluate                            <- existing, unchanged
    v
VerificationEngine.runVerification                       <- existing, unchanged
    v
counterfactual result (DERIVED)
```

`caseStudy.network` is deliberately just a `Scenario` — the same type every
other CASCADE scenario uses — so `buildEnvironmentFromScenario()` turns it
into the same `SimEnvironment` of `SimNode`/`SimEdge` the propagation engine
always operates on. No propagation, intervention, recommendation, or
verification logic is reimplemented anywhere in this directory.

## Files

- `types.ts` — `CaseStudy`, `EvidenceSource`, `ClassifiedStatement`, `DataClassification`, extensible `CaseStudyDomain`.
- `registry.ts` — `getCaseStudies()`, `getCaseStudy(id)`.
- `caseStudyRunner.ts` — `runCaseStudy(caseStudy)`, the adapter into the existing engine.
- `tamilNaduGrid.ts`, `chennaiHospital.ts`, `dataCenterUPS.ts` — the three case studies.
- `__tests__/caseStudies.test.ts` — loading, domain validity, evidence, VERIFIED/MODELLED separation, valid environment, non-mutation, no fake sensor data, DERIVED counterfactual labeling.
- `acceptanceTest.ts` — `npm run case-study-acceptance`; prints all three cases end-to-end.

## Reroute-realism fix (Phase 1.1)

An earlier version of all three networks gave downstream/backup nodes
implausibly generous spare capacity relative to what the reroute
intervention ever needs to shed, making "Reroute: 0 disruption, 100%
containment" the outcome in all three cases — genuinely computed, but
uniform enough to look suspicious. Tamil Nadu and the data-center case were
retuned (tighter, better-sourced capacity/threshold assumptions — see each
file's `modeledAssumptions`) so reroute now shows real, differentiated
outcomes: Tamil Nadu's corridor is modeled closer to its reported practical
loading ceiling (still fully contained by reroute, but on a realistic
margin); the data center's backup UPS is sized for partial, not full, load
transfer, so reroute alone no longer fully contains the cascade there and
Isolate is recommended instead. The hospital case was deliberately left
unchanged — its "separate protected line held" outcome is the verified
historical result, and shrinking it to force a partial failure would
contradict the cited source.

## Adding a new domain or case

Domains are not hard-coded to the three shipped here: `CaseStudyDomain` in
`types.ts` accepts any string. To add e.g. `MICROGRID`, just author a new
`CaseStudy` object with `domain: 'MICROGRID'` and register it in
`registry.ts` — no type or engine change required.

## Known limitation (Tamil Nadu sourcing)

Every SRPC (Southern Regional Power Committee) PDF tried for the Tamil Nadu
case (`srpc.kar.nic.in`, multiple documents, multiple attempts) failed to
render directly in this session — a TLS certificate error on that host. All
four of that case's `verifiedFacts` are therefore classified
`UNCONFIRMED_SECONDARY_EXTRACTION`, not `VERIFIED` — this is enforced in the
case-study data itself (`tamilNaduGrid.ts`), not only documented here, and
`runCaseStudy(...).realIncidentContext.classification` reflects it
automatically. A second document (`58SRPCAGUpload.pdf`, on `srpc.gov.in`) WAS
directly read and did not, in fact, contain the SPS/PGCIL–TANTRANSCO content
it was previously (incorrectly) cited for — that citation has been removed.
Before presenting the Tamil Nadu figures (1450 MW corridor loading; 750 MW /
3900 MW curtailment events; SPS proposal) as confirmed fact, independently
read the linked OCC-231 documents directly.
