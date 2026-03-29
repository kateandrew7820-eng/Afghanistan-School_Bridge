import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle, Sparkles } from "lucide-react";
import { useInRouterContext } from "react-router-dom";

type Status = "pending" | "rejected" | "approved";
const inRouter = useInRouterContext();
const navigate = inRouter ? useNavigate() : null;
export default function PendingVerification() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("pending");

  const [countdown, setCountdown] = useState(3);
  const [showDecision, setShowDecision] = useState(false);
  const [fading, setFading] = useState(false);

  // simulate fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus("pending");
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // countdown
  useEffect(() => {
    if (loading || status !== "pending") return;

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setShowDecision(true); // 👉 show decision UI instead of auto jump
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, status]);

  const goHome = () => {
    setFading(true);
    setTimeout(() => navigate("/"), 600);
  };

  const goLogin = () => {
    setFading(true);
    setTimeout(() => navigate("/login"), 600);
  };

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">در حال بررسی حساب...</p>
      </div>
    );
  }

  // REJECTED
  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-card border rounded-2xl p-6 text-center space-y-4 shadow-md">
          <h2 className="text-red-500 text-xl font-bold">
            حساب رد شده است
          </h2>

          <p className="text-muted-foreground">
            لطفاً با مدیریت تماس بگیرید.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
          >
            بازگشت به ورود
          </button>
        </div>
      </div>
    );
  }

  // MAIN PENDING UI
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-yellow-50 via-background to-yellow-100 transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}>

      {/* CARD */}
      <div className="w-full max-w-lg bg-card border rounded-2xl shadow-xl p-8 text-center space-y-6">

        {/* ICON */}
        <div className="flex justify-center">
          <Clock className="w-14 h-14 text-yellow-500 animate-pulse" />
        </div>

        {/* TITLE */}
        <h1 className="text-2xl font-bold">
          وضعیت بررسی حساب
        </h1>

        {/* DESCRIPTION */}
        <p className="text-muted-foreground">
          حساب شما در حال بررسی توسط سیستم است.
        </p>

        {/* TIMER */}
        {!showDecision && (
          <div className="flex items-center justify-center gap-2 text-sm bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            انتقال خودکار در {countdown} ثانیه
          </div>
        )}

        {/* AFTER TIMER: DUOLINGO STYLE CARD */}
        {showDecision && (
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border rounded-xl p-5 space-y-4 animate-fade-in">

            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <Sparkles className="w-5 h-5" />
              آماده انتقال هستید
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              شما به صفحه اصلی هدایت خواهید شد که شامل اطلاعات عمومی افغانستان است.
              تا تکمیل بررسی حساب، دسترسی شما محدود باقی می‌ماند.
            </p>

            <div className="flex flex-col gap-3 pt-2">

              <button
                onClick={goHome}
                className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition font-medium"
              >
                ادامه
              </button>

              <button
                onClick={goLogin}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg transition"
              >
                لغو و بازگشت به ورود
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}