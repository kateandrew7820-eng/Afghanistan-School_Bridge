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
    const timer = setTimeout(() => {
      setStatus("pending");
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
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

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // REJECTED STATE
  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border rounded-2xl p-6 text-center space-y-4 shadow-md">
          <h2 className="text-red-500 text-xl font-bold">
            Account Rejected
          </h2>

          <p className="text-muted-foreground">
            Please contact admin for more information.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // PENDING STATE (MAIN UI)
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-yellow-50 via-background to-yellow-100">

      <div className="w-full max-w-lg bg-card border rounded-2xl shadow-lg p-8 text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <Clock className="w-14 h-14 text-yellow-500 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold">
          Verification Pending
        </h1>

        {/* Description */}
        <p className="text-muted-foreground">
          Your account is currently under review by the system.
        </p>

        {/* Countdown Alert */}
        <div className="flex items-center justify-center gap-2 text-sm bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          Redirecting in {countdown}s
        </div>

        {/* Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center gap-2 w-full border py-2 rounded-lg hover:bg-accent transition"
        >
          <ExternalLink className="w-4 h-4" />
          System Info
        </button>

      </div>
    </div>
  );
}