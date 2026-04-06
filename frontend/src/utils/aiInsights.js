export function analyzeLogs(logs = []) {
    const safe = Array.isArray(logs) ? logs : [];
    const counts = {
        total: safe.length,
        critical: 0,
        medium: 0,
        low: 0,
        open: 0,
        investigating: 0,
        resolved: 0,
    };

    const byIp = {};
    const byCategory = {};
    const bySeverity = { critical: 0, medium: 0, low: 0 };

    safe.forEach((l) => {
        const sev = String(l.severity || "").toLowerCase();
        if (sev === "critical") {
            counts.critical += 1;
            bySeverity.critical += 1;
        } else if (sev === "medium") {
            counts.medium += 1;
            bySeverity.medium += 1;
        } else if (sev === "low") {
            counts.low += 1;
            bySeverity.low += 1;
        }

        const st = String(l.status || "open").toLowerCase();
        if (st === "resolved") counts.resolved += 1;
        else if (st === "investigating") counts.investigating += 1;
        else counts.open += 1;

        if (l.ip) byIp[l.ip] = (byIp[l.ip] || 0) + (sev === "critical" ? 3 : sev === "medium" ? 2 : 1);
        if (l.error_type) byCategory[l.error_type] = (byCategory[l.error_type] || 0) + 1;
    });

    const topIp = Object.entries(byIp)
        .sort((a, b) => b[1] - a[1])
        .map(([ip, score]) => ({ ip, score }))
        .slice(0, 3);

    const topCategory = Object.entries(byCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, count }))
        .slice(0, 3);

    const mostSevere = safe.find((l) => String(l.severity).toLowerCase() === "critical" && String(l.status || "open").toLowerCase() !== "resolved") ||
        safe.find((l) => String(l.severity).toLowerCase() === "critical") ||
        safe[0] || null;

    return {
        counts,
        topIp,
        topCategory,
        mostSevere,
        bySeverity,
    };
}

export function logSummaryText(logs = []) {
    const { counts, topIp, topCategory } = analyzeLogs(logs);
    if (!counts.total) {
        return {
            headline: "No incidents in this view.",
            bullets: ["Try broadening filters or checking realtime telemetry."],
        };
    }

    const ip = topIp[0]?.ip || "-";
    const category = topCategory[0]?.category || "-";

    return {
        headline: `${counts.total} incidents in view · ${counts.critical} critical`,
        bullets: [
            `Top risky IP: ${ip}`,
            `Most frequent category: ${category}`,
            `Open issues: ${counts.open} (Investigating: ${counts.investigating})`,
        ],
    };
}

export function recommendFromLogs(logs = []) {
    const { counts, topIp, topCategory } = analyzeLogs(logs);
    const recs = [];

    if (counts.critical > 0) {
        recs.push({
            title: "Investigate critical incidents",
            reason: `${counts.critical} critical issues present in this view.`,
            action: "Open Logs or Issue Details",
        });
    }

    if (topIp[0]) {
        recs.push({
            title: `Focus on ${topIp[0].ip}`,
            reason: "Highest risk-weighted incident concentration.",
            action: "Open Search or Realtime",
        });
    }

    if (topCategory[0]?.category === "Hardware") {
        recs.push({
            title: "Check Hardware errors",
            reason: "Hardware incidents dominate the current view.",
            action: "Open Hardware Logs",
        });
    }

    if (counts.open > 0 && counts.low > counts.critical + counts.medium) {
        recs.push({
            title: "Bulk resolve low-risk",
            reason: "Many low-severity issues remain open.",
            action: "Use bulk resolve after verification",
        });
    }

    return recs.slice(0, 4);
}
