// src/components/AuthModal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Mail, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../contexts/AuthContext'; // <--- IMPORT useAuth hook

const AuthModal = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    // If you want the modal to close automatically once authenticated
    // const { isAuthenticated } = useAuth(); // Need to get it here if you want to react to it in useEffect
    // if (isAuthenticated) {
    //   setIsModalOpen(false);
    // }
  }, []);

  const handleClose = () => {
    // This function will be called if the modal needs to be programmatically closed
    // You might set isModalOpen(false) here, but for now, rely on App.tsx to unmount it.
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const apiUrl = 'http://localhost:5000/api';

    try {
      let response;
      let data;

      if (mode === "login") {
        // --- LOGIN LOGIC ---
        response = await fetch(`${apiUrl}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
        
        data = await response.json();

        if (response.ok) {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
            variant: "default",
          });
          
          // ADDED LOG: Confirm token received from backend and sent to AuthContext
          console.log("AuthModal: Token received from backend and sent to AuthContext:", data.token);
          
          // Use the login function from AuthContext to store the token consistently
          authLogin(data.token);

          // The handleClose() might be redundant if App.tsx unmounts this component
          // because isAuthenticated becomes true.
          // handleClose(); // No need to close modal here as App.tsx will conditionaly unmount

          // Redirect to the desired authenticated page
          navigate('/dashboard');
        } else {
          toast({
            title: "Login Failed",
            description: data.message || "Invalid credentials. Please try again.",
            variant: "destructive",
          });
        }
      } else { // mode === "register"
        // --- REGISTER LOGIC ---
        response = await fetch(`${apiUrl}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: name, email, password }),
        });
        
        data = await response.json();

        if (response.ok) {
          toast({
            title: "Registration successful!",
            description: "Your account has been created. You can now log in.",
            variant: "default",
          });
          
          setMode("login"); // Switch to login tab
          setEmail("");
          setPassword("");
          setName("");
        } else {
          toast({
            title: "Registration Failed",
            description: data.message || "Error creating account. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("API Call Error:", error);
      toast({
        title: "Network Error",
        description: "Could not connect to the server. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Always stop loading
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}> {/* Control Dialog visibility */}
      <DialogContent className="sm:max-w-[425px] glass">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === "login"
              ? "Login to cast your vote and support your favorite contestant"
              : "Join the global community of Miss Bloom voters"}
          </DialogDescription>
        </DialogHeader>
        <Tabs
          defaultValue="login"
          value={mode}
          onValueChange={(value) => setMode(value as "login" | "register")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>
            <div className="text-center text-sm">
              <a
                href="#"
                className="text-primary hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                Forgot your password?
              </a>
            </div>
          </TabsContent>
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-name"
                    placeholder="Enter your full name"
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Register"}
              </Button>
            </form>
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                By registering, you agree to our{" "}
                <a href="#" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary hover:underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          </TabsContent>
        </Tabs>
        <div className="bg-accent/50 rounded-lg p-4 flex items-start gap-3 mt-4">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Your information is securely stored and will only be used for voting purposes. We never share your data with third parties.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;