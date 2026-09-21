"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f0f0f",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          padding: "0 24px",
        }}
      >
        <p style={{ fontSize: 72, fontWeight: 700, margin: "0 0 16px" }}>Oops</p>
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 32px",
            maxWidth: 440,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Something went wrong. Please try again or go back to the homepage.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => {
              try {
                reset()
              } catch {
                window.location.reload()
              }
            }}
            style={{
              height: 40,
              padding: "0 20px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 40,
              padding: "0 20px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  )
}