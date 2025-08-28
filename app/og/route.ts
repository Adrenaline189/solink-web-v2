// app/og/route.ts
import { ImageResponse } from "next/og";
import * as React from "react";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const title = (searchParams.get("title") ?? "Solink").slice(0, 80);
  const subtitle = (searchParams.get("subtitle") ?? "Share bandwidth. Earn rewards.").slice(0, 120);

  const container: React.CSSProperties = {
    height: "100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "linear-gradient(180deg, rgb(2,6,23) 0%, rgb(15,23,42) 100%)",
    color: "white",
    padding: "64px",
    gap: "16px",
    fontFamily: "Inter, ui-sans-serif, system-ui",
  };
  const titleStyle: React.CSSProperties = { fontSize: 56, fontWeight: 800, letterSpacing: -1 };
  const subStyle: React.CSSProperties = { fontSize: 28, color: "rgb(148,163,184)" };
  const row: React.CSSProperties = {
    marginTop: 24,
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "rgb(125,211,252)",
    fontSize: 24,
  };
  const dot: React.CSSProperties = {
    height: 16,
    width: 16,
    borderRadius: 9999,
    background: "rgb(56,189,248)",
  };

  const tree = React.createElement(
    "div",
    { style: container },
    React.createElement("div", { style: titleStyle }, title),
    React.createElement("div", { style: subStyle }, subtitle),
    React.createElement("div", { style: row }, React.createElement("div", { style: dot }), "solink.network")
  );

  return new ImageResponse(tree, { width: 1200, height: 630 });
}
