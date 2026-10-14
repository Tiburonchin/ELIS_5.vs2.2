import React, { useState } from "react"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Camera, ClipboardList, RefreshCw } from "lucide-react"
import { AssistantWidget } from "./AssistantWidget"
import { PatchAndBackupCenterModal } from "@/components/system/PatchAndBackupCenterModal"

export interface DashboardLayoutProps {
  children: React.ReactNode
  activeTab: "evidencias" | "actividades"
  onTabChange: (tab: "evidencias" | "actividades") => void
  evidenceCount?: number
  activityCount?: number
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  evidenceCount = 0,
  activityCount = 0,
}) => {
  const [patchModalOpen, setPatchModalOpen] = useState(false)
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
          {/* Header Superior Corporativo */}
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  ELIS 5.0
                </span>
                <span className="text-muted-foreground/40 hidden sm:inline">•</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  Sistema de Inspección &amp; Control Forense HSE
                </span>
              </div>
            </div>

            {/* Accesos rápidos superiores y Estado del Sistema */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 sm:hidden">
                <button
                  type="button"
                  onClick={() => onTabChange("evidencias")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === "evidencias"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Camera className="h-3 w-3" />
                  <span>Evidencias</span>
                </button>
                <button
                  type="button"
                  onClick={() => onTabChange("actividades")}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    activeTab === "actividades"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ClipboardList className="h-3 w-3" />
                  <span>Actividades</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPatchModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                title="Centro de Actualizaciones, Parches OTA y Backups Preventivos"
              >
                <RefreshCw className="h-3 w-3" />
                <span className="hidden sm:inline">Actualizaciones &amp; Backups</span>
                <span className="sm:hidden">Parches</span>
              </button>

              <Badge
                variant="outline"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <ShieldCheck className="h-3 w-3" />
                <span>SHA-256 Inmutable</span>
              </Badge>
            </div>
          </header>

          {/* Modal Central de Parches, Actualizaciones y Backups */}
          <PatchAndBackupCenterModal
            open={patchModalOpen}
            onOpenChange={setPatchModalOpen}
          />

          {/* Área de Contenido Principal con espaciado seguro para el Orbe flotante en móvil */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-10 max-w-7xl w-full mx-auto space-y-6">
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
