import { getMongoDB } from "../config/mongodb.js";

import type { MonitorCheckResult } from "./api-checker.js";

export async function saveCheckResult(result: MonitorCheckResult) {
  const database = getMongoDB();

  const collection = database.collection("monitor_checks");

  const document = {
    monitorId: result.monitorId,
    url: result.url,
    method: result.method,

    success: result.success,

    statusCode: result.statusCode,
    responseTime: result.responseTime,

    errorMessage: result.errorMessage,

    checkedAt: new Date(result.checkedAt),
    createdAt: new Date(),
  };

  const inserted = await collection.insertOne(document);

  console.log(`Check result saved to MongoDB: ${inserted.insertedId}`);

  return inserted.insertedId;
}
