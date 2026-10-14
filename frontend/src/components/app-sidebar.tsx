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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/useAuth"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { ProfileSettingsModal } from "@/components/profile/ProfileSettingsModal"
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
  CheckCircle2,
  Wifi,
  WifiOff,
  Lock,
  Palette,
  Mic,
  RefreshCw,
} from "lucide-react"
import { PatchAndBackupCenterModal } from "@/components/system/PatchAndBackupCenterModal"

// ─── Tipos de panel de diagnóstico forense ────────────────────────────
type ForensicPanel = "hash" | "ocr" | "reportes" | "storage" | null

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
  const { isOnline } = useOnlineStatus();
  const [activePanel, setActivePanel] = React.useState<ForensicPanel>(null);
  const [profileModalOpen, setProfileModalOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState<'perfil' | 'apariencia' | 'voz'>('perfil');
  const [patchModalOpen, setPatchModalOpen] = React.useState(false);

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
    <>
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

          {/* Auditoría & Cumplimiento Forense — Paneles de diagnóstico */}
          <SidebarGroup>
            <SidebarGroupLabel>Seguridad &amp; Forense</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Integridad SHA-256"
                    className="cursor-pointer"
                    onClick={() => setActivePanel("hash")}
                  >
                    <ShieldAlert className="h-4 w-4 text-emerald-600" />
                    <span>Integridad Hash SHA-256</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Motor OCR Tesseract"
                    className="cursor-pointer"
                    onClick={() => setActivePanel("ocr")}
                  >
                    <Cpu className="h-4 w-4 text-sky-600" />
                    <span>Motor OCR Tesseract</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Reportes Inmutables"
                    className="cursor-pointer"
                    onClick={() => setActivePanel("reportes")}
                  >
                    <FileCheck2 className="h-4 w-4 text-indigo-600" />
                    <span>Reportes PDF Inmutables</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip="Almacenamiento Cloud"
                    className="cursor-pointer"
                    onClick={() => setActivePanel("storage")}
                  >
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
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="cursor-pointer w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                    />
                  }
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
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  side="top"
                  sideOffset={8}
                  className="w-64 z-50 bg-popover text-popover-foreground shadow-xl border rounded-xl p-1"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2.5 px-2 py-2 text-left text-sm border-b border-border/50">
                        <Avatar className="h-9 w-9 rounded-lg">
                          <AvatarFallback className="rounded-lg bg-primary/15 text-primary text-xs font-bold">
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-xs leading-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-semibold text-foreground">{displayName}</span>
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0 uppercase font-semibold text-primary"
                            >
                              {profile?.rol || 'inspector'}
                            </Badge>
                          </div>
                          <span className="truncate text-[10px] text-muted-foreground mt-0.5">{displayEmail}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>

                  <DropdownMenuItem
                    onClick={() => {
                      setSettingsTab('perfil');
                      setProfileModalOpen(true);
                    }}
                    className="gap-2 cursor-pointer text-xs py-2 px-2.5 rounded-lg hover:bg-accent focus:bg-accent"
                  >
                    <User className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">Mi Perfil y Firma HSE</span>
                      <span className="text-[10px] text-muted-foreground">Ficha oficial F-120 y F-128</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      setSettingsTab('apariencia');
                      setProfileModalOpen(true);
                    }}
                    className="gap-2 cursor-pointer text-xs py-2 px-2.5 rounded-lg hover:bg-accent focus:bg-accent"
                  >
                    <Palette className="h-4 w-4 text-sky-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">Preferencias de Interfaz</span>
                      <span className="text-[10px] text-muted-foreground">Tema Claro / Oscuro y Contraste</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      setSettingsTab('voz');
                      setProfileModalOpen(true);
                    }}
                    className="gap-2 cursor-pointer text-xs py-2 px-2.5 rounded-lg hover:bg-accent focus:bg-accent"
                  >
                    <Mic className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">Configuración de Voz (Orbe)</span>
                      <span className="text-[10px] text-muted-foreground">es-PE &bull; TTS y Sensibilidad</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => {
                      setPatchModalOpen(true);
                    }}
                    className="gap-2 cursor-pointer text-xs py-2 px-2.5 rounded-lg hover:bg-accent focus:bg-accent"
                  >
                    <RefreshCw className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-medium">Actualizaciones, Parches y Backups</span>
                      <span className="text-[10px] text-muted-foreground">OTA Hot-Reload &bull; Snapshots</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-1" />

                  <DropdownMenuItem
                    onClick={() => logout()}
                    className="gap-2 text-destructive focus:text-destructive cursor-pointer text-xs py-2 px-2.5 rounded-lg hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    <span className="font-medium">Cerrar Sesión Segura</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Indicador PWA reactivo al estado real de conexión con acceso rápido a Parches */}
          <div
            onClick={() => setPatchModalOpen(true)}
            className={`flex items-center justify-between gap-2 rounded-lg p-2 text-xs mt-1 group-data-[collapsible=icon]:hidden transition-colors cursor-pointer hover:opacity-90 ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
            }`}
            title="Abrir Centro de Actualizaciones, Parches y Backups"
          >
            <div className="flex items-center gap-2 truncate">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <WifiOff className="h-4 w-4 text-amber-500 shrink-0 animate-pulse" />
              )}
              <div className="truncate">
                <p className="font-medium">
                  {isOnline ? "Conectado" : "Modo Offline"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {isOnline
                    ? "Parches & Crypto Activos"
                    : "Sin conexión — respaldo local"}
                </p>
              </div>
            </div>
            <RefreshCw className="h-3 w-3 text-muted-foreground/60 shrink-0" />
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Modal Centro de Actualizaciones, Parches y Backups */}
      <PatchAndBackupCenterModal
        open={patchModalOpen}
        onOpenChange={setPatchModalOpen}
      />

      {/* ─── Dialogs de diagnóstico forense ─────────────────────────── */}

      {/* Panel: Integridad Hash SHA-256 */}
      <Dialog open={activePanel === "hash"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-emerald-600" />
              Integridad Hash SHA-256
            </DialogTitle>
            <DialogDescription>
              Módulo de deduplicación criptográfica y cadena de custodia digital.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Web Crypto API</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-emerald-500/30 text-emerald-600">Activo</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                <code>crypto.subtle.digest('SHA-256')</code> nativo del navegador. Calcula el hash de una foto de 5 MB en &lt;0.1s.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Deduplicación en BD</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-emerald-500/30 text-emerald-600">UNIQUE</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                La columna <code>hash_sha256 CHAR(64) UNIQUE</code> en <code>public.evidencias</code> rechaza duplicados a nivel de motor PostgreSQL.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium">Inmutabilidad :ro</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-emerald-500/30 text-emerald-600">RLS</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Las políticas RLS bloquean <code>UPDATE</code> y <code>DELETE</code> en evidencias y Storage. Cadena de custodia inquebrantable.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Panel: Motor OCR Tesseract */}
      <Dialog open={activePanel === "ocr"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-5 w-5 text-sky-600" />
              Motor OCR Tesseract
            </DialogTitle>
            <DialogDescription>
              Reconocimiento óptico de caracteres ejecutado íntegramente en el navegador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                <span className="font-medium">Tesseract.js v5+ (Web Worker)</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-sky-500/30 text-sky-600">En-Navegador</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Ejecuta Tesseract en un hilo secundario (<code>Web Worker</code>) sin congelar la interfaz. Modelo <code>spa</code> cacheado localmente.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                <span className="font-medium">Liberación de memoria</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-sky-500/30 text-sky-600">worker.terminate()</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Cada instancia de Worker se destruye explícitamente con <code>worker.terminate()</code> en el bloque <code>finally</code> tras el OCR. Cero fuga de memoria.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-sky-600 shrink-0" />
                <span className="font-medium">Human-in-the-Loop</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-sky-500/30 text-sky-600">Obligatorio</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Los resultados OCR son sugerencias. Un revisor humano debe confirmar o corregir antes de guardar en <code>public.identificaciones</code> con <code>confirmado_por = auth.uid()</code>.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Panel: Reportes PDF Inmutables */}
      <Dialog open={activePanel === "reportes"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileCheck2 className="h-5 w-5 text-indigo-600" />
              Reportes PDF Inmutables
            </DialogTitle>
            <DialogDescription>
              Generación de fichas técnicas corporativas con control estético del 100%.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="font-medium">Checklist HSE 15 Secciones</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-indigo-500/30 text-indigo-600">S/ER/PI/NA</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Componente <code>&lt;InspectionReportTemplate /&gt;</code> con las 15 secciones normativas HSE renderizado con <code>react-to-print</code>.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="font-medium">Amonestación HSE-EL-F-128</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-indigo-500/30 text-indigo-600">Oficial</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Formato oficial <code>&lt;AmonestacionReportTemplate /&gt;</code> con datos del amonestado, motivo, nivel de riesgo y firmas de validación.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="font-medium">Exportador PDF</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-indigo-500/30 text-indigo-600">react-to-print</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                <code>&lt;PdfExporter /&gt;</code> genera descarga/impresión en 1 clic. El estado de la actividad se actualiza a <code>'exportada'</code> tras la generación.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Panel: Supabase Storage */}
      <Dialog open={activePanel === "storage"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-5 w-5 text-slate-600" />
              Supabase Storage
            </DialogTitle>
            <DialogDescription>
              Bucket de evidencias inmutables con políticas de seguridad estrictas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-slate-600 shrink-0" />
                <span className="font-medium">Bucket: <code>evidencias</code></span>
                <Badge variant="outline" className="ml-auto text-[10px] border-slate-500/30 text-slate-600">Cloud 24/7</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Estructura: <code>originals/&#123;hash&#125;.ext</code> y <code>thumbs/&#123;hash&#125;_thumb.webp</code>. Acceso autenticado vía JWT.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-600 shrink-0" />
                <span className="font-medium">Política :ro Inmutable</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-red-500/30 text-red-600">Solo INSERT+SELECT</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Las políticas RLS del bucket prohíben <code>UPDATE</code> y <code>DELETE</code>. Los archivos originales jamás se pueden sobrescribir ni eliminar.
              </p>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-slate-600 shrink-0" />
                <span className="font-medium">Sanitización EXIF</span>
                <Badge variant="outline" className="ml-auto text-[10px] border-slate-500/30 text-slate-600">Sin GPS</Badge>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Antes de subir, <code>fileProcessor.ts</code> extrae solo metadata segura (fecha, cámara) y descarta coordenadas GPS por privacidad.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Personalización & Perfil */}
      <ProfileSettingsModal
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        defaultTab={settingsTab}
      />
    </>
  )
}
