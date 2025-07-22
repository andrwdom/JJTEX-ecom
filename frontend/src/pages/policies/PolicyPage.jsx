import React from 'react';
import Title from '../../components/Title';

const PolicyPage = ({ title1, title2, children }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-2xl mb-8">
        <Title text1={title1} text2={title2} />
      </div>
      <div className="text-gray-800 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default PolicyPage; 