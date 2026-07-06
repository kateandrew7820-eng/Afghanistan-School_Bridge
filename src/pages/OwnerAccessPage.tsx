import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Building2, GraduationCap, Landmark, School, Users } from 'lucide-react';
import { getOwnerRoleRoute, type OwnerRoleSelection } from '@/lib/ownerAccess';

const ownerActions: Array<{ key: OwnerRoleSelection; label: string; description: string; icon: typeof School }> = [
  { key: 'teacher', label: 'Teacher', description: 'Open the school workspace as a teacher.', icon: GraduationCap },
  { key: 'principal', label: 'Principal', description: 'Open the school workspace as a principal.', icon: School },
  { key: 'district_admin', label: 'District', description: 'Open the district workspace.', icon: Building2 },
  { key: 'province_admin', label: 'Province', description: 'Open the provincial workspace.', icon: Landmark },
  { key: 'ministry_admin', label: 'Ministry', description: 'Open the ministry workspace.', icon: Users },
];

export default function OwnerAccessPage() {
  const navigate = useNavigate();

  const handleSelect = (role: OwnerRoleSelection) => {
    navigate(getOwnerRoleRoute(role), { replace: true });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 flex items-center justify-center" dir="rtl">
      <div className="w-full max-w-5xl space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-primary">Owner access</p>
          <h1 className="text-3xl font-bold">Choose a workspace to enter</h1>
          <p className="text-muted-foreground">This account opens the real platform directly for the selected role.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {ownerActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.key} className="border-border/60 shadow-sm">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{action.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                  <Button className="w-full" onClick={() => handleSelect(action.key)}>
                    Enter
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
