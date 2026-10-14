import React, { useState, useEffect } from "react"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Camera,
  ClipboardList,
  RefreshCw,
  CloudCheck,
  WifiOff,
  Sun,
  Moon,
  Laptop,
} from "lucide-react"
import { AssistantWidget } from "./AssistantWidget"
import { PatchAndBackupCenterModal } from "@/components/system/PatchAndBackupCenterModal"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"

export interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: "evidencias" | "actividades"
  onTabChange: (tab: "evidencias" | "actividades") => void
  evidenceCount?: number
  activityCount?: number
  currentViewTitle?: string
  onBreadcrumbNavigate?: () => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  evidenceCount = 0,
  activityCount = 0,
  currentViewTitle,
  onBreadcrumbNavigate,
}) => {
  const [patchModalOpen, setPatchModalOpen] = useState(false)
  const { isOnline } = useOnlineStatus()
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system")

  // Inicializar y sincronizar tema con localStorage y documentElement
  useEffect(() => {
    try {
      const saved = (localStorage.getItem("elis_theme") as "light" | "dark" | "system") || "system"
      setThemeMode(saved)
    } catch {
      // noop
    }
  }, [])

  const handleApplyTheme = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode)
    try {
      localStorage.setItem("elis_theme", mode)
      const root = document.documentElement
      if (mode === "dark") {
        root.classList.add("dark")
      } else if (mode === "light") {
        root.classList.remove("dark")
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        if (prefersDark) {
          root.classList.add("dark")
        } else {
          root.classList.remove("dark")
        }
      }
    } catch (err) {
      console.warn("Error aplicando tema:", err)
    }
  }

  // Título dinámico para el breadcrumb
  const activeLabel =
    currentViewTitle ||
    (activeTab === "evidencias" ? "Bandeja de Evidencias" : "Gestor de Actividades")

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground antialiased">
        <AppSidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          evidenceCount={evidenceCount}
          activityCount={activityCount}
        />
        <SidebarInset className="flex flex-1 flex-col overflow-x-hidden">
          {/* Header Superior Corporativo Fluido y Simétrico */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 sm:px-6 lg:px-8 backdrop-blur supports-backdrop-filter:bg-background/60">
            {/* Bloque Izquierdo: Trigger + Separator + ELIS 5.0 + Breadcrumb Dinámico */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground shrink-0" />
              <Separator orientation="vertical" className="h-4 shrink-0" />
              
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold tracking-tight text-foreground whitespace-nowrap">
                  ELIS 5.0
                </span>
              </div>

              <Separator orientation="vertical" className="h-4 hidden sm:block shrink-0" />

              {/* Breadcrumb dinámico */}
              <Breadcrumb className="hidden sm:flex min-w-0">
                <BreadcrumbList className="text-xs">
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      render={
                        <button
                          type="button"
                          onClick={() => {
                            if (currentViewTitle && onBreadcrumbNavigate) {
                              onBreadcrumbNavigate()
                            } else {
                              onTabChange(activeTab)
                            }
                          }}
                        />
                      }
                      className="cursor-pointer font-medium hover:text-foreground transition-colors"
                    >
                      {activeTab === "evidencias" ? "Evidencias" : "Actividades"}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-semibold text-foreground truncate max-w-[200px] md:max-w-[320px]">
                      {activeLabel}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Bloque Derecho: Tabs móvil + Badge Nube Conectada + Parches/Backups + Selector de Tema */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Selector Rápido Móvil (si pantalla pequeña) */}
              <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => onTabChange("evidencias")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === "evidencias"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Ir a Evidencias"
                >
                  <Camera className="h-3 w-3" />
                  <span className="sr-only">Evidencias</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("actividades")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === "actividades"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Ir a Actividades"
                >
                  <ClipboardList className="h-3 w-3" />
                  <span className="sr-only">Actividades</span>
                </button>
              </div>

              {/* Badge Nube Conectada Compacto */}
              {isOnline ? (
                <Badge
                  variant="outline"
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 whitespace-nowrap shrink-0"
                  title="Conexión en tiempo real con Supabase Cloud activa"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <CloudCheck className="h-3 w-3 shrink-0" />
                  <span>Nube Conectada</span>
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 whitespace-nowrap shrink-0"
                  title="Modo local sin conexión - Los cambios se sincronizarán al reconectar"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <WifiOff className="h-3 w-3 shrink-0" />
                  <span>Modo Offline</span>
                </Badge>
              )}

              {/* Botón Acceso Rápido: Parches & Backups */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPatchModalOpen(true)}
                className="h-8 gap-1.5 text-xs font-medium border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer whitespace-nowrap shrink-0"
                title="Centro de Actualizaciones, Parches OTA y Backups Preventivos"
              >
                <RefreshCw className="h-3 w-3 shrink-0" />
                <span className="hidden lg:inline">Parches &amp; Backups</span>
                <span className="lg:hidden">Parches</span>
              </Button>

              {/* Selector de Tema Claro / Oscuro / Sistema */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                      title="Cambiar apariencia de interfaz"
                    />
                  }
                >
                  {themeMode === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : themeMode === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Laptop className="h-4 w-4" />
                  )}
                  <span className="sr-only">Cambiar tema</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem
                    onClick={() => handleApplyTheme("light")}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span>Claro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleApplyTheme("dark")}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span>Oscuro</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleApplyTheme("system")}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Laptop className="h-3.5 w-3.5" />
                    <span>Sistema</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Modal Central de Parches, Actualizaciones y Backups */}
          <PatchAndBackupCenterModal
            open={patchModalOpen}
            onOpenChange={setPatchModalOpen}
          />

          {/* Área de Contenido Principal: Alineamiento Simétrico Fluido */}
          <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 md:pb-10">
            {children}
          </main>

          {/* Footer Corporativo */}
          <footer className="border-t py-4 px-6 text-center text-xs text-muted-foreground bg-muted/20">
            ELIS 5.0 — Entorno Local Inteligente y Seguro &bull; Arquitectura Cloud-Native Supabase &bull; Cumplimiento ISO/HSE
          </footer>

          {/* Widget Flotante del Asistente de Voz y Orbe de Datos */}
          <AssistantWidget />
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default DashboardLayout

