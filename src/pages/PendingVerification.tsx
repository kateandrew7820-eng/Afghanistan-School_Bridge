import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, ExternalLink } from "lucide-react";

type Status = "pending" | "rejected" | "approved";

export default function PendingVerification() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("pending");
  const [countdown, setCountdown] = useState(3);

  // simulate fetch
  useEffect(() => {
    let mounted = true;

    const timer = setTimeout(() => {
      if (!mounted) return;
      setStatus("pending");
      setLoading(false);
    }, 1000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // countdown redirect
  useEffect(() => {
    if (loading || status !== "pending") return;

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate("/afghanistan-info");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, status, navigate]);

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
          <p>Please contact admin.</p>
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
          <ExternalLink size={16} />
          System Info
        </button>
      </div>
    </div>
  );
}