import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import {
  ShieldAlert,
  Camera,
  ClipboardList,
  Cpu,
  FileCheck2,
  HardDrive,
  Sparkles,
} from "lucide-react"

export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab?: "evidencias" | "actividades"
  onTabChange?: (tab: "evidencias" | "actividades") => void
  evidenceCount?: number
  activityCount?: number
}

export function AppSidebar({
  activeTab = "evidencias",
  onTabChange,
  evidenceCount = 0,
  activityCount = 0,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
                E
              </div>
              <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                  ELIS 5.0
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  Gestión &amp; Control HSE
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Navegación Principal */}
        <SidebarGroup>
          <SidebarGroupLabel>Módulos Operativos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "evidencias"}
                  onClick={() => onTabChange && onTabChange("evidencias")}
                  tooltip="Bandeja de Evidencias"
                  className="cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span className="font-medium">Bandeja de Evidencias</span>
                  {evidenceCount > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 group-data-[collapsible=icon]:hidden">
                      {evidenceCount}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeTab === "actividades"}
                  onClick={() => onTabChange && onTabChange("actividades")}
                  tooltip="Gestor de Actividades"
                  className="cursor-pointer"
                >
                  <ClipboardList className="h-4 w-4" />
                  <span className="font-medium">Gestor de Actividades</span>
                  {activityCount > 0 && (
                    <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 group-data-[collapsible=icon]:hidden">
                      {activityCount}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Auditoría & Cumplimiento Forense */}
        <SidebarGroup>
          <SidebarGroupLabel>Seguridad &amp; Forense</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Integridad SHA-256">
                  <ShieldAlert className="h-4 w-4 text-emerald-600" />
                  <span>Integridad Hash SHA-256</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Motor OCR Tesseract">
                  <Cpu className="h-4 w-4 text-sky-600" />
                  <span>Motor OCR Tesseract</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Reportes Inmutables">
                  <FileCheck2 className="h-4 w-4 text-indigo-600" />
                  <span>Reportes PDF Inmutables</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Almacenamiento Local/Cloud">
                  <HardDrive className="h-4 w-4 text-slate-600" />
                  <span>Supabase Storage</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 text-xs">
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          <div className="truncate">
            <p className="font-medium text-foreground">Modo PWA Offline</p>
            <p className="text-[10px] text-muted-foreground truncate">
              Worker &amp; Crypto Activos
            </p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
