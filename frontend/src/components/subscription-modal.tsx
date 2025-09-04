import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Crown, Star, Zap, Shield, CreditCard, Smartphone, Check, X } from "lucide-react";
import * as React from "react";

interface SubscriptionModalProps {
  trigger?: React.ReactNode;
}

const subscriptionTiers = [
  {
    id: "elder",
    name: "Elder",
    price: { USD: 2, ZAR: 35, BWP: 25 },
    description: "Perfect for community members",
    features: [
      "Ad-free experience",
      "Priority support",
      "Custom profile badge",
      "Monthly wisdom points bonus",
      "Access to Elder discussions"
    ],
    icon: <Crown className="w-6 h-6" />,
    color: "bg-amber-500"
  },
  {
    id: "tribe_leader",
    name: "Tribe Leader",
    price: { USD: 5, ZAR: 85, BWP: 65 },
    description: "For active community leaders",
    features: [
      "Everything in Elder",
      "Create private groups",
      "Advanced analytics",
      "Priority content visibility",
      "Monthly community rewards",
      "Beta feature access"
    ],
    icon: <Star className="w-6 h-6" />,
    color: "bg-blue-500",
    popular: true
  },
  {
    id: "community_builder",
    name: "Community Builder",
    price: { USD: 10, ZAR: 170, BWP: 135 },
    description: "For those building the future",
    features: [
      "Everything in Tribe Leader",
      "Sponsored content creation",
      "Advanced marketplace access",
      "Direct monetization tools",
      "Custom branding options",
      "Monthly strategy sessions"
    ],
    icon: <Zap className="w-6 h-6" />,
    color: "bg-purple-500"
  }
];

const paymentMethods = [
  { id: "stripe", name: "Credit/Debit Card", icon: <CreditCard className="w-4 h-4" /> },
  { id: "orange_money", name: "Orange Money", icon: <Smartphone className="w-4 h-4" /> },
  { id: "skrill", name: "Skrill", icon: <CreditCard className="w-4 h-4" /> },
  { id: "myzaka", name: "MyZaka", icon: <Smartphone className="w-4 h-4" /> },
  { id: "smega", name: "Smega", icon: <Smartphone className="w-4 h-4" /> }
];

export default function SubscriptionModal({ trigger }: SubscriptionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState("tribe_leader");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [step, setStep] = useState(1); // 1: Plan, 2: Payment, 3: Success

  const createSubscription = useMutation({
    mutationFn: async (subscriptionData: any) => 
      apiRequest("POST", "/api/subscriptions", subscriptionData),
    onSuccess: () => {
      setStep(3);
      toast({
        title: "Subscription Created!",
        description: "Welcome to your premium experience",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create subscription",
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = () => {
    const tier = subscriptionTiers.find(t => t.id === selectedTier);
    if (!tier) return;

    createSubscription.mutate({
      plan: selectedTier,
      currency: selectedCurrency,
      amount: tier.price[selectedCurrency as keyof typeof tier.price] * 100, // Convert to cents
      paymentMethod,
      billing: "monthly"
    });
  };

  const resetModal = () => {
    setStep(1);
    setSelectedTier("tribe_leader");
    setSelectedCurrency("USD");
    setPaymentMethod("stripe");
    setIsOpen(false);
  };

  const selectedTierData = subscriptionTiers.find(t => t.id === selectedTier);
  const price = selectedTierData?.price[selectedCurrency as keyof typeof selectedTierData.price] || 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Go Premium
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Choose Your Premium Plan
              </DialogTitle>
              <DialogDescription>
                Unlock advanced features and support the community
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Currency</label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($) - International</SelectItem>
                    <SelectItem value="ZAR">ZAR (R) - South Africa</SelectItem>
                    <SelectItem value="BWP">BWP (P) - Botswana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4">
                {subscriptionTiers.map((tier) => (
                  <Card 
                    key={tier.id}
                    className={`cursor-pointer transition-all relative ${
                      selectedTier === tier.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTier(tier.id)}
                  >
                    {tier.popular && (
                      <Badge className="absolute -top-2 left-4 bg-primary">
                        Most Popular
                      </Badge>
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${tier.color} text-white`}>
                            {tier.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{tier.name}</CardTitle>
                            <CardDescription>{tier.description}</CardDescription>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            {selectedCurrency === "USD" ? "$" : selectedCurrency === "ZAR" ? "R" : "P"}
                            {tier.price[selectedCurrency as keyof typeof tier.price]}
                          </div>
                          <div className="text-sm text-gray-600">/month</div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <ul className="space-y-2">
                        {tier.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={resetModal}>
                  Cancel
                </Button>
                <Button onClick={() => setStep(2)}>
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && selectedTierData && (
          <>
            <DialogHeader>
              <DialogTitle>Payment Method</DialogTitle>
              <DialogDescription>
                Complete your {selectedTierData.name} subscription
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-sm">Selected Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${selectedTierData.color} text-white`}>
                        {selectedTierData.icon}
                      </div>
                      <div>
                        <div className="font-medium">{selectedTierData.name}</div>
                        <div className="text-sm text-gray-600">Monthly subscription</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {selectedCurrency === "USD" ? "$" : selectedCurrency === "ZAR" ? "R" : "P"}
                        {price}
                      </div>
                      <div className="text-sm text-gray-600">/month</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <label className="text-sm font-medium mb-2 block">Payment Method</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-2">
                          {method.icon}
                          <span>{method.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    30-Day Money Back Guarantee
                  </span>
                </div>
                <p className="text-sm text-blue-800">
                  Not satisfied? Cancel anytime within 30 days for a full refund.
                </p>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={handleSubscribe}
                  disabled={createSubscription.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {createSubscription.isPending ? "Processing..." : `Subscribe for ${selectedCurrency === "USD" ? "$" : selectedCurrency === "ZAR" ? "R" : "P"}${price}/month`}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && selectedTierData && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                Welcome to {selectedTierData.name}!
              </DialogTitle>
              <DialogDescription>
                Your subscription is now active. Enjoy your premium features!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-full ${selectedTierData.color} text-white`}>
                      {selectedTierData.icon}
                    </div>
                    <div>
                      <div className="font-medium">{selectedTierData.name}</div>
                      <div className="text-sm text-gray-600">Active subscription</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-green-800">
                      What's unlocked:
                    </div>
                    <ul className="space-y-1">
                      {selectedTierData.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-green-700">
                          <Check className="w-3 h-3" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm font-medium mb-1">Next Steps:</div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Check your profile for the new badge</li>
                  <li>• Explore premium features in settings</li>
                  <li>• Join the exclusive premium community</li>
                </ul>
              </div>

              <Button onClick={resetModal} className="w-full">
                Start Exploring
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
