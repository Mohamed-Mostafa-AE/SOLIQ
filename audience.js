const guidedViews = new Set(["overview", "rotations", "settings"]);
const researchViews = new Set([
  "overview",
  "outlook",
  "analyzer",
  "rotations",
  "evidence",
  "research",
  "settings",
]);

export function canAccessView(audience, view) {
  return (audience === "research" ? researchViews : guidedViews).has(view);
}

export function resolveViewForAudience(audience, view) {
  return canAccessView(audience, view) ? view : "overview";
}

export function viewsForAudience(audience) {
  return [...(audience === "research" ? researchViews : guidedViews)];
}
