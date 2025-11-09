// scripts/types.ts
export interface WalletConfig {
  wallet: string;
  token?: string; // optional; ถ้าไม่มีก็จะไป login เอา
}

export interface RateConfig {
  rps?: number;            // requests per second
  bucketSize?: number;     // token bucket size
  refillEveryMs?: number;  // ช่วงเวลา refill token
  jitterMs?: [number, number]; // random delay [min,max] ต่อ request
}

export interface AutoFarmConfig {
  baseUrl: string;         // เช่น https://api-solink.network
  type: string;            // เช่น extension_farm
  amount: number;          // แต้มต่อ 1 shot
  bursts: number;          // จำนวนครั้งยิงต่อกระเป๋า
  concurrency: number;     // งานพร้อมกันสูงสุด
  dailyCap: number;        // เพดานแต้มต่อวันต่อกระเป๋า
  wallets: WalletConfig[]; // รายการกระเป๋า
  rate?: RateConfig;       // ตัวเลือก rate limit
  adaptiveMode?: boolean;  // ปรับตาม 429 อัตโนมัติ
}

export interface WalletRun {
  wallet: string;
  token?: string;
  earned: number;
  shotsDone: number;
  shotsTried: number;
  lastBalance?: number;
  lastError?: string;
}

export interface RunTotals {
  wallets: number;
  successShots: number;
  failedShots: number;
  totalEarned: number;
}

export interface RunSummary {
  date: string;
  farmType: string;
  amountPerShot: number;
  bursts: number;
  concurrency: number;
  dailyCap: number;
  baseUrl: string;
  totals: RunTotals;
  perWallet: Record<string, WalletRun>;
}
