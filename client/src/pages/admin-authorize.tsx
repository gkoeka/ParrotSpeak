import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Shield } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AdminAuthorizePage() {
  const [token, setToken] = useState<string>("");
  const [authResult, setAuthResult] = useState<{ success: boolean; message: string } | null>(null);

  // Get token from URL params
  useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  });

  const authorizeMutation = useMutation({
    mutationFn: async (authToken: string) => {
      const response = await apiRequest("POST", "/api/admin/authorize-access", { token: authToken });
      return response.json();
    },
    onSuccess: (data) => {
      setAuthResult({ success: true, message: data.message });
    },
    onError: (error: any) => {
      setAuthResult({ success: false, message: error.message || "Authorization failed" });
    }
  });

  const handleAuthorize = () => {
    if (token) {
      authorizeMutation.mutate(token);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-primary" />
          <CardTitle>Admin Data Access Authorization</CardTitle>
          <CardDescription>
            A ParrotSpeak administrator has requested access to your encrypted conversation data for support purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!authResult ? (
            <>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>What this means:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Admin will be able to view your conversation titles and messages</li>
                  <li>Access will expire automatically in 24 hours</li>
                  <li>You can contact us to revoke access anytime</li>
                  <li>This is only for providing support assistance</li>
                </ul>
              </div>
              
              {token ? (
                <Button 
                  onClick={handleAuthorize} 
                  disabled={authorizeMutation.isPending}
                  className="w-full"
                >
                  {authorizeMutation.isPending ? "Authorizing..." : "Authorize Access"}
                </Button>
              ) : (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    Invalid or missing authorization token. Please use the link provided in your email.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <Alert className={authResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {authResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={authResult.success ? "text-green-800" : "text-red-800"}>
                {authResult.message}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-xs text-muted-foreground text-center">
            <p>ParrotSpeak respects your privacy. We only request access when necessary for support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}