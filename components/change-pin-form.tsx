"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { changePinAction, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/pin-input";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? "Guardando…" : "Cambiar PIN"}
    </Button>
  );
}

export function ChangePinForm() {
  const [state, action] = useActionState<AuthState, FormData>(changePinAction, {});
  return (
    <form action={action} className="space-y-4">
      <PinInput name="current" label="PIN actual" autoFocus />
      <div className="grid grid-cols-2 gap-3">
        <PinInput name="pin" label="PIN nuevo" />
        <PinInput name="pin2" label="Repetir nuevo" />
      </div>
      {state.error && (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="text-sm text-accent" role="status">
          ¡PIN actualizado! Usá el nuevo la próxima vez que entres.
        </p>
      )}
      <Submit />
    </form>
  );
}
