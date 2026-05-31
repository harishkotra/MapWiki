"use client";

import { Github, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  return (
    <div className="container flex min-h-[calc(100vh-57px)] max-w-md items-center py-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in to MapWiki</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline" onClick={() => void signIn("github", { callbackUrl: "/map" })}>
            <Github className="h-4 w-4" />
            Continue with GitHub
          </Button>
          <Button className="w-full justify-start" variant="outline" onClick={() => void signIn("google", { callbackUrl: "/map" })}>
            <Mail className="h-4 w-4" />
            Continue with Google
          </Button>
          <div className="grid gap-2 pt-2">
            <Label htmlFor="email">Email login</Label>
            <div className="flex gap-2">
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              <Button onClick={() => void signIn("email", { email, callbackUrl: "/map" })}>Send</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

