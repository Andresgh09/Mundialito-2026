import { KeyRound } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { ChangePinForm } from "@/components/change-pin-form";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const user = await requireUser();
  return (
    <div className="max-w-sm mx-auto pt-4">
      <header className="text-center mb-6">
        <KeyRound className="h-9 w-9 text-primary mx-auto mb-2" aria-hidden />
        <h1 className="font-display text-3xl font-bold">Cambiar PIN</h1>
        <p className="text-muted text-sm">
          Hola {user.name} 👋 Poné un PIN que solo vos sepas.
        </p>
      </header>
      <Card>
        <CardContent className="pt-5">
          <ChangePinForm />
        </CardContent>
      </Card>
    </div>
  );
}
