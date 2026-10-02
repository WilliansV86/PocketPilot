import { NextResponse } from "next/server";
function retiredEndpoint() { return NextResponse.json({ error: "Not found" }, { status: 404 }); }
export const GET = retiredEndpoint;
export const POST = retiredEndpoint;
export const PUT = retiredEndpoint;
export const PATCH = retiredEndpoint;
export const DELETE = retiredEndpoint;
