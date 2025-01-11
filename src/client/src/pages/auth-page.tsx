import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import type { InsertUser } from "@db/schema";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  const { login, register } = useUser();
  const form = useForm<InsertUser>();
  const [, setLocation] = useLocation();

  const onSubmit = async (data: InsertUser) => {
    try {
      const result = await (isLogin ? login(data) : register(data));
      if (!result.ok) {
        toast({
          title: result.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: `${isLogin ? "Login" : "Registration"} successful!`,
      });

      // Navigate to the home page after successful login/registration
      setLocation("/");
    } catch (error: any) {
      toast({
        title: error.toString(),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-lg mx-auto p-4 min-h-screen flex items-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Register"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Input
              placeholder="Username"
              {...form.register("username", { required: true })}
            />
            <Input
              type="password"
              placeholder="Password"
              {...form.register("password", { required: true })}
            />
            <div className="flex flex-col gap-2">
              <Button type="submit">{isLogin ? "Login" : "Register"}</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Need an account? Register" : "Have an account? Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}