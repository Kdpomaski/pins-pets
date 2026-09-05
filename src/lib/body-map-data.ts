export type Species = "dog" | "cat" | "horse" | "rabbit" | "other";
export type MapView = "side" | "top";

export type BodySite = {
  id: string;
  label: string;
  view: MapView;
  cx: number;
  cy: number;
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

const dogSites: BodySite[] = [
  { id: "dog-side-scruff", label: "Scruff / nape", view: "side", cx: 33, cy: 28 },
  { id: "dog-side-withers", label: "Withers", view: "side", cx: 41, cy: 26 },
  { id: "dog-side-shoulder", label: "Shoulder", view: "side", cx: 38, cy: 38 },
  { id: "dog-side-thorax", label: "Lateral thorax", view: "side", cx: 50, cy: 40 },
  { id: "dog-side-flank", label: "Flank", view: "side", cx: 60, cy: 42 },
  { id: "dog-side-loin", label: "Loin / epaxial", view: "side", cx: 66, cy: 34 },
  { id: "dog-side-hip", label: "Hip", view: "side", cx: 72, cy: 40 },
  { id: "dog-side-thigh", label: "Thigh (quad)", view: "side", cx: 74, cy: 52 },
  { id: "dog-side-forearm", label: "Forearm", view: "side", cx: 32, cy: 58 },
  { id: "dog-top-scruff", label: "Scruff / nape", view: "top", cx: 50, cy: 22 },
  { id: "dog-top-left-shoulder", label: "Left shoulder", view: "top", cx: 38, cy: 32 },
  { id: "dog-top-right-shoulder", label: "Right shoulder", view: "top", cx: 62, cy: 32 },
  { id: "dog-top-left-thorax", label: "Left thorax", view: "top", cx: 42, cy: 42 },
  { id: "dog-top-right-thorax", label: "Right thorax", view: "top", cx: 58, cy: 42 },
  { id: "dog-top-left-flank", label: "Left flank", view: "top", cx: 40, cy: 54 },
  { id: "dog-top-right-flank", label: "Right flank", view: "top", cx: 60, cy: 54 },
  { id: "dog-top-left-hip", label: "Left hip", view: "top", cx: 40, cy: 64 },
  { id: "dog-top-right-hip", label: "Right hip", view: "top", cx: 60, cy: 64 },
  { id: "dog-top-tail-base", label: "Tail base", view: "top", cx: 50, cy: 72 },
];

const catSites: BodySite[] = [
  { id: "cat-side-scruff", label: "Scruff / nape", view: "side", cx: 32, cy: 30 },
  { id: "cat-side-withers", label: "Between shoulders", view: "side", cx: 40, cy: 32 },
  { id: "cat-side-shoulder", label: "Shoulder", view: "side", cx: 38, cy: 42 },
  { id: "cat-side-thorax", label: "Lateral thorax", view: "side", cx: 50, cy: 42 },
  { id: "cat-side-flank", label: "Flank", view: "side", cx: 62, cy: 44 },
  { id: "cat-side-loin", label: "Loin / epaxial", view: "side", cx: 68, cy: 38 },
  { id: "cat-side-hip", label: "Hip", view: "side", cx: 74, cy: 44 },
  { id: "cat-side-thigh", label: "Hind limb", view: "side", cx: 76, cy: 56 },
  { id: "cat-top-scruff", label: "Scruff / nape", view: "top", cx: 50, cy: 20 },
  { id: "cat-top-left-shoulder", label: "Left shoulder", view: "top", cx: 40, cy: 30 },
  { id: "cat-top-right-shoulder", label: "Right shoulder", view: "top", cx: 60, cy: 30 },
  { id: "cat-top-left-flank", label: "Left flank", view: "top", cx: 40, cy: 48 },
  { id: "cat-top-right-flank", label: "Right flank", view: "top", cx: 60, cy: 48 },
  { id: "cat-top-left-hip", label: "Left hip", view: "top", cx: 40, cy: 60 },
  { id: "cat-top-right-hip", label: "Right hip", view: "top", cx: 60, cy: 60 },
  { id: "cat-top-tail-base", label: "Tail base", view: "top", cx: 50, cy: 70 },
];

const otherSites: BodySite[] = [
  { id: "other-side-scruff", label: "Scruff / nape", view: "side", cx: 34, cy: 32 },
  { id: "other-side-shoulder", label: "Shoulder", view: "side", cx: 40, cy: 42 },
  { id: "other-side-flank", label: "Flank", view: "side", cx: 58, cy: 46 },
  { id: "other-side-hip", label: "Hip / rump", view: "side", cx: 72, cy: 48 },
  { id: "other-side-thigh", label: "Hind limb", view: "side", cx: 70, cy: 62 },
  { id: "other-top-scruff", label: "Scruff / nape", view: "top", cx: 50, cy: 28 },
  { id: "other-top-left-shoulder", label: "Left shoulder", view: "top", cx: 42, cy: 36 },
  { id: "other-top-right-shoulder", label: "Right shoulder", view: "top", cx: 58, cy: 36 },
  { id: "other-top-left-flank", label: "Left flank", view: "top", cx: 40, cy: 52 },
  { id: "other-top-right-flank", label: "Right flank", view: "top", cx: 60, cy: 52 },
  { id: "other-top-rump", label: "Rump", view: "top", cx: 50, cy: 68 },
];

const horseSites: BodySite[] = [
  { id: "horse-side-neck", label: "Neck / cervical", view: "side", cx: 28, cy: 34 },
  { id: "horse-side-withers", label: "Withers", view: "side", cx: 40, cy: 26 },
  { id: "horse-side-shoulder", label: "Shoulder", view: "side", cx: 38, cy: 40 },
  { id: "horse-side-pectoral", label: "Pectoral / chest", view: "side", cx: 32, cy: 54 },
  { id: "horse-side-thorax", label: "Lateral thorax", view: "side", cx: 52, cy: 42 },
  { id: "horse-side-flank", label: "Flank", view: "side", cx: 64, cy: 44 },
  { id: "horse-side-loin", label: "Loin / epaxial", view: "side", cx: 70, cy: 32 },
  { id: "horse-side-hip", label: "Hip / gluteal", view: "side", cx: 78, cy: 40 },
  { id: "horse-side-thigh", label: "Thigh / hamstring", view: "side", cx: 80, cy: 56 },
  { id: "horse-side-rectum", label: "Rectum / anus", view: "side", cx: 86, cy: 48 },
  { id: "horse-top-poll", label: "Poll / nape", view: "top", cx: 50, cy: 16 },
  { id: "horse-top-left-neck", label: "Left neck", view: "top", cx: 42, cy: 26 },
  { id: "horse-top-right-neck", label: "Right neck", view: "top", cx: 58, cy: 26 },
  { id: "horse-top-left-shoulder", label: "Left shoulder", view: "top", cx: 36, cy: 36 },
  { id: "horse-top-right-shoulder", label: "Right shoulder", view: "top", cx: 64, cy: 36 },
  { id: "horse-top-left-thorax", label: "Left thorax", view: "top", cx: 38, cy: 48 },
  { id: "horse-top-right-thorax", label: "Right thorax", view: "top", cx: 62, cy: 48 },
  { id: "horse-top-left-flank", label: "Left flank", view: "top", cx: 38, cy: 58 },
  { id: "horse-top-right-flank", label: "Right flank", view: "top", cx: 62, cy: 58 },
  { id: "horse-top-left-hip", label: "Left hip", view: "top", cx: 40, cy: 70 },
  { id: "horse-top-right-hip", label: "Right hip", view: "top", cx: 60, cy: 70 },
  { id: "horse-top-tail-base", label: "Tail base", view: "top", cx: 50, cy: 80 },
];

const rabbitSites: BodySite[] = [
  { id: "rabbit-side-scruff", label: "Scruff / nape", view: "side", cx: 36, cy: 30 },
  { id: "rabbit-side-shoulder", label: "Shoulder", view: "side", cx: 40, cy: 42 },
  { id: "rabbit-side-thorax", label: "Lateral thorax", view: "side", cx: 50, cy: 44 },
  { id: "rabbit-side-flank", label: "Flank", view: "side", cx: 60, cy: 46 },
  { id: "rabbit-side-loin", label: "Loin / epaxial", view: "side", cx: 66, cy: 36 },
  { id: "rabbit-side-hip", label: "Hip / haunch", view: "side", cx: 74, cy: 46 },
  { id: "rabbit-side-thigh", label: "Hind limb", view: "side", cx: 72, cy: 60 },
  { id: "rabbit-side-rectum", label: "Rectum / anus", view: "side", cx: 82, cy: 52 },
  { id: "rabbit-top-scruff", label: "Scruff / nape", view: "top", cx: 50, cy: 22 },
  { id: "rabbit-top-left-shoulder", label: "Left shoulder", view: "top", cx: 38, cy: 34 },
  { id: "rabbit-top-right-shoulder", label: "Right shoulder", view: "top", cx: 62, cy: 34 },
  { id: "rabbit-top-left-flank", label: "Left flank", view: "top", cx: 38, cy: 50 },
  { id: "rabbit-top-right-flank", label: "Right flank", view: "top", cx: 62, cy: 50 },
  { id: "rabbit-top-left-hip", label: "Left hip", view: "top", cx: 40, cy: 64 },
  { id: "rabbit-top-right-hip", label: "Right hip", view: "top", cx: 60, cy: 64 },
  { id: "rabbit-top-rump", label: "Rump / tail", view: "top", cx: 50, cy: 74 },
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

export function sitesFor(species: Species, view: MapView): BodySite[] {
  return SPECIES_SITES[species].filter((s) => s.view === view);
}

export function siteLabel(siteId: string): string {
  return bodySites.find((s) => s.id === siteId)?.label ?? siteId.replace(/-/g, " ");
}

export function siteById(siteId: string): BodySite | undefined {
  return bodySites.find((s) => s.id === siteId);
}
