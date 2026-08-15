import type { BackgroundCheckProvider } from "../types";

let counter = 0;
// Dev-ergonomic: auto-resolves to clear so onboarding can be exercised
// locally without a real Checkr account.
const reportStatuses = new Map<string, "pending" | "clear" | "consider" | "suspended">();

export const checkrStub: BackgroundCheckProvider = {
  async createCandidate({ userId }) {
    counter += 1;
    const candidateId = `stub_cand_${counter}`;
    console.log(`[stub:checkr] createCandidate for ${userId} -> ${candidateId}`);
    return { candidateId };
  },
  async requestReport(candidateId) {
    counter += 1;
    const reportId = `stub_report_${counter}`;
    reportStatuses.set(reportId, "clear");
    console.log(`[stub:checkr] requestReport for ${candidateId} -> ${reportId}`);
    return { reportId };
  },
  async getReportStatus(reportId) {
    return reportStatuses.get(reportId) ?? "pending";
  },
};
