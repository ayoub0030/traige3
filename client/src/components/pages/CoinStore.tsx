import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useAuth } from '../../lib/stores/useAuth';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ArrowLeft, Coins, Crown, Star, Zap, Gift, CreditCard, Shield, Loader2, Check, X, LogIn, UserPlus } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import AuthModal from '../auth/AuthModal';

// Initialize Stripe with environment variable - using import.meta.env for Vite
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567');

// Types for Stripe payment data
interface CoinPack {
  coins: number;
  price: number;
  name: string;
}

interface PremiumPlan {
  price: number;
  name: string;
  features: string[];
}

interface PaymentData {
  subscriptions: Record<string, PremiumPlan>;
  coinPacks: Record<string, CoinPack>;
}

// Payment Form Component
function PaymentForm({ 
  amount, 
  onSuccess, 
  onError, 
  isSubscription = false, 
  userId, 
  packType 
}: {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  isSubscription?: boolean;
  userId: number;
  packType: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { language } = useLanguage();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const endpoint = isSubscription ? '/api/payments/create-subscription-intent' : '/api/payments/create-coins-intent';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          [isSubscription ? 'planType' : 'packType']: packType
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (error) {
      onError('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-border rounded-lg bg-card">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }}
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {language === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            {language === 'ar' ? `ادفع $${(amount / 100).toFixed(2)}` : `Pay $${(amount / 100).toFixed(2)}`}
          </>
        )}
      </Button>
    </form>
  );
}

// Main Coin Store component
export default function CoinStore() {
  const { translations, language } = useLanguage();
  const { setGameState } = useTriviaGame();
  const { user, getCurrentUser } = useAuth();
  
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [premiumStatus, setPremiumStatus] = useState({
    isPremium: false,
    benefits: {},
    currentCoins: 0
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Fetch payment data and premium status
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch payment plans
        const plansResponse = await fetch('/api/payments/plans');
        const plans = await plansResponse.json();
        setPaymentData(plans);
        
        // Fetch premium status if user is logged in
        if (user?.id) {
          const statusResponse = await fetch(`/api/payments/premium-status/${user.id}`);
          const status = await statusResponse.json();
          if (status.success) {
            setPremiumStatus(status);
          }
        }
      } catch (error) {
        console.error('Error fetching payment data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Handle payment success
  const handlePaymentSuccess = async () => {
    setPaymentSuccess(true);
    setShowPayment(false);
    setSelectedPack(null);
    
    // For coin purchases, manually update coins since webhooks might not work in dev
    if (selectedPack && paymentData?.coinPacks?.[selectedPack]) {
      const pack = paymentData.coinPacks[selectedPack];
      try {
        // Manually add coins to user account using the total amount
        const newAmount = (user?.coins || 0) + pack.coins;
        console.log(`Adding ${pack.coins} coins to user account. Current: ${user?.coins}, New total: ${newAmount}`);
        
        const response = await fetch('/api/auth/add-coins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            amount: newAmount
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update coins');
        }
        
        console.log('Coins updated successfully');
      } catch (error) {
        console.error('Error updating coins:', error);
      }
    }
    
    // Wait a moment then refresh user data to show updated coins
    setTimeout(async () => {
      await getCurrentUser();
    }, 500);
    
    setTimeout(async () => {
      setPaymentSuccess(false);
      // Refresh premium status and user data again
      if (user?.id) {
        try {
          const [status] = await Promise.all([
            fetch(`/api/payments/premium-status/${user.id}`).then(res => res.json()),
            getCurrentUser()
          ]);
          if (status.success) {
            setPremiumStatus(status);
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
        }
      }
    }, 2000);
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setTimeout(() => {
      setPaymentError(null);
    }, 5000);
  };

  // Start payment process
  const startPayment = (packType: string, isSubscription = false) => {
    if (!user) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }
    setSelectedPack(packType);
    setShowPayment(true);
  };

  // Handle auth modal actions
  const handleAuthAction = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 overflow-y-auto" style={{ height: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-6 pb-40"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGameState('home')}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
              <Coins className="h-8 w-8" />
              {language === 'ar' ? 'متجر العملات' : 'Coin Store'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'عزز تجربة اللعب لديك' : 'Boost your gaming experience'}
            </p>
          </div>
        </motion.div>

        {/* Current Balance */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-full">
                  <Coins className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-500">
                    {(user?.coins || 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Success/Error Messages */}
        {paymentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                {language === 'ar' ? 'تمت المعاملة بنجاح!' : 'Payment successful!'}
              </span>
            </div>
          </motion.div>
        )}

        {paymentError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              <span className="font-medium">{paymentError}</span>
            </div>
          </motion.div>
        )}

        {/* Login Prompt for Non-Authenticated Users */}
        {!user && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <LogIn className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-bold text-lg">
                      {language === 'ar' ? 'سجل دخولك أو أنشئ حساباً' : 'Login or Create Account'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'سجل دخولك لشراء العملات والاشتراك المميز' : 'Login to purchase coins and premium subscription'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-center">
                  <Button 
                    className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0"
                    onClick={() => handleAuthAction('login')}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/10"
                    onClick={() => handleAuthAction('register')}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'إنشاء حساب' : 'Sign Up'}
                  </Button>
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    {language === 'ar' ? 
                      'للاختبار: اسم المستخدم: demo | كلمة المرور: demo123' : 
                      'Demo account: username: demo | password: demo123'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Premium Status */}
        {premiumStatus.isPremium && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="h-6 w-6 text-purple-500" />
                  <div>
                    <h3 className="font-bold text-lg text-purple-600">
                      {language === 'ar' ? 'العضوية المميزة نشطة' : 'Premium Active'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'استمتع بجميع المزايا المميزة' : 'Enjoy all premium benefits'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{language === 'ar' ? 'ألعاب غير محدودة' : 'Unlimited games'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{language === 'ar' ? 'بدون إعلانات' : 'No ads'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{language === 'ar' ? 'عملات يومية إضافية' : 'Daily bonus coins'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{language === 'ar' ? 'دعم أولوية' : 'Priority support'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
          </div>
        ) : (
          <>
            {/* Premium Subscription */}
            {!premiumStatus.isPremium && paymentData?.subscriptions && (
              <motion.div variants={itemVariants}>
                <Card className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-purple-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-600">
                      <Crown className="h-6 w-6" />
                      {language === 'ar' ? 'العضوية المميزة' : 'Premium Subscription'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Object.entries(paymentData.subscriptions).map(([key, plan]) => (
                      <div key={key} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-lg">{plan.name}</h3>
                            <p className="text-2xl font-bold text-purple-600">
                              ${(plan.price / 100).toFixed(2)}/month
                            </p>
                          </div>
                          <Badge className="bg-purple-500 text-white">
                            {language === 'ar' ? 'الأفضل' : 'Best Value'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <Star className="h-4 w-4 text-purple-500" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                        
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                          onClick={() => startPayment(key, true)}
                        >
                          <Crown className="h-4 w-4 mr-2" />
                          {language === 'ar' ? 'اشترك الآن' : 'Subscribe Now'}
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Coin Packages */}
            {paymentData?.coinPacks && (
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-primary" />
                      {language === 'ar' ? 'حزم العملات' : 'Coin Packages'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(paymentData.coinPacks).map(([key, pack]) => (
                        <motion.div
                          key={key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
                                    <Coins className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-lg">{pack.coins.toLocaleString()}</h3>
                                    <p className="text-sm text-muted-foreground">{pack.name}</p>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-primary">
                                    ${(pack.price / 100).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {(pack.coins / (pack.price / 100)).toFixed(0)} coins/$
                                  </div>
                                </div>
                              </div>
                              
                              <Button 
                                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0"
                                onClick={() => startPayment(key)}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                {language === 'ar' ? 'اشتر الآن' : 'Buy Now'}
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}

        {/* Payment Modal */}
        {showPayment && selectedPack && paymentData && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowPayment(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-card border border-border rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg">
                  {language === 'ar' ? 'إتمام الدفع' : 'Complete Payment'}
                </h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowPayment(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mb-6">
                {selectedPack in (paymentData.subscriptions || {}) ? (
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">Premium Subscription</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      ${(paymentData.subscriptions[selectedPack].price / 100).toFixed(2)}/month
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Coins className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        {paymentData.coinPacks[selectedPack]?.coins} Coins
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      ${(paymentData.coinPacks[selectedPack]?.price / 100).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              
              <Elements stripe={stripePromise}>
                <PaymentForm
                  amount={selectedPack in (paymentData.subscriptions || {}) ? 
                    paymentData.subscriptions[selectedPack].price : 
                    paymentData.coinPacks[selectedPack]?.price || 0
                  }
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  isSubscription={selectedPack in (paymentData.subscriptions || {})}
                  userId={user.id}
                  packType={selectedPack}
                />
              </Elements>
              
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>
                    {language === 'ar' ? 
                      'مدفوعات آمنة ومشفرة بواسطة Stripe' : 
                      'Secure payments powered by Stripe'
                    }
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {language === 'ar' ? 
                    'للاختبار: استخدم 4242 4242 4242 4242' : 
                    'Test card: 4242 4242 4242 4242'
                  }
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Authentication Modal */}
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </motion.div>
    </div>
  );
}