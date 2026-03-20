import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Building2, ArrowRight, Send, FileText, Bell, Calendar, Users, TrendingUp, Globe, CheckCircle, Zap, Award, Shield } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Animated background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70">
              <School className="h-6 w-6 text-white" />
            </div>
            <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{t('app.title')}</span>
          </div>
          <Link to="/login">
            <Button className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/30">{t('auth.signIn')}</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          <div className="animate-fade-in space-y-8">
            {/* Hero icons */}
            <div className="flex justify-center gap-3 mb-8">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur border border-primary/20 animate-slide-up">
                <School className="h-10 w-10 text-primary" />
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 backdrop-blur border border-secondary/20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <Building2 className="h-10 w-10 text-secondary" />
              </div>
              <div className="p-3 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur border border-accent/20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Globe className="h-10 w-10 text-accent" />
              </div>
            </div>
            
            {/* Main heading */}
            <div className="text-center space-y-4">
              <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                {t('app.title')}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Empowering Afghan schools with digital solutions for seamless data management and verification
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Link to="/login">
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-xl hover:shadow-primary/40 group">
                  {t('auth.signUp')}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-2 hover:bg-primary/5">
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="pt-8 flex justify-center gap-8 text-center">
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">34+</div>
                <div className="text-sm text-muted-foreground">Provinces</div>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">8000+</div>
                <div className="text-sm text-muted-foreground">Schools</div>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">2.5M+</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">Powerful Features</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Everything you need to manage school data efficiently</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Send,
              title: "Digital Submissions",
              description: "Submit statistics, reports, and forms digitally with real-time validation",
              variant: "primary" as const
            },
            {
              icon: TrendingUp,
              title: "Track Progress",
              description: "Monitor performance and trends across all your data submissions",
              variant: "secondary" as const
            },
            {
              icon: Shield,
              title: "Secure Verification",
              description: "Multi-tier approval workflow with encryption and audit trails",
              variant: "accent" as const
            },
            {
              icon: Bell,
              title: "Live Updates",
              description: "Get instant notifications about deadlines and policy changes",
              variant: "primary" as const
            }
          ].map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={idx}
                className="group hover:shadow-xl transition-all duration-300 border-white/10 bg-gradient-to-br hover:from-primary/5 hover:to-transparent animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardHeader>
                  <div className={`p-3 rounded-lg w-fit mb-4 bg-gradient-to-br ${
                    feature.variant === 'primary' ? 'from-primary/20 to-primary/10' :
                    feature.variant === 'secondary' ? 'from-secondary/20 to-secondary/10' :
                    'from-accent/20 to-accent/10'
                  } group-hover:shadow-lg transition-shadow`}>
                    <Icon className={`h-6 w-6 ${
                      feature.variant === 'primary' ? 'text-primary' :
                      feature.variant === 'secondary' ? 'text-secondary' :
                      'text-accent'
                    }`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 md:py-24 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 rounded-3xl border border-white/10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground">Streamlined workflow from submission to approval</p>
        </div>

        <div className="grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
          {[
            { num: 1, title: "Sign Up", desc: "Create your account with school details" },
            { num: 2, title: "Submit Data", desc: "Upload statistics and reports" },
            { num: 3, title: "Verification", desc: "Multi-tier review process" },
            { num: 4, title: "Approval", desc: "Get verified and access full features" }
          ].map((step, idx) => (
            <div key={idx} className="relative text-center animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="absolute inset-0 flex items-center justify-center -z-10">
                {idx < 3 && (
                  <div className="absolute left-full top-1/2 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent -translate-y-1/2 hidden md:block"></div>
                )}
              </div>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                  {step.num}
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">Why Choose SchoolBridge?</h2>
          <p className="text-lg text-muted-foreground">Trusted by education administrators across Afghanistan</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {[
            { icon: CheckCircle, title: "Secure & Encrypted", description: "Your data is protected with military-grade encryption" },
            { icon: Zap, title: "Lightning Fast", description: "Optimized performance for instant data submission" },
            { icon: Users, title: "Easy Collaboration", description: "Multi-tier workflow for transparent approvals" },
            { icon: Award, title: "Ministry Approved", description: "Complies with Afghan education standards" }
          ].map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={idx}
                className="p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-primary/5 to-secondary/5 hover:border-primary/30 transition-all duration-300 hover:shadow-lg animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex gap-4">
                  <div className="p-3 rounded-lg h-fit bg-gradient-to-br from-primary/20 to-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-heading font-bold text-center mb-12">Key Capabilities</h2>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          <Card className="group border-white/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <Send className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Submit Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Schools submit student statistics, reports, and forms digitally with instant validation
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group border-white/10 hover:border-secondary/30 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <Bell className="h-8 w-8 text-secondary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Live Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Get instant اعلانات and notifications from education officials directly in your dashboard
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group border-white/10 hover:border-accent/30 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <FileText className="h-8 w-8 text-accent mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Access Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download policies, guidelines, and curricula shared by the ministry instantly
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group border-white/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" />
              <CardTitle className="text-lg">Deadline Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Never miss important dates with smart deadline reminders integrated throughout the app
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonial / Social Proof */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-secondary/10 border-white/10 backdrop-blur">
          <CardHeader className="text-center">
            <div className="flex gap-1 justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Award key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <CardTitle className="text-2xl md:text-3xl">Trusted by Education Leaders</CardTitle>
            <CardDescription className="text-base mt-2">
              "SchoolBridge transformed how we manage school data. The verification workflow saves hours of manual processing every week."
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="font-semibold">Dr. Mohammad Zaher - Ministry of Education</p>
            <p className="text-sm text-muted-foreground">Director of Digital Services</p>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary via-primary/80 to-secondary text-white border-0 shadow-2xl shadow-primary/30">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl md:text-4xl text-white">Ready to Transform Your School?</CardTitle>
            <CardDescription className="text-white/90 text-lg">
              Join thousands of Afghan schools using SchoolBridge today
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/login">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Schedule Demo
                </Button>
              </Link>
            </div>
            <p className="text-white/80 text-sm mt-6">No credit card required • Free forever for schools</p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-16 bg-gradient-to-b from-background to-background/50">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4 mb-12">
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary transition">Features</Link></li>
                <li><Link to="#" className="hover:text-primary transition">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-primary transition">Try Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary transition">About</Link></li>
                <li><Link to="#" className="hover:text-primary transition">Blog</Link></li>
                <li><Link to="#" className="hover:text-primary transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary transition">Documentation</Link></li>
                <li><Link to="#" className="hover:text-primary transition">FAQ</Link></li>
                <li><Link to="#" className="hover:text-primary transition">Support</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary transition">Privacy</Link></li>
                <li><Link to="#" className="hover:text-primary transition">Terms</Link></li>
                <li><Link to="#" className="hover:text-primary transition">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} SchoolBridge. Connecting education across Afghanistan.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link to="#" className="hover:text-primary transition">Twitter</Link>
              <Link to="#" className="hover:text-primary transition">Facebook</Link>
              <Link to="#" className="hover:text-primary transition">LinkedIn</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
