import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export const LIVE_ADMIN_ACCOUNTS: Record<string, { name: string; passwordHashOrPlain: string; role: string }> = {
  'admin@seu-usa.com': {
    name: 'Sunshine Enterprise Administrator',
    passwordHashOrPlain: 'SeuAdmin2026!',
    role: 'recruiter',
  },
  'recruiter@seu-usa.com': {
    name: 'SEU Talent Acquisition Lead',
    passwordHashOrPlain: 'SkillProof2026!',
    role: 'recruiter',
  },
  'admin@skillproof.com': {
    name: 'SkillProof Executive Admin',
    passwordHashOrPlain: 'SkillProof2026!',
    role: 'recruiter',
  },
  'recruiter@skillproof.com': {
    name: 'Senior Technical Recruiter',
    passwordHashOrPlain: 'SkillProof2026!',
    role: 'recruiter',
  },
};

export const authService = {
  async getSession() {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Error fetching Supabase session:', error.message);
      return null;
    }
    return data.session;
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const localSession = localStorage.getItem('skillproof_admin_session');
    if (localSession) {
      try {
        return JSON.parse(localSession);
      } catch {
        // continue
      }
    }

    if (!isSupabaseConfigured) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Recruiter',
      role: user.user_metadata?.role || 'recruiter',
    };
  },

  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check official live admin accounts
    const liveAdmin = LIVE_ADMIN_ACCOUNTS[normalizedEmail];
    if (liveAdmin) {
      if (liveAdmin.passwordHashOrPlain === password) {
        const user: AuthUser = {
          id: `admin-${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
          email: normalizedEmail,
          name: liveAdmin.name,
          role: 'recruiter',
        };
        localStorage.setItem('skillproof_admin_session', JSON.stringify(user));
        return { user, error: null };
      } else {
        return { user: null, error: 'Credenciales inválidas. Verifique su contraseña corporativa.' };
      }
    }

    // 2. Check registered local administrators (signup without Supabase)
    const registeredAdminsJson = localStorage.getItem('skillproof_registered_admins');
    if (registeredAdminsJson) {
      try {
        const registeredAdmins: Array<{ email: string; password: string; name: string }> = JSON.parse(registeredAdminsJson);
        const match = registeredAdmins.find(a => a.email.toLowerCase() === normalizedEmail);
        if (match) {
          if (match.password === password) {
            const user: AuthUser = {
              id: `admin-${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
              email: normalizedEmail,
              name: match.name,
              role: 'recruiter',
            };
            localStorage.setItem('skillproof_admin_session', JSON.stringify(user));
            return { user, error: null };
          } else {
            return { user: null, error: 'Credenciales inválidas. Verifique su contraseña corporativa.' };
          }
        }
      } catch {
        // continue
      }
    }

    // 3. Supabase Auth if configured
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email || '',
        name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Recruiter',
        role: 'recruiter',
      };

      localStorage.setItem('skillproof_admin_session', JSON.stringify(user));
      return { user, error: null };
    }

    // Unrecognized user
    return {
      user: null,
      error: 'Usuario no reconocido. Utilice su usuario corporativo oficial (ej. admin@seu-usa.com).',
    };
  },

  async signUp(email: string, password: string, fullName: string = ''): Promise<{ user: AuthUser | null; error: string | null; requiresEmailConfirmation?: boolean }> {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured) {
      const registeredAdminsJson = localStorage.getItem('skillproof_registered_admins');
      let registeredAdmins: Array<{ email: string; password: string; name: string }> = [];
      if (registeredAdminsJson) {
        try {
          registeredAdmins = JSON.parse(registeredAdminsJson);
        } catch {
          registeredAdmins = [];
        }
      }

      const alreadyExists = registeredAdmins.some(a => a.email.toLowerCase() === normalizedEmail) || LIVE_ADMIN_ACCOUNTS[normalizedEmail];
      if (alreadyExists) {
        return { user: null, error: 'Este correo corporativo ya se encuentra registrado.' };
      }

      registeredAdmins.push({
        email: normalizedEmail,
        password,
        name: fullName || normalizedEmail.split('@')[0],
      });
      localStorage.setItem('skillproof_registered_admins', JSON.stringify(registeredAdmins));

      const mockUser: AuthUser = {
        id: `admin-${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
        email: normalizedEmail,
        name: fullName || normalizedEmail.split('@')[0],
        role: 'recruiter',
      };
      localStorage.setItem('skillproof_admin_session', JSON.stringify(mockUser));
      return { user: mockUser, error: null };
    }

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'recruiter',
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    if (data.user && !data.session) {
      return { user: null, error: null, requiresEmailConfirmation: true };
    }

    const user: AuthUser = {
      id: data.user?.id || 'admin-user',
      email: data.user?.email || '',
      name: fullName || data.user?.email?.split('@')[0] || 'Recruiter',
      role: 'recruiter',
    };

    localStorage.setItem('skillproof_admin_session', JSON.stringify(user));
    return { user, error: null };
  },

  async signOut(): Promise<void> {
    localStorage.removeItem('skillproof_admin_session');
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },
};
