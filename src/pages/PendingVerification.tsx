import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, ExternalLink } from "lucide-react";

export default function PendingVerification() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [countdown, setCountdown] = useState(3);

  // simulate profile fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("pending");
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // redirect countdown
  useEffect(() => {
    if (status !== "pending") return;

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          navigate("/afghanistan-info");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, navigate]);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner} />
        <p>Loading...</p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div style={styles.center}>
        <div style={styles.card}>
          <h2 style={{ color: "red" }}>Account Rejected</h2>
          <p>Please contact the administrator.</p>
          <button style={styles.button} onClick={() => navigate("/login")}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.cardLarge}>
        <Clock size={60} color="#eab308" />

        <h1>Verification Pending</h1>

        <p>Your account is under review.</p>

        <div style={styles.alert}>
          <AlertCircle size={16} />
          Redirecting in {countdown}s
        </div>

        <button
          style={styles.buttonOutline}
          onClick={() => navigate("/afghanistan-info")}
        >
          <ExternalLink size={16} /> System Info
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg,#f8fafc,#eef2ff)"
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "12px"
  },

  cardLarge: {
    background: "white",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center" as const,
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    maxWidth: "420px",
    width: "100%",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
    alignItems: "center"
  },

  card: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    textAlign: "center" as const,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
  },

  alert: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    background: "#e0f2fe",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "14px"
  },

  button: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "white",
    cursor: "pointer"
  },

  buttonOutline: {
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "white",
    cursor: "pointer",
    display: "flex",
    gap: "6px",
    alignItems: "center"
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e5e7eb",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  }
};
