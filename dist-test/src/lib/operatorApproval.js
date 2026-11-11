"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperatorApprovalSeenKey = getOperatorApprovalSeenKey;
exports.shouldShowOperatorApprovalModal = shouldShowOperatorApprovalModal;
exports.getOperatorApprovalMessage = getOperatorApprovalMessage;
function getOperatorApprovalSeenKey(applicationId) {
    return `@sinsay_operator_approved_seen_${applicationId.trim()}`;
}
function shouldShowOperatorApprovalModal(params) {
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
function getOperatorApprovalMessage(resortName) {
    const cleanName = resortName?.trim() || "your establishment";
    return `Congratulations! Your application to register ${cleanName} as a dive establishment has been approved. You now have full access to manage dive manifests, procure dive passes, and handle resort guests.`;
}
