import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { SpaceButton } from '../ui/SpaceButton';
import { HologramCard } from '../ui/HologramCard';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  ArrowLeft, 
  Trophy,
  Crown,
  Medal,
  Star,
  Target,
  Gamepad2,
  Users,
  Globe,
  Loader2,
  Sparkles,
  Coins,
  Zap,
  TrendingUp
} from 'lucide-react';

interface LeaderboardPlayer {
  id: number;
  username: string;
  rank: string;
  coins: number;
  totalScore: number;
  totalWins: number;
  totalGames: number;
  maxStreak: number;
  averageScore: number;
  perfectGames: number;
  winRate: string;
  singleplayerWinRate: string;
  oneVsOneWinRate: string;
  twoVsTwoWinRate: string;
  lastPlayed: string;
}

export default function LeaderboardPage() {
  const { language } = useLanguage();
  const { setGameState } = useTriviaGame();
  const [activeMode, setActiveMode] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Fetch leaderboard data
  const fetchLeaderboard = async (mode = activeMode, lang = selectedLanguage, reset = false) => {
    try {
      setIsLoading(true);
      const offset = reset ? 0 : currentPage * 10;
      
      const params = new URLSearchParams({
        limit: '10',
        offset: offset.toString(),
        ...(mode !== 'all' && { mode }),
        ...(lang !== 'all' && { language: lang })
      });

      const response = await fetch(`/api/leaderboard?${params}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setLeaderboard(data.leaderboard);
          setCurrentPage(0);
        } else {
          setLeaderboard(prev => [...prev, ...data.leaderboard]);
        }
        setHasMore(data.pagination.hasMore);
        if (!reset) setCurrentPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load leaderboard on component mount and filter changes
  useEffect(() => {
    fetchLeaderboard(activeMode, selectedLanguage, true);
  }, [activeMode, selectedLanguage]);

  // Get rank icon and color
  const getRankDisplay = (rank: string, position: number) => {
    const isTopThree = position <= 3;
    
    if (isTopThree) {
      const icons = [
        { icon: Crown, color: 'text-yellow-500' },
        { icon: Medal, color: 'text-gray-400' },
        { icon: Trophy, color: 'text-amber-600' }
      ];
      const { icon: Icon, color } = icons[position - 1];
      return <Icon className={`h-6 w-6 ${color}`} />;
    }

    const rankColors: Record<string, string> = {
      'Legendary': 'text-purple-400',
      'Diamond': 'text-blue-400',
      'Platinum': 'text-gray-300',
      'Gold': 'text-yellow-400',
      'Silver': 'text-gray-400',
      'Bronze': 'text-amber-500'
    };

    return (
      <Badge variant="secondary" className={`${rankColors[rank] || 'text-gray-500'} border-0 font-semibold`}>
        {rank}
      </Badge>
    );
  };

  // Mode tabs configuration
  const modeTabs = [
    { 
      id: 'all', 
      name: language === 'ar' ? 'الكل' : 'All', 
      icon: Globe,
      description: language === 'ar' ? 'جميع الأنماط' : 'All game modes'
    },
    { 
      id: '1v1', 
      name: language === 'ar' ? 'واحد ضد واحد' : '1vs1', 
      icon: Target,
      description: language === 'ar' ? 'المواجهات الفردية' : 'Head-to-head battles'
    },
    { 
      id: '2v2', 
      name: language === 'ar' ? 'اثنان ضد اثنان' : '2vs2', 
      icon: Users,
      description: language === 'ar' ? 'فريق ضد فريق' : 'Team battles'
    },
    { 
      id: 'single', 
      name: language === 'ar' ? 'فردي' : 'Solo', 
      icon: Gamepad2,
      description: language === 'ar' ? 'اللعب الفردي' : 'Single player'
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.05
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
        className="max-w-6xl mx-auto space-y-6 pb-32"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
                <Trophy className="h-8 w-8" />
                {language === 'ar' ? 'قائمة المتصدرين' : 'Leaderboard'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'ar' ? 'أفضل اللاعبين في جميع أنحاء العالم' : 'Top players from around the world'}
              </p>
            </div>
          </div>

          {/* Language Filter */}
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {language === 'ar' ? 'جميع اللغات' : 'All Languages'}
              </SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Mode Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs value={activeMode} onValueChange={setActiveMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 h-auto p-2 bg-card">
              {modeTabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="font-medium">{tab.name}</span>
                  <span className="text-xs opacity-70">{tab.description}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Leaderboard Content */}
            {modeTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <tab.icon className="h-6 w-6 text-primary" />
                      {tab.name} {language === 'ar' ? 'المتصدرين' : 'Leaderboard'}
                      {selectedLanguage !== 'all' && (
                        <Badge variant="outline">
                          {selectedLanguage === 'en' ? 'English' : 'العربية'}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading && leaderboard.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Leaderboard Header */}
                        <div className="grid grid-cols-12 gap-4 p-3 text-sm font-medium text-muted-foreground border-b">
                          <div className="col-span-1 text-center">#</div>
                          <div className="col-span-3">{language === 'ar' ? 'اللاعب' : 'Player'}</div>
                          <div className="col-span-2 text-center">{language === 'ar' ? 'النقاط' : 'Score'}</div>
                          <div className="col-span-2 text-center">{language === 'ar' ? 'الانتصارات' : 'Wins'}</div>
                          <div className="col-span-2 text-center">{language === 'ar' ? 'معدل الفوز' : 'Win Rate'}</div>
                          <div className="col-span-2 text-center">{language === 'ar' ? 'أفضل سلسلة' : 'Best Streak'}</div>
                        </div>

                        {/* Leaderboard Entries */}
                        {leaderboard.map((player, index) => (
                          <motion.div
                            key={player.id}
                            variants={itemVariants}
                            className={`grid grid-cols-12 gap-4 p-3 rounded-lg transition-colors hover:bg-accent/50 ${
                              index < 3 ? 'bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20' : 'bg-card'
                            }`}
                          >
                            {/* Position */}
                            <div className="col-span-1 flex items-center justify-center">
                              <div className="flex items-center gap-2">
                                {getRankDisplay(player.rank, index + 1)}
                                <span className="text-sm font-medium">#{index + 1}</span>
                              </div>
                            </div>

                            {/* Player Info */}
                            <div className="col-span-3 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                                {player.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold">{player.username}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Coins className="h-3 w-3" />
                                  {player.coins}
                                </div>
                              </div>
                            </div>

                            {/* Total Score */}
                            <div className="col-span-2 text-center">
                              <div className="font-bold text-lg">{(player.totalScore || 0).toLocaleString()}</div>
                              <div className="text-xs text-muted-foreground">
                                {language === 'ar' ? 'متوسط' : 'Avg'}: {player.averageScore || 0}
                              </div>
                            </div>

                            {/* Wins */}
                            <div className="col-span-2 text-center">
                              <div className="font-semibold text-green-600">{player.totalWins || 0}</div>
                              <div className="text-xs text-muted-foreground">
                                / {player.totalGames || 0} {language === 'ar' ? 'ألعاب' : 'games'}
                              </div>
                            </div>

                            {/* Win Rate */}
                            <div className="col-span-2 text-center">
                              <div className="font-semibold">{player.winRate}%</div>
                              {(player.perfectGames || 0) > 0 && (
                                <div className="text-xs text-amber-600 flex items-center justify-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  {player.perfectGames || 0}
                                </div>
                              )}
                            </div>

                            {/* Best Streak */}
                            <div className="col-span-2 text-center">
                              <div className="font-semibold flex items-center justify-center gap-1">
                                <Zap className="h-4 w-4 text-orange-500" />
                                {player.maxStreak || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {language === 'ar' ? 'أفضل سلسلة' : 'best'}
                              </div>
                            </div>
                          </motion.div>
                        ))}

                        {/* Load More Button */}
                        {hasMore && (
                          <div className="text-center pt-6">
                            <Button
                              onClick={() => fetchLeaderboard()}
                              disabled={isLoading}
                              variant="outline"
                              className="min-w-32"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  {language === 'ar' ? 'عرض المزيد' : 'Load More'}
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* No data message */}
                        {leaderboard.length === 0 && !isLoading && (
                          <div className="text-center py-12">
                            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              {language === 'ar' ? 'لا توجد بيانات للعرض' : 'No leaderboard data available'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </motion.div>

        {/* Stats Summary */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{leaderboard.length}</div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'لاعبين نشطين' : 'Active Players'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Target className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {leaderboard.reduce((sum, p) => sum + (p.totalGames || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي الألعاب' : 'Total Games'}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {leaderboard.reduce((sum, p) => sum + (p.totalScore || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'إجمالي النقاط' : 'Total Points'}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}