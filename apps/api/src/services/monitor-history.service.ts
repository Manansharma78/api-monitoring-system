import { getMongoDB } from "../config/mongodb.js";

export async function getMonitorHistory(monitorId: string, limit = 50) {
  const database = getMongoDB();

  const collection = database.collection("monitor_checks");

  const results = await collection
    .find(
      {
        monitorId,
      },
      {
        projection: {
          _id: 1,
          monitorId: 1,
          url: 1,
          method: 1,
          success: 1,
          statusCode: 1,
          responseTime: 1,
          errorMessage: 1,
          checkedAt: 1,
          createdAt: 1,
        },
      },
    )
    .sort({
      checkedAt: -1,
    })
    .limit(limit)
    .toArray();

  return results;
}
