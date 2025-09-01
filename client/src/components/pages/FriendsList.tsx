import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/stores/useAuth';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  ArrowLeft, 
  Users,
  UserPlus,
  Copy,
  Trophy,
  Coins,
  Search,
  X,
  Share2,
  Gift
} from 'lucide-react';

interface Friend {
  id: number;
  username: string;
  rank: string;
  coins: number;
  level: number;
  friendCode: string;
  addedAt: string;
}

export default function FriendsList() {
  const { user, isAuthenticated } = useAuth();
  const { language, translations } = useLanguage();
  const { setGameState } = useTriviaGame();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendCode, setFriendCode] = useState('');
  const [myFriendCode, setMyFriendCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate unique friend code for user
  useEffect(() => {
    if (user?.username) {
      // Generate a unique code based on username and user ID
      const code = `${user.username.toUpperCase()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      setMyFriendCode(code);
      
      // Load friends from localStorage (in production, this would be from database)
      const savedFriends = localStorage.getItem(`friends_${user.username}`);
      if (savedFriends) {
        setFriends(JSON.parse(savedFriends));
      }
    }
  }, [user]);

  // Copy friend code to clipboard
  const copyFriendCode = async () => {
    try {
      await navigator.clipboard.writeText(myFriendCode);
      setMessage(language === 'ar' ? '✅ تم نسخ الكود!' : '✅ Code copied!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(language === 'ar' ? '❌ فشل النسخ' : '❌ Failed to copy');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Share friend code
  const shareFriendCode = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mirage Trivia Friend Code',
          text: language === 'ar' 
            ? `أضفني كصديق في Mirage Trivia! الكود: ${myFriendCode}`
            : `Add me as a friend on Mirage Trivia! Code: ${myFriendCode}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    }
  };

  // Add friend by code
  const addFriend = () => {
    if (!friendCode.trim()) {
      setMessage(language === 'ar' ? '❌ الرجاء إدخال كود' : '❌ Please enter a code');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check if already friends
    if (friends.some(f => f.friendCode === friendCode.toUpperCase())) {
      setMessage(language === 'ar' ? '❌ مضاف بالفعل' : '❌ Already added');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Check if trying to add self
    if (friendCode.toUpperCase() === myFriendCode) {
      setMessage(language === 'ar' ? '❌ لا يمكنك إضافة نفسك' : "❌ You can't add yourself");
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    // Simulate adding friend (in production, this would be an API call)
    const newFriend: Friend = {
      id: friends.length + 1,
      username: `Player_${friendCode.substr(0, 4)}`,
      rank: ['Bronze', 'Silver', 'Gold'][Math.floor(Math.random() * 3)],
      coins: Math.floor(Math.random() * 5000),
      level: Math.floor(Math.random() * 20) + 1,
      friendCode: friendCode.toUpperCase(),
      addedAt: new Date().toISOString()
    };

    const updatedFriends = [...friends, newFriend];
    setFriends(updatedFriends);
    
    // Save to localStorage
    if (user?.username) {
      localStorage.setItem(`friends_${user.username}`, JSON.stringify(updatedFriends));
    }

    setMessage(language === 'ar' ? '✅ تمت الإضافة بنجاح!' : '✅ Friend added successfully!');
    setFriendCode('');
    setShowAddFriend(false);
    setTimeout(() => setMessage(''), 3000);
  };

  // Remove friend
  const removeFriend = (friendId: number) => {
    const updatedFriends = friends.filter(f => f.id !== friendId);
    setFriends(updatedFriends);
    
    // Save to localStorage
    if (user?.username) {
      localStorage.setItem(`friends_${user.username}`, JSON.stringify(updatedFriends));
    }
    
    setMessage(language === 'ar' ? '✅ تمت الإزالة' : '✅ Friend removed');
    setTimeout(() => setMessage(''), 3000);
  };

  // Filter friends by search term
  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            onClick={() => setGameState('profile')}
            className="text-primary hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {language === 'ar' ? 'قائمة الأصدقاء' : 'Friends List'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'تواصل مع أصدقائك' : 'Connect with your friends'}
            </p>
          </div>
        </motion.div>

        {/* My Friend Code Card */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="h-5 w-5 text-primary" />
                {language === 'ar' ? 'كود الصداقة الخاص بك' : 'Your Friend Code'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg mb-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === 'ar' ? 'شارك هذا الكود' : 'Share this code'}
                  </p>
                  <p className="font-mono font-bold text-xl">{myFriendCode}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyFriendCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={shareFriendCode}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {message && (
                <p className="text-sm text-center p-2 rounded-lg bg-muted/30">
                  {message}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Add Friend Section */}
        <motion.div variants={itemVariants}>
          {!showAddFriend ? (
            <Button 
              className="w-full"
              onClick={() => setShowAddFriend(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'إضافة صديق' : 'Add Friend'}
            </Button>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Input
                    placeholder={language === 'ar' ? 'أدخل كود الصديق' : 'Enter friend code'}
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  <div className="flex gap-2">
                    <Button onClick={addFriend} className="flex-1">
                      {language === 'ar' ? 'إضافة' : 'Add'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAddFriend(false);
                        setFriendCode('');
                      }}
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Search Friends */}
        {friends.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'البحث عن صديق...' : 'Search friends...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>
        )}

        {/* Friends List */}
        <motion.div variants={itemVariants} className="space-y-3">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => (
              <Card key={friend.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{friend.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {friend.rank}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Lvl {friend.level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Coins className="h-3 w-3 text-yellow-500" />
                          <span className="text-sm font-medium">
                            {friend.coins.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFriend(friend.id)}
                        className="text-red-500 hover:bg-red-500/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? (language === 'ar' ? 'لا توجد نتائج' : 'No results found')
                    : (language === 'ar' ? 'لا يوجد أصدقاء بعد' : 'No friends yet')}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {language === 'ar' 
                    ? 'شارك كودك أو أضف أصدقاء جدد!'
                    : 'Share your code or add new friends!'}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Friends Count */}
        {friends.length > 0 && (
          <motion.div variants={itemVariants} className="text-center text-sm text-muted-foreground">
            {language === 'ar' 
              ? `${friends.length} صديق`
              : `${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}