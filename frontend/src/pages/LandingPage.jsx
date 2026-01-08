import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Shield, TrendingUp, Star, LogOut } from 'lucide-react';
import { testApi } from '../services/api';
import { getCurrentUser, signOut } from '../services/auth';
import capitalYouLogo from '../assets/CapitalYou_logo.png';

function LandingPage() {
  const navigate = useNavigate();
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

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
            <nav className="flex items-center gap-8">
              {user ? (
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Log Out
                </button>
              ) : (
                <Link 
                  to="/login" 
                  className="px-6 py-2.5 bg-[#004977] hover:bg-[#003557] text-white rounded-full font-medium transition-all shadow-sm hover:shadow-md"
                >
                  Login
                </Link>
              )}
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
                  to={user ? "/dashboard" : "/register"}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#D03027] hover:bg-[#B02820] text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
                >
                  {user ? "Go to Dashboard" : "Get Started"}
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Removed API Response display */}

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
              {user ? "View your spending insights" : "Ready to see your spending insights?"}
            </h2>
            <p className="text-gray-200 text-lg mb-8 max-w-2xl mx-auto">
              {user 
                ? "Head to your dashboard to see your top spending categories and rewards."
                : "Get started today to see your top spending categories and how many points you're earning."
              }
            </p>
            <Link
              to={user ? "/dashboard" : "/register"}
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-[#D03027] hover:bg-[#B02820] text-white rounded-full font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              {user ? "Go to Dashboard" : "Get Started"}
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
