import React from 'react';

interface CurrencyDisplayProps {
  points: number;
  className?: string;
}

const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({ points, className }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Placeholder icon - replace with an actual icon component if needed */}
      <span role="img" aria-label="coin">🪙</span>
      <span className="font-semibold">{points}</span>
    </div>
  );
};

export default CurrencyDisplay;