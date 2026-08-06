import { NextResponse } from "next/server";

type IndiaPostOffice = {
  Name?: string;
  District?: string;
  Block?: string;
  State?: string;
};

type IndiaPostPayload = Array<{
  Status?: string;
  PostOffice?: IndiaPostOffice[] | null;
}>;

export type PincodeLookupResponse = {
  pincode: string;
  city: string;
  state: string;
};

type RouteContext = { params: Promise<{ pin: string }> };

/**
 * Proxies India Post PIN lookup. City = District (Block/Name fallback); State as given.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { pin } = await context.params;
  if (!/^[1-9][0-9]{5}$/.test(pin)) {
    return NextResponse.json({ message: "Invalid PIN code" }, { status: 400 });
  }

  try {
    const upstream = await fetch(
      `https://api.postalpincode.in/pincode/${encodeURIComponent(pin)}`,
      {
        next: { revalidate: 86400 },
        headers: { Accept: "application/json" },
      },
    );

    if (!upstream.ok) {
      return NextResponse.json({ message: "Lookup unavailable" }, { status: 502 });
    }

    const payload = (await upstream.json()) as IndiaPostPayload;
    const entry = payload[0];
    if (!entry || entry.Status !== "Success" || !entry.PostOffice?.length) {
      return NextResponse.json({ message: "PIN not found" }, { status: 404 });
    }

    const office = entry.PostOffice[0];
    const city =
      office.District?.trim() ||
      office.Block?.trim() ||
      office.Name?.trim() ||
      "";
    const state = office.State?.trim() || "";

    if (!city || !state) {
      return NextResponse.json({ message: "PIN not found" }, { status: 404 });
    }

    const body: PincodeLookupResponse = { pincode: pin, city, state };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return NextResponse.json({ message: "Lookup unavailable" }, { status: 502 });
  }
}
