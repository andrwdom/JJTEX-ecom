import React from 'react';
import Title from '../../components/Title';

const ShippingPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-2xl mb-8">
        <Title text1="SHIPPING" text2="POLICY" />
      </div>
      <div className="prose prose-lg max-w-none">
        <p>
          Shipping Policy - All orders are processed within 24-48 hours of placement and are delivered within 4 to 7 business days.
        </p>
      </div>
    </div>
  );
};

export default ShippingPolicy; 