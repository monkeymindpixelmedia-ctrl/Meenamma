import axios from "axios";
import Session from "supertokens-auth-react/recipe/session";

export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/api",
  withCredentials: true,
});

Session.addAxiosInterceptors(api);

export const imgUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${process.env.REACT_APP_API_URL || "/api"}/uploads/${path}`;
};

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
const RAZORPAY_CHECKOUT_URL = "https://checkout.razorpay.com/v1/checkout.js";

function checkoutError(error, fallback) {
  const detail = formatApiErrorDetail(error?.response?.data?.detail);
  return new Error(detail || error?.message || fallback);
}

export function loadRazorpayScript() {
  if (typeof window.Razorpay === "function") return Promise.resolve();
  if (rzpScriptPromise) return rzpScriptPromise;

  const scriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${RAZORPAY_CHECKOUT_URL}"]`);
    const loaded = () => {
      if (typeof window.Razorpay === "function") resolve();
      else reject(new Error("Razorpay Checkout loaded incorrectly. Please refresh and try again."));
    };
    const failed = () => {
      script?.remove();
      reject(new Error(
        "Unable to load Razorpay Checkout. Check your connection or content blocker and try again."
      ));
    };

    if (script) {
      script.addEventListener("load", loaded, { once: true });
      script.addEventListener("error", failed, { once: true });
      return;
    }

    script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_URL;
    script.async = true;
    script.addEventListener("load", loaded, { once: true });
    script.addEventListener("error", failed, { once: true });
    document.head.appendChild(script);
  });

  rzpScriptPromise = scriptPromise.catch((error) => {
    rzpScriptPromise = null;
    throw error;
  });
  return rzpScriptPromise;
}

function assertCheckoutPayload(payload, idField) {
  if (!payload?.key_id || !payload?.[idField]) {
    throw new Error("Razorpay configuration is incomplete. Please contact support.");
  }
}

function rejectPaymentFailure(reject, response, fallback) {
  const providerError = response?.error;
  reject(new Error(providerError?.description || providerError?.reason || fallback));
}

export async function payWithRazorpay(orderPayload, user, endpoint = "/payments/create-order") {
  await loadRazorpayScript();
  let order;
  try {
    ({ data: order } = await api.post(endpoint, orderPayload));
    assertCheckoutPayload(order, "order_id");
  } catch (error) {
    throw checkoutError(error, "Unable to create the Razorpay order.");
  }
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
          reject(checkoutError(e, "Payment verification failed."));
        }
      },
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
    });
    if (typeof rzp.on === "function") {
      rzp.on("payment.failed", (response) =>
        rejectPaymentFailure(reject, response, "Payment failed. Please try again."));
    }
    rzp.open();
  });
}

export async function setupAutopay(user) {
  await loadRazorpayScript();
  let sub;
  try {
    ({ data: sub } = await api.post("/autopay/subscribe"));
    assertCheckoutPayload(sub, "subscription_id");
  } catch (error) {
    throw checkoutError(error, "Unable to create the Razorpay subscription.");
  }
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
          reject(checkoutError(e, "Autopay verification failed."));
        }
      },
      modal: { ondismiss: () => reject(new Error("Autopay setup cancelled")) },
    });
    if (typeof rzp.on === "function") {
      rzp.on("payment.failed", (response) =>
        rejectPaymentFailure(reject, response, "Autopay authorisation failed. Please try again."));
    }
    rzp.open();
  });
}
