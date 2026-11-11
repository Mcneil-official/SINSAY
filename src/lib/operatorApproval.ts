export interface OperatorApprovalDecisionParams {
  applicationStatus?: string | null;
  applicationId?: string | null;
  isAcknowledged: boolean;
}

export function getOperatorApprovalSeenKey(applicationId: string): string {
  return `@sinsay_operator_approved_seen_${applicationId.trim()}`;
}

export function shouldShowOperatorApprovalModal(
  params: OperatorApprovalDecisionParams
): boolean {
  const { applicationStatus, applicationId, isAcknowledged } = params;
  if (!applicationId || !applicationId.trim() || !applicationStatus) {
    return false;
  }
  if (applicationStatus.trim().toLowerCase() !== "approved") {
    return false;
  }
  if (isAcknowledged) {
    return false;
  }
  return true;
}

export function getOperatorApprovalMessage(resortName?: string | null): string {
  const cleanName = resortName?.trim() || "your establishment";
  return `Congratulations! Your application to register ${cleanName} as a dive establishment has been approved. You now have full access to manage dive manifests, procure dive passes, and handle resort guests.`;
}
