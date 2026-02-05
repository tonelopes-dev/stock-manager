'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from './_components/ui/button'

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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center p-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-primary">
          Algo deu errado 😕
        </h2>

        <p className="text-muted-foreground max-w-md">
          Tivemos um problema ao carregar esta tela.  
          Você pode tentar novamente sem perder o que já estava fazendo.
        </p>
      </div>

      <Button
        onClick={reset}
        variant="default"
        size="lg"
      >
        Tentar novamente
      </Button>
    </div>
  )
}
