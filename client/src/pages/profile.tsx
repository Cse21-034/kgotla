import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MobileLayout from "@/components/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  MapPin, 
  Calendar, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Heart, 
  Settings,
  Edit3,
  LogOut
} from "lucide-react";
import { useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading profile...</p>
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <Card className="mx-4 mt-8">
          <CardContent className="p-8 text-center">
            <User className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Profile not found
            </h3>
            <p className="text-gray-600">
              Unable to load your profile information.
            </p>
          </CardContent>
        </Card>
      </MobileLayout>
    );
  }

  const header = (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral">Profile</h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Edit3 size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.location.href = "/settings"}>
            <Settings size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} />
          </Button>
        </div>
      </div>
    </header>
  );

  const mockStats = {
    posts: 23,
    comments: 89,
    upvotes: 456,
    followers: 127,
    following: 89,
    reputation: 1247,
  };

  const mockPosts = [
    {
      id: 1,
      content: "The rains have started early this year in Botswana! 🌧️ This reminds me of an old Setswana proverb...",
      upvotes: 24,
      comments: 8,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 2,
      content: "What should be our community's top priority for youth development in 2025?",
      upvotes: 89,
      comments: 24,
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
  ];

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'elder':
        return 'bg-cultural text-white';
      case 'mentor':
        return 'bg-secondary text-white';
      case 'expert':
        return 'bg-primary text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-4 py-6">
        <div className="flex items-center space-x-4">
          <img
            src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || "User")}&size=80`}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-xl font-bold text-neutral">
                {user.firstName} {user.lastName}
              </h2>
              {user.isVerified && (
                <div className="w-5 h-5 bg-cultural rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            
            {user.verificationBadge && (
              <Badge className={getBadgeColor(user.verificationBadge)}>
                {user.verificationBadge.charAt(0).toUpperCase() + user.verificationBadge.slice(1)}
              </Badge>
            )}
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              {user.location && (
                <div className="flex items-center space-x-1">
                  <MapPin size={14} />
                  <span>{user.location}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>
        
        {user.bio && (
          <p className="text-gray-700 mt-4 leading-relaxed">{user.bio}</p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 px-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{mockStats.posts}</div>
            <div className="text-sm text-gray-600">Posts</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-secondary">{mockStats.followers}</div>
            <div className="text-sm text-gray-600">Followers</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-cultural">{mockStats.reputation}</div>
            <div className="text-sm text-gray-600">Reputation</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <div className="px-4">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4 mt-4">
            {mockPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="p-4">
                  <p className="text-gray-700 mb-3">{post.content}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Heart size={14} />
                        <span>{post.upvotes}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageSquare size={14} />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                    <span>{formatDistanceToNow(post.createdAt, { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No comments yet
                </h3>
                <p className="text-gray-600">
                  Your comments on posts will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="saved" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-8 text-center">
                <Star className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No saved posts
                </h3>
                <p className="text-gray-600">
                  Posts you bookmark will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  return (
    <MobileLayout header={header}>
      {content}
    </MobileLayout>
  );
}
