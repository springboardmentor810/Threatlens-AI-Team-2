// Mock data — replace with real API calls to the ThreatLens AI backend.

export const ROLES = [
  {
    id: "analyst",
    label: "Security Analyst",
    permissions: [
      "Upload suspicious files",
      "Run static analysis scans",
      "View malware classification reports",
      "Access threat monitoring dashboards",
      "Review alerts and security notifications",
      "Generate investigation reports",
    ],
  },
  {
    id: "soc",
    label: "SOC Team Member",
    permissions: [
      "Monitor detection logs",
      "View active threats",
      "Access security dashboards",
      "Track malware incidents",
      "Review alert history",
      "Generate operational reports",
    ],
  },
  {
    id: "admin",
    label: "Administrator",
    permissions: [
      "Manage users and roles",
      "Configure platform settings",
      "Manage integrations and APIs",
      "Access all dashboards and reports",
      "Monitor platform activities",
      "Manage security policies",
    ],
  },
  {
    id: "researcher",
    label: "Researcher",
    permissions: [
      "Upload malware samples for research",
      "Access malware datasets",
      "Analyze malware families",
      "Review classification results",
      "Export research reports",
      "Access historical threat analytics",
    ],
  },
];

export const statOverview = [
  { label: "Files scanned (24h)", value: "1,284", delta: "+12.4%", trend: "up" },
  { label: "Threats detected", value: "37", delta: "+3", trend: "up" },
  { label: "Avg. risk score", value: "41 / 100", delta: "-4.1%", trend: "down" },
  { label: "Open alerts", value: "9", delta: "-2", trend: "down" },
];

export const detectionTrend = [
  { day: "Mon", scans: 210, threats: 6 },
  { day: "Tue", scans: 268, threats: 9 },
  { day: "Wed", scans: 190, threats: 4 },
  { day: "Thu", scans: 312, threats: 11 },
  { day: "Fri", scans: 284, threats: 7 },
  { day: "Sat", scans: 132, threats: 2 },
  { day: "Sun", scans: 158, threats: 3 },
];

export const malwareFamilies = [
  { name: "Trojan", value: 38 },
  { name: "Ransomware", value: 21 },
  { name: "Spyware", value: 16 },
  { name: "Worm", value: 11 },
  { name: "Adware", value: 8 },
  { name: "Rootkit", value: 6 },
];

export const riskDistribution = [
  { band: "0–25", label: "Low", count: 412 },
  { band: "26–50", label: "Medium", count: 268 },
  { band: "51–75", label: "High", count: 143 },
  { band: "76–100", label: "Critical", count: 61 },
];

export const recentScans = [
  { id: "SCN-8841", file: "invoice.exe", hash: "e3b0c44298...af41", risk: 82, verdict: "Trojan", status: "critical", time: "2 min ago", analyst: "S. Rangan" },
  { id: "SCN-8840", file: "quarterly_report.docm", hash: "9f86d081...d16a", risk: 64, verdict: "Macro dropper", status: "high", time: "14 min ago", analyst: "A. Fernandes" },
  { id: "SCN-8839", file: "setup_v2.msi", hash: "a94a8fe5...c1c2", risk: 22, verdict: "Clean", status: "low", time: "38 min ago", analyst: "Auto-scan" },
  { id: "SCN-8838", file: "update_patch.zip", hash: "2cf24dba...4e58", risk: 47, verdict: "Suspicious archive", status: "medium", time: "51 min ago", analyst: "Auto-scan" },
  { id: "SCN-8837", file: "vpn_client.dll", hash: "d4735e3a...8ea6", risk: 91, verdict: "Ransomware.GenKD", status: "critical", time: "1 hr ago", analyst: "R. Ibarra" },
  { id: "SCN-8836", file: "photo_editor.apk", hash: "4e07408562...a3ba", risk: 58, verdict: "Adware bundle", status: "medium", time: "2 hr ago", analyst: "Auto-scan" },
  { id: "SCN-8835", file: "readme.pdf", hash: "6b86b273...7c92", risk: 8, verdict: "Clean", status: "low", time: "3 hr ago", analyst: "Auto-scan" },
];

export const scanHistory = [
  { id: "SCN-8841", file: "invoice.exe", hash: "e3b0c44298fc1c14...b7852b85", risk: 82, verdict: "Trojan", status: "critical", date: "Aug 31, 2026", time: "14:52", analyst: "S. Rangan" },
  { id: "SCN-8840", file: "quarterly_report.docm", hash: "9f86d081884c7d65...219b2e2f", risk: 64, verdict: "Macro dropper", status: "high", date: "Aug 31, 2026", time: "14:38", analyst: "A. Fernandes" },
  { id: "SCN-8839", file: "setup_v2.msi", hash: "a94a8fe5ccb19ba6...025b6100", risk: 22, verdict: "Clean", status: "low", date: "Aug 31, 2026", time: "14:14", analyst: "Auto-scan" },
  { id: "SCN-8838", file: "update_patch.zip", hash: "2cf24dba5fb0a30e...b7395a4b", risk: 47, verdict: "Suspicious archive", status: "medium", date: "Aug 31, 2026", time: "14:01", analyst: "Auto-scan" },
  { id: "SCN-8837", file: "vpn_client.dll", hash: "d4735e3a265e16ee...c0c5cad3", risk: 91, verdict: "Ransomware.GenKD", status: "critical", date: "Aug 31, 2026", time: "13:47", analyst: "R. Ibarra" },
  { id: "SCN-8836", file: "photo_editor.apk", hash: "4e07408562bedb8b...5c7f4a3b", risk: 58, verdict: "Adware bundle", status: "medium", date: "Aug 31, 2026", time: "12:20", analyst: "Auto-scan" },
  { id: "SCN-8835", file: "readme.pdf", hash: "6b86b273ff34fce1...7ab409cd", risk: 8, verdict: "Clean", status: "low", date: "Aug 31, 2026", time: "11:05", analyst: "Auto-scan" },
  { id: "SCN-8834", file: "payroll_march.xlsm", hash: "1c383cd30b7c298a...cc6da43e", risk: 71, verdict: "Macro dropper", status: "high", date: "Aug 30, 2026", time: "17:42", analyst: "A. Fernandes" },
  { id: "SCN-8833", file: "driver_pack.exe", hash: "5891b5b522d5df08...f8c33c34", risk: 15, verdict: "Clean", status: "low", date: "Aug 30, 2026", time: "16:10", analyst: "Auto-scan" },
  { id: "SCN-8832", file: "remote_support.msi", hash: "f5ca38f748a1d6ea...b9e5b3f4", risk: 54, verdict: "PUP / bundler", status: "medium", date: "Aug 30, 2026", time: "15:33", analyst: "Auto-scan" },
  { id: "SCN-8831", file: "invoice_scan.img", hash: "ef2d127de37b942b...c26c1907", risk: 88, verdict: "Trojan.GenKit", status: "critical", date: "Aug 30, 2026", time: "13:52", analyst: "R. Ibarra" },
  { id: "SCN-8830", file: "wallpaper_pack.zip", hash: "e5fa44f2b31c1fb5...5c5cf03c", risk: 12, verdict: "Clean", status: "low", date: "Aug 30, 2026", time: "11:18", analyst: "Auto-scan" },
  { id: "SCN-8829", file: "team_notes.docx", hash: "3596ba00191893b2...b1f8ee94", risk: 6, verdict: "Clean", status: "low", date: "Aug 29, 2026", time: "18:04", analyst: "Auto-scan" },
  { id: "SCN-8828", file: "cracked_license.exe", hash: "7902699be42c8a8e...a0b8b9c6", risk: 95, verdict: "Ransomware.GenKD", status: "critical", date: "Aug 29, 2026", time: "16:47", analyst: "S. Rangan" },
  { id: "SCN-8827", file: "browser_ext.crx", hash: "2c624232cdd221771...7b16bee1", risk: 62, verdict: "Adware bundle", status: "medium", date: "Aug 29, 2026", time: "15:12", analyst: "Auto-scan" },
  { id: "SCN-8826", file: "firmware_update.bin", hash: "19581e27de7ced00...3c40098c", risk: 33, verdict: "Suspicious archive", status: "medium", date: "Aug 29, 2026", time: "12:39", analyst: "M. Chen" },
  { id: "SCN-8825", file: "onboarding_guide.pdf", hash: "0263829989b6fd95...0b8ba1cd", risk: 4, verdict: "Clean", status: "low", date: "Aug 28, 2026", time: "17:20", analyst: "Auto-scan" },
  { id: "SCN-8824", file: "vendor_invoice.exe", hash: "07523dd9d4a2ceec...b0f9e5d1", risk: 79, verdict: "Trojan", status: "high", date: "Aug 28, 2026", time: "14:55", analyst: "A. Fernandes" },
];

export const staticAnalysisExample = {
  fileName: "invoice.exe",
  sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85",
  md5: "5d41402abc4b2a76b9719d911017c592",
  fileType: "PE32 executable (GUI) Intel 80386, for MS Windows",
  size: "812 KB",
  indicators: [
    { label: "Suspicious PowerShell commands detected", severity: "high" },
    { label: "Malicious URL references found", severity: "critical" },
    { label: "YARA rule match: trojan_generic_dropper", severity: "critical" },
    { label: "Unsigned binary, no publisher certificate", severity: "medium" },
    { label: "Packed with UPX-modified stub", severity: "medium" },
  ],
  riskScore: 82,
  classification: "Potential Trojan Malware",
  recommendedAction: "Escalate to Security Analyst for investigation",
};

export const alerts = [
  { id: "ALT-2291", title: "Critical: Ransomware signature matched", source: "vpn_client.dll", severity: "critical", time: "12 min ago", ack: false },
  { id: "ALT-2290", title: "High risk score on uploaded archive", source: "update_patch.zip", severity: "high", time: "48 min ago", ack: false },
  { id: "ALT-2289", title: "New YARA rule match across 3 files", severity: "high", source: "Threat feed sync", time: "1 hr ago", ack: true },
  { id: "ALT-2288", title: "Suspicious outbound IP in static analysis", source: "invoice.exe", severity: "medium", time: "2 hr ago", ack: true },
  { id: "ALT-2287", title: "VirusTotal feed unreachable, retry scheduled", severity: "low", source: "System", time: "4 hr ago", ack: true },
];

export const detectionLogs = [
  { time: "14:52:03", event: "Static scan completed", target: "invoice.exe", result: "Trojan detected", status: "critical" },
  { time: "14:44:11", event: "File uploaded", target: "quarterly_report.docm", result: "Queued for analysis", status: "info" },
  { time: "14:31:47", event: "YARA match", target: "vpn_client.dll", result: "Ransomware.GenKD", status: "critical" },
  { time: "14:12:09", event: "Static scan completed", target: "setup_v2.msi", result: "Clean", status: "low" },
  { time: "13:58:22", event: "Alert acknowledged", target: "ALT-2289", result: "By R. Ibarra", status: "info" },
  { time: "13:40:05", event: "Static scan completed", target: "update_patch.zip", result: "Suspicious archive", status: "medium" },
];

export const predictionInsights = [
  {
    title: "Behavioral drift on endpoint fleet",
    description: "12 endpoints show process-injection patterns consistent with a known trojan family, despite no signature match yet.",
    confidence: 78,
    severity: "high",
  },
  {
    title: "Unknown sample resembles ransomware family",
    description: "Static features of vpn_client.dll cluster closely with GenKD ransomware in embedding space.",
    confidence: 91,
    severity: "critical",
  },
  {
    title: "Low-confidence anomaly in archive handling",
    description: "update_patch.zip shows nested archive obfuscation, a technique associated with loader malware.",
    confidence: 54,
    severity: "medium",
  },
];

export const users = [
  { id: "U-001", name: "Sundar Rangan", email: "s.rangan@threatlens.io", role: "Administrator", status: "active", lastActive: "Just now" },
  { id: "U-002", name: "Ana Fernandes", email: "a.fernandes@threatlens.io", role: "Security Analyst", status: "active", lastActive: "10 min ago" },
  { id: "U-003", name: "Raul Ibarra", email: "r.ibarra@threatlens.io", role: "SOC Team Member", status: "active", lastActive: "1 hr ago" },
  { id: "U-004", name: "Mei Chen", email: "m.chen@threatlens.io", role: "Researcher", status: "invited", lastActive: "—" },
  { id: "U-005", name: "Devon Clarke", email: "d.clarke@threatlens.io", role: "SOC Team Member", status: "suspended", lastActive: "6 days ago" },
];
