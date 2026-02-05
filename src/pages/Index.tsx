import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Building2, ArrowRight, Send, FileText, Bell, Calendar } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="h-6 w-6 text-primary" />
            <span className="font-bold">Afghanistan Schools Portal</span>
          </div>
          <Link to="/login">
            <Button>Sign In</Button>
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
          
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Afghanistan Schools Data Portal
          </h1>
          <p className="text-xl text-muted-foreground">پورتال معلومات مکاتب افغانستان</p>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connecting schools across Afghanistan with the central education ministry. 
            Submit data digitally, receive updates, and eliminate the need for long distance paper transfers.
          </p>

          <Link to="/login">
            <Button size="lg" className="mt-4">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
        
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
                Get instant announcements and news from the center directly in your dashboard.
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
              Contact the center administrator if your school needs an account.
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
