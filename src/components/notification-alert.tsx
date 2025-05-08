"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, AlertCircle, CheckCircle2 } from "lucide-react";

interface NotificationAlertProps {
  message: string;
  type: 'success' | 'error';
}

export default function NotificationAlert({ message, type }: NotificationAlertProps) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  const variant = type === 'success' ? 'default' : 'destructive';
  const title = type === 'success' ? 'Success!' : 'Error!';

  return (
    <Alert variant={variant} className="w-full text-left mb-4">
      <Icon className="h-5 w-5" />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
