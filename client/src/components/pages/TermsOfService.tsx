import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, FileText, AlertTriangle, CreditCard, Users } from 'lucide-react';

export default function TermsOfService() {
  const { language } = useLanguage();
  const { setGameState } = useTriviaGame();

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

  const termsContent = {
    en: {
      title: "Terms of Service",
      subtitle: "Rules and guidelines for using MIRAGE",
      lastUpdated: "Last updated: August 29, 2025",
      sections: [
        {
          icon: FileText,
          title: "Acceptance of Terms",
          content: [
            "By accessing and using MIRAGE trivia game, you accept these terms",
            "You must be at least 13 years old to use our service",
            "These terms may be updated periodically with notice",
            "Continued use constitutes acceptance of any changes"
          ]
        },
        {
          icon: Users,
          title: "User Accounts",
          content: [
            "You are responsible for maintaining account security",
            "One account per person; sharing accounts is prohibited",
            "You must provide accurate information during registration",
            "We reserve the right to suspend accounts for policy violations"
          ]
        },
        {
          icon: CreditCard,
          title: "Payments and Subscriptions",
          content: [
            "Premium subscriptions are billed monthly at $9.99/month",
            "Payments are processed securely through Stripe",
            "Refunds are provided according to our refund policy",
            "Subscription cancellation takes effect at the end of billing period"
          ]
        },
        {
          icon: AlertTriangle,
          title: "Prohibited Conduct",
          content: [
            "Cheating, hacking, or using automated tools",
            "Sharing inappropriate content or harassment",
            "Attempting to gain unauthorized access to our systems",
            "Violating intellectual property rights"
          ]
        }
      ]
    },
    ar: {
      title: "شروط الخدمة",
      subtitle: "القواعد والإرشادات لاستخدام MIRAGE",
      lastUpdated: "آخر تحديث: 29 أغسطس 2025",
      sections: [
        {
          icon: FileText,
          title: "قبول الشروط",
          content: [
            "من خلال الوصول واستخدام لعبة MIRAGE للأسئلة، فإنك تقبل هذه الشروط",
            "يجب أن تكون بعمر 13 سنة على الأقل لاستخدام خدمتنا",
            "قد يتم تحديث هذه الشروط دورياً مع الإشعار",
            "الاستخدام المستمر يشكل قبولاً لأي تغييرات"
          ]
        },
        {
          icon: Users,
          title: "حسابات المستخدمين",
          content: [
            "أنت مسؤول عن الحفاظ على أمان الحساب",
            "حساب واحد لكل شخص؛ مشاركة الحسابات محظورة",
            "يجب تقديم معلومات دقيقة أثناء التسجيل",
            "نحتفظ بالحق في تعليق الحسابات لانتهاك السياسات"
          ]
        },
        {
          icon: CreditCard,
          title: "المدفوعات والاشتراكات",
          content: [
            "الاشتراكات المميزة تُفوتر شهرياً بـ 9.99 دولار/شهر",
            "تتم معالجة المدفوعات بأمان من خلال Stripe",
            "يتم توفير المبالغ المستردة وفقاً لسياسة الاسترداد الخاصة بنا",
            "إلغاء الاشتراك يسري في نهاية فترة الفوترة"
          ]
        },
        {
          icon: AlertTriangle,
          title: "السلوك المحظور",
          content: [
            "الغش أو القرصنة أو استخدام الأدوات الآلية",
            "مشاركة محتوى غير لائق أو التحرش",
            "محاولة الحصول على وصول غير مصرح به لأنظمتنا",
            "انتهاك حقوق الملكية الفكرية"
          ]
        }
      ]
    }
  };

  const content = termsContent[language as keyof typeof termsContent];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 overflow-y-auto" style={{ height: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto space-y-6 pb-40"
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
            <h1 className="text-2xl font-bold text-primary">{content.title}</h1>
            <p className="text-sm text-muted-foreground">{content.subtitle}</p>
          </div>
        </motion.div>

        {/* Last Updated */}
        <motion.div variants={itemVariants}>
          <p className="text-sm text-muted-foreground text-center">
            {content.lastUpdated}
          </p>
        </motion.div>

        {/* Terms Sections */}
        {content.sections.map((section, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {/* Legal Notice */}
        <motion.div variants={itemVariants}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="font-bold mb-2">
                {language === 'ar' ? 'إشعار قانوني' : 'Legal Notice'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'هذه الشروط محكومة بقوانين الولايات المتحدة الأمريكية. أي نزاعات ستحل من خلال التحكيم الملزم.'
                  : 'These terms are governed by United States law. Any disputes will be resolved through binding arbitration.'}
              </p>
              <p className="text-sm text-primary font-medium mt-2">
                legal@mirage-trivia.com
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}