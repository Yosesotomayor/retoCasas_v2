import { NextRequest, NextResponse } from "next/server";

interface PredictionRequest {
  prompt: string;
}

export async function POST(request: NextRequest) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

  if (!AI_SERVICE_URL) {
    return NextResponse.json(
      { error: "AI_SERVICE_URL is not defined in environment variables" },
      { status: 500 }
    );
  }

  try {
    const { prompt }: PredictionRequest = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Field 'prompt' is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${AI_SERVICE_URL}/api/llm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`AI Service error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch from ML Service: ${error}` },
      { status: 500 }
    );
  }
}