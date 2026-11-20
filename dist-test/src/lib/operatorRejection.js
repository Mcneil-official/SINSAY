"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOperatorRejectionSeenKey = getOperatorRejectionSeenKey;
exports.shouldShowOperatorRejectionModal = shouldShowOperatorRejectionModal;
exports.getOperatorRejectionMessage = getOperatorRejectionMessage;
function getOperatorRejectionSeenKey(applicationId) {
    return `@sinsay_operator_rejected_seen_${applicationId.trim()}`;
}
function shouldShowOperatorRejectionModal(params) {
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
function getOperatorRejectionMessage(resortName) {
    const cleanName = resortName?.trim() || "your establishment";
    return `Your application to register ${cleanName} as a dive establishment was not approved by the Tourism Office.`;
}
