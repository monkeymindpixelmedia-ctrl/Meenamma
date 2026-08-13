import axios from "axios";
import { supabase } from "./supabase";

export const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

export const imgUrl = (p) =>
  p && p.startsWith("/") ? `${process.env.REACT_APP_BACKEND_URL}${p}` : p;

export const haptic = () => {
  try {
    if (navigator.vibrate) navigator.vibrate(12);
  } catch (e) {}
};

export function formatApiErrorDetail(detail) {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

let rzpScriptPromise = null;
function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true);
  if (!rzpScriptPromise) {
    rzpScriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(s);
    });
  }
  return rzpScriptPromise;
}

export async function payWithRazorpay(orderPayload, user, endpoint = "/payments/create-order") {
  await loadRazorpayScript();
  const { data: order } = await api.post(endpoint, orderPayload);
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: "Meenamma",
      description:
        orderPayload.purpose === "deposit"
          ? "Kudam Deposit"
          : orderPayload.purpose === "booking"
          ? "Catch Pre-booking"
          : "Reserved Catch",
      prefill: { name: user?.name || "", email: user?.email || "" },
      theme: { color: "#4A1C17" },
      handler: async (res) => {
        try {
          const { data } = await api.post("/payments/verify", {
            razorpay_order_id: res.razorpay_order_id,
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_signature: res.razorpay_signature,
          });
          resolve(data);
        } catch (e) {
          reject(new Error(formatApiErrorDetail(e.response?.data?.detail)));
        }
      },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    rzp.open();
  });
}

export async function setupAutopay(user) {
  await loadRazorpayScript();
  const { data: sub } = await api.post("/autopay/subscribe");
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: sub.key_id,
      subscription_id: sub.subscription_id,
      name: "Meenamma",
      description: `UPI Autopay · ₹${sub.amount}/day (billed ₹${sub.weekly_amount}/week)`,
      prefill: { name: user?.name || "", email: user?.email || "" },
      theme: { color: "#4A1C17" },
      handler: async (res) => {
        try {
          const { data } = await api.post("/autopay/verify", {
            razorpay_payment_id: res.razorpay_payment_id,
            razorpay_subscription_id: res.razorpay_subscription_id,
            razorpay_signature: res.razorpay_signature,
          });
          resolve(data);
        } catch (e) {
          reject(new Error(formatApiErrorDetail(e.response?.data?.detail)));
        }
      },
      modal: { ondismiss: () => reject(new Error("Autopay setup cancelled")) },
    });
    rzp.open();
  });
}
