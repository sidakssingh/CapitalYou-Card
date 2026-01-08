import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Database } from 'lucide-react';
import { getCurrentUser } from '../services/auth';
import { getAllSummaries, deleteSummary } from '../services/database';
import UploadCard from '../components/UploadCard';
import Modal from '../components/Modal';
import LogoutButton from '../components/LogoutButton';
import capitalYouLogo from '../assets/CapitalYou_logo.png';

function ManageUploadsPage() {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [summaryToDelete, setSummaryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      const data = await getAllSummaries(user.id);
      setSummaries(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load summaries:', err);
      setError('Failed to load your uploads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (summaryId) => {
    setSummaryToDelete(summaryId);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!summaryToDelete) return;

    setDeleting(true);
    try {
      await deleteSummary(summaryToDelete);
      setSummaries(summaries.filter(s => s.id !== summaryToDelete));
      setDeleteModalOpen(false);
      setSummaryToDelete(null);
    } catch (err) {
      console.error('Failed to delete summary:', err);
      alert('Failed to delete upload. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center">
              <img 
                src={capitalYouLogo} 
                alt="CapitalYou" 
                className="h-16 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Back to Dashboard Button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-[#004977] transition-all group mb-8"
        >
          <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </div>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Database className="w-8 h-8 text-[#004977]" />
              <h1 className="text-3xl font-bold text-[#004977]">
                Manage Your Uploads
              </h1>
            </div>
            <p className="text-gray-600">
              View and manage all your uploaded transaction summaries
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004977] mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your uploads...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-800">{error}</p>
              <button
                onClick={loadSummaries}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Summaries Grid */}
          {!loading && !error && (
            <>
              {summaries.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
                  <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No Uploads Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Upload your first transaction CSV to get started
                  </p>
                  <button
                    onClick={() => navigate('/upload')}
                    className="px-6 py-3 bg-[#D03027] hover:bg-[#B02820] text-white rounded-lg font-semibold transition-colors"
                  >
                    Upload Transactions
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {summaries.map((summary) => (
                    <UploadCard
                      key={summary.id}
                      summary={summary}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Delete Upload?"
      >
        <div className="p-6 space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>

          <div className="text-center space-y-2">
            <p className="text-gray-800 font-medium">
              Are you sure you want to delete this upload?
            </p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. The spending summary will be permanently removed.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ManageUploadsPage;
