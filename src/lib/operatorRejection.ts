export interface OperatorRejectionDecisionParams {
  applicationStatus?: string | null;
  applicationId?: string | null;
  isAcknowledged: boolean;
}

export function getOperatorRejectionSeenKey(applicationId: string): string {
  return `@sinsay_operator_rejected_seen_${applicationId.trim()}`;
}

export function shouldShowOperatorRejectionModal(
  params: OperatorRejectionDecisionParams
): boolean {
  const { applicationStatus, applicationId, isAcknowledged } = params;
  if (!applicationId || !applicationId.trim() || !applicationStatus) {
    return false;
  }
  if (applicationStatus.trim().toLowerCase() !== "rejected") {
    return false;
  }
  if (isAcknowledged) {
    return false;
  }
  return true;
}

export function getOperatorRejectionMessage(resortName?: string | null): string {
  const cleanName = resortName?.trim() || "your establishment";
  return `Your application to register ${cleanName} as a dive establishment was not approved by the Tourism Office.`;
}
