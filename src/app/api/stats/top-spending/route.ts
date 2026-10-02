import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getTopSpending, getDateRangePreset } from "@/lib/actions/stats";

export async function POST(request: Request) {
  await auth.protect();

  try {
    const { preset, currency } = await request.json();
    const dateRange = getDateRangePreset(preset);
    const result = await getTopSpending(dateRange, currency === "CAD" ? "CAD" : "USD");
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
