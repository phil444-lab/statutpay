import path from "node:path";
import { defineConfig } from "@prisma/config";
import "dotenv/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    async adapter() {
      const { createPool } = await import("mysql2/promise");
      const { PrismaMysql } = await import("@prisma/adapter-mysql");
      const pool = createPool(process.env.DATABASE_URL!);
      return new PrismaMysql(pool);
    },
  },
});
