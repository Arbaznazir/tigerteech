export type ColorStyle = "solid" | "dotted" | "gradient" | "strips";

export type ColorDraft = {
  colorName: string;
  colorStyle: ColorStyle;
  colorHex: string;
  colorHex2: string;
};

export function buildSwatchCss(d: Pick<ColorDraft, "colorStyle" | "colorHex" | "colorHex2">): string {
  const a = d.colorHex || "#161412";
  const b = d.colorHex2 || "#F38120";
  switch (d.colorStyle) {
    case "dotted":
      return `radial-gradient(circle at 30% 30%, ${b} 0 22%, transparent 23%), radial-gradient(circle at 70% 65%, ${b} 0 18%, transparent 19%), ${a}`;
    case "gradient":
      return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
    case "strips":
      return `repeating-linear-gradient(135deg, ${a} 0 10%, ${b} 10% 20%)`;
    case "solid":
    default:
      return a;
  }
}

/** Parse a stored CSS/hex value back into editor fields. */
export function parseSwatchCss(raw: string | undefined | null): Pick<
  ColorDraft,
  "colorStyle" | "colorHex" | "colorHex2"
> {
  const value = (raw || "#161412").trim();
  if (value.startsWith("radial-gradient") && value.includes("circle at")) {
    const hexes = value.match(/#([0-9a-fA-F]{3,8})\b/g) || [];
    return {
      colorStyle: "dotted",
      colorHex: hexes[hexes.length - 1] || "#161412",
      colorHex2: hexes[0] || "#F38120",
    };
  }
  if (value.startsWith("repeating-linear-gradient")) {
    const hexes = value.match(/#([0-9a-fA-F]{3,8})\b/g) || [];
    return {
      colorStyle: "strips",
      colorHex: hexes[0] || "#161412",
      colorHex2: hexes[1] || "#F38120",
    };
  }
  if (value.startsWith("linear-gradient")) {
    const hexes = value.match(/#([0-9a-fA-F]{3,8})\b/g) || [];
    return {
      colorStyle: "gradient",
      colorHex: hexes[0] || "#161412",
      colorHex2: hexes[1] || "#F38120",
    };
  }
  return {
    colorStyle: "solid",
    colorHex: /^#/.test(value) ? value : "#161412",
    colorHex2: "#F38120",
  };
}

/** Sample distinct colors from an image file (canvas). */
export async function sampleColorsFromImage(
  file: File,
  max = 8
): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    const size = 48;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const buckets = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 200) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // skip near-white / near-black noise
      const lum = (r + g + b) / 3;
      if (lum > 245 || lum < 12) continue;
      const key = rgbToHex(
        Math.round(r / 24) * 24,
        Math.round(g / 24) * 24,
        Math.round(b / 24) * 24
      );
      buckets.set(key, (buckets.get(key) || 0) + 1);
    }
    return [...buckets.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([hex]) => hex);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function pickColorAtPoint(
  fileOrUrl: File | string,
  xRatio: number,
  yRatio: number
): Promise<string> {
  const url =
    typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  const revoke = typeof fileOrUrl !== "string";
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#161412";
    ctx.drawImage(img, 0, 0);
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(xRatio * canvas.width)));
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor(yRatio * canvas.height)));
    const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
    return rgbToHex(r, g, b);
  } finally {
    if (revoke) URL.revokeObjectURL(url);
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export const COLOR_STYLE_OPTIONS: {
  id: ColorStyle;
  label: string;
  hint: string;
}[] = [
  { id: "solid", label: "Solid", hint: "Flat shade" },
  { id: "dotted", label: "Dotted", hint: "Base + dots" },
  { id: "gradient", label: "Gradient", hint: "Two-tone blend" },
  { id: "strips", label: "Stripes", hint: "Diagonal stripes" },
];
