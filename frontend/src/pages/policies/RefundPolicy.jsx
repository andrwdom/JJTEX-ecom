import React from 'react';
import Title from '../../components/Title';

const RefundPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-2xl mb-8">
        <Title text1="REFUND" text2="POLICY" />
      </div>
      <div className="prose prose-lg max-w-none">
        <p>
          To apply for Return or Refund please contact us within 48 hours from the order delivery date.
        </p>
        <p>
          Refund Policy - The eligible refund will process in 3 – 4 business days, and the amount will be credited to the original payment method or source within 5 – 7 business days.
        </p>
      </div>
    </div>
  );
};

export default RefundPolicy; 