import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import MobileLayout from "@/components/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Heart, MessageCircle, UserPlus, Settings, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    retry: false,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("PUT", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  if (error && isUnauthorizedError(error as Error)) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'vote':
        return <Heart className="text-red-500" size={20} />;
      case 'comment':
        return <MessageCircle className="text-blue-500" size={20} />;
      case 'follow':
        return <UserPlus className="text-green-500" size={20} />;
      case 'mention':
        return <Bell className="text-purple-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const mockNotifications = [
    {
      id: 1,
      type: 'vote',
      title: 'New upvote on your post',
      content: 'Mmoloki Serame upvoted your post about traditional weather wisdom',
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      relatedUserId: 'user123',
    },
    {
      id: 2,
      type: 'comment',
      title: 'New comment on your post',
      content: 'Kefilwe Mogale commented on your graduation post',
      isRead: false,
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      relatedUserId: 'user456',
    },
    {
      id: 3,
      type: 'follow',
      title: 'New follower',
      content: 'Tebogo Morake started following you',
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      relatedUserId: 'user789',
    },
    {
      id: 4,
      type: 'mention',
      title: 'You were mentioned',
      content: 'Naledi Kgomo mentioned you in a comment about tourism business',
      isRead: true,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      relatedUserId: 'user101',
    },
  ];

  const unreadCount = mockNotifications.filter(n => !n.isRead).length;

  const header = (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-neutral">Notifications</h1>
          {unreadCount > 0 && (
            <Badge className="bg-red-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <CheckCheck size={16} />
            Mark All Read
          </Button>
          <Button variant="ghost" size="sm">
            <Settings size={16} />
          </Button>
        </div>
      </div>
    </header>
  );

  const content = (
    <div className="space-y-0">
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading notifications...</p>
        </div>
      ) : mockNotifications.length > 0 ? (
        <div className="divide-y divide-gray-200">
          {mockNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                !notification.isRead ? 'bg-blue-50 border-l-4 border-l-primary' : ''
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markAsReadMutation.mutate(notification.id);
                }
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${
                      !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.content}
                  </p>
                  {!notification.isRead && (
                    <div className="mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="mx-4 mt-8">
          <CardContent className="p-8 text-center">
            <Bell className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No notifications yet
            </h3>
            <p className="text-gray-600">
              You'll see notifications here when people interact with your posts and comments.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <MobileLayout header={header}>
      {content}
    </MobileLayout>
  );
}
