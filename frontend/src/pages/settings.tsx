import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Smartphone, Globe, Settings as SettingsIcon, DollarSign, Coins } from "lucide-react";

const paymentMethods = [
  {
    id: "stripe",
    name: "Stripe",
    icon: <CreditCard className="w-5 h-5" />,
    description: "International credit/debit cards",
    currencies: ["USD", "EUR", "GBP", "ZAR"],
    configFields: [
      { key: "publicKey", label: "Public Key", type: "text", placeholder: "pk_..." },
      { key: "secretKey", label: "Secret Key", type: "password", placeholder: "sk_..." },
    ]
  },
  {
    id: "orange_money",
    name: "Orange Money",
    icon: <Smartphone className="w-5 h-5" />,
    description: "Mobile money for Botswana",
    currencies: ["BWP"],
    configFields: [
      { key: "merchantId", label: "Merchant ID", type: "text", placeholder: "Your merchant ID" },
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Your API key" },
      { key: "apiSecret", label: "API Secret", type: "password", placeholder: "Your API secret" },
    ]
  },
  {
    id: "skrill",
    name: "Skrill",
    icon: <Globe className="w-5 h-5" />,
    description: "Digital wallet for Africa",
    currencies: ["USD", "EUR", "ZAR", "BWP"],
    configFields: [
      { key: "merchantId", label: "Merchant ID", type: "text", placeholder: "Your merchant ID" },
      { key: "secretWord", label: "Secret Word", type: "password", placeholder: "Your secret word" },
    ]
  },
  {
    id: "myzaka",
    name: "MyZaka",
    icon: <Smartphone className="w-5 h-5" />,
    description: "Mobile payments for Southern Africa",
    currencies: ["ZAR", "BWP"],
    configFields: [
      { key: "merchantCode", label: "Merchant Code", type: "text", placeholder: "Your merchant code" },
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Your API key" },
    ]
  },
  {
    id: "smega",
    name: "Smega",
    icon: <DollarSign className="w-5 h-5" />,
    description: "Digital payments for Botswana",
    currencies: ["BWP"],
    configFields: [
      { key: "merchantId", label: "Merchant ID", type: "text", placeholder: "Your merchant ID" },
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Your API key" },
    ]
  }
];

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("payments");

  // Fetch payment settings
  const { data: paymentSettings = [], isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/payment-settings'],
  });

  // Fetch app configuration
  const { data: appConfig = [], isLoading: isLoadingConfig } = useQuery({
    queryKey: ['/api/app-config'],
  });

  // Update payment setting mutation
  const updatePaymentSetting = useMutation({
    mutationFn: async (data: { id: number; updates: any }) => 
      apiRequest("PUT", `/api/payment-settings/${data.id}`, data.updates),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment method updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment method",
        variant: "destructive",
      });
    },
  });

  // Create payment setting mutation
  const createPaymentSetting = useMutation({
    mutationFn: async (data: any) => 
      apiRequest("POST", "/api/payment-settings", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payment method configured successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/payment-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to configure payment method",
        variant: "destructive",
      });
    },
  });

  // Update app config mutation
  const updateAppConfig = useMutation({
    mutationFn: async (data: { key: string; value: string }) => 
      apiRequest("PUT", `/api/app-config/${data.key}`, { value: data.value }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Configuration updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/app-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update configuration",
        variant: "destructive",
      });
    },
  });

  const handlePaymentMethodToggle = (methodId: string, enabled: boolean) => {
    const existingSetting = paymentSettings.find((ps: any) => ps.method === methodId);
    
    if (existingSetting) {
      updatePaymentSetting.mutate({
        id: existingSetting.id,
        updates: { isEnabled: enabled }
      });
    } else {
      const method = paymentMethods.find(m => m.id === methodId);
      if (method) {
        createPaymentSetting.mutate({
          method: methodId,
          displayName: method.name,
          description: method.description,
          isEnabled: enabled,
          supportedCurrencies: method.currencies,
          configuration: {},
          fees: {},
          minAmount: 100,
          maxAmount: 100000
        });
      }
    }
  };

  const handlePaymentMethodConfig = (methodId: string, config: any) => {
    const existingSetting = paymentSettings.find((ps: any) => ps.method === methodId);
    
    if (existingSetting) {
      updatePaymentSetting.mutate({
        id: existingSetting.id,
        updates: { configuration: config }
      });
    }
  };

  const PaymentMethodCard = ({ method }: { method: any }) => {
    const [config, setConfig] = useState<any>({});
    const existingSetting = paymentSettings.find((ps: any) => ps.method === method.id);
    const isEnabled = existingSetting?.isEnabled || false;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {method.icon}
              <div>
                <CardTitle className="text-lg">{method.name}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => handlePaymentMethodToggle(method.id, checked)}
              />
              {isEnabled && (
                <Badge variant="outline" className="text-green-600">
                  Active
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        {isEnabled && (
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Supported Currencies</Label>
              <div className="flex gap-2 mt-1">
                {method.currencies.map((currency: string) => (
                  <Badge key={currency} variant="secondary">
                    {currency}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label className="text-sm font-medium">Configuration</Label>
              {method.configFields.map((field: any) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={config[field.key] || existingSetting?.configuration?.[field.key] || ""}
                    onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
              <Button 
                onClick={() => handlePaymentMethodConfig(method.id, config)}
                disabled={updatePaymentSetting.isPending}
              >
                Save Configuration
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  if (isLoadingSettings || isLoadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Configure your app's payment methods and monetization features</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Configure payment methods for subscriptions, tips, and marketplace transactions
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="grid gap-6">
            {paymentMethods.map((method) => (
              <PaymentMethodCard key={method.id} method={method} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monetization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monetization Settings</CardTitle>
              <CardDescription>
                Configure subscription tiers, tip amounts, and marketplace fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscription-price">Monthly Subscription Price (USD)</Label>
                  <Input
                    id="subscription-price"
                    type="number"
                    placeholder="5.00"
                    min="1"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tip-minimum">Minimum Tip Amount (USD)</Label>
                  <Input
                    id="tip-minimum"
                    type="number"
                    placeholder="1.00"
                    min="0.50"
                    step="0.50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketplace-fee">Marketplace Fee (%)</Label>
                <Input
                  id="marketplace-fee"
                  type="number"
                  placeholder="5"
                  min="0"
                  max="20"
                  step="0.1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wisdom-points-rate">Wisdom Points per Dollar</Label>
                <Input
                  id="wisdom-points-rate"
                  type="number"
                  placeholder="10"
                  min="1"
                  step="1"
                />
              </div>

              <Button>Save Monetization Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general app settings and features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Premium Features</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable premium subscription features
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Marketplace</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to buy and sell items
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Tips</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow users to tip content creators
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Wisdom Points</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable wisdom points reward system
                  </p>
                </div>
                <Switch />
              </div>

              <Button>Save General Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}