/**
 * bandwidth.ts — measures download/upload speed and latency
 */
/**
 * Measure bandwidth using a known public speed test endpoint.
 * Falls back to a simple latency test if speed test fails.
 */
export async function measureBandwidth() {
    const latency = await measureLatency();
    // Use a public CDN/endpoint for speed test
    // This uses a ~1MB test file
    const testUrl = "https://speed.cloudflare.com/__down?bytes=1000000";
    console.log("    Testing download...");
    const startDown = Date.now();
    let downloadMbps = 0;
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        const res = await fetch(testUrl, {
            signal: controller.signal,
            method: "GET",
        });
        clearTimeout(timeout);
        if (res.ok) {
            const data = await res.arrayBuffer();
            const bytes = data.byteLength;
            const seconds = (Date.now() - startDown) / 1000;
            const bitsPerSec = (bytes * 8) / seconds;
            downloadMbps = bitsPerSec / 1_000_000; // Mbps
        }
    }
    catch (e) {
        console.warn("    ⚠️ Download test failed, using latency estimate");
        // Estimate from latency as fallback
        downloadMbps = Math.max(1, 100 / Math.max(latency, 10));
    }
    // Upload estimate: typically 20-50% of download for most connections
    // For real upload test, you'd upload to a server
    const uploadMbps = downloadMbps * 0.3; // Conservative estimate
    return {
        download: Math.round(downloadMbps * 10) / 10,
        upload: Math.round(uploadMbps * 10) / 10,
        latencyMs: latency,
    };
}
/**
 * Measure round-trip latency to a public endpoint.
 */
async function measureLatency() {
    const targets = [
        "https://1.1.1.1/cdn-cgi/trace",
        "https://cloudflare.com/cdn-cgi/trace",
        "https://8.8.8.8",
    ];
    const latencies = [];
    for (const url of targets) {
        try {
            const start = Date.now();
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            await fetch(url, {
                method: "GET",
                signal: controller.signal,
            });
            clearTimeout(timeout);
            latencies.push(Date.now() - start);
            if (latencies.length >= 2)
                break;
        }
        catch {
            // try next
        }
    }
    if (latencies.length === 0) {
        return 0;
    }
    // Return median latency
    latencies.sort((a, b) => a - b);
    return latencies[Math.floor(latencies.length / 2)];
}
