import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/stores/useAuth';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { useTheme, themeOptions } from '../../lib/stores/useTheme';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  ArrowLeft, 
  User, 
  Trophy, 
  Coins, 
  Crown, 
  Globe,
  Palette,
  Settings,
  Gift,
  BarChart3,
  Calendar,
  Target,
  Award,
  TrendingUp,
  Share2,
  Copy,
  Users
} from 'lucide-react';

// Profile component with rewards, statistics, theme, language selector
export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { language, setLanguage, translations } = useLanguage();
  const { highScore, setGameState } = useTriviaGame();
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [referralData, setReferralData] = useState<{
    referralCode: string;
    totalReferrals: number;
    shareUrl: string;
  } | null>(null);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [referralMessage, setReferralMessage] = useState('');

  // Fetch referral data
  const fetchReferralData = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('/api/auth/referral-code', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  // Use referral code
  const useReferralCode = async () => {
    if (!referralCodeInput.trim()) return;
    
    try {
      const response = await fetch('/api/auth/use-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ referralCode: referralCodeInput.trim() })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setReferralMessage(`✅ ${data.message}`);
        setShowReferralInput(false);
        setReferralCodeInput('');
        // Refresh user data to show new coins
        window.location.reload();
      } else {
        setReferralMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setReferralMessage('❌ Failed to use referral code');
    }
    
    setTimeout(() => setReferralMessage(''), 5000);
  };

  // Copy referral link to clipboard
  const copyReferralLink = async () => {
    if (!referralData?.shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(referralData.shareUrl);
      setReferralMessage('✅ Referral link copied to clipboard!');
    } catch (error) {
      setReferralMessage('❌ Failed to copy link');
    }
    
    setTimeout(() => setReferralMessage(''), 3000);
  };

  // Load referral data on component mount
  React.useEffect(() => {
    fetchReferralData();
  }, [isAuthenticated]);

  // Use real user statistics from the user object, defaulting to 0 for new accounts
  const userStats = {
    totalGamesPlayed: user?.totalGames || 0,
    correctAnswers: user?.correctAnswers || 0,
    accuracy: user?.totalGames ? Math.round((user.correctAnswers || 0) / (user.totalGames || 1) * 100) : 0,
    averageTime: user?.averageTime || 0,
    longestStreak: user?.maxStreak || 0,
    dailyStreak: user?.currentStreak || 0,
    questionsAnswered: user?.questionsAnswered || 0,
    timeSpent: user?.timeSpent || 0, // hours
    rank: user?.rank || 'Bronze',
    level: user ? Math.floor((user.coins || 0) / 100) + 1 : 1,
    nextLevelCoins: 100 - ((user?.coins || 0) % 100)
  };

  // Language options
  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
  ];


  // Recent achievements - check actual progress for new accounts
  const achievements = [
    { 
      icon: '🏆', 
      title: 'Quiz Master', 
      description: 'Answered 100 questions correctly', 
      earned: (user?.correctAnswers || 0) >= 100 
    },
    { 
      icon: '🔥', 
      title: 'Streak Champion', 
      description: 'Maintained 10-question streak', 
      earned: (user?.maxStreak || 0) >= 10 
    },
    { 
      icon: '⚡', 
      title: 'Speed Demon', 
      description: 'Answer in under 5 seconds', 
      earned: (user?.hasSpeedDemon || false) 
    },
    { 
      icon: '🎯', 
      title: 'Perfect Score', 
      description: 'Get 100% in a category', 
      earned: (user?.hasPerfectScore || false) 
    }
  ];

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
        className="max-w-md mx-auto space-y-4 pb-40"
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
            <h1 className="text-2xl font-bold text-primary">{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</h1>
            <p className="text-sm text-muted-foreground">{language === 'ar' ? 'إدارة حسابك' : 'Manage your account'}</p>
          </div>
        </motion.div>

        {/* User Info Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">
                    {isAuthenticated ? user?.username : (language === 'ar' ? 'ضيف' : 'Guest Player')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{userStats.rank}</Badge>
                    <Badge variant="outline">{(language === 'ar' ? 'المستوى' : 'Level')} {userStats.level}</Badge>
                    {user?.premium && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg font-bold text-yellow-500">
                      {(user?.coins || 0).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'عملة' : 'Coins'}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      {highScore.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'أفضل نتيجة' : 'Best Score'}</p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-1">
                    <Award className="h-4 w-4 text-accent" />
                    <span className="text-lg font-bold text-accent">
                      {userStats.totalGamesPlayed}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الألعاب' : 'Games'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Statistics */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'الإحصائيات' : 'Statistics'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-green-500">{userStats.accuracy}%</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'الدقة' : 'Accuracy'}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-blue-500">{userStats.averageTime}s</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'المتوسط الزمني' : 'Avg Time'}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-orange-500">{userStats.longestStreak}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'أفضل سلسلة' : 'Best Streak'}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-purple-500">{userStats.dailyStreak}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'سلسلة يومية' : 'Daily Streak'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{language === 'ar' ? 'الأسئلة المجابة' : 'Questions Answered'}</span>
                  <span className="font-medium">{userStats.questionsAnswered.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{language === 'ar' ? 'الوقت المستغرق' : 'Time Spent'}</span>
                  <span className="font-medium">{userStats.timeSpent}h</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{language === 'ar' ? 'الإجابات الصحيحة' : 'Correct Answers'}</span>
                  <span className="font-medium">{userStats.correctAnswers.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'الإنجازات' : 'Achievements'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    achievement.earned 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                  {achievement.earned && (
                    <Badge className="bg-green-500 text-white text-xs">{language === 'ar' ? 'مكتسبة' : 'Earned'}</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Settings */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'الإعدادات' : 'Settings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {language === 'ar' ? 'اللغة' : 'Language'}: {language}
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      console.log('Switching to English');
                      setLanguage('en');
                    }}
                    className="flex items-center gap-2"
                  >
                    🇺🇸 {language === 'ar' ? 'الإنجليزية' : 'English'}
                  </Button>
                  <Button
                    variant={language === 'ar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      console.log('Switching to Arabic');
                      setLanguage('ar');
                    }}
                    className="flex items-center gap-2"
                  >
                    🇸🇦 العربية
                  </Button>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {language === 'ar' ? 'السمة' : 'Theme'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {themeOptions.map((themeOption) => (
                    <Button
                      key={themeOption.id}
                      variant={theme === themeOption.id ? "default" : "outline"}
                      className="h-12 flex items-center gap-2"
                      onClick={() => {
                        console.log('Theme button clicked:', themeOption.id);
                        setTheme(themeOption.id);
                      }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: themeOption.color }}
                      />
                      <span className="text-xs">{themeOption.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{language === 'ar' ? 'إشعارات الدفع' : 'Push Notifications'}</label>
                <Switch 
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral System */}
        {isAuthenticated && (
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-green-500" />
                  {language === 'ar' ? 'نظام الإحالة' : 'Referral System'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {referralData && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'ar' ? 'كودك الشخصي' : 'Your Referral Code'}
                        </p>
                        <p className="font-mono font-bold text-lg">{referralData.referralCode}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={copyReferralLink}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-bold text-green-500">{referralData.totalReferrals}</p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'إحالات ناجحة' : 'Successful Referrals'}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-500">
                          {referralData.totalReferrals * 50}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ar' ? 'عملات مكتسبة' : 'Coins Earned'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!showReferralInput ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowReferralInput(true)}
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'استخدم كود إحالة' : 'Use Referral Code'}
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={language === 'ar' ? 'أدخل كود الإحالة' : 'Enter referral code'}
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value)}
                      className="w-full p-2 border rounded-lg bg-background"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={useReferralCode} className="flex-1">
                        {language === 'ar' ? 'تأكيد' : 'Apply'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setShowReferralInput(false);
                          setReferralCodeInput('');
                        }}
                      >
                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                )}

                {referralMessage && (
                  <p className="text-sm text-center p-2 rounded-lg bg-muted/30">
                    {referralMessage}
                  </p>
                )}

                <div className="text-xs text-muted-foreground text-center">
                  {language === 'ar' 
                    ? 'شارك كودك واحصل على 50 عملة لكل صديق جديد!' 
                    : 'Share your code and earn 50 coins for each new friend!'}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Action buttons */}
        {isAuthenticated && (
          <motion.div variants={itemVariants} className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setGameState('friends')}
            >
              <Users className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'قائمة الأصدقاء' : 'Friends List'}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setGameState('coin-store')}
            >
              <Crown className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'الترقية إلى المميز' : 'Upgrade to Premium'}
            </Button>
            <Button
              variant="outline"
              className="w-full text-red-500 border-red-500/30 hover:bg-red-500/10"
              onClick={logout}
            >
              {language === 'ar' ? 'تسجيل خروج' : 'Sign Out'}
            </Button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}