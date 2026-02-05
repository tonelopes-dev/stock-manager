'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from './_components/ui/button'
import { AlertTriangleIcon, RefreshCcwIcon, HomeIcon } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        layer: 'ui',
        boundary: 'app/error.tsx',
      },
    })
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center text-slate-900">
      <div className="max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-50 p-6">
            <AlertTriangleIcon className="h-16 w-16 text-amber-500" />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight text-primary">Ocorreu um erro inesperado</h1>
          <p className="text-slate-600">
            Pedimos desculpas pelo transtorno. Nossa equipe técnica já foi notificada e estamos trabalhando nisso para você.
          </p>
          {error.digest && (
             <p className="text-[10px] text-slate-400 font-mono">ID: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col gap-4 pt-4">
          <Button 
            size="lg" 
            className="h-14 w-full text-lg font-bold shadow-xl shadow-primary/10"
            onClick={() => reset()}
          >
            <RefreshCcwIcon className="mr-2 h-5 w-5" />
            Tentar novamente
          </Button>
          <Button 
            size="lg" 
            variant="ghost" 
            className="h-12 w-full text-slate-500 font-bold hover:text-slate-900"
            asChild
          >
            <Link href="/dashboard">
              <HomeIcon className="mr-2 h-5 w-5" />
              Voltar ao Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
