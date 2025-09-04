import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Heart, Gift, Coins, CreditCard, Smartphone } from "lucide-react";
import * as React from "react";

interface TipModalProps {
  recipientId: string;
  recipientName: string;
  postId?: number;
  commentId?: number;
  trigger?: React.ReactNode;
}

const paymentMethods = [
  { id: "stripe", name: "Credit/Debit Card", icon: <CreditCard className="w-4 h-4" />, fee: "2.9%" },
  { id: "orange_money", name: "Orange Money", icon: <Smartphone className="w-4 h-4" />, fee: "1.5%" },
  { id: "skrill", name: "Skrill", icon: <DollarSign className="w-4 h-4" />, fee: "1.9%" },
  { id: "myzaka", name: "MyZaka", icon: <Smartphone className="w-4 h-4" />, fee: "1.2%" },
  { id: "smega", name: "Smega", icon: <Smartphone className="w-4 h-4" />, fee: "1.8%" },
];

const quickAmounts = [
  { amount: 1, label: "$1", desc: "Buy a coffee" },
  { amount: 5, label: "$5", desc: "Show appreciation" },
  { amount: 10, label: "$10", desc: "Support their work" },
  { amount: 25, label: "$25", desc: "Big thanks!" },
];

export default function TipModal({ recipientId, recipientName, postId, commentId, trigger }: TipModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("stripe");
  const [step, setStep] = useState(1); // 1: Amount, 2: Payment, 3: Success

  const createTip = useMutation({
    mutationFn: async (tipData: any) => apiRequest("POST", "/api/tips", tipData),
    onSuccess: (data) => {
      setStep(3);
      toast({
        title: "Tip Sent!",
        description: `Successfully sent $${amount} to ${recipientName}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tips"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send tip",
        variant: "destructive",
      });
    },
  });

  const handleAmountSelect = (selectedAmount: number) => {
    setAmount(selectedAmount.toString());
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setAmount(value);
  };

  const handleSendTip = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid tip amount",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) > 1000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum tip amount is $1000",
        variant: "destructive",
      });
      return;
    }

    createTip.mutate({
      toUserId: recipientId,
      postId,
      commentId,
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: "USD",
      paymentMethod,
      message,
    });
  };

  const resetModal = () => {
    setStep(1);
    setAmount("");
    setCustomAmount("");
    setMessage("");
    setPaymentMethod("stripe");
    setIsOpen(false);
  };

  const selectedPaymentMethod = paymentMethods.find(m => m.id === paymentMethod);
  const tipAmount = parseFloat(amount) || 0;
  const feeAmount = tipAmount * (selectedPaymentMethod?.fee.includes("%") ? 
    parseFloat(selectedPaymentMethod.fee.replace("%", "")) / 100 : 0);
  const totalAmount = tipAmount + feeAmount;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Tip
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Send Tip to {recipientName}
              </DialogTitle>
              <DialogDescription>
                Show your appreciation with a tip. All tips help support content creators.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Choose Amount</Label>
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.map((quick) => (
                    <Card 
                      key={quick.amount}
                      className={`cursor-pointer transition-all ${
                        amount === quick.amount.toString() 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleAmountSelect(quick.amount)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="text-lg font-bold">{quick.label}</div>
                        <div className="text-xs text-gray-600">{quick.desc}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="custom-amount">Custom Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    id="custom-amount"
                    type="number"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-10"
                    min="0.50"
                    max="1000"
                    step="0.50"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={resetModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!amount || parseFloat(amount) <= 0}
                >
                  Continue
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Payment Method</DialogTitle>
              <DialogDescription>
                Choose how you'd like to send your ${amount} tip
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center gap-2">
                          {method.icon}
                          <span>{method.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {method.fee}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tip Amount</span>
                    <span>${tipAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Processing Fee</span>
                    <span>${feeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {message && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Your Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{message}</p>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button 
                  onClick={handleSendTip}
                  disabled={createTip.isPending}
                >
                  {createTip.isPending ? "Processing..." : `Send $${amount}`}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Heart className="w-5 h-5" />
                Tip Sent Successfully!
              </DialogTitle>
              <DialogDescription>
                Your tip has been sent to {recipientName}. They've earned wisdom points too!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">${amount}</div>
                  <div className="text-sm text-green-700">sent to {recipientName}</div>
                  <div className="text-xs text-green-600 mt-1">
                    +{Math.floor(parseFloat(amount) * 10)} wisdom points earned
                  </div>
                </CardContent>
              </Card>

              <Button onClick={resetModal} className="w-full">
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
