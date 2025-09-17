import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define settings type
interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    signalAlerts: boolean;
    marketUpdates: boolean;
  };
  display: {
    currency: 'USD' | 'EUR' | 'GBP';
    timezone: string;
    language: 'en' | 'es' | 'fr' | 'de';
    chartType: 'candlestick' | 'line' | 'area';
  };
  trading: {
    defaultTimeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
    riskLevel: 'conservative' | 'moderate' | 'aggressive';
    autoRefresh: boolean;
    refreshInterval: number; // seconds
  };
}

// Default settings for new users
const defaultSettings: UserSettings = {
  theme: 'dark',
  notifications: {
    email: true,
    push: true,
    sms: false,
    signalAlerts: true,
    marketUpdates: true,
  },
  display: {
    currency: 'USD',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
    chartType: 'candlestick',
  },
  trading: {
    defaultTimeframe: '1h',
    riskLevel: 'moderate',
    autoRefresh: true,
    refreshInterval: 30,
  },
};

// GET /api/settings - Retrieve user settings
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch user settings from database
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no settings found, return default settings
      if (error.code === 'PGRST116') {
        console.log(`No settings found for user ${userId}, returning defaults`);
        return NextResponse.json({
          settings: defaultSettings,
          isDefault: true,
        });
      }

      console.error('Error fetching user settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      settings: data.settings || defaultSettings,
      isDefault: false,
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Upsert user settings
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    console.log(`Updated settings for user ${userId}`);

    return NextResponse.json({
      settings: data.settings,
      updated: true,
    });
  } catch (error) {
    console.error('Unexpected error in PUT /api/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to deep merge objects
function deepMerge(target: any, source: any): any {
  const output = Object.assign({}, target);
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target))
          Object.assign(output, { [key]: source[key] });
        else
          output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}