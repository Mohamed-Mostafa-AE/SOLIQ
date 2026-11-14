# Conditional crop analyzer

The analyzer compares six crop profiles: spring wheat, barley, grain maize,
grain sorghum, soybean and sunflower. It is a historical-weather scenario tool,
not a forecast of this year's best crop, yield or profit.

## Method and evidence

FAO-56 Table 12 provides starting single-coefficient values. Where the table
gives ranges, this implementation selects an interior or midpoint value and
records the exact numbers in every export. Initial wetting and climate
adjustments have not been applied. Table 12 is not a universally calibrated
crop model. Source: https://www.fao.org/4/x0490e/x0490e0b.htm

Users declare four growth-stage lengths and a planting date within the available
weather year. The coefficient is constant initially, rises linearly during
development, remains constant at mid-season, and declines during the late stage.
These are assumptions about phenology, not observed plant growth.

All candidates share weather, fixed soil-water capacity, starting water and an
annual irrigation budget. Outside the chosen season, the existing baseline's
monthly coefficients remain unchanged. Soil water carries through every day.
The current crop inside the window is explicitly declared by the user; its
reference run uses the same staged method as alternatives.

The fixed-depth bucket drains excess incoming water before ET. Irrigation
refills from below 40% to 70% of capacity when budget remains. A depletion
fraction of 0.5 sets the assumed stress response. Root growth, layered flow,
nutrient turnover, salinity, groundwater, snow and flooded cultivation are not
modeled. Declared unsupported processes block all candidate water simulations.

## Feasibility before preference

Each crop has explicit seed, equipment/labor, market/own-use and local-review
states. Any "no" excludes it from simulation and ordering. Unknown states,
unreviewed soil water or synthetic forcing prevent shortlist membership.
Confirmations are user declarations, not independent certification.

Eligible options are ordered by either modeled annual unmet water demand or
crop-family change followed by that water criterion. A different family is not
proof of breaking a particular pest cycle. Soybean's nitrogen-fixing mechanism
is noted qualitatively; the tool assigns no nitrogen credit.

Three perturbations inspect 25% lower rainfall (bounded by the existing rainfall
setting), and +/-15% crop coefficients inside the seasonal window. Endpoints
are sensitivity results, not confidence intervals or a robustness certificate.
Lower demand or unmet demand does not prove improved yield, income or soil health.

## Verification

Node tests exercise stage boundaries, calendar validity, baseline equality,
constraint gates, unsupported-process blocking and independent integrated water
closure. A separate pinned Playwright job tests English/Arabic workflows,
mobile overflow, actual exclusion behavior, conditional evidence gates and
language/view invariance of scientific exports. Browser tests use an explicitly
synthetic imported fixture and never claim live NASA or agronomic validation.
