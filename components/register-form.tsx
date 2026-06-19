"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { registerAction, type AuthState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/pin-input";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Creando…" : "Crear mi perfil"}
    </Button>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState<AuthState, FormData>(registerAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Tu nombre</Label>
        <Input id="name" name="name" autoComplete="username" placeholder="Así te verán en el ranking" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PinInput name="pin" label="Elegí tu PIN" />
        <PinInput name="pin2" label="Repetí el PIN" />
      </div>
      <div>
        <Label htmlFor="joinCode">Código de grupo</Label>
        <Input id="joinCode" name="joinCode" placeholder="Te lo pasa quien armó la quiniela" required />
      </div>
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <Submit />
      <p className="text-center text-sm text-muted">
        ¿Ya tenés perfil?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-gold-soft">
          Entrá acá
        </Link>
      </p>
    </form>
  );
}
