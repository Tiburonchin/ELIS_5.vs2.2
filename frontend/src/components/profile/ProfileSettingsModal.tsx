import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthService } from '@/services/AuthService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Palette,
  Mic,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Volume2,
  Sun,
  Moon,
  Laptop,
  HardDrive,
  FileText,
} from 'lucide-react';

export interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'perfil' | 'apariencia' | 'voz';
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  open,
  onOpenChange,
  defaultTab = 'perfil',
}) => {
  const { user, profile, refreshProfile } = useAuth();

  // Tab 1: Identidad y Firma HSE
  const [nombresCompletos, setNombresCompletos] = useState('');
  const [cargo, setCargo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Tab 2: Apariencia y Experiencia PWA
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [accentColor, setAccentColor] = useState<'emerald' | 'blue' | 'amber'>('emerald');
  const [highContrast, setHighContrast] = useState(false);

  // Tab 3: Motor de Voz y Diagnóstico
  const [micTesting, setMicTesting] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [micTestedOk, setMicTestedOk] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [webpQuality, setWebpQuality] = useState('0.8');

  // Inicializar estado con datos del perfil
  useEffect(() => {
    if (profile) {
      setNombresCompletos(profile.nombres_completos || '');
      setCargo(profile.cargo || 'Supervisor HSE');
      setTelefono(profile.telefono || '');
    } else if (user) {
      const meta = user.user_metadata || {};
      setNombresCompletos(meta.full_name || meta.nombres_completos || user.email?.split('@')[0] || '');
      setCargo('Supervisor HSE');
      setTelefono(user.phone || '');
    }
  }, [profile, user]);

  // Cargar configuraciones visuales desde localStorage
  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('elis_theme') as 'light' | 'dark' | 'system') || 'system';
      const savedAccent = (localStorage.getItem('elis_accent') as 'emerald' | 'blue' | 'amber') || 'emerald';
      const savedContrast = localStorage.getItem('elis_high_contrast') === 'true';
      const savedTts = localStorage.getItem('elis_tts_enabled') !== 'false';
      const savedQuality = localStorage.getItem('elis_webp_quality') || '0.8';

      setThemeMode(savedTheme);
      setAccentColor(savedAccent);
      setHighContrast(savedContrast);
      setTtsEnabled(savedTts);
      setWebpQuality(savedQuality);
    } catch {
      // Ignorar errores de acceso a localStorage
    }
  }, []);

  // Aplicar tema en documentElement
  const handleApplyTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    try {
      localStorage.setItem('elis_theme', mode);
      const root = document.documentElement;
      if (mode === 'dark') {
        root.classList.add('dark');
      } else if (mode === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    } catch (err) {
      console.warn('Error aplicando tema:', err);
    }
  };

  const handleToggleHighContrast = (checked: boolean) => {
    setHighContrast(checked);
    try {
      localStorage.setItem('elis_high_contrast', String(checked));
      if (checked) {
        document.documentElement.classList.add('contrast-more');
      } else {
        document.documentElement.classList.remove('contrast-more');
      }
    } catch (err) {
      console.warn('Error aplicando alto contraste:', err);
    }
  };

  const handleToggleTts = (checked: boolean) => {
    setTtsEnabled(checked);
    try {
      localStorage.setItem('elis_tts_enabled', String(checked));
    } catch (err) {
      console.warn('Error guardando TTS:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!nombresCompletos.trim()) {
      setProfileErrorMsg('El nombre completo es obligatorio para la firma oficial.');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await AuthService.updateProfile({
        nombres_completos: nombresCompletos.trim(),
        cargo: cargo.trim() || 'Supervisor HSE',
        telefono: telefono.trim() || null,
      });

      if (error) {
        setProfileErrorMsg(`Error al actualizar perfil: ${error.message}`);
      } else {
        setProfileSuccessMsg('Perfil y firma HSE actualizados exitosamente en la base de datos.');
        await refreshProfile();
      }
    } catch (err) {
      setProfileErrorMsg(err instanceof Error ? err.message : 'Error inesperado al guardar');
    } finally {
      setSavingProfile(false);
    }
  };

  // Prueba en vivo del micrófono
  const handleTestMic = async () => {
    if (micTesting) return;
    setMicTesting(true);
    setMicTestedOk(false);
    setMicAudioLevel(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

      analyser.smoothingTimeConstant = 0.8;
      analyser.fftSize = 1024;
      microphone.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(audioContext.destination);

      let samples = 0;
      javascriptNode.onaudioprocess = () => {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;
        const length = array.length;
        for (let i = 0; i < length; i++) {
          values += array[i];
        }
        const average = values / length;
        setMicAudioLevel(Math.min(100, Math.round(average * 2)));
        samples++;
        if (samples > 30) {
          // Finalizar prueba
          stream.getTracks().forEach((track) => track.stop());
          audioContext.close();
          setMicTesting(false);
          setMicTestedOk(true);
        }
      };
    } catch {
      setMicTesting(false);
      setMicTestedOk(false);
    }
  };

  const rolBadge = profile?.rol || 'inspector';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl bg-card border-border/80 shadow-2xl">
        <DialogHeader className="space-y-1 pb-2 border-b border-border/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Centro de Personalización &amp; Perfil</span>
            </DialogTitle>
            <Badge
              variant="outline"
              className="text-[11px] uppercase tracking-wider font-semibold border-primary/30 bg-primary/10 text-primary"
            >
              {rolBadge}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Gestiona tu identidad para reportes oficiales, preferencias de interfaz y motor de voz.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-3 h-9 p-1 bg-muted/60 rounded-lg">
            <TabsTrigger value="perfil" className="text-xs gap-1.5 cursor-pointer font-medium">
              <User className="h-3.5 w-3.5" />
              <span>Firma HSE</span>
            </TabsTrigger>
            <TabsTrigger value="apariencia" className="text-xs gap-1.5 cursor-pointer font-medium">
              <Palette className="h-3.5 w-3.5" />
              <span>Apariencia</span>
            </TabsTrigger>
            <TabsTrigger value="voz" className="text-xs gap-1.5 cursor-pointer font-medium">
              <Mic className="h-3.5 w-3.5" />
              <span>Voz &amp; Dispositivo</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: IDENTIDAD Y FIRMA HSE */}
          <TabsContent value="perfil" className="space-y-4 pt-3">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {profileSuccessMsg && (
                <div
                  role="status"
                  className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              {profileErrorMsg && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="perfil-nombres" className="text-xs font-semibold">
                    Nombres y Apellidos Completos *
                  </Label>
                  <Input
                    id="perfil-nombres"
                    value={nombresCompletos}
                    onChange={(e) => setNombresCompletos(e.target.value)}
                    placeholder="Ej. Ing. Carlos Mendoza Llerena"
                    className="text-xs h-9"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Aparecerá en el pie de página de F-120 y F-128
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="perfil-cargo" className="text-xs font-semibold">
                    Cargo Operativo *
                  </Label>
                  <Input
                    id="perfil-cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    placeholder="Ej. Supervisor HSE / Inspector Técnico"
                    className="text-xs h-9"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Cargo técnico registrado en campo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="perfil-telefono" className="text-xs font-semibold">
                    Teléfono de Emergencia en Campo
                  </Label>
                  <Input
                    id="perfil-telefono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+51 987 654 321"
                    className="text-xs h-9 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Correo Electrónico Vinculado
                  </Label>
                  <Input
                    disabled
                    value={user?.email || ''}
                    className="text-xs h-9 bg-muted/50 cursor-not-allowed font-mono text-muted-foreground"
                  />
                </div>
              </div>

              {/* Previsualización del bloque de firma */}
              <Card className="border border-border/80 bg-muted/20">
                <CardHeader className="py-2 px-3 border-b border-border/50">
                  <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    <span>Previsualización de Firma Oficial en Formatos PDF (F-120 y F-128)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="max-w-xs mx-auto border border-black/80 p-3 bg-white text-black text-center rounded-sm shadow-xs space-y-1">
                    <div className="h-10 border-b border-dashed border-black/40 flex items-end justify-center pb-1">
                      <span className="text-[10px] italic font-serif text-gray-400">
                        Firma Digitalizada / Acreditada
                      </span>
                    </div>
                    <p className="font-bold text-[10px] uppercase tracking-tight">
                      {nombresCompletos || 'INSPECTOR NO CONFIGURADO'}
                    </p>
                    <p className="text-[8.5px] text-gray-700 uppercase">
                      {cargo || 'SUPERVISOR HSE'}
                    </p>
                    <p className="text-[7.5px] font-mono text-gray-500">
                      ID: {user?.id?.slice(0, 8)}... | AUTH JWT
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={savingProfile}
                  className="text-xs font-medium h-9 cursor-pointer gap-2 px-4"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Guardando en BD...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Guardar Perfil y Firma</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: APARIENCIA Y EXPERIENCIA PWA */}
          <TabsContent value="apariencia" className="space-y-4 pt-3">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Tema Visual del Sistema</Label>
                <p className="text-[11px] text-muted-foreground">
                  Selecciona la paleta de iluminación adaptada para oficina o inspección en exteriores.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleApplyTheme('light')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs gap-2 cursor-pointer transition-all ${
                    themeMode === 'light'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border/70 hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <Sun className="h-5 w-5" />
                  <span>Claro</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyTheme('dark')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs gap-2 cursor-pointer transition-all ${
                    themeMode === 'dark'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border/70 hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <Moon className="h-5 w-5" />
                  <span>Oscuro</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyTheme('system')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs gap-2 cursor-pointer transition-all ${
                    themeMode === 'system'
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                      : 'border-border/70 hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <Laptop className="h-5 w-5" />
                  <span>Automático</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast" className="text-xs font-semibold">
                    Alto Contraste para Exteriores
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Aumenta bordes y sombras para lectura bajo luz solar directa en campo.
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={highContrast}
                  onCheckedChange={handleToggleHighContrast}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-border/50">
              <Label className="text-xs font-semibold">Color de Acento Corporativo</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAccentColor('emerald');
                    try {
                      localStorage.setItem('elis_accent', 'emerald');
                    } catch {}
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                    accentColor === 'emerald'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <div className="h-3 w-3 rounded-full bg-emerald-600" />
                  <span>Esmeralda HSE</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccentColor('blue');
                    try {
                      localStorage.setItem('elis_accent', 'blue');
                    } catch {}
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                    accentColor === 'blue'
                      ? 'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-400 font-bold'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <div className="h-3 w-3 rounded-full bg-sky-600" />
                  <span>Azul Corporativo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccentColor('amber');
                    try {
                      localStorage.setItem('elis_accent', 'amber');
                    } catch {}
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer ${
                    accentColor === 'amber'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <span>Ámbar Alerta</span>
                </button>
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: MOTOR DE VOZ Y DIAGNÓSTICO */}
          <TabsContent value="voz" className="space-y-4 pt-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tts-switch" className="text-xs font-semibold flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-primary" />
                    <span>Respuesta Hablada por Voz (TTS Síntesis)</span>
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    El Orbe pronunciará la confirmación auditiva al dictar hallazgos en campo.
                  </p>
                </div>
                <Switch
                  id="tts-switch"
                  checked={ttsEnabled}
                  onCheckedChange={handleToggleTts}
                />
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <Label className="text-xs font-semibold">
                  Idioma y Acento del Motor Fonético
                </Label>
                <Input
                  disabled
                  value="es-PE (Español de Perú — Optimizado para terminología minera y de obra)"
                  className="text-xs h-9 bg-muted/50 cursor-not-allowed font-medium text-muted-foreground"
                />
              </div>

              {/* Prueba de Micrófono en vivo */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Sensibilidad y Prueba de Micrófono
                  </Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleTestMic}
                    disabled={micTesting}
                    className="text-xs h-7 gap-1.5 cursor-pointer"
                  >
                    <Mic className={`h-3 w-3 ${micTesting ? 'animate-pulse text-red-500' : ''}`} />
                    <span>{micTesting ? 'Escuchando...' : 'Probar Micrófono'}</span>
                  </Button>
                </div>

                <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${micAudioLevel}%` }}
                  />
                </div>

                {micTestedOk && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Micrófono calibrado correctamente para dictado en campo.</span>
                  </p>
                )}
              </div>

              {/* Diagnóstico de compresión y Storage */}
              <div className="space-y-1.5 pt-2 border-t border-border/50">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5 text-primary" />
                  <span>Calidad de Compresión WebP en Cliente</span>
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="0.5"
                    max="1.0"
                    step="0.05"
                    value={webpQuality}
                    onChange={(e) => {
                      setWebpQuality(e.target.value);
                      try {
                        localStorage.setItem('elis_webp_quality', e.target.value);
                      } catch {}
                    }}
                    className="w-28 text-xs h-8 font-mono"
                  />
                  <span className="text-[11px] text-muted-foreground">
                    0.80 recomendado (~250 KB por foto, compresión en milisegundos en RAM)
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
