import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { storage } from '../services/storage';
import type { Notification } from '../types';

const defaultDraft = () => ({
  title: '',
  message: '',
  type: 'info' as Notification['type'],
});

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [draft, setDraft] = useState(defaultDraft());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNotifications = () => {
      setNotifications(storage.getNotifications());
      setIsLoading(false);
    };

    const timer = window.setTimeout(loadNotifications, 150);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((notification) => !notification.read);
    }

    return notifications;
  }, [notifications, filter]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const refreshNotifications = () => {
    setNotifications(storage.getNotifications());
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();

    if (!draft.title.trim() || !draft.message.trim()) {
      toast.error('Please provide a title and message');
      return;
    }

    storage.createNotification({
      title: draft.title.trim(),
      message: draft.message.trim(),
      type: draft.type,
      date: new Date().toISOString().split('T')[0],
    });

    setDraft(defaultDraft());
    refreshNotifications();
    toast.success('Notification created');
  };

  const handleMarkRead = (id: string) => {
    storage.markNotificationRead(id);
    refreshNotifications();
  };

  const handleMarkAllRead = () => {
    notifications.forEach((notification) => {
      if (!notification.read) {
        storage.markNotificationRead(notification.id);
      }
    });

    refreshNotifications();
    toast.success('All notifications marked as read');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-400" /> Notifications
          </h1>
          <p className="text-muted-foreground">Stay on top of salon updates and important events.</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
            <Bell className="h-4 w-4" />
            {unreadCount} unread
          </Badge>
          <Button variant="outline" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-0 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Create notification</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="notification-title">Title</Label>
                <Input
                  id="notification-title"
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="e.g. New package launched"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-type">Type</Label>
                <select
                  id="notification-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={draft.type}
                  onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as Notification['type'] }))}
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  id="notification-message"
                  value={draft.message}
                  onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Describe the update"
                  rows={5}
                />
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                <Plus className="mr-2 h-4 w-4" />
                Send notification
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white/5 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Inbox</CardTitle>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-full px-3 py-1 text-xs transition ${filter === 'all' ? 'bg-amber-500 text-black' : 'text-muted-foreground'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`rounded-full px-3 py-1 text-xs transition ${filter === 'unread' ? 'bg-amber-500 text-black' : 'text-muted-foreground'}`}
              >
                Unread
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="rounded-lg border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground">
                No notifications available.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl border p-4 ${notification.read ? 'border-white/10 bg-black/20' : 'border-amber-500/40 bg-amber-500/5'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-400" />
                          <p className="font-medium">{notification.title}</p>
                        </div>

                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{notification.date}</span>
                          <Badge variant={notification.type === 'error' ? 'destructive' : 'secondary'}>{notification.type}</Badge>
                        </div>
                      </div>

                      {!notification.read && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notification.id)}>
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
