import { create } from "zustand";
import { getLocalStorage, setLocalStorage } from "../localStorage";

export type Language = 'en' | 'ar';

interface Translations {
  // Game UI
  gameSubtitle: string;
  startGame: string;
  multiplayer: string;
  premium: string;
  category: string;
  difficulty: string;
  question: string;
  timeRemaining: string;
  score: string;
  streak: string;
  correct: string;
  incorrect: string;
  nextQuestion: string;
  seeResults: string;
  loadingQuestion: string;
  
  // Results
  gameComplete: string;
  newHighScore: string;
  highScore: string;
  home: string;
  accuracy: string;
  avgTime: string;
  bestStreak: string;
  playAgain: string;
  mainMenu: string;
  share: string;
  
  // Categories
  general: string;
  science: string;
  history: string;
  geography: string;
  sports: string;
  entertainment: string;
  
  // Difficulties
  easy: string;
  medium: string;
  hard: string;
  
  // Performance ratings
  excellent: string;
  great: string;
  good: string;
  fair: string;
  needsImprovement: string;
  
  // Multiplayer
  online: string;
  offline: string;
  playersOnline: string;
  gameModes: string;
  quickMatch: string;
  teamMatch: string;
  findPlayer: string;
  enterPlayerName: string;
  searchingForOpponent: string;
  mode: string;
  cancel: string;
  onlinePlayers: string;
  level: string;
  wins: string;
  challenge: string;
  challengePlayer: string;
  matchFound: string;
  offlineMessage: string;
  mockMultiplayerNotice: string;
  
  // Payment
  premiumPlans: string;
  securePayment: string;
  popular: string;
  month: string;
  selected: string;
  selectPlan: string;
  paymentMethod: string;
  creditCard: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  orderSummary: string;
  basic: string;
  premiumPlan: string;
  elite: string;
  plan: string;
  discount: string;
  total: string;
  processing: string;
  subscribePay: string;
  mockPaymentNotice: string;
  mockPurchaseSuccess: string;
}

const englishTranslations: Translations = {
  // Game UI
  gameSubtitle: "AI-Powered Trivia Challenge",
  startGame: "Start Game",
  multiplayer: "Multiplayer",
  premium: "Premium",
  category: "Category",
  difficulty: "Difficulty",
  question: "Question",
  timeRemaining: "Time Remaining",
  score: "Score",
  streak: "Streak",
  correct: "Correct!",
  incorrect: "Incorrect",
  nextQuestion: "Next Question",
  seeResults: "See Results",
  loadingQuestion: "Loading Question",
  
  // Results
  gameComplete: "Game Complete!",
  newHighScore: "New High Score",
  highScore: "High Score",
  accuracy: "Accuracy",
  avgTime: "Avg Time",
  bestStreak: "Best Streak",
  playAgain: "Play Again",
  home: "Home",
  mainMenu: "Main Menu",
  share: "Share",
  
  // Categories
  general: "General Knowledge",
  science: "Science & Nature",
  history: "History",
  geography: "Geography",
  sports: "Sports",
  entertainment: "Entertainment",
  
  // Difficulties
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  
  // Performance ratings
  excellent: "Excellent!",
  great: "Great Job!",
  good: "Good Work!",
  fair: "Fair",
  needsImprovement: "Keep Practicing!",
  
  // Multiplayer
  online: "Online",
  offline: "Offline",
  playersOnline: "players online",
  gameModes: "Game Modes",
  quickMatch: "Quick Match",
  teamMatch: "Team Match",
  findPlayer: "Find Player",
  enterPlayerName: "Enter player name...",
  searchingForOpponent: "Searching for opponent",
  mode: "mode",
  cancel: "Cancel",
  onlinePlayers: "Online Players",
  level: "Level",
  wins: "wins",
  challenge: "Challenge",
  challengePlayer: "Challenge Player",
  matchFound: "Match Found",
  offlineMessage: "Connect to internet to play with others",
  mockMultiplayerNotice: "This is a demo multiplayer interface. Real multiplayer coming soon!",
  
  // Payment
  premiumPlans: "Premium Plans",
  securePayment: "Secure Payment",
  popular: "Most Popular",
  month: "month",
  selected: "Selected",
  selectPlan: "Select Plan",
  paymentMethod: "Payment Method",
  creditCard: "Credit Card",
  cardNumber: "Card Number",
  expiryDate: "MM/YY",
  cvv: "CVV",
  cardholderName: "Cardholder Name",
  orderSummary: "Order Summary",
  basic: "Basic",
  premiumPlan: "Premium",
  elite: "Elite",
  plan: "Plan",
  discount: "Discount",
  total: "Total",
  processing: "Processing",
  subscribePay: "Subscribe & Pay",
  mockPaymentNotice: "This is a mock payment interface for demonstration purposes only.",
  mockPurchaseSuccess: "Mock purchase successful! Thank you for trying our demo."
};

const arabicTranslations: Translations = {
  // Game UI
  gameSubtitle: "تحدي المعلومات العامة بالذكاء الاصطناعي",
  startGame: "بدء اللعبة",
  multiplayer: "متعدد الأشخاص",
  premium: "مميز",
  category: "الفئة",
  difficulty: "الصعوبة",
  question: "السؤال",
  timeRemaining: "الوقت المتبقي",
  score: "النقاط",
  streak: "التتابع",
  correct: "إجابة صحيحة!",
  incorrect: "إجابة خاطئة",
  nextQuestion: "السؤال التالي",
  seeResults: "عرض النتائج",
  loadingQuestion: "جاري تحميل السؤال",
  
  // Results
  gameComplete: "انتهت اللعبة!",
  newHighScore: "رقم قياسي جديد",
  highScore: "أعلى نقاط",
  accuracy: "الدقة",
  avgTime: "متوسط الوقت",
  bestStreak: "أفضل تتابع",
  playAgain: "العب مرة أخرى",
  home: "الرئيسية",
  mainMenu: "القائمة الرئيسية",
  share: "مشاركة",
  
  // Categories
  general: "معلومات عامة",
  science: "علوم وطبيعة",
  history: "تاريخ",
  geography: "جغرافيا",
  sports: "رياضة",
  entertainment: "ترفيه",
  
  // Difficulties
  easy: "سهل",
  medium: "متوسط",
  hard: "صعب",
  
  // Performance ratings
  excellent: "ممتاز!",
  great: "عمل رائع!",
  good: "عمل جيد!",
  fair: "لا بأس",
  needsImprovement: "استمر في التمرن!",
  
  // Multiplayer
  online: "متصل",
  offline: "غير متصل",
  playersOnline: "لاعب متصل",
  gameModes: "أنماط اللعب",
  quickMatch: "مباراة سريعة",
  teamMatch: "مباراة جماعية",
  findPlayer: "البحث عن لاعب",
  enterPlayerName: "أدخل اسم اللاعب...",
  searchingForOpponent: "البحث عن منافس",
  mode: "نمط",
  cancel: "إلغاء",
  onlinePlayers: "اللاعبون المتصلون",
  level: "المستوى",
  wins: "انتصار",
  challenge: "تحدي",
  challengePlayer: "تحدي اللاعب",
  matchFound: "تم العثور على مباراة",
  offlineMessage: "اتصل بالإنترنت للعب مع الآخرين",
  mockMultiplayerNotice: "هذه واجهة تجريبية للعب الجماعي. اللعب الجماعي الحقيقي قادم قريباً!",
  
  // Payment
  premiumPlans: "الخطط المميزة",
  securePayment: "دفع آمن",
  popular: "الأكثر شعبية",
  month: "شهر",
  selected: "محدد",
  selectPlan: "اختر الخطة",
  paymentMethod: "طريقة الدفع",
  creditCard: "بطاقة ائتمان",
  cardNumber: "رقم البطاقة",
  expiryDate: "الشهر/السنة",
  cvv: "رمز الأمان",
  cardholderName: "اسم حامل البطاقة",
  orderSummary: "ملخص الطلب",
  basic: "أساسي",
  premiumPlan: "مميز",
  elite: "نخبة",
  plan: "خطة",
  discount: "خصم",
  total: "المجموع",
  processing: "جاري المعالجة",
  subscribePay: "اشترك وادفع",
  mockPaymentNotice: "هذه واجهة دفع تجريبية لأغراض العرض فقط.",
  mockPurchaseSuccess: "تم الشراء التجريبي بنجاح! شكراً لتجربة العرض التوضيحي."
};

interface LanguageState {
  language: Language;
  translations: Translations;
  
  // Actions
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

export const useLanguage = create<LanguageState>((set, get) => {
  // Load from localStorage if present
  const saved = (getLocalStorage('mirage_language') as Language) || 'en';
  const initialLanguage: Language = saved === 'ar' ? 'ar' : 'en';
  const initialTranslations = initialLanguage === 'ar' ? arabicTranslations : englishTranslations;

  // Set initial document direction
  document.documentElement.dir = initialLanguage === 'ar' ? 'rtl' : 'ltr';

  return {
    language: initialLanguage,
    translations: initialTranslations,

    setLanguage: (language) => {
      console.log('Setting language to:', language);
      const translations = language === 'en' ? englishTranslations : arabicTranslations;
      setLocalStorage('mirage_language', language);

      // Update document direction for Arabic
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';

      set({ language, translations });
    },

    toggleLanguage: () => {
      const currentLanguage = get().language;
      const newLanguage: Language = currentLanguage === 'en' ? 'ar' : 'en';
      get().setLanguage(newLanguage);
    }
  };
})
