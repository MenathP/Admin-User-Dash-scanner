"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ClientOnly } from "@/components/client-only"

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return (
        <ClientOnly fallback={<div>{children}</div>}>
            <NextThemesProvider {...props}>{children}</NextThemesProvider>
        </ClientOnly>
    )
}