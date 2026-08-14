jest.mock("axios", () => ({
  create: jest.fn(() => ({ post: jest.fn() })),
}));
jest.mock("supertokens-auth-react/recipe/session", () => ({
  __esModule: true,
  default: { addAxiosInterceptors: jest.fn() },
}));

import { api, payWithRazorpay, setupAutopay } from "./lib/api";

const mockPost = api.post;
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Razorpay Checkout behavior", () => {
  let checkoutOptions;
  let checkoutHandlers;
  let open;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutOptions = null;
    checkoutHandlers = {};
    open = jest.fn();
    window.Razorpay = jest.fn(function Razorpay(options) {
      checkoutOptions = options;
      this.open = open;
      this.on = (event, handler) => {
        checkoutHandlers[event] = handler;
      };
    });
  });

  afterEach(() => {
    delete window.Razorpay;
  });

  test("opens checkout with the order created by the API and verifies success", async () => {
    mockPost
      .mockResolvedValueOnce({
        data: { key_id: "rzp_test_public", order_id: "order_123", amount: 50000, currency: "INR" },
      })
      .mockResolvedValueOnce({ data: { ok: true, purpose: "deposit" } });

    const result = payWithRazorpay(
      { purpose: "deposit", amount: 500, kudam_id: "kudam-1" },
      { name: "Meena", email: "meena@example.test" }
    );
    await flushPromises();

    expect(open).toHaveBeenCalledTimes(1);
    expect(checkoutOptions).toMatchObject({
      key: "rzp_test_public",
      order_id: "order_123",
      amount: 50000,
      currency: "INR",
    });

    await checkoutOptions.handler({
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "signature_123",
    });

    await expect(result).resolves.toEqual({ ok: true, purpose: "deposit" });
    expect(mockPost).toHaveBeenLastCalledWith("/payments/verify", {
      razorpay_order_id: "order_123",
      razorpay_payment_id: "pay_123",
      razorpay_signature: "signature_123",
    });
  });

  test("shows the backend configuration error instead of a generic request failure", async () => {
    mockPost.mockRejectedValueOnce({
      message: "Request failed with status code 503",
      response: { data: { detail: "Razorpay is not configured." } },
    });

    await expect(payWithRazorpay({ purpose: "deposit" }, {})).rejects.toThrow(
      "Razorpay is not configured."
    );
    expect(window.Razorpay).not.toHaveBeenCalled();
  });

  test("opens subscription checkout and surfaces provider payment failures", async () => {
    mockPost.mockResolvedValueOnce({
      data: {
        key_id: "rzp_test_public",
        subscription_id: "sub_123",
        amount: 5,
        weekly_amount: 35,
      },
    });

    const result = setupAutopay({ name: "Meena", email: "meena@example.test" });
    await flushPromises();

    expect(open).toHaveBeenCalledTimes(1);
    expect(checkoutOptions).toMatchObject({
      key: "rzp_test_public",
      subscription_id: "sub_123",
    });

    checkoutHandlers["payment.failed"]({ error: { description: "UPI mandate was declined" } });
    await expect(result).rejects.toThrow("UPI mandate was declined");
  });
});
