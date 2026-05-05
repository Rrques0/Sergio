import { logger } from "@/lib/observability/logger";

export async function register() {
  logger.info({ service: "drywall-os" }, "instrumentation registered");
}
