import * as actions from "../../app/practice/knowledge-support-actions";
import { requestForLocalOwner } from "./local-ownership";

export const readKnowledgeSupport = (sessionId: string) =>
  requestForLocalOwner((owner) =>
    actions.readKnowledgeSupport(sessionId, owner),
  );
export const readKnowledgeSupportEligibility = (context: unknown) =>
  requestForLocalOwner((owner) =>
    actions.readKnowledgeSupportEligibility(context, owner),
  );
export const submitKnowledgeDiagnostic = (
  sessionId: string,
  option: unknown,
  context: unknown,
) =>
  requestForLocalOwner((owner) =>
    actions.submitKnowledgeDiagnostic(sessionId, option, context, owner),
  );
export const openKnowledgeLesson = (sessionId: string) =>
  requestForLocalOwner((owner) =>
    actions.openKnowledgeLesson(sessionId, owner),
  );
export const submitKnowledgeMicroCheck = (sessionId: string, option: unknown) =>
  requestForLocalOwner((owner) =>
    actions.submitKnowledgeMicroCheck(sessionId, option, owner),
  );
