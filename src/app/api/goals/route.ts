import { NextResponse } from "next/server";
import { getGoals } from "@/lib/actions/goal-actions";

export async function GET() {
  try {
    console.log("=== GOALS API: Starting request ===");
    const result = await getGoals();
    console.log("=== GOALS API: getGoals result ===", { success: result.success, dataCount: result.data?.length || 0 });
    
    if (!result.success) {
      console.error("=== GOALS API: getGoals failed ===", result.error);
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }

    console.log("=== GOALS API: Success ===");
    return NextResponse.json(result);
  } catch (error) {
    console.error("=== GOALS API: Unexpected error ===", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { 
        error: "Internal server error",
        success: false,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { createGoal } = await import("@/lib/actions/goal-actions");
    const formData = await request.formData();
    
    const result = await createGoal(formData);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
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
