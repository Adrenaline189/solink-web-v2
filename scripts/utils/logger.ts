import fs from "fs";
import path from "path";

const logsDir = path.join(__dirname, "..", "logs");

// สร้างโฟลเดอร์ logs ถ้ายังไม่มี
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * บันทึกข้อความลง log ไฟล์รายวัน
 * ตัวอย่างไฟล์: /logs/2025-11-09.log
 */
export function log(message: string, level: "INFO" | "WARN" | "ERROR" = "INFO") {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const timeStr = now.toLocaleTimeString("th-TH", { hour12: false });
  const logFile = path.join(logsDir, `${dateStr}.log`);
  const line = `[${timeStr}] [${level}] ${message}\n`;
  fs.appendFileSync(logFile, line, "utf-8");
  console.log(line.trim());
}

/**
 * สรุปผลรายวัน (เขียนเป็น JSON)
 * ตัวอย่างไฟล์: /logs/2025-11-09.json
 */
export function writeDailySummary(summary: any) {
  const dateStr = new Date().toISOString().split("T")[0];
  const file = path.join(logsDir, `${dateStr}.json`);
  fs.writeFileSync(file, JSON.stringify(summary, null, 2), "utf-8");
  console.log(`📄 Saved summary → ${file}`);
}
