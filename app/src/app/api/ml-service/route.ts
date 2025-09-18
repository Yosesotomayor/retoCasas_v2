// app/api/ml-service/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL as string;
  
  try {
    const response = await fetch(ML_SERVICE_URL, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`ML Service error! status: ${response.status}`);
    }
    
    const data = await response.text();
    
    return NextResponse.json({ 
      success: true, 
      data, 
      error: null, 
      serviceUrl: ML_SERVICE_URL 
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error',
      serviceUrl: ML_SERVICE_URL
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL as string;
  const target = `${ML_SERVICE_URL}/predict-app`;
  try {
    const body = await req.json();
    const r = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const raw = await r.text();
    let data: any;
    try { data = JSON.parse(raw); } catch { data = raw; }
    if (!r.ok) throw new Error(`Status ${r.status}: ${raw}`);
    return NextResponse.json({ success: true, data, error: null, serviceUrl: target });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, data: null, error: e.message || 'Error', serviceUrl: target },
      { status: 500 }
    );
  }
}