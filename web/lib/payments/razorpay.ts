export type RazorpayCheckoutSuccess = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export class RazorpayDismissedError extends Error {
  constructor() {
    super("Payment cancelled");
    this.name = "RazorpayDismissedError";
  }
}

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: RazorpaySuccessResponse) => void;
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, handler: () => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay requires a browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay")),
      );
      if (window.Razorpay) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Opens Razorpay Checkout.js. Resolves with payment ids on success;
 * rejects with RazorpayDismissedError if the customer closes the modal.
 */
export async function openRazorpayCheckout(input: {
  key: string;
  razorpayOrderId: string;
  amountPaise: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}): Promise<RazorpayCheckoutSuccess> {
  await loadRazorpayScript();

  const Razorpay = window.Razorpay;
  if (!Razorpay) {
    throw new Error("Razorpay is unavailable");
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const instance = new Razorpay({
      key: input.key,
      amount: input.amountPaise,
      currency: "INR",
      name: "Ishraq Parfums",
      description: "Your fragrance order",
      order_id: input.razorpayOrderId,
      prefill: {
        name: input.customerName,
        email: input.customerEmail,
        contact: input.customerPhone,
      },
      theme: { color: "#d6a851" },
      handler(response) {
        settled = true;
        resolve({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss() {
          if (!settled) {
            settled = true;
            reject(new RazorpayDismissedError());
          }
        },
      },
    });

    instance.open();
  });
}
