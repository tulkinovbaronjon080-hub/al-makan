"use client";

import { LogOut } from "lucide-react";
import { Button, Card, CardContent } from "@al-makan/ui";
import { useAuth } from "@/lib/auth/auth-context";

// Mobile has no Topbar (bottom-nav only, per brief §6), so this is where
// the account/logout action lives on mobile. Desktop also has it in Topbar.
export default function MorePage() {
  const { user, business, role, logout } = useAuth();

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4">
      <Card>
        <CardContent className="space-y-1 pt-4">
          <p className="font-medium">{user?.fullName}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-sm text-muted-foreground">
            {business?.name} · {role?.name}
          </p>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => void logout()}>
        <LogOut className="h-4 w-4" />
        Log out
      </Button>
    </div>
  );
}
