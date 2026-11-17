"use client";

/**
 * Last-resort handler for errors thrown in the root layout itself, where the
 * normal error boundary cannot render. Kept deliberately plain: no fonts, no
 * components, no styling framework — just something readable.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFF8F0",
          color: "#722F43",
          fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "26rem" }}>
          <h1 style={{ fontSize: "1.6rem", margin: "0 0 0.75rem" }}>
            Ekta chhoto jhamela hoye geche
          </h1>
          <p style={{ margin: "0 0 1.5rem", lineHeight: 1.6, opacity: 0.8 }}>
            Kichu ekta thik moto load hote pareni, my love. Tomar kono kichu
            haray ni — ekbar arekbar chesta koro.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "0.85rem 1.6rem",
              background: "#722F43",
              color: "#FFF8F0",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            Abar chesta kori
          </button>
          {error.digest ? (
            <p style={{ marginTop: "1.5rem", fontSize: "0.7rem", opacity: 0.45 }}>
              {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
