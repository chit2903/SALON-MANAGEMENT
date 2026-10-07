import React, { useEffect, useState } from 'react';
import { Save, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/storage';

interface ProfileFormState {
  name: string;
  email: string;
  phone: string;
}

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<ProfileFormState>({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfile({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
  }, [user]);

  const handleSave = () => {
    if (!user) {
      return;
    }

    if (!profile.name.trim() || !profile.email.trim() || !profile.phone.trim()) {
      toast.error('Please fill in all profile fields');
      return;
    }

    storage.updateUser(user.id, {
      name: profile.name.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
    });

    refreshUser();
    toast.success('Profile updated successfully');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
          <UserCircle2 className="w-7 h-7 text-amber-400" /> Profile
        </h1>
        <p className="text-muted-foreground">Manage your personal salon workspace details.</p>
      </div>

      <Card className="border-0 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle2 className="h-4 w-4 text-amber-400" />
            Account information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Full name</Label>
            <Input
              id="profile-name"
              value={profile.name}
              onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                value={profile.email}
                onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={profile.phone}
                onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">
            Role: <span className="font-medium text-foreground">{user.role}</span>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
              <Save className="mr-2 h-4 w-4" />
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
