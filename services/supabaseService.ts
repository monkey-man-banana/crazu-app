import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const auth = {
  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signInWithOAuth: async (provider: 'google' | 'github') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin, // Redirect back to app after login
      }
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getUser: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },
  
  getSession: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Usage Tracking
  logAction: async (actionType: 'PDF_UPLOAD' | 'WEB_GEN' | 'FORMULA_GEN', meta?: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    await supabase.from('usage_logs').insert({
      user_id: user.id,
      action_type: actionType,
      meta_data: meta
    });
  },

  getDailyUsage: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString());
    
    return count || 0;
  },

  getUserStats: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { total: 0, streak: 0 };

    // Total Generated
    const { count: total } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Calculate Streak (Simplified: Distinct days in logs)
    // Note: True consecutive streak requires complex SQL or JS logic. 
    // For now, we'll return "Active Days" as a proxy or simple streak logic.
    // Let's do a simple JS calculation for now to save DB complexity.
    const { data: logs } = await supabase
      .from('usage_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    let streak = 0;
    if (logs && logs.length > 0) {
        const today = new Date().toDateString();
        const dates = Array.from(new Set(logs.map(l => new Date(l.created_at).toDateString())));
        
        // Check if active today or yesterday to maintain streak
        if (dates.includes(today)) {
            streak = 1;
            let current = new Date();
            while (true) {
                current.setDate(current.getDate() - 1);
                if (dates.includes(current.toDateString())) {
                    streak++;
                } else {
                    break;
                }
            }
        }
    }

    return { total: total || 0, streak };
  }
};
