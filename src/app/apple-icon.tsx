import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const PETAL = {
  borderRadius: "62% 62% 56% 56% / 78% 78% 38% 38%",
};

/**
 * iOS home-screen icon: the same layered rose as the site, on ivory.
 * Drawn from plain divs so it renders deterministically at build time.
 */
export default function AppleIcon() {
  const outer = [0, 72, 144, 216, 288];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(150deg, #FFFDF9 0%, #FBE8EC 55%, #F3CFD7 100%)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 132,
            height: 132,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {outer.map((angle) => (
            <div
              key={angle}
              style={{
                position: "absolute",
                width: 62,
                height: 76,
                left: 35,
                top: 12,
                transformOrigin: "50% 78%",
                transform: `rotate(${angle}deg)`,
                background: "linear-gradient(180deg, #F3D2DA 0%, #D99BAA 55%, #B4637A 100%)",
                ...PETAL,
              }}
            />
          ))}

          {[36, 108, 180, 252, 324].map((angle) => (
            <div
              key={`inner-${angle}`}
              style={{
                position: "absolute",
                width: 44,
                height: 54,
                left: 44,
                top: 40,
                transformOrigin: "50% 76%",
                transform: `rotate(${angle}deg)`,
                background: "linear-gradient(180deg, #F6DCE3 0%, #C47F92 52%, #8A3F53 100%)",
                ...PETAL,
              }}
            />
          ))}

          <div
            style={{
              position: "relative",
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "linear-gradient(160deg, #C88B9B 0%, #722F43 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#F0D6A4",
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
