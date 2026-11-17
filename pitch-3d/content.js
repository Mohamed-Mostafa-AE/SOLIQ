export const LINKS={
  "app": "https://soliq-delta.vercel.app/",
  "ai": "https://soliq-delta.vercel.app/adviser/?lat=31.083333333333332&lon=30.933333333333334",
  "benchmark": "https://soliq-delta.vercel.app/benchmarks/egypt-sakha/",
  "paper": "https://soliq-delta.vercel.app/welcome/paper.html",
  "github": "https://github.com/Mohamed-Mostafa-AE/SOLIQ"
};
export const slides=[
  {
    "label": "01 / THE IDEA",
    "title": "The next crop.\nA clearer choice.",
    "lead": "NASA weather. Local knowledge.\nRotation decisions you can explain.",
    "kind": "hero",
    "scene": "mixed",
    "notes": "A rotation decision affects the whole farm: its water, soil, next planting window and market. Soil-IQ helps farmers explore three crop calendars under the same assumptions, while keeping the evidence and missing information visible. The field is a concept illustration, not a satellite image or a prediction of plant growth."
  },
  {
    "label": "02 / THE CHALLENGE",
    "title": "One rotation.\nSeveral competing needs.",
    "lead": "Farmers need to weigh the whole season.",
    "kind": "problem",
    "scene": "dry",
    "items": [
      [
        "Water",
        "Does the calendar fit the available supply?"
      ],
      [
        "Soil",
        "Where could protective cover help?"
      ],
      [
        "Timing",
        "Do crops fit the local growing window?"
      ],
      [
        "Feasibility",
        "Are seed, equipment and markets available?"
      ]
    ],
    "notes": "The challenge is choosing a feasible rotation as weather and water conditions change. A cover crop can protect soil, but it also uses water. A crop-family change needs local species and pest review. These trade-offs motivate a comparison tool grounded in the farmer’s situation. We do not infer field soil health from a satellite pixel."
  },
  {
    "label": "03 / THE SOLUTION",
    "title": "Compare the season\nbefore changing the field.",
    "lead": "Current calendar + two alternatives.\nOne shared weather and water context.",
    "kind": "compare",
    "scene": "mixed",
    "items": [
      [
        "01",
        "Current calendar",
        "Keep the farmer’s baseline visible."
      ],
      [
        "02",
        "Alternative 1",
        "Explore a different crop family or cover window."
      ],
      [
        "03",
        "Alternative 2",
        "Compare another seasonal demand pattern."
      ]
    ],
    "notes": "The farmer edits three monthly crop calendars, provides soil-water information, water availability and practical constraints, and chooses a priority. We compare modeled storage and unmet water demand under shared weather. Unknown feasibility prevents a preferred-crop recommendation; an explicit refusal excludes an option from preference ordering. The displayed field changes are illustrative, not measured growth."
  },
  {
    "label": "04 / THE EVIDENCE",
    "title": "Every result has\na source—and a limit.",
    "lead": "Keep observations, assumptions\nand scenarios visible.",
    "kind": "evidence",
    "scene": "layers",
    "items": [
      [
        "NASA POWER",
        "Daily gridded temperature and rainfall; dated coverage and raw requests."
      ],
      [
        "Local context",
        "Soil source, hydraulic properties, irrigation and crop calendars are declared inputs."
      ],
      [
        "Transparent calculation",
        "Daily water accounting, historical weather scenarios and reproducible exports."
      ]
    ],
    "notes": "NASA POWER is the live environmental adapter in this build. Its regional meteorology is not a field sensor. A simple single-layer water bucket uses declared capacity and crop coefficients; it does not model yield, profit, soil carbon, nutrient credits, salinity or groundwater. Other Earth-observation adapters and multi-year crop transitions remain future work. Present the paper as a methods draft."
  },
  {
    "label": "05 / TWO EXPERIENCES",
    "title": "The data.\nThe people.",
    "lead": "A science workspace and a playable Delta story.\nAn evidence adviser explains the limits.",
    "kind": "ai",
    "scene": "documents",
    "items": [
      ["THE SEVENTH FIELD", "Walk through a fictional Egyptian village, meet its farmers and test irrigation decisions in 3D."],
      ["THE FIELD WORKSPACE", "Compare crop calendars with dated NASA POWER weather and clearly declared local assumptions."],
      ["THE EVIDENCE ADVISER", "On-device retrieval from six reviewed passages. It cannot validate a farm or predict crop yields."]
    ],
    "stat": "5 / 5",
    "statLabel": "preset retrieval checks found their expected source in the top three",
    "notes": "Two experiences share an evidence-first mission: a practical rotation comparison and The Seventh Field, a fictional 3D Delta village with chapters and water-sharing choices. The story does not use actual field measurements and does not change the scientific model. In the optional evidence adviser, all-MiniLM-L6-v2 ranks six reviewed source passages. Five predefined English queries found their expected source in the top three. That is not verified agronomic accuracy, and real-world NASA pixel processing remains limited. Show both live routes and invite the judges to inspect limitations."
  },
  {
    "label": "06 / THE EGYPT BENCHMARK",
    "title": "Real data.\nA real Egyptian context.",
    "lead": "Sakha, Kafr El Sheikh · Nile Delta\nNASA weather: 1 Jan–12 Nov 2026",
    "kind": "benchmark",
    "scene": "mixed",
    "items": [
      [
        "316",
        "valid daily records"
      ],
      [
        "48.14 mm",
        "accumulated rainfall"
      ],
      [
        "112",
        "days with maximum temperature ≥35°C"
      ]
    ],
    "notes": "We chose an approximate Sakha study-area point, 31 degrees 5 minutes north and 30 degrees 56 minutes east, documented in a published wheat study. This is not a surveyed farm boundary or a claim of collaboration with Sakha. Fresh NASA responses were checked by a separate parser, retained with hashes and compared against the app. All 15 full-year strategy/member runs passed water accounting and bounds checks. The three calendars and soil parameters are illustrative assumptions. No independent 2026 station or farm outcomes were available. Source: doi:10.3389/fpls.2023.1165113 and Soil-IQ benchmark snapshot, 15 November 2026.\n\nForecast benchmark: Four retrospective chronological holdouts used target years 2022–2025 with only earlier years for training. The target was remaining-year rainfall after the November 12 cutoff. Analog rainfall MAE was 20.32 mm versus 15.29 mm for climatology, so no forecasting advantage was demonstrated. Both methods had zero heat-day error in a late-year period with no target days reaching 35 degrees C; that is a trivial result, not evidence of heat prediction skill. Numerical closure validates bookkeeping; field performance still needs independent measurements."
  },
  {
    "label": "07 / THE NEXT STEP",
    "title": "See the trade-offs.\nShape the next field.",
    "lead": "Try the NASA demo. Play the water turn.\nThen question every assumption.",
    "kind": "close",
    "scene": "mixed",
    "items": [
      [
        "Validate",
        "Independent weather, soil and irrigation measurements."
      ],
      [
        "Review",
        "Local crop calendars and agronomist / farmer feedback."
      ],
      [
        "Extend",
        "Multi-year rotations and justified satellite vegetation layers."
      ]
    ],
    "notes": "Soil-IQ is a supportive decision tool. The next work is independent validation with local crop, soil and irrigation evidence, farmer usability review, and evaluation across locations and years. Our authors are Mohamed Mostafa, Youssef Mohamed, Aya Abdelnabi and Mohamed Abdelrahman. We are a NASA Space Apps 6 October project team. Badr University in Cairo is the event venue; we do not claim institutional affiliation or endorsement. The research paper remains a methods draft. Invite questions and demonstrate the zero-input NASA walkthrough plus the original 3D mission. Both show their own uncertainty boundaries."
  }
];
