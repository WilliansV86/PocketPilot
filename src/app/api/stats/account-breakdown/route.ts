import { NextResponse } from "next/server";
import { getAccountBreakdown } from "@/lib/actions/stats";

export async function GET(request: Request) {
  try {
    const result = await getAccountBreakdown(new URL(request.url).searchParams.get("currency") === "CAD" ? "CAD" : "USD");
    
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
