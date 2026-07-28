import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Card: React.FC<CardProps> = ({ className, children, ...props }) => (
  <div
    className={`bg-white border border-gray-200 rounded-lg shadow-sm p-6 card-hover ${className || ''}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
