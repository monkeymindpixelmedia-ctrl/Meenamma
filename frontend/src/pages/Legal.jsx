import React, { useEffect } from "react";
import { useParams } from "react-router-dom";

const POLICIES = {
  privacy: {
    title: "Privacy Policy",
    content: `
      MEENAMMA values your privacy. This Privacy Policy describes how we collect, use, and share your personal information when you visit or make a purchase from our site.
      
      We collect standard device information and order information necessary to process your purchases and provide a seamless experience. We share your information with payment processors like Razorpay to securely execute transactions.
      
      Your data is kept strictly confidential and is not sold to third parties. If you have any questions about our privacy practices, please contact us at [Insert Email Address].
    `
  },
  terms: {
    title: "Terms and Conditions",
    content: `
      Welcome to MEENAMMA. By accessing or using our website and purchasing our products, you agree to be bound by these Terms and Conditions.
      
      All products remain subject to availability. We reserve the right to refuse service, terminate accounts, or cancel orders in our sole discretion. Prices for our products are subject to change without notice.
      
      Meenamma is a registered business located at [Insert Registered Business Address]. For support, please reach out to [Insert Email Address].
    `
  },
  refund: {
    title: "Cancellation & Refund Policy",
    content: `
      At MEENAMMA, we strive to ensure you receive the highest quality products. 
      
      **Cancellations:**
      Orders can be cancelled prior to dispatch. Once an order is dispatched or a daily delivery is scheduled, cancellation requests may not be honored.
      
      **Refunds:**
      If you receive a defective or incorrect item, please contact us within 24 hours of delivery at [Insert Email Address] with photographic evidence. Approved refunds will be processed back to your original payment method (via Razorpay) within 5-7 business days.
    `
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    content: `
      MEENAMMA provides local delivery services for all our products.
      
      **Delivery Timeframes:**
      Orders are typically processed and dispatched within 1-2 business days. For daily subscriptions, delivery occurs daily as per the agreed schedule.
      
      **Shipping Charges:**
      Delivery fees are calculated at checkout based on your location. 
      
      If you experience any delays or issues with your delivery, please contact our support team immediately at [Insert Email Address].
    `
  }
};

export default function Legal() {
  const { policy } = useParams();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [policy]);

  const data = POLICIES[policy];

  if (!data) {
    return (
      <div className="min-h-screen bg-sandalwood-paper pt-24 px-4 flex items-start justify-center">
        <p className="font-serif italic text-gold-dim">Policy not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-sandalwood-paper pt-24 pb-32 px-4 md:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-serif text-3xl md:text-4xl text-henna mb-12 text-center" style={{ letterSpacing: "0.05em" }}>
          {data.title}
        </h1>
        <div className="text-henna/80 leading-relaxed font-sans space-y-6 whitespace-pre-wrap">
          {data.content.trim().split('\\n\\n').map((paragraph, idx) => {
            const isBold = paragraph.trim().startsWith('**');
            return (
              <p key={idx} className={isBold ? "font-bold mt-8" : ""}>
                {paragraph.replace(/\\*\\*/g, '').trim()}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
