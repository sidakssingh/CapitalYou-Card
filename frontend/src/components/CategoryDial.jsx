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
  
  // SVG dimensions for semi-circle dial
  const width = 200;
  const height = 120; // Half circle height
  const centerX = width / 2;
  const centerY = height; // Bottom center for semi-circle
  const radius = 80;
  
  // Calculate the angle for the arc (0-180 degrees for semi-circle)
  // 0% = 180° (left), 100% = 0° (right)
  // We want it to fill from left to right
  const startAngle = 180; // Start from left
  const endAngle = 180 - (clampedPercentage / 100) * 180; // End based on percentage
  
  // Convert angles to radians
  const startRad = (startAngle - 90) * (Math.PI / 180);
  const endRad = (endAngle - 90) * (Math.PI / 180);
  
  // Calculate arc endpoints
  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);
  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);
  
  // Determine if arc is large (>= 180°)
  const sweepAngle = Math.abs(endAngle - startAngle);
  const largeArcFlag = sweepAngle >= 180 ? 1 : 0;
  
  // Create arc path for filled area
  const arcPath = clampedPercentage > 0 
    ? `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${x2} ${y2} Z`
    : '';
  
  // Background semi-circle path
  const backgroundPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
  
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
                width="8"
                height="8"
              >
                <path
                  d="M 0 8 L 8 0"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              </pattern>
            </defs>
            
            {/* Background semi-circle outline (gray) */}
            <path
              d={backgroundPath}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="3"
            />
            
            {/* Filled arc (blue with diagonal pattern) */}
            {clampedPercentage > 0 && arcPath && (
              <>
                <motion.path
                  d={arcPath}
                  fill={`url(#${patternId})`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                {/* Solid blue fill overlay */}
                <motion.path
                  d={arcPath}
                  fill="#3B82F6"
                  fillOpacity="0.7"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, ease: "easeOut" }}
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
