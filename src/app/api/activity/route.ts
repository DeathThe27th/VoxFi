import { NextResponse } from "next/server";
import { listActivity } from "@/lib/store";
import { errorResponse,requireUser } from "@/lib/auth";
export async function GET(request:Request){try{const user=await requireUser(request);return NextResponse.json({activity:listActivity(user.id)});}catch(error){return errorResponse(error,"Unable to load activity");}}
