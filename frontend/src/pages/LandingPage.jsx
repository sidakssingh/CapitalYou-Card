import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Shield, TrendingUp, Star } from 'lucide-react';
import { testApi } from '../services/api';
import capitalYouLogo from '../assets/CapitalYou_logo.png';

function LandingPage() {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestApi = async () => {
    setLoading(true);
    try {
      const response = await testApi();
      setApiResponse(response);
    } catch (error) {
      setApiResponse({ error: error.message });
    }
    setLoading(false);
  };

  const features = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Smart Spending Insights",
      description: "Track your spending patterns and see where your money goes with detailed category breakdowns."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Earn More Rewards",
      description: "Get up to 5x points on your top spending categories, automatically optimized for you."
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Choose Your Tier",
      description: "Pick the card that fits your lifestyle — from no annual fee to premium rewards."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
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
            <nav className="hidden md:flex items-center gap-8">
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-[#004977] hover:bg-[#003557] text-white rounded-full font-medium transition-all shadow-sm hover:shadow-md"
              >
                Login
              </Link>
            </nav>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#004977] to-[#003557] text-white">
        <div className="container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Your spending, <br />
                <span className="text-[#D03027]">rewarded.</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed">
                CapitalYou Card automatically tracks your top spending categories and maximizes your rewards. No thinking required.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#D03027] hover:bg-[#B02820] text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  Get Started
                  <ChevronRight className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleTestApi}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-full font-semibold text-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Testing...' : 'Test API Connection'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* API Response */}
      {apiResponse && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 border-b border-gray-200"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-2xl">
              <p className="text-sm font-medium text-gray-500 mb-2">API Response:</p>
              <pre className="text-sm text-[#004977] overflow-auto">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          </div>
        </motion.div>
      )}

      {/* Features Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[#004977] mb-4">
              Why CapitalYou Card?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              We make it easy to understand your spending and earn more on every purchase.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="w-14 h-14 bg-[#D03027]/10 rounded-xl flex items-center justify-center text-[#D03027] mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-[#004977] mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-6">
          <motion.div 
            className="bg-[#004977] rounded-3xl p-12 md:p-16 text-center text-white"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to see your spending insights?
            </h2>
            <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
              Get started today to see your top spending categories and how many points you're earning.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#D03027] hover:bg-[#B02820] text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              Get Started
              <ChevronRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <img 
              src={capitalYouLogo} 
              alt="CapitalYou" 
              className="h-8 w-auto brightness-0 invert opacity-70"
            />
            <p className="text-sm">
              Disclaimer: This is a demo application built for the Capital One Tech Summit hackathon.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
