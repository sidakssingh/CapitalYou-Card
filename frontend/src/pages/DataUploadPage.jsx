import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadTransactions } from '../services/api';
import capitalYouLogo from '../assets/CapitalYou_logo.png';

function DataUploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setError(null);
        console.log('CSV file selected:', selectedFile.name);
      } else {
        setError('Please select a valid CSV file');
        setFile(null);
        console.log('Invalid file type selected');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    console.log('Starting upload for file:', file.name);

    try {
      const response = await uploadTransactions(file);
      console.log('Upload successful:', response);
      setUploadSuccess(true);
      
      // Get user_id from response, default to 1 if not provided
      const userId = response.user_id || '1';
      console.log('Redirecting to dashboard for user:', userId);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/dashboard/${userId}`);
      }, 2000);
    } catch (err) {
      console.log('Upload failed:', err.message);
      setError(err.message || 'Failed to upload transactions');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-6 py-2">
          <motion.div 
            className="flex justify-between items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link to="/" className="flex items-center">
              <img 
                src={capitalYouLogo} 
                alt="CapitalYou" 
                className="h-16 md:h-20 w-auto"
              />
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-16 flex items-center justify-center">
        <motion.div 
          className="max-w-2xl w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#D03027]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-[#D03027]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#004977] mb-3">
                Upload Your Transactions
              </h1>
              <p className="text-gray-600 text-lg">
                Upload a CSV file with your transaction data to get personalized spending insights
              </p>
            </div>

            {/* Upload Area */}
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#D03027] transition-colors">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                  id="csv-upload"
                  disabled={uploading || uploadSuccess}
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer block"
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3 text-[#004977]">
                      <FileText className="w-8 h-8" />
                      <span className="font-medium text-lg">{file.name}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-gray-600 font-medium">
                        Click to select a CSV file
                      </p>
                      <p className="text-sm text-gray-500">
                        or drag and drop
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Success Message */}
              {uploadSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-medium">Upload successful!</p>
                    <p className="text-green-700 text-sm">Redirecting to your dashboard...</p>
                  </div>
                </motion.div>
              )}

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!file || uploading || uploadSuccess}
                className="w-full py-4 bg-[#D03027] hover:bg-[#B02820] text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : uploadSuccess ? 'Upload Complete' : 'Upload Transactions'}
              </button>

              {/* Skip Link */}
              <div className="text-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-600 hover:text-[#004977] font-medium transition-colors"
                  disabled={uploading}
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default DataUploadPage;
