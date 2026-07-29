import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(140deg, #3D2519, #2C1B14)",
          borderRadius: 7,
        }}
      >
        <span
          style={{
            color: "#E0BD84",
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
          }}
        >
          I
        </span>
      </div>
    ),
    { ...size },
  );
}
