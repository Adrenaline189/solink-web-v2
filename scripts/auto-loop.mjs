import { exec } from "child_process";

console.log("🚀 Auto rollup running every hour, farm every minute");

// ฟาร์มทุก 1 นาที
setInterval(() => {
  exec("node scripts/farm-simulator.mjs", (err) => {
    if (err) console.error("farm error:", err.message);
    else console.log("🌱 farm tick done");
  });
}, 60_000);

// รวมผลทุกชั่วโมง
setInterval(() => {
  exec("npm run queue:rollup", (err) => {
    if (err) console.error("rollup queue error:", err.message);
    else console.log("🧮 queued rollup");
  });
}, 3_600_000);
