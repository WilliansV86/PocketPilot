import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { getAccounts } = await import("@/lib/actions/goal-actions");
    const result = await getAccounts();
    
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
