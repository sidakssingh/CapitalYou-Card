import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * CategoryDial - A semi-circular dial component showing spending percentage
 * Styled to match Capital One's design language
 */
const CategoryDial = ({ category, percentage, pointsMultiplier, totalSpent, rank }) => {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // SVG dimensions
  const width = 180;
  const height = 100;
  const centerX = width / 2;
  const centerY = height - 5;
  const radius = 70;
  
  // Calculate the fill angle
  const fillAngle = (clampedPercentage / 100) * 180;
  
  // Convert to radians
  const startAngleRad = Math.PI;
  const endAngleRad = Math.PI - (fillAngle * Math.PI / 180);
  
  // Calculate endpoints
  const endX = centerX + radius * Math.cos(endAngleRad);
  const endY = centerY - radius * Math.sin(endAngleRad);
  const leftX = centerX - radius;
  const leftY = centerY;
  const rightX = centerX + radius;
  const rightY = centerY;
  
  // Determine if arc is large
  const largeArcFlag = fillAngle > 90 ? 1 : 0;
  
  // Paths
  const backgroundArc = `M ${leftX} ${leftY} A ${radius} ${radius} 0 0 1 ${rightX} ${rightY}`;
  const filledPath = clampedPercentage > 0
    ? `M ${centerX} ${centerY} L ${leftX} ${leftY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
    : '';
  
  // Pattern ID
  const patternId = `pattern-${category.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6"
    >
      <div className="flex flex-col">
        {/* Header with rank and category */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {rank && (
              <span className="w-8 h-8 bg-[#004977] text-white rounded-full flex items-center justify-center text-sm font-bold">
                {rank}
              </span>
            )}
            <h3 className="text-lg font-bold text-[#004977]">{category}</h3>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#D03027]/10 text-[#D03027] font-bold text-sm">
              {pointsMultiplier}x Points
            </span>
          </div>
        </div>

        {/* Dial and Stats */}
        <div className="flex items-center gap-6">
          {/* SVG Dial */}
          <div className="flex-shrink-0">
            <svg width={width} height={height} className="overflow-visible">
              {/* Pattern for stripes */}
              <defs>
                <pattern
                  id={patternId}
                  patternUnits="userSpaceOnUse"
                  width="5"
                  height="5"
                  patternTransform="rotate(45)"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="5"
                    stroke="#B02820"
                    strokeWidth="2"
                  />
                </pattern>
              </defs>
              
              {/* Background arc */}
              <path
                d={backgroundArc}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="8"
                strokeLinecap="round"
              />
              
              {/* Filled arc */}
              {clampedPercentage > 0 && filledPath && (
                <>
                  {/* Solid fill */}
                  <motion.path
                    d={filledPath}
                    fill="#D03027"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                  {/* Stripe pattern overlay */}
                  <motion.path
                    d={filledPath}
                    fill={`url(#${patternId})`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  />
                </>
              )}
            </svg>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="mb-3">
              <p className="text-sm text-gray-500 font-medium">Percentage of Spend</p>
              <p className="text-3xl font-bold text-[#004977]">
                {clampedPercentage.toFixed(0)}%
              </p>
            </div>
            {totalSpent !== undefined && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Amount Spent</p>
                <p className="text-xl font-semibold text-gray-800">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

CategoryDial.propTypes = {
  category: PropTypes.string.isRequired,
  percentage: PropTypes.number.isRequired,
  pointsMultiplier: PropTypes.number.isRequired,
  totalSpent: PropTypes.number,
  rank: PropTypes.number,
};

export default CategoryDial;
