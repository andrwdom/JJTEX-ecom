import React from 'react';
import Title from '../../components/Title';

const TermsAndConditions = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-2xl mb-8">
        <Title text1="TERMS" text2="AND CONDITIONS" />
      </div>
      <div className="text-gray-800 leading-relaxed">
        <p className="mb-4">
          By using this website, you agree to comply with and be bound by the following terms and conditions. Please review them carefully before using the website.
        </p>
        <p className="mb-4">
          The brand/business name is JJ Textiles. All prices are in ₹/Rs./INR. We reserve the right to update or modify these terms at any time without prior notice.
        </p>
      </div>
    </div>
  );
};

export default TermsAndConditions; 