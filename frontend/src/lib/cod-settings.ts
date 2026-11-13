import { API_URL } from "@/lib/api";
import { findCountryByName, findCountryByIso } from "@/lib/countries";

export type CodRule = {
  countryIso: string;
  countryName: string;
  scope: "country" | "states" | string;
  states: string[];
  stateIsos?: string[];
};

export type CodSettings = {
  enabled: boolean;
  everywhere: boolean;
  rules: CodRule[];
};

export async function fetchCodSettings(): Promise<CodSettings> {
  const res = await fetch(`${API_URL}/api/v1/settings/cod`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as {
    data?: CodSettings;
    error?: string | null;
  };
  if (!res.ok || !json.data) {
    return { enabled: true, everywhere: true, rules: [] };
  }
  return {
    enabled: Boolean(json.data.enabled),
    everywhere: Boolean(json.data.everywhere),
    rules: json.data.rules || [],
  };
}

function norm(s: string) {
  return s.trim().toLowerCase();
}

export function isCodAvailable(
  settings: CodSettings | null | undefined,
  countryName: string,
  stateName: string
): boolean {
  if (!settings || !settings.enabled) return false;
  if (settings.everywhere) return true;
  const rules = settings.rules || [];
  if (rules.length === 0) return false;

  const country = findCountryByName(countryName);
  const cName = norm(countryName);
  const cIso = norm(country?.iso2 || "");
  const st = norm(stateName);

  for (const rule of rules) {
    const ruleIso = norm(rule.countryIso);
    const ruleName = norm(rule.countryName);
    const matchCountry =
      (ruleIso && (cIso === ruleIso || cName === ruleIso)) ||
      (ruleName &&
        (cName === ruleName ||
          cName.includes(ruleName) ||
          ruleName.includes(cName)));
    if (!matchCountry) continue;
    if (rule.scope !== "states") return true;
    for (const allowed of rule.states || []) {
      const a = norm(allowed);
      if (a && (st === a || st.includes(a) || a.includes(st))) return true;
    }
    for (const iso of rule.stateIsos || []) {
      if (st && st === norm(iso)) return true;
    }
  }
  return false;
}

export function formatCodAvailability(settings: CodSettings): string[] {
  if (!settings.enabled) return ["COD is currently disabled"];
  if (settings.everywhere) return ["Available in all countries"];
  if (!settings.rules?.length) return ["No regions configured"];
  return settings.rules.map((rule) => {
    const name =
      rule.countryName ||
      findCountryByIso(rule.countryIso)?.name ||
      rule.countryIso;
    if (rule.scope === "states") {
      return `${name}: ${rule.states.join(", ") || "selected states"}`;
    }
    return `${name}: entire country`;
  });
}
