import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { School, Plus, Loader2, Search } from 'lucide-react';

interface SchoolData {
  id: string;
  name: string;
  code: string | null;
  province: string | null;
  district: string | null;
  contact_email: string | null;
  is_active: boolean;
}

export default function ManageSchools() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '',
    province: '',
    district: '',
    contact_email: ''
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    const { data } = await supabase
      .from('schools')
      .select('*')
      .order('name', { ascending: true });
    
    if (data) setSchools(data);
    setLoading(false);
  }

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase.from('schools').insert({
      name: newSchool.name,
      code: newSchool.code || null,
      province: newSchool.province || null,
      district: newSchool.district || null,
      contact_email: newSchool.contact_email || null
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Failed to Add School",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "School Added",
      description: `${newSchool.name} has been added successfully.`
    });

    setIsAddDialogOpen(false);
    setNewSchool({ name: '', code: '', province: '', district: '', contact_email: '' });
    fetchSchools();
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.province?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <School className="h-6 w-6" />
            Manage Schools
          </h1>
          <p className="text-muted-foreground">Add and manage school accounts</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New School</DialogTitle>
              <DialogDescription>Register a new school in the system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSchool} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">School Name *</Label>
                <Input
                  id="name"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  placeholder="Ahmad Shah Baba High School"
                  required
                />
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">School Code</Label>
                  <Input
                    id="code"
                    value={newSchool.code}
                    onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value })}
                    placeholder="KBL-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newSchool.contact_email}
                    onChange={(e) => setNewSchool({ ...newSchool, contact_email: e.target.value })}
                    placeholder="school@example.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    value={newSchool.province}
                    onChange={(e) => setNewSchool({ ...newSchool, province: e.target.value })}
                    placeholder="Kabul"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input
                    id="district"
                    value={newSchool.district}
                    onChange={(e) => setNewSchool({ ...newSchool, district: e.target.value })}
                    placeholder="District 1"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add School'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search schools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Schools List */}
      {loading ? (
        <p className="text-muted-foreground">Loading schools...</p>
      ) : filteredSchools.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No schools match your search' : 'No schools registered yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => (
            <Card key={school.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{school.name}</CardTitle>
                  <Badge variant={school.is_active ? 'default' : 'secondary'}>
                    {school.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {school.code && (
                  <CardDescription>Code: {school.code}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-1">
                  {school.province && <p>Province: {school.province}</p>}
                  {school.district && <p>District: {school.district}</p>}
                  {school.contact_email && <p>Email: {school.contact_email}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
