export type PincodeLookup = {
  pincode: string;
  city: string;
  state: string;
};

/** Client helper for PIN → city/state. Returns null on any soft failure. */
export async function lookupPincode(pin: string): Promise<PincodeLookup | null> {
  if (!/^[1-9][0-9]{5}$/.test(pin)) return null;

  try {
    const response = await fetch(`/api/pincode/${encodeURIComponent(pin)}`, {
      cache: "force-cache",
    });
    if (!response.ok) return null;
    return (await response.json()) as PincodeLookup;
  } catch {
    return null;
  }
}
