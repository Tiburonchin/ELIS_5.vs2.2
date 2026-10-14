import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PatchAndBackupService,
  calculateDataSha256,
  CURRENT_APP_VERSION,
} from '../../services/PatchAndBackupService';
import { supabase } from '../../lib/supabaseClient';

vi.mock('../../lib/supabaseClient', () => {
  const fromMock = vi.fn();
  const authMock = {
    getUser: vi.fn(),
  };
  const rpcMock = vi.fn();

  return {
    supabase: {
      auth: authMock,
      from: fromMock,
      rpc: rpcMock,
    },
  };
});

describe('PatchAndBackupService - Sobrescritura Controlada y Backups Preventivos', () => {
  let service: PatchAndBackupService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    service = new PatchAndBackupService();
  });

  it('calculateDataSha256 calcula un hash consistente y determinista', async () => {
    const data = { test: 'campo_hse', valor: 123 };
    const hash1 = await calculateDataSha256(data);
    const hash2 = await calculateDataSha256(data);

    expect(hash1).toBeDefined();
    expect(hash1.length).toBe(64);
    expect(hash1).toBe(hash2);
  });

  it('createSafetyBackup genera un snapshot local en localStorage y en Supabase Cloud', async () => {
    ((supabase.auth as any).getUser).mockResolvedValueOnce({
      data: { user: { id: 'usr-123' } },
      error: null,
    });

    const singleMock = vi.fn().mockResolvedValueOnce({
      data: { id: 'backup-uuid-777' },
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: selectMock });

    (supabase.from as any).mockReturnValueOnce({
      insert: insertMock,
    });

    const testPayload = { seccion: 'Checklist HSE', estado: 'parcial' };
    const result = await service.createSafetyBackup(
      'PRE_SOBRESCRITURA_ACTIVIDAD',
      'act-001',
      testPayload,
      'Backup de prueba unitaria'
    );

    expect(result.localSuccess).toBe(true);
    expect(result.cloudSuccess).toBe(true);
    expect(result.backupId).toBe('backup-uuid-777');
    expect(result.hash.length).toBe(64);

    // Verificar persistencia en localStorage
    const savedLocal = localStorage.getItem('elis_local_safety_backups');
    expect(savedLocal).not.toBeNull();
    const parsed = JSON.parse(savedLocal!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].tipo).toBe('PRE_SOBRESCRITURA_ACTIVIDAD');
    expect(parsed[0].data).toEqual(testPayload);
  });

  it('applyPatchToActivity genera OBLIGATORIAMENTE un backup preventivo antes de invocar la RPC', async () => {
    const backupSpy = vi.spyOn(service, 'createSafetyBackup').mockResolvedValueOnce({
      localSuccess: true,
      cloudSuccess: true,
      backupId: 'backup-prev-001',
      hash: 'a'.repeat(64),
    });

    ((supabase as any).rpc).mockResolvedValueOnce({
      data: {
        success: true,
        actividad_id: 'act-001',
        backup_id: 'backup-prev-001',
        mensaje: 'Parche aplicado con éxito',
      },
      error: null,
    });

    const parche = {
      items_evaluados: [{ seccion_id: 1, item_codigo: '1.1', calificacion: 'S' }],
    };

    const res = await service.applyPatchToActivity('act-001', parche, 'MERGE');

    // 1. Debe haber llamado OBLIGATORIAMENTE a createSafetyBackup primero
    expect(backupSpy).toHaveBeenCalledWith('PRE_SOBRESCRITURA_ACTIVIDAD', 'act-001', parche);

    // 2. Debe haber llamado a la RPC con el modo y JSON
    expect(supabase.rpc).toHaveBeenCalledWith('aplicar_parche_actividad_con_backup', {
      p_actividad_id: 'act-001',
      p_parche_json: parche,
      p_modo: 'MERGE',
    });

    expect(res.success).toBe(true);
    expect(res.backupId).toBe('backup-prev-001');
  });

  it('rollbackActivityBackup revierte vía RPC en base de datos o desde localStorage', async () => {
    // 1. Rollback Cloud
    ((supabase as any).rpc).mockResolvedValueOnce({
      data: {
        success: true,
        actividad_id: 'act-001',
        mensaje: 'Actividad restaurada exitosamente.',
      },
      error: null,
    });

    const cloudRes = await service.rollbackActivityBackup('uuid-backup-cloud-1');
    expect(supabase.rpc).toHaveBeenCalledWith('restaurar_backup_actividad', {
      p_backup_id: 'uuid-backup-cloud-1',
    });
    expect(cloudRes.success).toBe(true);

    // 2. Rollback Local
    localStorage.setItem(
      'elis_local_safety_backups',
      JSON.stringify([
        {
          id: 'local-123456789',
          tipo: 'PRE_SOBRESCRITURA_ACTIVIDAD',
          data: {
            elis_draft_item1: 'valor_recuperado',
          },
        },
      ])
    );

    const localRes = await service.rollbackActivityBackup('local-123456789');
    expect(localRes.success).toBe(true);
    expect(localStorage.getItem('elis_draft_item1')).toBe('valor_recuperado');
  });

  it('importAndApplyPatchFile valida formato, ejecuta backup previo y aplica el parche', async () => {
    const applyPatchSpy = vi.spyOn(service, 'applyPatchToActivity').mockResolvedValueOnce({
      success: true,
      backupId: 'backup-auto-99',
      mensaje: 'Parche instalado con éxito.',
    });

    const fileContent = JSON.stringify({
      format: 'ELIS_PATCH',
      version: CURRENT_APP_VERSION,
      tipo_contenido: 'DATOS_HSE',
      actividad_id: 'act-100',
      codigo_referencia: 'INSP-2026-001',
      timestamp: new Date().toISOString(),
      parche_json: { seccion: 'Protección contra Caídas' },
      hash_integridad: await calculateDataSha256({ seccion: 'Protección contra Caídas' }),
    });

    const file = new File([fileContent], 'test.elis-patch.json', { type: 'application/json' });

    const result = await service.importAndApplyPatchFile(file, 'OVERWRITE', 'act-100');

    expect(applyPatchSpy).toHaveBeenCalledWith(
      'act-100',
      { seccion: 'Protección contra Caídas' },
      'OVERWRITE'
    );
    expect(result.success).toBe(true);
  });
});
