import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { RegisterForm } from "@/components/register-form";

export default async function RegistroPage() {
  if (await getSession()) redirect("/predicciones");
  return (
    <div className="max-w-sm mx-auto pt-8">
      <div className="text-center mb-6">
        <Trophy className="h-10 w-10 text-primary mx-auto mb-2" aria-hidden />
        <h1 className="font-display text-3xl font-bold">Unite al Mundialito</h1>
        <p className="text-muted">Creá tu perfil con un PIN y a predecir.</p>
      </div>
      <Card>
        <CardContent className="pt-5">
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
