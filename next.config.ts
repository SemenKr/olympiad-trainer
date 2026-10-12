import type { NextConfig } from "next";
import { runtimeDatabaseUrl } from "./src/modules/practice/server/database-environment.mjs";

if (process.env.VERCEL_ENV === "preview") runtimeDatabaseUrl(process.env);

const config: NextConfig = {};

export default config;
