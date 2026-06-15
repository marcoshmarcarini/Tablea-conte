import { CampaignBudget, getInitialBudgets, SinaProItem, SINAPRO_CATALOG } from "./sinaproData";

export function getStoredCatalog(): SinaProItem[] {
  if (typeof window === "undefined") {
    return SINAPRO_CATALOG;
  }
  const stored = localStorage.getItem("sinapro_catalog_items");
  if (!stored) {
    localStorage.setItem("sinapro_catalog_items", JSON.stringify(SINAPRO_CATALOG));
    return SINAPRO_CATALOG;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return SINAPRO_CATALOG;
  }
}

export function saveStoredCatalog(items: SinaProItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("sinapro_catalog_items", JSON.stringify(items));
}

export function resetStoredCatalog() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("sinapro_catalog_items");
}

export function getStoredBudgets(): CampaignBudget[] {
  if (typeof window === "undefined") {
    return getInitialBudgets();
  }
  const stored = localStorage.getItem("sinapro_campaign_budgets");
  if (!stored) {
    const initial = getInitialBudgets();
    localStorage.setItem("sinapro_campaign_budgets", JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return getInitialBudgets();
  }
}

export function saveStoredBudgets(budgets: CampaignBudget[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("sinapro_campaign_budgets", JSON.stringify(budgets));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

