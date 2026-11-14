# Shared analysis, two levels of detail

Soliq now starts in a guided view. A farmer can compare the current monthly plan
with either alternative, select a month, inspect the planned crop change and
understand modeled water demand in plain language. The drawings represent crop
identity in a plan; they do not predict growth stage, biomass, yield or appearance.

Research view retains methods, physical metrics, source records, model diagnostics,
sensitivity and reproducibility exports. Both views use the same result object;
changing language or presentation does not change scientific inputs or calculations.

The Arabic interface uses an explicit translation catalogue, Arabic labels and
right-to-left layouts. Standard identifiers such as NASA POWER, CSV, UTC, Kc and
machine-readable exported fields stay unchanged. User-entered field names are
preserved. Arabic terminology and layout still need native-speaker/user review
before a farmer-facing deployment; automated language checks are not usability studies.

## Accuracy boundaries

100% agricultural accuracy cannot be promised. Input validation and arithmetic
correctness are different from observed farm accuracy. The current model remains
an exploratory constant-coefficient water bucket. It is not a complete crop model,
and no independent agricultural outcome evaluation has been completed.

Additional guards reject incompatible declared POWER units, non-UTC POWER files,
duplicate or empty strategy IDs, inherited prototype keys as crops, and nonfinite
or out-of-range crop coefficients. Existing checks reject incomplete dates, weather
sentinels, reversed temperature bounds and invalid soil/management parameters.
POWER metadata-free inputs remain unverified for units/time standard; provenance
and local review are still required. CSV values retain user-declared units.

When a newer weather import or field context supersedes an in-flight request, the
older request cannot replace the current forcing. A failed retrieval retains the
previous visibly labeled data. UI preferences never change model parameters.

## Before stronger claims

Use a locally reviewed crop calendar and growth-stage coefficients; test source
coverage and independent matching field observations; report error distributions
and failure cases by region; test user comprehension in both languages. Numerical
benchmarks alone do not prove soil-carbon gains, yield improvements or water savings.
