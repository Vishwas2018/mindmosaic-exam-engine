import { NextResponse } from "next/server";

export function GET(): NextResponse {
  return NextResponse.json(
    { error: "guest_bank_retired" },
    { status: 410, headers: { "Cache-Control": "private, no-store" } },
  );
}
