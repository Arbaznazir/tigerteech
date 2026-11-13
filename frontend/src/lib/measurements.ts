export type MeasGender = "male" | "female";
export type MeasUnit = "cm" | "in";

export type MeasField = {
  key: string;
  label: string;
  hint: string;
};

export type MeasurementSet = {
  id: string;
  name: string;
  gender: MeasGender;
  unit: MeasUnit;
  top: Record<string, string>;
  bottom: Record<string, string>;
  notes: string;
  updatedAt: string;
};

export const MALE_SHIRT_FIELDS: MeasField[] = [
  { key: "neck", label: "Neck", hint: "Around the base of the neck where the collar sits" },
  { key: "shoulders", label: "Shoulders", hint: "Edge to edge across the back" },
  { key: "chest", label: "Chest", hint: "Around the fullest part, under the arms" },
  { key: "sleeveLength", label: "Sleeve Length", hint: "Shoulder seam down to the wrist bone" },
  { key: "halfSleeveLength", label: "Half Sleeve Length", hint: "Shoulder seam to mid-upper arm" },
  { key: "bicep", label: "Bicep", hint: "Around the fullest part of the upper arm" },
  { key: "stomachWaist", label: "Stomach / Waist", hint: "Around the natural waistline" },
  { key: "hip", label: "Hip", hint: "Around the fullest part of the hips" },
];

export const MALE_TROUSER_FIELDS: MeasField[] = [
  { key: "waist", label: "Waist", hint: "Around the natural waistline (narrowest part)" },
  { key: "hip", label: "Hip", hint: "Around the fullest part of hips / buttocks" },
  { key: "thighRound", label: "Thigh Round", hint: "Around the fullest part of the thigh" },
  { key: "fullRise", label: "Full Rise", hint: "Front waist through crotch up to back waist" },
  { key: "trouserLength", label: "Trouser Length", hint: "Crotch down inside leg to desired length" },
  { key: "bottomHem", label: "Bottom Hem", hint: "Around the bottom opening" },
];

export const FEMALE_TOP_FIELDS: MeasField[] = [
  { key: "neck", label: "Neck", hint: "Around the base of the neck" },
  { key: "shoulderToApex", label: "Shoulder to Apex", hint: "Highest point of shoulder to apex" },
  { key: "bust", label: "Bust", hint: "Around the fullest part of the bust" },
  { key: "stomach", label: "Stomach", hint: "Around the fullest part of the stomach" },
  { key: "shoulder", label: "Shoulder", hint: "Base of neck to end of shoulder" },
  { key: "hip", label: "Hip", hint: "Around the fullest part of the hip" },
  { key: "sleeveLength", label: "Sleeve Length", hint: "Shoulder tip to the wrist bone" },
  { key: "wrist", label: "Wrist", hint: "Around the wrist" },
];

export const FEMALE_PANT_FIELDS: MeasField[] = [
  { key: "waist", label: "Waist", hint: "Around the natural waistline" },
  { key: "hip", label: "Hip", hint: "Around the fullest part of the hip" },
  { key: "trouserLength", label: "Trouser Length", hint: "Waistline to desired hem length" },
  { key: "kneeRound", label: "Knee Round", hint: "Around the knee" },
  { key: "thighRound", label: "Thigh Round", hint: "Around the fullest part of the thigh" },
  { key: "calfRound", label: "Calf Round", hint: "Around the widest part of the calf" },
  { key: "trouserHem", label: "Trouser Hem", hint: "Around the bottom opening" },
  { key: "fullRise", label: "Full Rise", hint: "Front waist between legs up to back waist" },
];

export const GUIDE_IMAGES = {
  maleTop: "/images/measurements/shirt-men.png",
  maleBottom: "/images/measurements/trousers-men.png",
  femaleTop: "/images/measurements/top-women.png",
  femaleBottom: "/images/measurements/pant-women.png",
} as const;

export function emptyValues(fields: MeasField[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of fields) out[f.key] = "";
  return out;
}

export function topFieldsFor(gender: MeasGender): MeasField[] {
  return gender === "female" ? FEMALE_TOP_FIELDS : MALE_SHIRT_FIELDS;
}

export function bottomFieldsFor(gender: MeasGender): MeasField[] {
  return gender === "female" ? FEMALE_PANT_FIELDS : MALE_TROUSER_FIELDS;
}

export function createBlankSet(
  name: string,
  gender: MeasGender,
  unit: MeasUnit
): MeasurementSet {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `m-${Date.now()}`,
    name: name.trim() || "My measurements",
    gender,
    unit,
    top: emptyValues(topFieldsFor(gender)),
    bottom: emptyValues(bottomFieldsFor(gender)),
    notes: "",
    updatedAt: new Date().toISOString(),
  };
}

export function filledCount(
  values: Record<string, string>,
  fields: MeasField[]
): number {
  return fields.filter((f) => String(values[f.key] || "").trim()).length;
}

export function progressPercent(input: {
  gender: MeasGender;
  needTop: boolean;
  needBottom: boolean;
  top: Record<string, string>;
  bottom: Record<string, string>;
}): number {
  const topF = input.needTop ? topFieldsFor(input.gender) : [];
  const bottomF = input.needBottom ? bottomFieldsFor(input.gender) : [];
  const total = topF.length + bottomF.length;
  if (!total) return 100;
  const filled =
    filledCount(input.top, topF) + filledCount(input.bottom, bottomF);
  return Math.round((filled / total) * 100);
}

export function isComplete(input: {
  gender: MeasGender;
  needTop: boolean;
  needBottom: boolean;
  top: Record<string, string>;
  bottom: Record<string, string>;
}): boolean {
  return progressPercent(input) === 100;
}

/** Product gender_fit values from catalog: men | women | unisex */
export type ProductGenderFit = "men" | "women" | "unisex" | string;

export function allowedMeasGenders(fit: ProductGenderFit): MeasGender[] {
  const f = String(fit || "unisex").toLowerCase();
  if (f === "men" || f === "male") return ["male"];
  if (f === "women" || f === "female") return ["female"];
  return ["male", "female"];
}

export function setMatchesProductFit(
  setGender: MeasGender,
  fit: ProductGenderFit
): boolean {
  return allowedMeasGenders(fit).includes(setGender);
}

export function filterSetsForFit(
  sets: MeasurementSet[],
  fit: ProductGenderFit
): MeasurementSet[] {
  return sets.filter((s) => setMatchesProductFit(s.gender, fit));
}

export function defaultMeasGender(
  fit: ProductGenderFit,
  userGender?: string | null
): MeasGender {
  const allowed = allowedMeasGenders(fit);
  const g = String(userGender || "").toLowerCase();
  if ((g === "male" || g === "female") && allowed.includes(g as MeasGender)) {
    return g as MeasGender;
  }
  return allowed[0];
}

export function fitLabel(fit: ProductGenderFit): string {
  const f = String(fit || "unisex").toLowerCase();
  if (f === "men" || f === "male") return "Men";
  if (f === "women" || f === "female") return "Women";
  return "Men & Women";
}

export function cartLineKey(item: {
  variantId?: string;
  productId: string;
  size: string;
  color: string;
}): string {
  if (item.variantId) return item.variantId;
  return `${item.productId}:${item.size}:${item.color}`;
}

export type LineMeasurementAssignment = {
  lineKey: string;
  productId: string;
  productName: string;
  variantId?: string;
  size: string;
  color: string;
  genderFit: string;
  needTop: boolean;
  needBottom: boolean;
  setId: string;
  setName: string;
  gender: MeasGender;
  unit: MeasUnit;
  notes: string;
  top?: Record<string, string>;
  bottom?: Record<string, string>;
};

export function snapshotFromSet(
  set: MeasurementSet,
  opts: {
    lineKey: string;
    productId: string;
    productName: string;
    variantId?: string;
    size: string;
    color: string;
    genderFit: string;
    needTop: boolean;
    needBottom: boolean;
  }
): LineMeasurementAssignment {
  return {
    ...opts,
    setId: set.id,
    setName: set.name,
    gender: set.gender,
    unit: set.unit,
    notes: set.notes,
    top: opts.needTop ? set.top : undefined,
    bottom: opts.needBottom ? set.bottom : undefined,
  };
}
