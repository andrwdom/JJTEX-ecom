import React from 'react';
import Title from '../../components/Title';

const PolicyPrivacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-2xl mb-8">
        <Title text1="PRIVACY" text2="POLICY" />
      </div>
      <div className="prose prose-lg max-w-none">
        <p>
          We respect your privacy. Your information is used only to process your orders and will not be shared with third parties. For any privacy-related concerns, please contact us.
        </p>
      </div>
    </div>
  );
};

export default PolicyPrivacy; 