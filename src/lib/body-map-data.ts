export type Species = "dog" | "cat" | "horse" | "rabbit" | "other";
export type MapView = "side" | "top";
export type Laterality = "left" | "right";
export type SiteLaterality = Laterality | "midline";

export type BodySite = {
  id: string;
  label: string;
  view: MapView;
  cx: number;
  cy: number;
  /** Side-view laterality. Top-view L/R is already in the id/label. */
  laterality?: SiteLaterality;
  /** Older site ids that should still resolve to this pin (heatmap + labels). */
  aliases?: string[];
};

export const SPECIES_LABELS: Record<Species, string> = {
  dog: "Dog",
  cat: "Cat",
  horse: "Horse",
  rabbit: "Rabbit",
  other: "Other pet",
};

/** Display order for the pet-type picker. */
export const SPECIES_OPTIONS: Species[] = ["dog", "cat", "horse", "rabbit", "other"];

export function speciesLabel(species: string): string {
  return SPECIES_LABELS[species as Species] ?? species;
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const MAP_IMAGES: Record<Species, Record<MapView, string>> = {
  dog: { side: asset("body-map/dog-side.jpg"), top: asset("body-map/dog-top.jpg") },
  cat: { side: asset("body-map/cat-side.jpg"), top: asset("body-map/cat-top.jpg") },
  horse: { side: asset("body-map/horse-side.jpg"), top: asset("body-map/horse-top.jpg") },
  rabbit: { side: asset("body-map/rabbit-side.jpg"), top: asset("body-map/rabbit-top.jpg") },
  other: { side: asset("body-map/other-side.jpg"), top: asset("body-map/other-top.jpg") },
};

/**
 * Artwork is 1248×832 (3:2), matching the map frame, so cx/cy are % of the image.
 * Side silhouettes face left → unflipped view is the animal's RIGHT side.
 * Coordinates audited against the JPGs (2026-09).
 */
function mid(
  species: string,
  view: MapView,
  key: string,
  label: string,
  cx: number,
  cy: number,
  oldId?: string,
): BodySite {
  return {
    id: `${species}-${view}-${key}`,
    label,
    view,
    cx,
    cy,
    laterality: view === "side" ? "midline" : undefined,
    aliases: oldId && oldId !== `${species}-${view}-${key}` ? [oldId] : undefined,
  };
}

function sidePair(
  species: string,
  key: string,
  label: string,
  cx: number,
  cy: number,
): BodySite[] {
  const oldId = `${species}-side-${key}`;
  return [
    {
      id: `${species}-side-right-${key}`,
      label: `Right ${label}`,
      view: "side",
      cx,
      cy,
      laterality: "right",
      aliases: [oldId],
    },
    {
      id: `${species}-side-left-${key}`,
      label: `Left ${label}`,
      view: "side",
      cx,
      cy,
      laterality: "left",
    },
  ];
}

function topPair(
  species: string,
  key: string,
  label: string,
  leftCx: number,
  rightCx: number,
  cy: number,
): BodySite[] {
  return [
    {
      id: `${species}-top-left-${key}`,
      label: `Left ${label}`,
      view: "top",
      cx: leftCx,
      cy,
      laterality: "left",
    },
    {
      id: `${species}-top-right-${key}`,
      label: `Right ${label}`,
      view: "top",
      cx: rightCx,
      cy,
      laterality: "right",
    },
  ];
}

const dogSites: BodySite[] = [
  mid("dog", "side", "scruff", "Scruff / nape", 30, 24),
  mid("dog", "side", "withers", "Withers", 39, 22),
  ...sidePair("dog", "shoulder", "shoulder", 36, 38),
  ...sidePair("dog", "thorax", "thorax", 47, 40),
  ...sidePair("dog", "flank", "flank", 58, 42),
  mid("dog", "side", "loin", "Loin / epaxial", 64, 30, "dog-side-loin"),
  ...sidePair("dog", "hip", "hip", 70, 38),
  ...sidePair("dog", "thigh", "thigh (quad)", 72, 54),
  ...sidePair("dog", "forearm", "forearm", 34, 64),
  mid("dog", "side", "rectum", "Rectum / anus", 78, 46),
  mid("dog", "top", "scruff", "Scruff / nape", 50, 24),
  ...topPair("dog", "shoulder", "shoulder", 43, 57, 32),
  ...topPair("dog", "thorax", "thorax", 44, 56, 44),
  ...topPair("dog", "flank", "flank", 43, 57, 54),
  ...topPair("dog", "hip", "hip", 44, 56, 64),
  mid("dog", "top", "tail-base", "Tail base", 50, 74),
];

const catSites: BodySite[] = [
  mid("cat", "side", "scruff", "Scruff / nape", 28, 26),
  mid("cat", "side", "withers", "Between shoulders", 38, 28, "cat-side-withers"),
  ...sidePair("cat", "shoulder", "shoulder", 36, 40),
  ...sidePair("cat", "thorax", "thorax", 48, 42),
  ...sidePair("cat", "flank", "flank", 60, 44),
  mid("cat", "side", "loin", "Loin / epaxial", 66, 34, "cat-side-loin"),
  ...sidePair("cat", "hip", "hip", 72, 42),
  ...sidePair("cat", "thigh", "hind limb", 74, 56),
  mid("cat", "side", "rectum", "Rectum / anus", 80, 50),
  mid("cat", "top", "scruff", "Scruff / nape", 50, 22),
  ...topPair("cat", "shoulder", "shoulder", 44, 56, 30),
  ...topPair("cat", "flank", "flank", 43, 57, 48),
  ...topPair("cat", "hip", "hip", 44, 56, 60),
  mid("cat", "top", "tail-base", "Tail base", 50, 72),
];

const otherSites: BodySite[] = [
  mid("other", "side", "scruff", "Scruff / nape", 32, 30),
  ...sidePair("other", "shoulder", "shoulder", 38, 42),
  ...sidePair("other", "flank", "flank", 54, 46),
  ...sidePair("other", "hip", "hip / rump", 66, 46),
  ...sidePair("other", "thigh", "hind limb", 64, 62),
  mid("other", "side", "rectum", "Rectum / anus", 76, 54),
  mid("other", "top", "scruff", "Scruff / nape", 50, 26),
  ...topPair("other", "shoulder", "shoulder", 43, 57, 34),
  ...topPair("other", "flank", "flank", 42, 58, 50),
  mid("other", "top", "rump", "Rump", 50, 70),
];

const horseSites: BodySite[] = [
  ...sidePair("horse", "neck", "neck / cervical", 26, 32),
  mid("horse", "side", "withers", "Withers", 36, 24),
  ...sidePair("horse", "shoulder", "shoulder", 36, 40),
  ...sidePair("horse", "pectoral", "pectoral / chest", 30, 50),
  ...sidePair("horse", "thorax", "thorax", 50, 40),
  ...sidePair("horse", "flank", "flank", 62, 42),
  mid("horse", "side", "loin", "Loin / epaxial", 68, 28, "horse-side-loin"),
  ...sidePair("horse", "hip", "hip / gluteal", 74, 36),
  ...sidePair("horse", "thigh", "thigh / hamstring", 76, 54),
  mid("horse", "side", "rectum", "Rectum / anus", 82, 46),
  mid("horse", "top", "poll", "Poll / nape", 50, 14),
  ...topPair("horse", "neck", "neck", 46, 54, 24),
  ...topPair("horse", "shoulder", "shoulder", 40, 60, 34),
  ...topPair("horse", "thorax", "thorax", 42, 58, 46),
  ...topPair("horse", "flank", "flank", 42, 58, 56),
  ...topPair("horse", "hip", "hip", 43, 57, 66),
  mid("horse", "top", "tail-base", "Tail base", 50, 76),
];

const rabbitSites: BodySite[] = [
  mid("rabbit", "side", "scruff", "Scruff / nape", 32, 28),
  ...sidePair("rabbit", "shoulder", "shoulder", 38, 42),
  ...sidePair("rabbit", "thorax", "thorax", 48, 46),
  ...sidePair("rabbit", "flank", "flank", 56, 48),
  mid("rabbit", "side", "loin", "Loin / epaxial", 60, 34, "rabbit-side-loin"),
  ...sidePair("rabbit", "hip", "hip / haunch", 66, 44),
  ...sidePair("rabbit", "thigh", "hind limb", 64, 60),
  mid("rabbit", "side", "rectum", "Rectum / anus", 74, 54),
  mid("rabbit", "top", "scruff", "Scruff / nape", 50, 22),
  ...topPair("rabbit", "shoulder", "shoulder", 42, 58, 34),
  ...topPair("rabbit", "flank", "flank", 42, 58, 50),
  ...topPair("rabbit", "hip", "hip", 43, 57, 64),
  mid("rabbit", "top", "rump", "Rump / tail", 50, 74),
];

export const SPECIES_SITES: Record<Species, BodySite[]> = {
  dog: dogSites,
  cat: catSites,
  horse: horseSites,
  rabbit: rabbitSites,
  other: otherSites,
};

export const bodySites: BodySite[] = [
  ...dogSites,
  ...catSites,
  ...horseSites,
  ...rabbitSites,
  ...otherSites,
];

export function sitesFor(
  species: Species,
  view: MapView,
  laterality: Laterality = "right",
): BodySite[] {
  return SPECIES_SITES[species].filter((s) => {
    if (s.view !== view) return false;
    if (view === "top") return true;
    return !s.laterality || s.laterality === "midline" || s.laterality === laterality;
  });
}

export function siteById(siteId: string): BodySite | undefined {
  return bodySites.find((s) => s.id === siteId || s.aliases?.includes(siteId));
}

export function siteLabel(siteId: string): string {
  return siteById(siteId)?.label ?? siteId.replace(/-/g, " ");
}

export function siteIdMatches(pinId: string, logSiteId: string): boolean {
  if (pinId === logSiteId) return true;
  const pin = siteById(pinId);
  const log = siteById(logSiteId);
  if (!pin || !log) return false;
  return pin.id === log.id;
}

export function displaySiteX(cx: number, laterality: Laterality): number {
  return laterality === "left" ? 100 - cx : cx;
}
