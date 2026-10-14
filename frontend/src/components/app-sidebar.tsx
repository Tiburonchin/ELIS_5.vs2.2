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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import {
  ShieldAlert,
  Camera,
  ClipboardList,
  Cpu,
  FileCheck2,
  HardDrive,
  Sparkles,
  LogOut,
  User,
  ChevronsUpDown,
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
  const { user, profile, logout } = useAuth();

  // Iniciales para el avatar
  const getInitials = (name?: string | null) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = profile?.nombres_completos || user?.email?.split("@")[0] || "Inspector";
  const displayCargo = profile?.cargo || "Supervisor HSE";
  const displayEmail = user?.email || "";

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

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer w-full"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-[10px] text-muted-foreground">{displayCargo}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-bold">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-xs leading-tight">
                      <span className="truncate font-semibold">{displayName}</span>
                      <span className="truncate text-[10px] text-muted-foreground">{displayEmail}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer text-xs">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Rol: {profile?.rol?.toUpperCase() || 'INSPECTOR'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-2 text-xs mt-1 group-data-[collapsible=icon]:hidden">
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
