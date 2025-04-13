import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import loginBackground from '@/assets/images/login_background.png';

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

const signupSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
    },
  });

  const onLoginSubmit = async (values: LoginValues) => {
    const { error } = await signIn(values.email, values.password);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged in successfully');
    }
  };

  const onSignupSubmit = async (values: SignupValues) => {
    const { error, success } = await signUp(values.email, values.password, values.username);
    if (error) {
      toast.error(error.message);
    } else if (success) {
      toast.success('Account created! Please log in.');
      setActiveTab('login');
      loginForm.setValue('email', values.email);
    }
  };

  // If user is already logged in, redirect to home
  if (!loading && user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen w-full flex items-stretch overflow-hidden">
      {/* Left Panel - Login Form */}
      <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center px-6 py-12 relative z-10 bg-white/95 dark:bg-gray-900/95">
        <div className="max-w-md w-full mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-['Pacifico'] text-[#cd4631] mb-2">Lexica</h1>
            <p className="text-[#9e6240] dark:text-[#dea47e]">Expand your vocabulary with AI-powered learning</p>
          </div>
          
          <Card className="border-none shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-[#f8f2dc]/50 dark:bg-gray-700/50">
                  <TabsTrigger 
                    value="login"
                    className="data-[state=active]:bg-[#cd4631] data-[state=active]:text-white"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup"
                    className="data-[state=active]:bg-[#cd4631] data-[state=active]:text-white"
                  >
                    Sign Up
                  </TabsTrigger>
                </TabsList>
              
                <TabsContent value="login" className="mt-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#9e6240] dark:text-[#dea47e]">Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="your.email@example.com" 
                                type="email" 
                                className="border-[#dea47e]/30 focus-visible:ring-[#cd4631]" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-[#cd4631]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#9e6240] dark:text-[#dea47e]">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="••••••••" 
                                  type={showPassword ? "text" : "password"} 
                                  className="border-[#dea47e]/30 focus-visible:ring-[#cd4631]" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 text-[#9e6240] hover:text-[#cd4631]"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-[#cd4631]" />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full mt-6 bg-[#cd4631] hover:bg-[#cd4631]/90 transition-all duration-300 text-white" 
                        disabled={loginForm.formState.isSubmitting}
                      >
                        {loginForm.formState.isSubmitting ? 'Logging in...' : 'Log In'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                <TabsContent value="signup" className="mt-6">
                  <Form {...signupForm}>
                    <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                      <FormField
                        control={signupForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#9e6240] dark:text-[#dea47e]">Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="yourname" 
                                className="border-[#dea47e]/30 focus-visible:ring-[#cd4631]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-[#cd4631]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#9e6240] dark:text-[#dea47e]">Email</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="your.email@example.com" 
                                type="email" 
                                className="border-[#dea47e]/30 focus-visible:ring-[#cd4631]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage className="text-[#cd4631]" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-[#9e6240] dark:text-[#dea47e]">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="••••••••" 
                                  type={showPassword ? "text" : "password"} 
                                  className="border-[#dea47e]/30 focus-visible:ring-[#cd4631]"
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 text-[#9e6240] hover:text-[#cd4631]"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-[#cd4631]" />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full mt-6 bg-[#cd4631] hover:bg-[#cd4631]/90 transition-all duration-300 text-white" 
                        disabled={signupForm.formState.isSubmitting}
                      >
                        {signupForm.formState.isSubmitting ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-[#9e6240]/70 dark:text-[#dea47e]/70">
              Lexica helps you build your vocabulary with AI-powered tools
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Panel - Background Image */}
      <div 
        className="hidden md:block md:w-1/2 lg:w-3/5 bg-cover bg-center relative" 
        style={{ 
          backgroundImage: `url(${loginBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#cd4631]/30 to-[#81adc8]/30 backdrop-blur-sm"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-lg p-8 bg-black/30 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl transform transition-all">
            <h2 className="text-4xl font-['Pacifico'] text-white mb-4">Expand Your Vocabulary</h2>
            <p className="text-white/90 text-lg mb-6 leading-relaxed">
              Join thousands of learners enhancing their vocabulary through AI-assisted learning and personalized practice sessions.
            </p>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <span className="bg-[#cd4631] rounded-full w-8 h-8 flex items-center justify-center text-white shadow-lg">✓</span>
                <span className="text-white font-medium">AI-powered vocabulary analysis</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <span className="bg-[#cd4631] rounded-full w-8 h-8 flex items-center justify-center text-white shadow-lg">✓</span>
                <span className="text-white font-medium">Personalized learning collections</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <span className="bg-[#cd4631] rounded-full w-8 h-8 flex items-center justify-center text-white shadow-lg">✓</span>
                <span className="text-white font-medium">Interactive practice modes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
