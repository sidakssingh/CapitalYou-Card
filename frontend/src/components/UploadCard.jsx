import React from 'react';
import { Trash2, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

function UploadCard({ summary, onDelete }) {
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get top spending category
  const getTopCategory = () => {
    if (!summary.categories || summary.categories.length === 0) {
      return { category: 'N/A', total_spent: 0 };
    }
    return summary.categories.reduce((top, cat) => 
      cat.total_spent > top.total_spent ? cat : top
    );
  };

  const topCategory = getTopCategory();
  // Capital One blue: #004977

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[#004977] mb-1">
            {summary.title && summary.title !== 'None' ? summary.title : 'Upload Summary'}
          </h3>
          <p className="text-sm text-gray-500">
            {formatDate(summary.created_at)}
          </p>
        </div>
        <button
          onClick={() => onDelete(summary.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          aria-label="Delete upload"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Total Spent */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Total Spent:</span>
          <span className="text-xl font-bold text-[#004977]">
            ${parseFloat(summary.total_spent).toFixed(2)}
          </span>
        </div>

        {/* Top Category */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#004977]" />
            <span className="text-gray-600 text-sm">Top Category:</span>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-800">{topCategory.category}</p>
            <p className="text-sm text-gray-500">
              ${parseFloat(topCategory.total_spent).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

UploadCard.propTypes = {
  summary: PropTypes.shape({
    id: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    total_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    categories: PropTypes.arrayOf(PropTypes.shape({
      category: PropTypes.string.isRequired,
      total_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    }))
  }).isRequired,
  onDelete: PropTypes.func.isRequired
};

export default UploadCard;
