// All monetary values are stored as integer "fils" (1 BHD = 1000 fils)
// to avoid floating-point rounding drift across quotes/invoices/payments.

export type Fils = number;

export const BHD_PER_FILS = 0.001;

export function bhdToFils(bhd: number): Fils {
  return Math.round(bhd * 1000);
}

export function filsToBhd(fils: Fils): number {
  return fils / 1000;
}

export function formatBHD(fils: Fils): string {
  const bhd = filsToBhd(fils);
  const sign = bhd < 0 ? "-" : "";
  return `${sign}BHD ${Math.abs(bhd).toLocaleString("en-BH", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`;
}

export function formatBHDCompact(fils: Fils): string {
  return filsToBhd(fils).toLocaleString("en-BH", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function sumFils(values: Fils[]): Fils {
  return values.reduce((total, v) => total + v, 0);
}

/** basis points, e.g. 1000 = 10% */
export function applyTaxBps(subtotalFils: Fils, taxBps: number): Fils {
  return Math.round((subtotalFils * taxBps) / 10000);
}
