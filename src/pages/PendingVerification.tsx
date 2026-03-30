import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, AlertCircle } from "lucide-react";


type Status = "pending" | "rejected" | "approved";

export default function PendingVerification() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("pending");
  const [error, setError] = useState<string | null>(null);

  // 🔥 REAL FETCH FUNCTION
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/verification-status", {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Network error");

      const data = await res.json();
      setStatus(data.status);
      setError(null);
    } catch (err: any) {
      setError("خطا در دریافت وضعیت");
    } finally {
      setLoading(false);
    }
  };

  // 🚀 INITIAL LOAD
  useEffect(() => {
    fetchStatus();
  }, []);

  // 🔁 POLLING (every 5s if pending)
  useEffect(() => {
    if (status !== "pending") return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [status]);

  // 🎯 AUTO REDIRECT
  useEffect(() => {
    if (status === "approved") {
      setTimeout(() => navigate("/dashboard"), 800);
    }
  }, [status]);

  // LOADING
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
        <p>در حال بررسی حساب...</p>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="text-red-500" />
        <p>{error}</p>
        <button
          onClick={fetchStatus}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  // REJECTED
  if (status === "rejected") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white border rounded-xl p-6 text-center space-y-4">
          <h2 className="text-red-500 font-bold">حساب رد شده</h2>
          <p>لطفاً با پشتیبانی تماس بگیرید</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            بازگشت به ورود
          </button>
        </div>
      </div>
    );
  }

  // PENDING
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white border rounded-xl p-8 text-center space-y-5">

        <Clock className="w-12 h-12 text-yellow-500 animate-pulse mx-auto" />

        <h1 className="text-xl font-bold">در حال بررسی</h1>

        <p className="text-gray-500 text-sm">
          حساب شما هنوز تایید نشده است. این صفحه به صورت خودکار بروزرسانی می‌شود.
        </p>

        <div className="text-xs text-gray-400">
          بررسی هر 5 ثانیه
        </div>

        <button
          onClick={() => navigate("/")}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          بازگشت به صفحه اصلی
        </button>

      </div>
    </div>
  );
}
