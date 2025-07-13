import React from 'react';
import Title from '../../components/Title';

const ReturnPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-2xl mb-8">
        <Title text1="RETURN" text2="POLICY" />
      </div>
      <div className="prose prose-lg max-w-none">
        <p>
          To apply for Return or Refund please contact us within 48 hours from the order delivery date.
        </p>
        <p>
          Return Policy - The eligible Return/Replacement is processed in 3-4 business days, and the replacement will be delivered within 4 to 7 business days.
        </p>
      </div>
    </div>
  );
};

export default ReturnPolicy; 