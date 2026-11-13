import { State } from "country-state-city";
import { findCountryByName } from "@/lib/countries";

export type StateOption = {
  name: string;
  isoCode: string;
  countryCode: string;
};

export function statesForCountryName(countryName: string): StateOption[] {
  const country = findCountryByName(countryName);
  if (!country) return [];
  return State.getStatesOfCountry(country.iso2).map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
    countryCode: s.countryCode,
  }));
}

export function statesForCountryIso(iso2: string): StateOption[] {
  if (!iso2) return [];
  return State.getStatesOfCountry(iso2.toUpperCase()).map((s) => ({
    name: s.name,
    isoCode: s.isoCode,
    countryCode: s.countryCode,
  }));
}

export function countryHasStates(countryName: string): boolean {
  return statesForCountryName(countryName).length > 0;
}
