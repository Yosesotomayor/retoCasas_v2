import { getDb } from './db';
import { housePredictions } from './db/schema';
import { eq, desc } from 'drizzle-orm';

interface HouseProperty {
  name: string;
  value: string | number;
}

interface PredictionData {
  price: number;
  properties: HouseProperty[];
}

// Save a new house prediction
export async function savePrediction(userId: string, predictionData: PredictionData) {
  const db = await getDb();
  const result = await db
    .insert(housePredictions)
    .values({
      userId,
      price: predictionData.price.toString(),
      properties: JSON.stringify(predictionData.properties),
    })
    .returning();

  return result[0];
}

// Get user's prediction history
export async function getUserPredictions(userId: string, limit = 50) {
  const db = await getDb();
  const results = await db
    .select()
    .from(housePredictions)
    .where(eq(housePredictions.userId, userId))
    .orderBy(desc(housePredictions.createdAt))
    .limit(limit);

  return results.map(prediction => ({
    ...prediction,
    price: parseFloat(prediction.price),
    properties: JSON.parse(prediction.properties) as HouseProperty[],
  }));
}

// Get a specific prediction by ID
export async function getPredictionById(predictionId: string, userId: string) {
  const db = await getDb();
  const result = await db
    .select()
    .from(housePredictions)
    .where(eq(housePredictions.id, predictionId))
    .limit(1);

  const prediction = result[0];

  if (!prediction || prediction.userId !== userId) {
    return null;
  }

  return {
    ...prediction,
    price: parseFloat(prediction.price),
    properties: JSON.parse(prediction.properties) as HouseProperty[],
  };
}

// Delete a prediction
export async function deletePrediction(predictionId: string, userId: string) {
  const db = await getDb();
  const result = await db
    .delete(housePredictions)
    .where(eq(housePredictions.id, predictionId))
    .returning();

  // Verify the deleted prediction belonged to the user
  if (result[0] && result[0].userId === userId) {
    return result[0];
  }

  return null;
}

// Get prediction statistics for a user
export async function getUserPredictionStats(userId: string) {
  const predictions = await getUserPredictions(userId);

  if (predictions.length === 0) {
    return {
      totalPredictions: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      lastPredictionDate: null,
    };
  }

  const prices = predictions.map(p => p.price);
  const totalPredictions = predictions.length;
  const averagePrice = prices.reduce((sum, price) => sum + price, 0) / totalPredictions;
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const lastPredictionDate = predictions[0].createdAt;

  return {
    totalPredictions,
    averagePrice: Math.round(averagePrice * 100) / 100,
    minPrice,
    maxPrice,
    lastPredictionDate,
  };
}