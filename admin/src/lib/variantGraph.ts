import {
  buildSwatchCss,
  parseSwatchCss,
  type ColorStyle,
} from "@/lib/colorSwatch";

export type GraphColor = {
  id: string;
  name: string;
  colorStyle: ColorStyle;
  colorHex: string;
  colorHex2: string;
};

export type GraphMaterial = {
  id: string;
  name: string;
  price: number;
  /** Initial stock applied to newly linked color variants on save. */
  stock: number;
  /** Max units per order. 0 = no limit (stock only). */
  maxPerOrder: number;
  colorIds: string[];
};

export type VariantGraph = {
  colors: GraphColor[];
  materials: GraphMaterial[];
};

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyColor(): GraphColor {
  return {
    id: newId("c"),
    name: "",
    colorStyle: "solid",
    colorHex: "#161412",
    colorHex2: "#F38120",
  };
}

export function emptyMaterial(): GraphMaterial {
  return {
    id: newId("m"),
    name: "",
    price: 0,
    stock: 0,
    maxPerOrder: 0,
    colorIds: [],
  };
}

export function expandGraphToVariants(graph: VariantGraph) {
  const colorMap = new Map(graph.colors.map((c) => [c.id, c]));
  const rows: {
    materialName: string;
    colorName: string;
    colorHex: string;
    sizeLabel: string;
    price: number;
    sku: string;
    stock: number;
    maxPerOrder: number;
  }[] = [];

  for (const mat of graph.materials) {
    const stock = Math.max(0, Math.floor(Number(mat.stock) || 0));
    const maxPerOrder = Math.max(0, Math.floor(Number(mat.maxPerOrder) || 0));
    const linked = mat.colorIds
      .map((id) => colorMap.get(id))
      .filter(Boolean) as GraphColor[];
    if (!linked.length) {
      rows.push({
        materialName: mat.name || "Material",
        colorName: "Default",
        colorHex: "#161412",
        sizeLabel: "",
        price: Number(mat.price) || 0,
        sku: "",
        stock,
        maxPerOrder,
      });
      continue;
    }
    for (const color of linked) {
      rows.push({
        materialName: mat.name || "Material",
        colorName: color.name || "Color",
        colorHex: buildSwatchCss(color),
        sizeLabel: "",
        price: Number(mat.price) || 0,
        sku: "",
        stock,
        maxPerOrder,
      });
    }
  }
  return rows;
}

/** Rebuild graph from flat API variants when details.variantGraph is missing. */
export function graphFromVariants(
  variants: {
    materialName?: string;
    colorName: string;
    colorHex: string;
    price: number;
    stock?: number | null;
    maxPerOrder?: number | null;
  }[]
): VariantGraph {
  const colors: GraphColor[] = [];
  const colorKeyToId = new Map<string, string>();
  const materials = new Map<
    string,
    {
      id: string;
      name: string;
      price: number;
      stock: number;
      maxPerOrder: number;
      colorIds: string[];
    }
  >();

  for (const v of variants) {
    const matName = (v.materialName || "").trim() || "Standard";
    const parsed = parseSwatchCss(v.colorHex);
    const key = `${v.colorName}|${v.colorHex}`;
    let colorId = colorKeyToId.get(key);
    if (!colorId) {
      colorId = newId("c");
      colorKeyToId.set(key, colorId);
      colors.push({
        id: colorId,
        name: v.colorName || "Color",
        colorStyle: parsed.colorStyle,
        colorHex: parsed.colorHex,
        colorHex2: parsed.colorHex2,
      });
    }
    let mat = materials.get(matName);
    if (!mat) {
      mat = {
        id: newId("m"),
        name: matName,
        price: v.price,
        stock: typeof v.stock === "number" ? v.stock : 0,
        maxPerOrder:
          typeof v.maxPerOrder === "number" && v.maxPerOrder > 0
            ? v.maxPerOrder
            : 0,
        colorIds: [],
      };
      materials.set(matName, mat);
    }
    if (!mat.colorIds.includes(colorId)) mat.colorIds.push(colorId);
    mat.price = v.price;
    if (typeof v.stock === "number") mat.stock = v.stock;
    if (typeof v.maxPerOrder === "number") {
      mat.maxPerOrder = Math.max(0, v.maxPerOrder);
    }
  }

  if (!colors.length) colors.push(emptyColor());
  if (!materials.size) {
    return { colors, materials: [emptyMaterial()] };
  }
  return { colors, materials: [...materials.values()] };
}
