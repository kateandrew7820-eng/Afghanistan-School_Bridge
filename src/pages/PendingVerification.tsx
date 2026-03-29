import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, ExternalLink } from "lucide-react";

type Status = "pending" | "rejected" | "approved";

export default function PendingVerification() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("pending");
  const [countdown, setCountdown] = useState(3);

  // Simulate verification fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("pending");
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

<<<<<<< HEAD
  // Countdown logic (safe + stable)
=======
  // countdown redirect
>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed
  useEffect(() => {
    if (loading || status !== "pending") return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
<<<<<<< HEAD
          setShowDecision(true);
=======
          navigate("/afghanistan-info");
>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, status, navigate]);

<<<<<<< HEAD
  const navigateWithFade = (path: string) => {
    setFading(true);
    setTimeout(() => navigate(path, { replace: true }), 500);
  };

  // LOADING STATE
=======
  // LOADING STATE
>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed
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
<<<<<<< HEAD
          <h2 className="text-red-500 text-xl font-bold">حساب رد شده است</h2>
          <p className="text-muted-foreground">لطفاً با مدیریت تماس بگیرید.</p>
=======
          <h2 className="text-red-500 text-xl font-bold">
            Account Rejected
          </h2>
>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed

<<<<<<< HEAD
=======
          <p className="text-muted-foreground">
            Please contact admin for more information.
          </p>

>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed
          <button
            onClick={() => navigateWithFade("/login")}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

<<<<<<< HEAD
  // MAIN UI
=======
  // PENDING STATE (MAIN UI)
>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed
  return (
<<<<<<< HEAD
    <div
      className={`min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-yellow-50 via-background to-yellow-100 transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-lg bg-card border rounded-2xl shadow-xl p-8 text-center space-y-6">
=======
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-yellow-50 via-background to-yellow-100">

      <div className="w-full max-w-lg bg-card border rounded-2xl shadow-lg p-8 text-center space-y-6">
>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed

        {/* Icon */}
        <div className="flex justify-center">
          <Clock className="w-14 h-14 text-yellow-500 animate-pulse" />
        </div>

<<<<<<< HEAD
        {/* TITLE */}
        <h1 className="text-2xl font-bold">وضعیت بررسی حساب</h1>
=======
        {/* Title */}
        <h1 className="text-2xl font-bold">
          Verification Pending
        </h1>
>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed

        {/* Description */}
        <p className="text-muted-foreground">
          Your account is currently under review by the system.
        </p>

        {/* Countdown Alert */}
        <div className="flex items-center justify-center gap-2 text-sm bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          Redirecting in {countdown}s
        </div>

<<<<<<< HEAD
        {/* AFTER COUNTDOWN */}
        {showDecision && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border rounded-xl p-5 space-y-4 animate-in fade-in">
=======
        {/* Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center gap-2 w-full border py-2 rounded-lg hover:bg-accent transition"
        >
          <ExternalLink className="w-4 h-4" />
          System Info
        </button>
>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed

<<<<<<< HEAD
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <Sparkles className="w-5 h-5" />
              آماده انتقال هستید
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              شما به صفحه اصلی هدایت خواهید شد. دسترسی کامل پس از تکمیل بررسی فعال می‌شود.
            </p>

            <div className="flex flex-col gap-3 pt-2">

              <button
                onClick={() => navigateWithFade("/")}
                className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition font-medium"
              >
                ادامه
              </button>

              <button
                onClick={() => navigateWithFade("/login")}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
              >
                لغو و بازگشت به ورود
              </button>

            </div>
          </div>
        )}
=======
>>>>>>> 9eeee28f40279ab80f904335b8ab1dd61927daed
      </div>
    </div>
  );
}