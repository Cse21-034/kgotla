import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import MobileLayout from "@/components/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Filter, 
  Heart, 
  Star, 
  MapPin, 
  Calendar,
  DollarSign,
  Eye,
  MessageCircle,
  Share2
} from "lucide-react";

const categories = [
  "All",
  "Traditional Crafts",
  "Food & Beverages",
  "Clothing & Accessories",
  "Books & Media",
  "Services",
  "Electronics",
  "Home & Garden",
  "Health & Beauty",
  "Other"
];

const mockMarketplaceItems = [
  {
    id: 1,
    title: "Handwoven Baskets Set",
    description: "Beautiful traditional baskets made from local materials. Perfect for home decoration or storage.",
    price: 45.00,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400"],
    category: "Traditional Crafts",
    location: "Gaborone, Botswana",
    seller: {
      id: "seller1",
      name: "Mma Kgosi",
      avatar: "https://ui-avatars.com/api/?name=Mma+Kgosi&size=40",
      rating: 4.8,
      reviews: 23
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    views: 145,
    likes: 12,
    isSponsored: false
  },
  {
    id: 2,
    title: "Organic Morogo Seeds",
    description: "Premium organic seeds for traditional African spinach. Grow your own nutritious vegetables.",
    price: 15.00,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"],
    category: "Food & Beverages",
    location: "Maun, Botswana",
    seller: {
      id: "seller2",
      name: "Rra Modise",
      avatar: "https://ui-avatars.com/api/?name=Rra+Modise&size=40",
      rating: 4.9,
      reviews: 41
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    views: 89,
    likes: 8,
    isSponsored: true
  },
  {
    id: 3,
    title: "Traditional Seshweshwe Fabric",
    description: "Authentic South African printed fabric. Various colors and patterns available.",
    price: 28.00,
    currency: "USD",
    images: ["https://images.unsplash.com/photo-1558618666-fbd8c2cd8bd8?w=400"],
    category: "Clothing & Accessories",
    location: "Francistown, Botswana",
    seller: {
      id: "seller3",
      name: "Mma Tlholo",
      avatar: "https://ui-avatars.com/api/?name=Mma+Tlholo&size=40",
      rating: 4.6,
      reviews: 17
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    views: 203,
    likes: 15,
    isSponsored: false
  }
];

export default function Marketplace() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    price: "",
    currency: "USD",
    category: "Other",
    location: "",
    images: []
  });

  // Mock query for marketplace items
  const { data: marketplaceItems = mockMarketplaceItems } = useQuery({
    queryKey: ["/api/marketplace", selectedCategory, searchQuery],
    queryFn: async () => {
      // Filter mock data based on category and search
      let filtered = mockMarketplaceItems;
      
      if (selectedCategory !== "All") {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }
      
      if (searchQuery) {
        filtered = filtered.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      return filtered;
    }
  });

  const createMarketplaceItem = useMutation({
    mutationFn: async (itemData: any) => 
      apiRequest("POST", "/api/marketplace", itemData),
    onSuccess: () => {
      toast({
        title: "Item Listed!",
        description: "Your item has been added to the marketplace"
      });
      setIsCreateModalOpen(false);
      setNewItem({
        title: "",
        description: "",
        price: "",
        currency: "USD",
        category: "Other",
        location: "",
        images: []
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace"] });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
        description: error.message || "Failed to create item",
        variant: "destructive",
      });
    },
  });

  const handleCreateItem = () => {
    if (!newItem.title || !newItem.description || !newItem.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createMarketplaceItem.mutate({
      ...newItem,
      price: Math.round(parseFloat(newItem.price) * 100) // Convert to cents
    });
  };

  const filteredItems = marketplaceItems || [];

  const header = (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-neutral">Marketplace</h1>
        {isAuthenticated && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Sell
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>List an Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newItem.title}
                    onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                    placeholder="Item name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Describe your item..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={newItem.currency} onValueChange={(value) => setNewItem({...newItem, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="ZAR">ZAR</SelectItem>
                        <SelectItem value="BWP">BWP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem({...newItem, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.slice(1).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    placeholder="City, Country"
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateItem} disabled={createMarketplaceItem.isPending}>
                    {createMarketplaceItem.isPending ? "Creating..." : "List Item"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );

  const content = (
    <div className="space-y-4">
      {filteredItems.length === 0 ? (
        <Card className="mx-4">
          <CardContent className="p-8 text-center">
            <ShoppingBag className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No items found
            </h3>
            <p className="text-gray-600">
              {searchQuery || selectedCategory !== "All" 
                ? "Try adjusting your search or category filter"
                : "Be the first to list an item in the marketplace"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {item.isSponsored && (
                <Badge className="absolute top-2 right-2 bg-yellow-500 text-white z-10">
                  Sponsored
                </Badge>
              )}
              
              <div className="relative">
                <img
                  src={item.images[0] || "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400"}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <button className="absolute top-2 right-2 p-2 bg-white/90 rounded-full hover:bg-white">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {item.currency === "USD" ? "$" : item.currency === "ZAR" ? "R" : "P"}
                      {item.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {item.location}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.seller.avatar}
                      alt={item.seller.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <div>
                      <div className="text-sm font-medium">{item.seller.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {item.seller.rating} ({item.seller.reviews})
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {item.views}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {item.likes}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button className="flex-1" size="sm">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Contact
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <MobileLayout header={header}>
      {content}
    </MobileLayout>
  );
}