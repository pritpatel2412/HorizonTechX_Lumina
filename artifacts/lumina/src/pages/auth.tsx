import { useState } from "react";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { setToken } from "@/lib/auth";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LoginForm {
  identifier: string;
  password: string;
}

interface RegisterForm {
  displayName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [, setLocation] = useLocation();

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<LoginForm>({
    defaultValues: { identifier: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    defaultValues: { displayName: "", username: "", email: "", password: "", confirmPassword: "" },
  });

  const onLogin = (values: LoginForm) => {
    if (!values.identifier) {
      loginForm.setError("identifier", { message: "Username or email is required" });
      return;
    }
    if (values.password.length < 8) {
      loginForm.setError("password", { message: "Password must be at least 8 characters" });
      return;
    }
    loginMutation.mutate({ data: values }, {
      onSuccess: (res: any) => {
        setToken(res.token);
        toast.success("Welcome back!");
        setLocation("/feed");
      },
      onError: (err: any) => toast.error(err?.data?.error || err?.message || "Login failed"),
    });
  };

  const onRegister = (values: RegisterForm) => {
    if (!values.displayName) {
      registerForm.setError("displayName", { message: "Display name is required" });
      return;
    }
    if (values.username.length < 3) {
      registerForm.setError("username", { message: "Username must be at least 3 characters" });
      return;
    }
    if (!values.email.includes("@")) {
      registerForm.setError("email", { message: "Invalid email address" });
      return;
    }
    if (values.password.length < 8) {
      registerForm.setError("password", { message: "Password must be at least 8 characters" });
      return;
    }
    if (values.password !== values.confirmPassword) {
      registerForm.setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }
    const { confirmPassword: _, ...data } = values;
    registerMutation.mutate({ data }, {
      onSuccess: (res: any) => {
        setToken(res.token);
        toast.success("Account created! Welcome to LUMINA.");
        setLocation("/feed");
      },
      onError: (err: any) => toast.error(err?.data?.error || err?.message || "Registration failed"),
    });
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Artistic Panel */}
      <div className="hidden lg:flex w-[60%] relative overflow-hidden flex-col justify-center items-center">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-2 h-2 rounded-full bg-primary/40 animate-pulse shadow-[0_0_10px_rgba(124,106,255,0.5)]" />
          <div className="absolute bottom-20 right-20 w-3 h-3 rounded-full bg-secondary/40 animate-pulse shadow-[0_0_15px_rgba(255,106,176,0.5)]" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: "0.5s" }} />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 rounded-full bg-primary/30 animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 rounded-full bg-secondary/20 animate-pulse" style={{ animationDelay: "0.8s" }} />
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
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-5 sm:px-12 lg:px-20 py-10 bg-surface relative shadow-2xl overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden flex items-center gap-3 mb-12 justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <div className="h-4 w-4 rounded-full bg-primary" />
            </div>
            <span className="font-display text-3xl font-extrabold tracking-wide">LUMINA</span>
          </div>

          {/* Tab Switcher */}
          <div className="flex relative border-b border-white/10 mb-8">
            <button
              type="button"
              className={cn("flex-1 pb-4 font-display font-semibold text-lg transition-colors", activeTab === "login" ? "text-white" : "text-muted-foreground hover:text-white/80")}
              onClick={() => setActiveTab("login")}
            >
              LOGIN
            </button>
            <button
              type="button"
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

          {/* Login Form */}
          {activeTab === "login" && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
              <div>
                <input
                  {...loginForm.register("identifier")}
                  placeholder="Username or Email"
                  autoComplete="username"
                  className={cn(
                    "lumina-input h-12 w-full px-4 text-foreground placeholder:text-muted-foreground",
                    loginForm.formState.errors.identifier && "border-destructive",
                  )}
                />
                {loginForm.formState.errors.identifier && (
                  <p className="text-destructive text-xs mt-1">{loginForm.formState.errors.identifier.message}</p>
                )}
              </div>
              <div>
                <input
                  {...loginForm.register("password")}
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  className={cn(
                    "lumina-input h-12 w-full px-4 text-foreground placeholder:text-muted-foreground",
                    loginForm.formState.errors.password && "border-destructive",
                  )}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-destructive text-xs mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="btn-primary w-full h-12 mt-2"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </button>
            </form>
          )}

          {/* Register Form */}
          {activeTab === "register" && (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div>
                <input
                  {...registerForm.register("displayName")}
                  placeholder="Display Name"
                  autoComplete="name"
                  className={cn(
                    "lumina-input h-12 w-full px-4 text-foreground placeholder:text-muted-foreground",
                    registerForm.formState.errors.displayName && "border-destructive",
                  )}
                />
                {registerForm.formState.errors.displayName && (
                  <p className="text-destructive text-xs mt-1">{registerForm.formState.errors.displayName.message}</p>
                )}
              </div>
              <div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none select-none">@</span>
                  <input
                    {...registerForm.register("username")}
                    placeholder="username"
                    autoComplete="username"
                    className={cn(
                      "lumina-input h-12 w-full pl-8 pr-4 text-foreground placeholder:text-muted-foreground",
                      registerForm.formState.errors.username && "border-destructive",
                    )}
                  />
                </div>
                {registerForm.formState.errors.username && (
                  <p className="text-destructive text-xs mt-1">{registerForm.formState.errors.username.message}</p>
                )}
              </div>
              <div>
                <input
                  {...registerForm.register("email")}
                  type="email"
                  placeholder="Email Address"
                  autoComplete="email"
                  className={cn(
                    "lumina-input h-12 w-full px-4 text-foreground placeholder:text-muted-foreground",
                    registerForm.formState.errors.email && "border-destructive",
                  )}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-destructive text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <input
                  {...registerForm.register("password")}
                  type="password"
                  placeholder="Password"
                  autoComplete="new-password"
                  className={cn(
                    "lumina-input h-12 w-full px-4 text-foreground placeholder:text-muted-foreground",
                    registerForm.formState.errors.password && "border-destructive",
                  )}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-destructive text-xs mt-1">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <input
                  {...registerForm.register("confirmPassword")}
                  type="password"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                  className={cn(
                    "lumina-input h-12 w-full px-4 text-foreground placeholder:text-muted-foreground",
                    registerForm.formState.errors.confirmPassword && "border-destructive",
                  )}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-destructive text-xs mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <button
                type="submit"
                className="btn-primary w-full h-12 mt-4"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating account..." : "Join LUMINA"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
