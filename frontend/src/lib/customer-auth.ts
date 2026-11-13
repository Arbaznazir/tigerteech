const TOKEN_KEY = "tt_customer_token";

export function getCustomerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearCustomerToken() {
  localStorage.removeItem(TOKEN_KEY);
}
