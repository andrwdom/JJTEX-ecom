import React from 'react';
import PolicyPage from './PolicyPage';

const TermsAndConditions = () => {
    const effectiveDate = new Date().toLocaleDateString('en-CA');
    const storeName = "JJTEX";

    return (
        <PolicyPage title1="TERMS" text2="AND CONDITIONS">
            <p className="mb-4">Effective Date: {effectiveDate}</p>
            <p className="mb-6">Store Name: {storeName}</p>

            <p className="mb-6">
                By accessing or purchasing from {storeName}, you agree to the following Terms and Conditions. Please read them carefully before using our website.
            </p>

            <h2 className="text-xl font-semibold mb-3">1. General</h2>
            <p className="mb-4">
                These Terms apply to all users of the site.
            </p>
            <p className="mb-6">
                We may update these Terms at any time without prior notice. Continued use of the website after changes means you accept the updated terms.
            </p>

            <h2 className="text-xl font-semibold mb-3">2. Products and Descriptions</h2>
            <p className="mb-4">
                We strive to provide accurate product images and details. However, colors may slightly vary depending on your screen settings.
            </p>
            <p className="mb-6">
                Product availability is subject to change without notice.
            </p>

            <h2 className="text-xl font-semibold mb-3">3. Orders and Payments</h2>
            <p className="mb-4">
                Placing an order means you agree to pay the total amount displayed at checkout.
            </p>
            <p className="mb-4">
                Accepted payment methods include: UPI, Credit/Debit Cards, Net Banking, COD.
            </p>
            <p className="mb-6">
                We reserve the right to cancel any order due to product unavailability, pricing errors, or suspected fraud.
            </p>

            <h2 className="text-xl font-semibold mb-3">4. Shipping and Delivery</h2>
            <p className="mb-4">
                Orders are typically processed within [X] business days.
            </p>
            <p className="mb-4">
                Delivery timelines are estimates and may vary based on location and external factors.
            </p>
            <p className="mb-6">
                We are not liable for delays caused by third-party delivery services.
            </p>

            <h2 className="text-xl font-semibold mb-3">5. Cancellations and Modifications</h2>
            <p className="mb-4">
                Orders can be canceled within [X] hours of placement if not yet shipped.
            </p>
            <p className="mb-6">
                Once shipped, cancellations or modifications are not allowed.
            </p>

            <h2 className="text-xl font-semibold mb-3">6. Returns and Exchanges</h2>
            <p className="mb-4">
                We accept returns or exchanges within [X] days of delivery.
            </p>
            <p className="mb-4">
                Items must be in original condition, unused, unwashed, and with all tags intact.
            </p>
            <p className="mb-6">
                Certain items (e.g., sale items, lingerie) are non-returnable. See our full return policy for details.
            </p>

            <h2 className="text-xl font-semibold mb-3">7. Pricing and Offers</h2>
            <p className="mb-4">
                All prices are listed in INR and include applicable taxes unless stated otherwise.
            </p>
            <p className="mb-6">
                Promotional offers are subject to change and may be withdrawn at any time without notice.
            </p>

            <h2 className="text-xl font-semibold mb-3">8. Intellectual Property</h2>
            <p className="mb-4">
                All content on our website, including logos, product images, text, and designs, are owned by {storeName} and protected by copyright laws.
            </p>
            <p className="mb-6">
                Unauthorized use or reproduction is prohibited.
            </p>

            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p className="mb-6">
                We are not responsible for any indirect, incidental, or consequential damages resulting from the use of our website or products.
            </p>

            <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
            <p className="mb-6">
                These Terms are governed by the laws of India. Any disputes shall be resolved under the jurisdiction of the courts in Chennai.
            </p>
        </PolicyPage>
    );
};

export default TermsAndConditions; 