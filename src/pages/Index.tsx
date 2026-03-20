import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Building2, ArrowRight, Send, FileText, Bell, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/contexts/LocalizationContext';
import { getRoleTier } from '@/lib/supabase';

export default function Index() {
  const { t } = useTranslation();
  const { user, roleTier, loading } = useAuth();

  // Get the correct dashboard route based on role tier
  const getDashboardRoute = (): string => {
    switch (roleTier) {
      case 'school': return '/school';
      case 'district': return '/district';
      case 'province': return '/province';
      case 'ministry': return '/ministry';
      default: return '/login';
    }
  };

  // Redirect authenticated users to their dashboard
  if (user && !loading && roleTier) {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show public landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="h-6 w-6 text-primary" />
            <span className="font-heading font-bold">{t('app.title')}</span>
          </div>
          <Link to="/login">
            <Button>{t('auth.signIn')}</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex justify-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-primary/10">
              <School className="h-12 w-12 text-primary" />
            </div>
            <div className="p-4 rounded-2xl bg-primary/10">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight">
            {t('app.title')}
          </h1>
          <p className="text-xl text-muted-foreground">{t('app.description')}</p>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('app.description')} - تکمیل ارتباط آموزش در سراسر افغانستان
          </p>

          <Link to="/login">
            <Button size="lg" className="mt-4">
              {t('auth.signUp')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-heading font-bold text-center mb-12">How It Works</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <Send className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Submit Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Schools can submit student statistics, reports, and forms digitally - no more paper!
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Bell className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Receive Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get instant اعلانات and news from the center directly in your dashboard.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Access Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download policies, guidelines, and curricula shared by the education ministry.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Track Deadlines</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Never miss an important date with the built-in deadline calendar.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription>
              Create an account or sign in to access the portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/login">
              <Button size="lg">
                Sign In to Portal
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} Afghanistan Schools Data Portal</p>
          <p className="mt-1">Connecting education across the nation</p>
        </div>
      </footer>
    </div>
  );
}
