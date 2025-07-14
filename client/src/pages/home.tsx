import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MobileLayout from "@/components/mobile-layout";
import PostCard from "@/components/post-card";
import CreatePostModal from "@/components/create-post-modal";
import { Button } from "@/components/ui/button";
import { Plus, Search, Bell, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'tn'>('en');

  // Redirect to login if not authenticated
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

  const { data: posts, isLoading: postsLoading, error } = useQuery({
    queryKey: ["/api/posts"],
    enabled: isAuthenticated,
    retry: false,
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

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'tn' : 'en');
  };

  const header = (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <i className="fas fa-comments text-white text-sm"></i>
        </div>
        <h1 className="text-xl font-bold text-neutral">
          {language === 'en' ? 'Kgotla' : 'Kgotla'}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="text-gray-600 hover:text-primary"
        >
          <Globe size={16} className="mr-1" />
          {language === 'en' ? 'EN' : 'TN'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-primary"
        >
          <Search size={16} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-primary relative"
        >
          <Bell size={16} />
          <span className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-2 h-2"></span>
        </Button>
      </div>
    </header>
  );

  const stories = user ? (
    <section className="px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
        <div className="flex-shrink-0 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <img 
                src={user.profileImageUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.firstName || "User")}
                alt="Your story" 
                className="w-14 h-14 rounded-full object-cover"
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {language === 'en' ? 'Your Story' : 'Pale ya gago'}
          </p>
        </div>
        {/* Mock community stories */}
        <div className="flex-shrink-0 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-secondary to-cultural rounded-full p-0.5">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-lg">👥</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {language === 'en' ? 'Community' : 'Setšhaba'}
          </p>
        </div>
      </div>
    </section>
  ) : null;

  const createPostPrompt = user ? (
    <section className="px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <img 
          src={user.profileImageUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.firstName || "User")}
          alt="Your profile" 
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <Button
            variant="outline"
            onClick={() => setIsCreatePostOpen(true)}
            className="w-full text-left justify-start bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full"
          >
            {language === 'en' ? "What's on your mind?" : "O akanya eng?"}
          </Button>
        </div>
      </div>
    </section>
  ) : null;

  const content = (
    <div className="space-y-0">
      {postsLoading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading posts...</p>
        </div>
      ) : posts && posts.length > 0 ? (
        posts.map((post: any) => (
          <PostCard key={post.id} post={post} />
        ))
      ) : (
        <Card className="mx-4 mt-8">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {language === 'en' ? 'Welcome to Kgotla!' : 'Kamogelo ko Kgotla!'}
            </h3>
            <p className="text-gray-600 mb-4">
              {language === 'en' 
                ? "Start by creating your first post or joining a community group."
                : "Simolola ka go dira poso ya ntlha kgotsa go tsena setlhopheng sa setšhaba."
              }
            </p>
            <Button 
              onClick={() => setIsCreatePostOpen(true)}
              className="bg-primary hover:bg-blue-600"
            >
              {language === 'en' ? 'Create Your First Post' : 'Dira Poso ya Ntlha'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const fab = (
    <Button
      onClick={() => setIsCreatePostOpen(true)}
      className="fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full shadow-lg hover:bg-blue-600 z-40"
    >
      <Plus size={24} />
    </Button>
  );

  return (
    <MobileLayout header={header} fab={fab}>
      {stories}
      {createPostPrompt}
      {content}
      <CreatePostModal 
        isOpen={isCreatePostOpen} 
        onClose={() => setIsCreatePostOpen(false)}
        language={language}
      />
    </MobileLayout>
  );
}
