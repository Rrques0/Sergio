import { Worker } from "bullmq";
import IORedis from "ioredis";

import { env } from "@/lib/env";
import { logger } from "@/lib/observability/logger";

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "drywall-os",
  async (job) => {
    logger.info({ jobId: job.id, name: job.name }, "processing background job");
    return { ok: true };
  },
  { connection }
);

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, error }, "background job failed");
});
