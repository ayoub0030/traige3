import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../lib/stores/useLanguage';
import { useTriviaGame } from '../../lib/stores/useTriviaGame';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Shield, Eye, Lock, Database } from 'lucide-react';

export default function PrivacyPolicy() {
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

  const privacyContent = {
    en: {
      title: "Privacy Policy",
      subtitle: "How we protect your data",
      lastUpdated: "Last updated: August 29, 2025",
      sections: [
        {
          icon: Database,
          title: "Information We Collect",
          content: [
            "Account information: Username, email, and encrypted password",
            "Game statistics: Scores, achievements, and playing patterns", 
            "Payment information: Processed securely through Stripe",
            "Device information: Browser type and basic device details"
          ]
        },
        {
          icon: Eye,
          title: "How We Use Your Information",
          content: [
            "Provide and improve our trivia game service",
            "Track game progress and maintain leaderboards",
            "Process payments for premium subscriptions",
            "Send important updates about your account or service"
          ]
        },
        {
          icon: Lock,
          title: "Data Protection",
          content: [
            "All passwords are encrypted using industry-standard bcrypt",
            "Payment processing is handled securely by Stripe",
            "We never store credit card information on our servers",
            "Data is transmitted over secure HTTPS connections"
          ]
        },
        {
          icon: Shield,
          title: "Your Rights",
          content: [
            "Access and download your personal data",
            "Request deletion of your account and data",
            "Opt out of non-essential communications",
            "Update your information at any time"
          ]
        }
      ]
    },
    ar: {
      title: "سياسة الخصوصية",
      subtitle: "كيف نحمي بياناتك",
      lastUpdated: "آخر تحديث: 29 أغسطس 2025",
      sections: [
        {
          icon: Database,
          title: "المعلومات التي نجمعها",
          content: [
            "معلومات الحساب: اسم المستخدم والبريد الإلكتروني وكلمة المرور المشفرة",
            "إحصائيات اللعبة: النقاط والإنجازات وأنماط اللعب",
            "معلومات الدفع: تتم معالجتها بأمان من خلال Stripe",
            "معلومات الجهاز: نوع المتصفح وتفاصيل الجهاز الأساسية"
          ]
        },
        {
          icon: Eye,
          title: "كيف نستخدم معلوماتك",
          content: [
            "توفير وتحسين خدمة لعبة الأسئلة لدينا",
            "تتبع تقدم اللعبة والحفاظ على لوحات المتصدرين",
            "معالجة المدفوعات للاشتراكات المميزة",
            "إرسال تحديثات مهمة حول حسابك أو الخدمة"
          ]
        },
        {
          icon: Lock,
          title: "حماية البيانات",
          content: [
            "جميع كلمات المرور مشفرة باستخدام bcrypt المعياري في الصناعة",
            "تتم معالجة المدفوعات بأمان بواسطة Stripe",
            "نحن لا نخزن معلومات بطاقة الائتمان على خوادمنا مطلقاً",
            "يتم نقل البيانات عبر اتصالات HTTPS آمنة"
          ]
        },
        {
          icon: Shield,
          title: "حقوقك",
          content: [
            "الوصول إلى بياناتك الشخصية وتنزيلها",
            "طلب حذف حسابك وبياناتك",
            "إلغاء الاشتراك في الاتصالات غير الأساسية",
            "تحديث معلوماتك في أي وقت"
          ]
        }
      ]
    }
  };

  const content = privacyContent[language as keyof typeof privacyContent];

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

        {/* Privacy Sections */}
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

        {/* Contact Information */}
        <motion.div variants={itemVariants}>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="font-bold mb-2">
                {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' 
                  ? 'إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بنا.'
                  : 'If you have any questions about this Privacy Policy, please contact us.'}
              </p>
              <p className="text-sm text-primary font-medium mt-2">
                privacy@mirage-trivia.com
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}