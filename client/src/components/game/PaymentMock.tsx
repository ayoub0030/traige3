import React, { useState } from 'react';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useLanguage } from '../../lib/stores/useLanguage';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  CreditCard, 
  ArrowLeft, 
  Check, 
  Star, 
  Zap, 
  Users, 
  Trophy,
  Lock,
  Shield
} from 'lucide-react';

export default function PaymentMock() {
  const { setGameState } = useTriviaGame();
  const { translations } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'elite'>('premium');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'basic',
      nameEn: 'Basic',
      nameAr: 'أساسي',
      price: 4.99,
      features: [
        { en: '500 AI Questions/month', ar: '500 سؤال بالذكاء الاصطناعي/شهر' },
        { en: 'Basic Categories', ar: 'فئات أساسية' },
        { en: 'Score Tracking', ar: 'تتبع النقاط' },
        { en: 'Mobile Support', ar: 'دعم الهاتف المحمول' },
      ]
    },
    {
      id: 'premium',
      nameEn: 'Premium',
      nameAr: 'مميز',
      price: 9.99,
      features: [
        { en: 'Unlimited AI Questions', ar: 'أسئلة لا محدودة بالذكاء الاصطناعي' },
        { en: 'All Categories', ar: 'جميع الفئات' },
        { en: 'Multiplayer Access', ar: 'الوصول للعب الجماعي' },
        { en: 'Advanced Statistics', ar: 'إحصائيات متقدمة' },
        { en: 'Priority Support', ar: 'دعم أولوية' },
      ],
      popular: true
    },
    {
      id: 'elite',
      nameEn: 'Elite',
      nameAr: 'نخبة',
      price: 19.99,
      features: [
        { en: 'Everything in Premium', ar: 'كل شيء في المميز' },
        { en: 'Custom Question Sets', ar: 'مجموعات أسئلة مخصصة' },
        { en: 'Tournament Access', ar: 'الوصول للبطولات' },
        { en: 'Leaderboard Rankings', ar: 'ترتيب قائمة المتصدرين' },
        { en: 'White-label Options', ar: 'خيارات العلامة البيضاء' },
      ]
    }
  ];

  const handlePurchase = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      alert(`${translations.mockPurchaseSuccess} (${selectedPlan.toUpperCase()})`);
      setGameState('menu');
    }, 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header */}
        <Card className="bg-black/90 border-gray-600 text-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setGameState('menu')}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-green-400" />
                  {translations.premiumPlans}
                </CardTitle>
              </div>
              <Badge className="bg-green-600">
                <Shield className="h-4 w-4 mr-1" />
                {translations.securePayment}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative cursor-pointer transition-all duration-200 ${
                selectedPlan === plan.id 
                  ? 'bg-blue-900/50 border-blue-500' 
                  : 'bg-black/80 border-gray-600 hover:border-gray-500'
              } text-white`}
              onClick={() => setSelectedPlan(plan.id as any)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-yellow-600 text-yellow-100">
                    <Star className="h-3 w-3 mr-1" />
                    {translations.popular}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">
                  {translations.language === 'en' ? plan.nameEn : plan.nameAr}
                </CardTitle>
                <div className="text-3xl font-bold text-blue-400">
                  ${plan.price}
                  <span className="text-sm text-gray-400 font-normal">/{translations.month}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm">
                      {translations.language === 'en' ? feature.en : feature.ar}
                    </span>
                  </div>
                ))}
                
                <div className="pt-4">
                  <Button 
                    className={`w-full ${
                      selectedPlan === plan.id 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedPlan(plan.id as any)}
                  >
                    {selectedPlan === plan.id ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {translations.selected}
                      </>
                    ) : (
                      translations.selectPlan
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Form */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Method */}
          <Card className="bg-black/90 border-gray-600 text-white">
            <CardHeader>
              <CardTitle>{translations.paymentMethod}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className={paymentMethod === 'card' ? 'bg-blue-600' : 'border-gray-600 text-white hover:bg-white/10'}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {translations.creditCard}
                </Button>
                <Button
                  variant={paymentMethod === 'paypal' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('paypal')}
                  className={paymentMethod === 'paypal' ? 'bg-blue-600' : 'border-gray-600 text-white hover:bg-white/10'}
                >
                  PayPal
                </Button>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-3">
                  <Input
                    placeholder={translations.cardNumber}
                    className="bg-gray-800 border-gray-600 text-white"
                    maxLength={19}
                    value="**** **** **** 1234"
                    disabled
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder={translations.expiryDate}
                      className="bg-gray-800 border-gray-600 text-white"
                      value="12/25"
                      disabled
                    />
                    <Input
                      placeholder={translations.cvv}
                      className="bg-gray-800 border-gray-600 text-white"
                      value="***"
                      disabled
                    />
                  </div>
                  <Input
                    placeholder={translations.cardholderName}
                    className="bg-gray-800 border-gray-600 text-white"
                    value="John Doe"
                    disabled
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-black/90 border-gray-600 text-white">
            <CardHeader>
              <CardTitle>{translations.orderSummary}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>{translations[selectedPlan]} {translations.plan}</span>
                <span>${plans.find(p => p.id === selectedPlan)?.price}/mo</span>
              </div>
              
              <div className="flex justify-between items-center text-green-400">
                <span>{translations.discount} (First Month)</span>
                <span>-$2.00</span>
              </div>
              
              <hr className="border-gray-600" />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{translations.total}</span>
                <span>${((plans.find(p => p.id === selectedPlan)?.price || 0) - 2).toFixed(2)}</span>
              </div>

              <Button 
                onClick={handlePurchase}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white mt-6"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {translations.processing}...
                  </div>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    {translations.subscribePay}
                  </>
                )}
              </Button>
              
              <p className="text-xs text-gray-400 text-center mt-3">
                {translations.mockPaymentNotice}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
