import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import TriviaQuestion from '../game/TriviaQuestion';
import GameResults from '../game/GameResults';
import { useLanguage } from '../../lib/stores/useLanguage';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, 
  Play, 
  Brain, 
  Globe, 
  Trophy, 
  Beaker,
  Calendar,
  Film,
  Music,
  Star,
  Loader2,
  Sparkles,
  BookOpen,
  Gamepad2
} from 'lucide-react';

// Enhanced Quiz Zone with AI-generated questions and improved categories
export default function QuizZone() {
  const { gameState, setGameState, setCategory, setDifficulty, startGame, resetGame } = useTriviaGame();
  const { translations, language } = useLanguage();
  
  // State for AI categories and loading
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Fetch AI-powered categories on component mount and reset game state
  useEffect(() => {
    // Reset game when entering quiz zone to clear any stuck state
    if (gameState === 'playing' || gameState === 'results') {
      resetGame();
    }
    fetchCategories();
  }, [language]);

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await fetch(`/api/questions/categories?language=${language}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      } else {
        throw new Error(data.error || 'Failed to load categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use fallback categories if API fails
      setCategories(getFallbackCategories());
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Fallback categories for offline/error scenarios
  const getFallbackCategories = () => {
    const fallbackData = {
      en: [
        { id: 'general-knowledge', name: 'General Knowledge', icon: '🧠', subcategories: ['Basic Facts', 'World Knowledge', 'Common Sense'] },
        { id: 'sports', name: 'Sports', icon: '⚽', subcategories: ['Football', 'Basketball', 'Olympics'] },
        { id: 'science', name: 'Science', icon: '🔬', subcategories: ['Physics', 'Chemistry', 'Biology'] },
        { id: 'history', name: 'History', icon: '🏛️', subcategories: ['Ancient History', 'World Wars', 'Modern History'] },
        { id: 'movies', name: 'Movies & Entertainment', icon: '🎬', subcategories: ['Hollywood', 'TV Shows', 'Celebrities'] },
        { id: 'music', name: 'Music', icon: '🎵', subcategories: ['Pop Music', 'Classical', 'Rock'] },
        { id: 'news', name: 'Current News', icon: '📰', subcategories: ['World Events', 'Politics', 'Technology'] }
      ],
      ar: [
        { id: 'general-knowledge', name: 'المعرفة العامة', icon: '🧠', subcategories: ['الحقائق الأساسية', 'المعرفة العالمية', 'الحس العام'] },
        { id: 'sports', name: 'الرياضة', icon: '⚽', subcategories: ['كرة القدم', 'كرة السلة', 'الألعاب الأولمبية'] },
        { id: 'science', name: 'العلوم', icon: '🔬', subcategories: ['الفيزياء', 'الكيمياء', 'علم الأحياء'] },
        { id: 'history', name: 'التاريخ', icon: '🏛️', subcategories: ['التاريخ القديم', 'الحروب العالمية', 'التاريخ الحديث'] },
        { id: 'movies', name: 'الأفلام والترفيه', icon: '🎬', subcategories: ['هوليوود', 'البرامج التلفزيونية', 'المشاهير'] },
        { id: 'music', name: 'الموسيقى', icon: '🎵', subcategories: ['الموسيقى الشعبية', 'الكلاسيكية', 'الروك'] },
        { id: 'news', name: 'الأخبار الحالية', icon: '📰', subcategories: ['الأحداث العالمية', 'السياسة', 'التكنولوجيا'] }
      ]
    };
    
    return fallbackData[language] || fallbackData.en;
  };

  // Difficulty levels with localization
  const difficultyLevels = [
    { 
      id: 'easy', 
      name: language === 'ar' ? 'سهل' : 'Easy', 
      color: 'from-green-500 to-green-600',
      description: language === 'ar' ? 'للمبتدئين' : 'For beginners'
    },
    { 
      id: 'medium', 
      name: language === 'ar' ? 'متوسط' : 'Medium', 
      color: 'from-yellow-500 to-yellow-600',
      description: language === 'ar' ? 'متوسط الصعوبة' : 'Moderate challenge'
    },
    { 
      id: 'hard', 
      name: language === 'ar' ? 'صعب' : 'Hard', 
      color: 'from-red-500 to-red-600',
      description: language === 'ar' ? 'للخبراء' : 'For experts'
    }
  ];

  // Start AI-generated game
  const handleStartGame = async () => {
    if (!selectedCategory) return;
    
    setIsGeneratingQuestions(true);
    
    try {
      // Set the selected category and difficulty in the store
      setCategory(selectedCategory.id);
      setDifficulty(selectedDifficulty);
      
      // Start the game (this will generate questions and set gameState to 'playing')
      await startGame();
      
    } catch (error) {
      console.error('Error generating questions:', error);
      // The startGame function already handles fallbacks
    } finally {
      setIsGeneratingQuestions(false);
    }
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

  // Render different components based on game state
  if (gameState === 'playing') {
    return <TriviaQuestion />;
  }
  
  if (gameState === 'results') {
    return <GameResults />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 overflow-y-auto" style={{ height: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-6 pb-32"
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
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              {language === 'ar' ? 'منطقة الأسئلة' : 'Quiz Zone'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'أسئلة ذكية مولدة بالذكاء الاصطناعي' : 'AI-Generated Smart Questions'}
            </p>
          </div>
        </motion.div>

        {/* Categories Section */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'اختر الفئة' : 'Choose Category'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCategories ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <motion.div
                      key={category.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedCategory?.id === category.id 
                          ? 'border-primary border-2 bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                            {category.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{category.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {category.subcategories?.slice(0, 2).join(', ')}
                              {category.subcategories?.length > 2 && '...'}
                            </p>
                          </div>
                        </div>
                        
                        {selectedCategory?.id === category.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2"
                          >
                            <div className="flex flex-wrap gap-1">
                              {category.subcategories?.map((sub, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {sub}
                                </Badge>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Difficulty Selection */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            variants={itemVariants}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty Level'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {difficultyLevels.map((level) => (
                    <motion.div
                      key={level.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedDifficulty === level.id 
                          ? 'border-primary border-2 bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedDifficulty(level.id)}
                    >
                      <div className={`h-2 bg-gradient-to-r ${level.color}`} />
                      <div className="p-4 text-center">
                        <h3 className="font-semibold text-lg">{level.name}</h3>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Start Game Button */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            variants={itemVariants}
            className="text-center"
          >
            <Button
              onClick={handleStartGame}
              disabled={isGeneratingQuestions}
              className="w-full md:w-auto bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white border-0 h-14 px-8 text-lg"
            >
              {isGeneratingQuestions ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري إنشاء الأسئلة...' : 'Generating Questions...'}
                </>
              ) : (
                <>
                  <Gamepad2 className="h-5 w-5 mr-2" />
                  {language === 'ar' ? 'ابدأ اللعب' : 'Start Playing'}
                </>
              )}
            </Button>
            
            {selectedCategory && (
              <p className="text-sm text-muted-foreground mt-2">
                {language === 'ar' 
                  ? `${selectedCategory.name} • ${difficultyLevels.find(d => d.id === selectedDifficulty)?.name}`
                  : `${selectedCategory.name} • ${difficultyLevels.find(d => d.id === selectedDifficulty)?.name}`
                }
              </p>
            )}
          </motion.div>
        )}

        {/* AI Features Info */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
                <h3 className="font-semibold text-primary">
                  {language === 'ar' ? 'مزايا الذكاء الاصطناعي' : 'AI-Powered Features'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>
                    {language === 'ar' ? 'أسئلة متنوعة ومحدثة' : 'Fresh & diverse questions'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span>
                    {language === 'ar' ? 'دعم اللغة العربية والإنجليزية' : 'Arabic & English support'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  <span>
                    {language === 'ar' ? 'مستويات صعوبة ذكية' : 'Smart difficulty levels'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-orange-500" />
                  <span>
                    {language === 'ar' ? 'شروحات تفصيلية للإجابات' : 'Detailed explanations'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}