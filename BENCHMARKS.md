# Soliq benchmark protocol

Run `npm test` and `npm run benchmark`. The GitHub workflow runs the same commands
on each push and pull request and can also be started manually. It uploads JSON,
CSV and Markdown outputs and adds a readable summary to the Actions run.

## What this establishes

The deterministic matrix includes 81 configurations: 3 latitudes, 3 soil-water
capacities, 3 irrigation budgets and 3 rainfall multipliers. Each runs the same
three strategies for the 366-day synthetic year, producing 88,938 daily records.
Assertions check daily and independently integrated conservation, storage bounds,
irrigation limits, repeated-run equality, strategy-order invariance and zero-water
behavior. A failure exits nonzero; do not report a partial run as passing.

Calculation timing uses 5 warmups and 30 repeats. Report median and p95 together
with Node version, CPU, OS, source hash and commit. Do not compare timings across
different hardware or count network/UI work as included.

## What remains scientific work

Public NASA data ingestion checks are separate from independent model validation.
Before claiming better rotation decisions, select pilot sites and evaluation rules,
retrieve traceable NASA observations and local soil/crop data, obtain independent
matching observations, define the outcome, and compare fair baselines on blocked
temporal/geographic holdouts. Include failures and unsupported cases. Yield,
profit, carbon and measured water savings are currently unvalidated.

## Development and judges' repositories

Development target: https://github.com/Mohamed-Mostafa-AE/SOLIQ (private at inspection).
Use normal additive commits and retain test failures as part of development history.
Do not force-push or erase runs to improve appearances. An eventual judges' release
should identify the source commit/tag, include the protocol and representative
artifacts, show successful GitHub Actions runs, and state unresolved limitations.

The final repository should receive a reviewed snapshot when it is ready. Keep
the development repository and research provenance available; a new release
repository is not evidence of an absence of development failures.
