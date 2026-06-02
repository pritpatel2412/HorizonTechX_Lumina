import { useState } from "react";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [, setLocation] = useLocation();

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", username: "", email: "", password: "", confirmPassword: "" },
  });

  const onLogin = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast.success("Welcome back!");
        setLocation("/feed");
      },
      onError: (err: any) => toast.error(err?.error || "Login failed")
    });
  };

  const onRegister = (values: z.infer<typeof registerSchema>) => {
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate({ data: registerData }, {
      onSuccess: (res) => {
        setToken(res.token);
        toast.success("Account created successfully!");
        setLocation("/feed");
      },
      onError: (err: any) => toast.error(err?.error || "Registration failed")
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Artistic Panel */}
      <div className="hidden lg:flex w-[60%] relative overflow-hidden flex-col justify-center items-center">
        <div className="absolute inset-0 z-0">
          {/* Subtle particle canvas would go here, using CSS for now */}
          <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-primary/40 animate-pulse shadow-[0_0_10px_rgba(124,106,255,0.5)]" />
          <div className="absolute bottom-20 right-20 w-3 h-3 rounded-full bg-secondary/40 animate-pulse shadow-[0_0_15px_rgba(255,106,176,0.5)]" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <h1 className="text-7xl font-display font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">
            LUMINA
          </h1>
          <p className="text-xl text-muted-foreground font-medium mb-16">
            Where moments become memories.
          </p>
          
          <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
            <div className="lumina-card p-6 aspect-square flex flex-col items-center justify-center gap-4 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-primary" />
              </div>
              <div className="font-display font-semibold text-lg">Connect</div>
            </div>
            <div className="lumina-card p-6 aspect-square flex flex-col items-center justify-center gap-4 hover:-translate-y-2 transition-transform duration-300 translate-y-8">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-secondary" />
              </div>
              <div className="font-display font-semibold text-lg">Create</div>
            </div>
            <div className="lumina-card p-6 aspect-square flex flex-col items-center justify-center gap-4 hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-white" />
              </div>
              <div className="font-display font-semibold text-lg">Inspire</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-surface z-10 relative shadow-2xl">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <div className="h-4 w-4 rounded-full bg-primary" />
            </div>
            <span className="font-display text-3xl font-extrabold tracking-wide">LUMINA</span>
          </div>

          <div className="flex relative border-b border-white/10 mb-8">
            <button 
              className={cn("flex-1 pb-4 font-display font-semibold text-lg transition-colors", activeTab === "login" ? "text-white" : "text-muted-foreground hover:text-white/80")}
              onClick={() => setActiveTab("login")}
            >
              LOGIN
            </button>
            <button 
              className={cn("flex-1 pb-4 font-display font-semibold text-lg transition-colors", activeTab === "register" ? "text-white" : "text-muted-foreground hover:text-white/80")}
              onClick={() => setActiveTab("register")}
            >
              REGISTER
            </button>
            <div 
              className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-1/2"
              style={{ left: activeTab === "login" ? "0%" : "50%" }}
            />
          </div>

          {activeTab === "login" ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <FormField
                  control={loginForm.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input className={cn("lumina-input h-12", loginForm.formState.errors.identifier && "border-destructive focus-visible:ring-destructive/20")} placeholder="Username or Email" {...field} />
                      </FormControl>
                      <FormMessage className="text-destructive text-xs mt-1" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="password" className={cn("lumina-input h-12", loginForm.formState.errors.password && "border-destructive focus-visible:ring-destructive/20")} placeholder="Password" {...field} />
                      </FormControl>
                      <FormMessage className="text-destructive text-xs mt-1" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="btn-primary w-full h-12 mt-2" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Logging in..." : "Login"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <FormField
                  control={registerForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input className={cn("lumina-input h-12", registerForm.formState.errors.displayName && "border-destructive")} placeholder="Display Name" {...field} />
                      </FormControl>
                      <FormMessage className="text-destructive text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                          <Input className={cn("lumina-input h-12 pl-8", registerForm.formState.errors.username && "border-destructive")} placeholder="username" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage className="text-destructive text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="email" className={cn("lumina-input h-12", registerForm.formState.errors.email && "border-destructive")} placeholder="Email Address" {...field} />
                      </FormControl>
                      <FormMessage className="text-destructive text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="password" className={cn("lumina-input h-12", registerForm.formState.errors.password && "border-destructive")} placeholder="Password" {...field} />
                      </FormControl>
                      <FormMessage className="text-destructive text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="password" className={cn("lumina-input h-12", registerForm.formState.errors.confirmPassword && "border-destructive")} placeholder="Confirm Password" {...field} />
                      </FormControl>
                      <FormMessage className="text-destructive text-xs" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="btn-primary w-full h-12 mt-4" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? "Creating account..." : "Join LUMINA"}
                </Button>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}
