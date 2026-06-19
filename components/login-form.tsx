"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { loginAction, type AuthState } from "@/app/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/pin-input";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Entrando…" : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<AuthState, FormData>(loginAction, {});
  return (
    <form action={action} className="space-y-4">
      <div>
        <Label htmlFor="name">Tu nombre</Label>
        <Input id="name" name="name" autoComplete="username" placeholder="Cómo apareces en el ranking" required />
      </div>
      <PinInput name="pin" label="PIN (4 dígitos)" />
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      <Submit />
      <p className="text-center text-sm text-muted">
        ¿Primera vez?{" "}
        <Link href="/registro" className="font-semibold text-primary hover:text-gold-soft">
          Creá tu perfil
        </Link>
      </p>
    </form>
  );
}
