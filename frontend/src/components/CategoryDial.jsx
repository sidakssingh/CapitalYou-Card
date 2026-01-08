import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * CategoryDial - A semi-circular dial component showing spending percentage
 * @param {Object} props - The component props
 * @param {string} props.category - The category name (e.g., "E-Commerce")
 * @param {number} props.percentage - Percentage of spend (0-100)
 * @param {number} props.pointsMultiplier - Points multiplier (e.g., 5 for "5 x Points")
 * @param {number} props.totalSpent - Optional total spent amount
 */
const CategoryDial = ({ category, percentage, pointsMultiplier, totalSpent }) => {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // SVG dimensions
  const width = 200;
  const height = 110;
  const centerX = width / 2;
  const centerY = height - 10; // Center at bottom with some padding
  const radius = 80;
  
  // Calculate the fill angle (0% = left side, 100% = right side)
  // In SVG, angles work differently - we need to calculate the end point
  // The arc goes from left (180°) to right (0°), sweeping upward
  // percentage maps to how much of the 180° arc is filled
  
  const fillAngle = (clampedPercentage / 100) * 180; // 0 to 180 degrees
  
  // Convert to radians (SVG uses a coordinate system where 0° is right, going counterclockwise)
  // For our upward-facing semi-circle:
  // - Left point is at angle 180° (π radians)
  // - Right point is at angle 0°
  // - We fill from left toward right
  
  const startAngleRad = Math.PI; // 180° - left side
  const endAngleRad = Math.PI - (fillAngle * Math.PI / 180); // End point based on percentage
  
  // Calculate the end point of the filled arc
  const endX = centerX + radius * Math.cos(endAngleRad);
  const endY = centerY - radius * Math.sin(endAngleRad);
  
  // Left point (start of arc)
  const leftX = centerX - radius;
  const leftY = centerY;
  
  // Right point (for background)
  const rightX = centerX + radius;
  const rightY = centerY;
  
  // Determine if arc is large (> 50% means > 90° of fill)
  const largeArcFlag = fillAngle > 90 ? 1 : 0;
  
  // Background semi-circle arc (just the outline)
  const backgroundArc = `M ${leftX} ${leftY} A ${radius} ${radius} 0 0 1 ${rightX} ${rightY}`;
  
  // Filled pie slice: center -> left point -> arc to end point -> back to center
  const filledPath = clampedPercentage > 0
    ? `M ${centerX} ${centerY} L ${leftX} ${leftY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
    : '';
  
  // Create unique pattern ID
  const patternId = `diagonal-${category.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white border-2 border-black rounded-lg p-6 shadow-lg"
    >
      <div className="flex flex-col items-center">
        {/* Category Name */}
        <h3 className="text-xl font-bold mb-4 text-gray-900">{category}</h3>
        
        {/* SVG Dial */}
        <div className="relative mb-4 flex justify-center">
          <svg width={width} height={height} className="overflow-visible">
            {/* Pattern definition for diagonal lines */}
            <defs>
              <pattern
                id={patternId}
                patternUnits="userSpaceOnUse"
                width="6"
                height="6"
                patternTransform="rotate(45)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="6"
                  stroke="#1E40AF"
                  strokeWidth="2"
                />
              </pattern>
            </defs>
            
            {/* Background semi-circle outline (gray) */}
            <path
              d={backgroundArc}
              fill="none"
              stroke="#D1D5DB"
              strokeWidth="4"
              strokeLinecap="round"
            />
            
            {/* Filled arc (blue with diagonal pattern) */}
            {clampedPercentage > 0 && filledPath && (
              <>
                {/* Solid blue fill */}
                <motion.path
                  d={filledPath}
                  fill="#3B82F6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.85 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
                {/* Diagonal pattern overlay */}
                <motion.path
                  d={filledPath}
                  fill={`url(#${patternId})`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                />
              </>
            )}
          </svg>
        </div>
        
        {/* Percentage Text */}
        <p className="text-2xl font-bold text-gray-900 mb-2">
          {clampedPercentage.toFixed(0)}% of Spend
        </p>
        
        {/* Points Multiplier */}
        <p className="text-lg font-semibold text-blue-600">
          {pointsMultiplier} x Points
        </p>
        
        {/* Optional: Total Spent */}
        {totalSpent !== undefined && (
          <p className="text-sm text-gray-600 mt-2">
            ${totalSpent.toFixed(2)}
          </p>
        )}
      </div>
    </motion.div>
  );
};

CategoryDial.propTypes = {
  category: PropTypes.string.isRequired,
  percentage: PropTypes.number.isRequired,
  pointsMultiplier: PropTypes.number.isRequired,
  totalSpent: PropTypes.number,
};

export default CategoryDial;
