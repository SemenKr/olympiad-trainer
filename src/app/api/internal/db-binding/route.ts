import {
  denyDiagnosticMethod,
  runProductionBindingDiagnostic,
} from "../../../../modules/practice/server/production-db-binding-diagnostic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const POST = runProductionBindingDiagnostic;
export const GET = denyDiagnosticMethod;
export const HEAD = denyDiagnosticMethod;
export const OPTIONS = denyDiagnosticMethod;
export const PUT = denyDiagnosticMethod;
export const PATCH = denyDiagnosticMethod;
export const DELETE = denyDiagnosticMethod;
