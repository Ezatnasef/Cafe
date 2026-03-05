import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useItems } from "@/hooks/use-items";
import { useCategories } from "@/hooks/use-categories";
import { useSessions, useCreateSession, useAddSessionItem, useUpdateSessionItem, useDeleteSessionItem, useCheckoutSession } from "@/hooks/use-sessions";
import { useCustomers } from "@/hooks/use-customers";
import { useStaff } from "@/hooks/use-staff";
import { Plus, Minus, Trash2, Search, CreditCard, Banknote, Smartphone, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function POS() {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Form states
  const [newSessionCustomer, setNewSessionCustomer] = useState("");
  const [newSessionStaff, setNewSessionStaff] = useState("");
  const [checkoutMethod, setCheckoutMethod] = useState("cash");

  const { toast } = useToast();

  const { data: items } = useItems();
  const { data: categories } = useCategories();
  const { data: sessions } = useSessions("active");
  const { data: customers } = useCustomers();
  const { data: staff } = useStaff();

  const createSession = useCreateSession();
  const addItem = useAddSessionItem();
  const updateItem = useUpdateSessionItem();
  const deleteItem = useDeleteSessionItem();
  const checkout = useCheckoutSession();

  const activeSession = sessions?.find(s => s.id === activeSessionId) || sessions?.[0];

  const filteredItems = items?.filter(item => 
    (activeCategoryId ? item.categoryId === activeCategoryId : true) &&
    (searchQuery ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) : true)
  );

  const handleCreateSession = async () => {
    if (!newSessionCustomer || !newSessionStaff) {
      toast({ title: "خطأ", description: "يرجى اختيار العميل والموظف", variant: "destructive" });
      return;
    }
    createSession.mutate({
      customerName: newSessionCustomer,
      customerId: parseInt(newSessionCustomer) || undefined, // Simple handling for demo
      staffId: parseInt(newSessionStaff),
      status: "active"
    }, {
      onSuccess: (data) => {
        setActiveSessionId(data.id);
        setIsNewSessionOpen(false);
      }
    });
  };

  const handleItemClick = (itemId: number) => {
    if (!activeSession) {
      toast({ title: "تنبيه", description: "يرجى فتح طلب جديد أولاً", variant: "default" });
      setIsNewSessionOpen(true);
      return;
    }
    
    const existingItem = activeSession.items?.find(i => i.itemId === itemId);
    if (existingItem) {
      updateItem.mutate({ sessionId: activeSession.id, itemId: existingItem.id, quantity: existingItem.quantity + 1 });
    } else {
      addItem.mutate({ sessionId: activeSession.id, itemId, quantity: 1 });
    }
  };

  const handleCheckout = () => {
    if (!activeSession) return;
    checkout.mutate({ id: activeSession.id, paymentMethod: checkoutMethod }, {
      onSuccess: () => {
        toast({ title: "تم الدفع", description: "تم إنهاء الطلب بنجاح", className: "bg-primary text-primary-foreground" });
        setIsCheckoutOpen(false);
        setActiveSessionId(null);
      }
    });
  };

  const orderTotal = activeSession?.items?.reduce((acc, curr) => acc + (curr.priceAtTime * curr.quantity), 0) || 0;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] gap-4 animate-in fade-in duration-300 overflow-hidden">
        
        {/* Left Side - Menu Grid */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Categories & Search */}
          <div className="flex items-center justify-between gap-4 shrink-0 flex-wrap md:flex-nowrap">
            <ScrollArea className="w-full md:w-auto flex-1 whitespace-nowrap" orientation="horizontal">
              <div className="flex w-max space-x-2 space-x-reverse p-1">
                <Button
                  variant={activeCategoryId === null ? "default" : "outline"}
                  onClick={() => setActiveCategoryId(null)}
                  className={`rounded-xl px-8 h-14 text-lg font-bold ${activeCategoryId === null ? 'shadow-md glow-primary' : 'bg-card border-border/50'}`}
                >
                  الكل
                </Button>
                {categories?.map(cat => (
                  <Button
                    key={cat.id}
                    variant={activeCategoryId === cat.id ? "default" : "outline"}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`rounded-xl px-8 h-14 text-lg font-bold ${activeCategoryId === cat.id ? 'shadow-md glow-primary' : 'bg-card border-border/50'}`}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
              <Input 
                placeholder="بحث عن صنف..." 
                className="pl-4 pr-12 h-14 rounded-xl bg-card border-border text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Items Grid */}
          <ScrollArea className="flex-1 pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
              {filteredItems?.map(item => (
                <Card 
                  key={item.id}
                  className="cursor-pointer hover:shadow-2xl hover:border-primary/50 transition-all duration-300 overflow-hidden bg-card border-border/50 group touch-target flex flex-col active:scale-95"
                  onClick={() => handleItemClick(item.id)}
                >
                  <div className="flex-1 flex items-center justify-center p-6 bg-muted/20 group-hover:bg-primary/5 transition-colors aspect-square">
                    <span className="text-6xl opacity-30 group-hover:text-primary group-hover:opacity-50 transition-colors">☕</span>
                  </div>
                  <div className="p-4 border-t border-border/50 bg-card/50 backdrop-blur-sm">
                    <h3 className="font-bold text-lg text-foreground truncate">{item.name}</h3>
                    <p className="text-primary font-black text-xl mt-1">{item.price} ج.م</p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Right Side - Cart / Active Session */}
        <Card className="w-[400px] flex flex-col bg-card/95 backdrop-blur-md border-border shadow-2xl shrink-0 overflow-hidden rounded-3xl">
          {activeSession ? (
            <>
              {/* Cart Header */}
              <div className="p-6 border-b border-border/50 bg-muted/10">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-black">طلب حالي #{activeSession.id}</h3>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive h-10 px-4 rounded-xl border border-border/20" onClick={() => setActiveSessionId(null)}>إلغاء التحديد</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/20 font-bold text-sm">العميل: {activeSession.customerName}</span>
                  <span className="bg-muted/30 text-muted-foreground px-3 py-1.5 rounded-lg border border-border/50 font-medium text-sm">بواسطة: {staff?.find(s => s.id === activeSession.staffId)?.name || 'غير محدد'}</span>
                </div>
              </div>

              {/* Cart Items */}
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-3">
                  {activeSession.items?.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <p>الطلب فارغ</p>
                      <p className="text-sm mt-1">اختر أصناف من القائمة للبدء</p>
                    </div>
                  ) : (
                    activeSession.items?.map(orderItem => (
                      <div key={orderItem.id} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-colors">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{items?.find(i => i.id === orderItem.itemId)?.name}</h4>
                          <p className="text-primary font-bold text-base">{orderItem.priceAtTime * orderItem.quantity} ج.م</p>
                        </div>
                        <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-12 w-12 text-foreground hover:text-primary hover:bg-background rounded-lg border border-border/50"
                            onClick={() => {
                              if (orderItem.quantity > 1) {
                                updateItem.mutate({ sessionId: activeSession.id, itemId: orderItem.id, quantity: orderItem.quantity - 1 });
                              } else {
                                deleteItem.mutate({ sessionId: activeSession.id, itemId: orderItem.id });
                              }
                            }}
                          >
                            <Minus className="w-6 h-6" />
                          </Button>
                          <span className="w-8 text-center font-black text-xl">{orderItem.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-12 w-12 text-foreground hover:text-primary hover:bg-background rounded-lg border border-border/50"
                            onClick={() => updateItem.mutate({ sessionId: activeSession.id, itemId: orderItem.id, quantity: orderItem.quantity + 1 })}
                          >
                            <Plus className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Cart Footer */}
              <div className="p-6 border-t border-border/50 bg-muted/5">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xl font-bold text-muted-foreground">الإجمالي</span>
                  <span className="text-4xl font-black text-primary">{orderTotal} <span className="text-xl font-bold">ج.م</span></span>
                </div>
                <Button 
                  className="w-full h-20 text-2xl font-black rounded-2xl glow-primary shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                  disabled={!activeSession.items?.length || checkout.isPending}
                  onClick={() => setIsCheckoutOpen(true)}
                >
                  إتمام الدفع
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-transparent to-muted/10">
              <div className="w-28 h-28 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 text-primary shadow-inner">
                <UtensilsCrossed className="w-14 h-14" />
              </div>
              <h3 className="text-2xl font-black mb-3">لا يوجد طلب محدد</h3>
              <p className="text-muted-foreground text-lg mb-10 max-w-[250px]">اختر طلباً حالياً أو قم بإنشاء طلب جديد للبدء</p>
              
              <Button 
                size="lg" 
                className="w-full h-16 rounded-2xl text-xl font-bold glow-primary shadow-xl shadow-primary/10 active:scale-95 transition-all"
                onClick={() => setIsNewSessionOpen(true)}
              >
                <Plus className="w-6 h-6 ml-3" /> طلب جديد
              </Button>

              {sessions && sessions.length > 0 && (
                <div className="w-full mt-8 text-right">
                  <h4 className="font-bold text-muted-foreground mb-4">الطلبات النشطة</h4>
                  <div className="flex flex-col gap-2">
                    {sessions.map(s => (
                      <Button 
                        key={s.id} 
                        variant="outline" 
                        className="justify-start h-12 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        onClick={() => setActiveSessionId(s.id)}
                      >
                        طلب #{s.id} - {s.customerName}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* New Session Dialog */}
        <Dialog open={isNewSessionOpen} onOpenChange={setIsNewSessionOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">بدء طلب جديد</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-base">العميل</Label>
                <Input 
                  placeholder="اسم العميل (أو اكتب 'زائر')" 
                  value={newSessionCustomer}
                  onChange={(e) => setNewSessionCustomer(e.target.value)}
                  className="h-12 bg-background border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base">الموظف (الكابتن)</Label>
                <Select value={newSessionStaff} onValueChange={setNewSessionStaff}>
                  <SelectTrigger className="h-12 bg-background border-border/50">
                    <SelectValue placeholder="اختر الموظف المسؤول" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff?.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateSession} 
                className="w-full h-14 text-lg font-bold rounded-xl mt-4 glow-primary"
                disabled={createSession.isPending}
              >
                {createSession.isPending ? "جاري الإنشاء..." : "فتح الطلب"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Checkout Dialog */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">إتمام الدفع</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-6 py-4 text-center">
              <div className="bg-background rounded-2xl p-6 border border-border/50">
                <p className="text-muted-foreground mb-2">المبلغ المطلوب</p>
                <h2 className="text-5xl font-black text-primary">{orderTotal} <span className="text-xl">ج.م</span></h2>
              </div>
              
              <div className="space-y-3">
                <Label className="text-base block text-right">طريقة الدفع</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant={checkoutMethod === 'cash' ? 'default' : 'outline'}
                    className={`h-20 flex-col gap-2 rounded-xl ${checkoutMethod === 'cash' ? 'glow-primary' : 'bg-background'}`}
                    onClick={() => setCheckoutMethod('cash')}
                  >
                    <Banknote className="w-6 h-6" /> كاش
                  </Button>
                  <Button 
                    variant={checkoutMethod === 'card' ? 'default' : 'outline'}
                    className={`h-20 flex-col gap-2 rounded-xl ${checkoutMethod === 'card' ? 'glow-primary' : 'bg-background'}`}
                    onClick={() => setCheckoutMethod('card')}
                  >
                    <CreditCard className="w-6 h-6" /> بطاقة
                  </Button>
                  <Button 
                    variant={checkoutMethod === 'vodafone_cash' ? 'default' : 'outline'}
                    className={`h-20 flex-col gap-2 rounded-xl ${checkoutMethod === 'vodafone_cash' ? 'glow-primary text-xs' : 'bg-background text-xs'}`}
                    onClick={() => setCheckoutMethod('vodafone_cash')}
                  >
                    <Smartphone className="w-6 h-6" /> فودافون كاش
                  </Button>
                </div>
              </div>

              <Button 
                onClick={handleCheckout} 
                className="w-full h-16 text-xl font-bold rounded-xl mt-4 glow-primary"
                disabled={checkout.isPending}
              >
                {checkout.isPending ? "جاري التنفيذ..." : "تأكيد الدفع"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  );
}
