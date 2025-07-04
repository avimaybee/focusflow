import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import Link from "next/link";

export const metadata = {
    title: "Login | FocusFlow AI",
    description: "Log in to your FocusFlow AI account to access your saved summaries, plans, and more.",
};

export default function LoginPage() {
    return (
        <div className="container mx-auto max-w-sm py-20 px-4">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
                        <LogIn className="h-6 w-6" /> Welcome Back
                    </CardTitle>
                    <CardDescription>Log in to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full">Log In</Button>
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <Link href="#" className="text-primary hover:underline">Sign Up</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
