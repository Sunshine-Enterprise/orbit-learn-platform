import { supabase } from '../lib/supabase';
import type { Candidate } from '../types';
import { resolveCandidateGender } from '../utils/genderHelper';

export function encodeAvatarMetadata(params: {
  gender?: 'male' | 'female';
  area?: string;
  secondaryAreas?: string[];
  temporaryPassword?: string;
  customPassword?: string;
  isPasswordChanged?: boolean;
}): string {
  const parts: string[] = [];
  parts.push(`gender:${params.gender || 'male'}`);
  if (params.area) parts.push(`area:${params.area}`);
  if (params.secondaryAreas && params.secondaryAreas.length > 0) {
    parts.push(`sec:${params.secondaryAreas.join(';')}`);
  }
  if (params.temporaryPassword) {
    parts.push(`tmp:${params.temporaryPassword}`);
  }
  if (params.customPassword) {
    parts.push(`pwd:${params.customPassword}`);
  }
  if (params.isPasswordChanged !== undefined) {
    parts.push(`chg:${params.isPasswordChanged ? '1' : '0'}`);
  }
  return parts.join('|');
}

export function decodeAvatarMetadata(avatarStr?: string, name?: string): {
  gender: 'male' | 'female';
  area?: string;
  secondaryAreas?: string[];
  temporaryPassword?: string;
  customPassword?: string;
  isPasswordChanged?: boolean;
} {
  let gender: 'male' | 'female' = 'male';
  let area: string | undefined = undefined;
  let secondaryAreas: string[] | undefined = undefined;
  let temporaryPassword: string | undefined = undefined;
  let customPassword: string | undefined = undefined;
  let isPasswordChanged: boolean | undefined = undefined;

  if (avatarStr && (avatarStr.startsWith('gender:') || avatarStr.includes('|'))) {
    const raw = avatarStr.replace(/^gender:/, '');
    const parts = raw.split('|');
    for (const p of parts) {
      if (p === 'female' || p === 'male') {
        gender = p;
      } else if (p.startsWith('area:')) {
        area = p.replace('area:', '');
      } else if (p.startsWith('sec:')) {
        secondaryAreas = p.replace('sec:', '').split(';').map(s => s.trim()).filter(Boolean);
      } else if (p.startsWith('tmp:')) {
        temporaryPassword = p.replace('tmp:', '').trim();
      } else if (p.startsWith('pwd:')) {
        customPassword = p.replace('pwd:', '').trim();
      } else if (p.startsWith('chg:')) {
        isPasswordChanged = p.replace('chg:', '').trim() === '1';
      }
    }
  } else {
    gender = resolveCandidateGender({ name: name || '', avatar: avatarStr });
  }

  return {
    gender,
    area,
    secondaryAreas,
    temporaryPassword,
    customPassword,
    isPasswordChanged,
  };
}

export const candidateService = {
  async getAll(): Promise<Candidate[]> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('registered_at', { ascending: false });

    if (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }

    return (data || []).map((c: any) => {
      const meta = decodeAvatarMetadata(c.avatar, c.name);
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        roleApplied: c.role_applied,
        area: meta.area || c.area || undefined,
        secondaryAreas: meta.secondaryAreas && meta.secondaryAreas.length > 0 ? meta.secondaryAreas : undefined,
        avatar: c.avatar || `gender:${meta.gender}`,
        gender: meta.gender,
        registeredAt: c.registered_at ? c.registered_at.split('T')[0] : '',
        temporaryPassword: meta.temporaryPassword,
        customPassword: meta.customPassword,
        isPasswordChanged: meta.isPasswordChanged,
      };
    });
  },

  async create(candidateData: Omit<Candidate, 'id' | 'registeredAt' | 'avatar'> & {
    gender?: 'male' | 'female';
    area?: string;
    secondaryAreas?: string[];
    temporaryPassword?: string;
    customPassword?: string;
    isPasswordChanged?: boolean;
  }): Promise<Candidate> {
    const tempPass = candidateData.temporaryPassword || `SEU-temp-${Math.floor(1000 + Math.random() * 9000)}`;
    const avatar = encodeAvatarMetadata({
      gender: candidateData.gender || 'male',
      area: candidateData.area,
      secondaryAreas: candidateData.secondaryAreas,
      temporaryPassword: tempPass,
      customPassword: candidateData.customPassword,
      isPasswordChanged: candidateData.isPasswordChanged,
    });

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        name: candidateData.name,
        email: candidateData.email,
        role_applied: candidateData.roleApplied,
        avatar,
      })
      .select()
      .single();

    if (error) throw error;

    const meta = decodeAvatarMetadata(data.avatar, data.name);
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      roleApplied: data.role_applied,
      area: meta.area,
      secondaryAreas: meta.secondaryAreas,
      avatar: data.avatar,
      gender: meta.gender,
      registeredAt: data.registered_at ? data.registered_at.split('T')[0] : '',
      temporaryPassword: meta.temporaryPassword || tempPass,
      customPassword: meta.customPassword,
      isPasswordChanged: meta.isPasswordChanged ?? false,
    };
  },

  async update(
    candidateId: string,
    candidateData: {
      name: string;
      email: string;
      roleApplied: string;
      gender: 'male' | 'female';
      area?: string;
      secondaryAreas?: string[];
      temporaryPassword?: string;
      customPassword?: string;
      isPasswordChanged?: boolean;
    }
  ): Promise<Candidate> {
    const { data: existing } = await supabase
      .from('candidates')
      .select('avatar')
      .eq('id', candidateId)
      .maybeSingle();

    const existingMeta = existing ? decodeAvatarMetadata(existing.avatar) : decodeAvatarMetadata();
    const finalTemp = candidateData.temporaryPassword !== undefined ? candidateData.temporaryPassword : existingMeta.temporaryPassword;
    const finalPwd = candidateData.customPassword !== undefined ? candidateData.customPassword : existingMeta.customPassword;
    const finalChg = candidateData.isPasswordChanged !== undefined ? candidateData.isPasswordChanged : existingMeta.isPasswordChanged;

    const avatar = encodeAvatarMetadata({
      gender: candidateData.gender,
      area: candidateData.area,
      secondaryAreas: candidateData.secondaryAreas,
      temporaryPassword: finalTemp,
      customPassword: finalPwd,
      isPasswordChanged: finalChg,
    });

    const { data, error } = await supabase
      .from('candidates')
      .update({
        name: candidateData.name,
        email: candidateData.email,
        role_applied: candidateData.roleApplied,
        avatar,
      })
      .eq('id', candidateId)
      .select()
      .single();

    if (error) throw error;

    const meta = decodeAvatarMetadata(data.avatar, data.name);
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      roleApplied: data.role_applied,
      area: meta.area,
      secondaryAreas: meta.secondaryAreas,
      avatar: data.avatar,
      gender: meta.gender,
      registeredAt: data.registered_at ? data.registered_at.split('T')[0] : '',
      temporaryPassword: meta.temporaryPassword,
      customPassword: meta.customPassword,
      isPasswordChanged: meta.isPasswordChanged,
    };
  },

  async updatePassword(
    email: string,
    params: { customPassword?: string; temporaryPassword?: string; isPasswordChanged?: boolean }
  ): Promise<void> {
    const norm = email.trim().toLowerCase();
    const { data: cands, error } = await supabase
      .from('candidates')
      .select('*')
      .ilike('email', norm);

    if (error || !cands || cands.length === 0) return;
    const cand = cands[0];
    const meta = decodeAvatarMetadata(cand.avatar, cand.name);

    const updatedAvatar = encodeAvatarMetadata({
      gender: meta.gender,
      area: meta.area,
      secondaryAreas: meta.secondaryAreas,
      temporaryPassword: params.temporaryPassword !== undefined ? params.temporaryPassword : meta.temporaryPassword,
      customPassword: params.customPassword !== undefined ? params.customPassword : meta.customPassword,
      isPasswordChanged: params.isPasswordChanged !== undefined ? params.isPasswordChanged : true,
    });

    await supabase
      .from('candidates')
      .update({ avatar: updatedAvatar })
      .eq('id', cand.id);
  },

  async delete(candidateId: string): Promise<void> {
    const { error } = await supabase.from('candidates').delete().eq('id', candidateId);
    if (error) throw error;
  },
};
