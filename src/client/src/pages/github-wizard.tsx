import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Github } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const createRepoSchema = z.object({
  name: z.string().min(1, "Repository name is required"),
  description: z.string().optional(),
  private: z.boolean().default(false),
});

type CreateRepoForm = z.infer<typeof createRepoSchema>;

export default function GitHubWizard() {
  const [step, setStep] = useState<"connect" | "create" | "complete">("connect");
  const [accessToken, setAccessToken] = useState<string>();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<CreateRepoForm>({
    resolver: zodResolver(createRepoSchema),
    defaultValues: {
      private: false,
    },
  });

  // Get OAuth URL
  const { data: oauthData, isLoading: urlLoading } = useQuery({
    queryKey: ["/api/github/oauth/url"],
    enabled: step === "connect",
  });

  // Create repository mutation
  const createRepo = useMutation({
    mutationFn: async (data: CreateRepoForm) => {
      if (!accessToken) throw new Error("Not authenticated with GitHub");

      const response = await fetch("/api/github/repositories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          access_token: accessToken,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Repository created successfully" });
      setStep("complete");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create repository",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle OAuth callback
  const handleCallback = async (code: string, state: string) => {
    try {
      const response = await fetch("/api/github/oauth/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setAccessToken(data.token.access_token);
      setStep("create");
    } catch (error: any) {
      toast({
        title: "GitHub authentication failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Check for OAuth callback
  useState(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (code && state) {
      handleCallback(code, state);
    }
  });

  const onSubmit = (data: CreateRepoForm) => {
    createRepo.mutate(data);
  };

  if (urlLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>GitHub Repository Setup</CardTitle>
          <CardDescription>
            Connect your GitHub account and create a repository
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "connect" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                First, connect your GitHub account to get started.
              </p>
              <Button
                className="w-full"
                onClick={() => {
                  if (oauthData?.url) {
                    window.location.href = oauthData.url;
                  }
                }}
              >
                <Github className="mr-2 h-4 w-4" />
                Connect GitHub Account
              </Button>
            </div>
          )}

          {step === "create" && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository Name</FormLabel>
                      <FormControl>
                        <Input placeholder="my-awesome-project" {...field} />
                      </FormControl>
                      <FormDescription>
                        Choose a unique name for your repository
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="A brief description of your project"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="private"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Private Repository</FormLabel>
                        <FormDescription>
                          Only you and people you share with can see this
                          repository
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createRepo.isPending}
                >
                  {createRepo.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Repository...
                    </>
                  ) : (
                    "Create Repository"
                  )}
                </Button>
              </form>
            </Form>
          )}

          {step === "complete" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Repository created successfully! You can now start using it.
              </p>
              <Button
                className="w-full"
                onClick={() => setLocation("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}