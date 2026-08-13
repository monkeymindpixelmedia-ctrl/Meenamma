import axios from "axios";

export const api = axios.create({
  baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`,
  withCredentials: true,
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
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

export async function payWithRazorpay(orderPayload, user) {
  await loadRazorpayScript();
  const { data: order } = await api.post("/payments/create-order", orderPayload);
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      order_id: order.order_id,
      name: "Meenamma",
      description:
        orderPayload.purpose === "deposit" ? "Kudam Deposit" : "Catch Pre-booking",
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
