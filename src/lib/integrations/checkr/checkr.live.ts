import type { BackgroundCheckProvider } from "../types";

const CHECKR_API_BASE = "https://api.checkr.com/v1";

function authHeader(): Record<string, string> {
  if (!process.env.CHECKR_API_KEY) {
    throw new Error("CHECKR_API_KEY is not set (CHECKR_MODE=live requires it)");
  }
  return {
    Authorization: `Basic ${Buffer.from(`${process.env.CHECKR_API_KEY}:`).toString("base64")}`,
    "Content-Type": "application/json",
  };
}

// Checkr has no official Node SDK — this talks to its documented REST API
// directly. See https://docs.checkr.com/
export const checkrLive: BackgroundCheckProvider = {
  async createCandidate({ userId }) {
    const res = await fetch(`${CHECKR_API_BASE}/candidates`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ metadata: { userId } }),
    });
    if (!res.ok) throw new Error(`Checkr createCandidate failed: ${res.status}`);
    const data = await res.json();
    return { candidateId: data.id };
  },
  async requestReport(candidateId) {
    const res = await fetch(`${CHECKR_API_BASE}/reports`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ candidate_id: candidateId, package: "tasker_pro" }),
    });
    if (!res.ok) throw new Error(`Checkr requestReport failed: ${res.status}`);
    const data = await res.json();
    return { reportId: data.id };
  },
  async getReportStatus(reportId) {
    const res = await fetch(`${CHECKR_API_BASE}/reports/${reportId}`, {
      headers: authHeader(),
    });
    if (!res.ok) throw new Error(`Checkr getReportStatus failed: ${res.status}`);
    const data = await res.json();
    if (data.status === "complete") {
      return data.result === "clear" ? "clear" : "consider";
    }
    if (data.status === "suspended") return "suspended";
    return "pending";
  },
};
