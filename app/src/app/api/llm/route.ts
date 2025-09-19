import { NextRequest, NextResponse } from "next/server";

interface PredictionRequest {
  prompt: string;
}

export async function POST(request: NextRequest) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

  if (!AI_SERVICE_URL) {
    throw new Error("AI_SERVICE_URL is not defined in environment variables");
  }

  try {
    const { prompt }: PredictionRequest = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Field 'prompt' is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${AI_SERVICE_URL}/llm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`AI Service error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch from ML Service: ${error}`);
  }
}