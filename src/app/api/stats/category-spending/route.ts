import { NextResponse } from "next/server";
import { getCategorySpending, getDateRangePreset } from "@/lib/actions/stats";

export async function POST(request: Request) {
  try {
    const { preset } = await request.json();
    const dateRange = getDateRangePreset(preset);
    const result = await getCategorySpending(dateRange);
    
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
