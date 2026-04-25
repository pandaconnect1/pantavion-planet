import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 74% 14%, rgba(243,196,84,.26), transparent 300px), linear-gradient(135deg,#020712,#071a2d)",
          color: "#fff7e8",
          padding: 72,
          fontFamily: "Arial"
        }}
      >
        <div style={{ fontSize: 28, color: "#f3c454", fontWeight: 900, letterSpacing: 8 }}>
          PANTAVION ONE
        </div>
        <div style={{ fontSize: 82, fontWeight: 900, lineHeight: 1.02, marginTop: 28 }}>
          Global ecosystem. Governed execution.
        </div>
        <div style={{ fontSize: 30, color: "#c7d4df", marginTop: 32, maxWidth: 930 }}>
          Not a static site. A public foundation for a real platform.
        </div>
      </div>
    ),
    { ...size }
  );
}
