import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { signOut } from '../services/auth';
import Modal from './Modal';

function LogoutButton({ className = '' }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      alert('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
      setModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50 ${className}`}
      >
        <LogOut className="w-4 h-4" />
        <span>{loading ? 'Logging out...' : 'Log Out'}</span>
      </button>
      <Modal
        isOpen={modalOpen}
        onClose={() => !loading && setModalOpen(false)}
        title="Log Out?"
      >
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-gray-800 font-medium">
              Are you sure you want to log out?
            </p>
            <p className="text-sm text-gray-600">
              You will need to log in again to access your account.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default LogoutButton;
