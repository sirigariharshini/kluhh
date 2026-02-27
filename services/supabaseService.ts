import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fuhawgevwdjjnrwclvgg.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aGF3Z2V2d2Rqam5yd2NsdmdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3OTQzNzMsImV4cCI6MjA4NTM3MDM3M30.u6Aul286DY3Y4WLrdF7C5CokH00D3rHNnxUxNGnxXrk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface HealthReading {
    id?: number;
    bpm: number;
    spo2: number;
    timestamp: string;
    created_at?: string;
}

export interface Appointment {
    id?: string;
    date: string;
    time: string;
    doctorName: string;
    doctorSpecialty: string;
    reminderMinutes: number;
    notes?: string;
    status: 'upcoming' | 'completed' | 'cancelled';
    created_at?: string;
}

export const supabaseService = {
    /**
     * Fetch all health readings from Supabase
     */
    async fetchHealthReadings(limit: number = 50): Promise<HealthReading[]> {
        try {
            console.log('📊 Fetching health readings from Supabase...');

            const { data, error } = await supabase
                .from('health_readings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('❌ Supabase fetch error:', error.message);
                throw error;
            }

            console.log(`✅ Fetched ${data?.length || 0} health readings`);
            return data || [];
        } catch (error: any) {
            console.error('❌ Error fetching health readings:', error);
            return [];
        }
    },

    /**
     * Fetch latest health reading
     */
    async fetchLatestReading(): Promise<HealthReading | null> {
        try {
            const { data, error } = await supabase
                .from('health_readings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                console.error('❌ Error fetching latest reading:', error.message);
                return null;
            }

            return data || null;
        } catch (error: any) {
            console.error('❌ Error fetching latest reading:', error);
            return null;
        }
    },

    /**
     * Insert new health reading
     */
    async insertHealthReading(bpm: number, spo2: number): Promise<HealthReading | null> {
        try {
            console.log('📝 Inserting health reading...');

            const { data, error } = await supabase
                .from('health_readings')
                .insert([
                    {
                        bpm,
                        spo2,
                        timestamp: new Date().toISOString()
                    }
                ])
                .select();

            if (error) {
                console.error('❌ Supabase insert error:', error.message);
                throw error;
            }

            console.log('✅ Health reading inserted successfully');
            return data?.[0] || null;
        } catch (error: any) {
            console.error('❌ Error inserting health reading:', error);
            return null;
        }
    },

    /**
     * Subscribe to real-time updates
     */
    subscribeToHealthReadings(callback: (reading: HealthReading) => void) {
        try {
            console.log('🔄 Subscribing to health readings...');

            const subscription = supabase
                .from('health_readings')
                .on('*', (payload) => {
                    console.log('🔔 New health reading received:', payload);
                    if (payload.new) {
                        callback(payload.new as HealthReading);
                    }
                })
                .subscribe();

            return subscription;
        } catch (error: any) {
            console.error('❌ Error subscribing to readings:', error);
            return null;
        }
    },

    /**
     * Check Supabase connection
     */
    async checkConnection(): Promise<boolean> {
        try {
            console.log('🧪 Testing Supabase connection...');

            const { data, error } = await supabase
                .from('health_readings')
                .select('count')
                .limit(1);

            if (error) {
                console.error('❌ Supabase connection failed:', error.message);
                return false;
            }

            console.log('✅ Supabase connection successful');
            return true;
        } catch (error: any) {
            console.error('❌ Connection error:', error);
            return false;
        }
    },

    // ===== APPOINTMENT FUNCTIONS =====

    /**
     * Fetch all appointments
     */
    async getAppointments(): Promise<Appointment[]> {
        try {
            console.log('📅 Fetching appointments...');

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .order('date', { ascending: true });

            if (error) {
                console.error('❌ Error fetching appointments:', error.message);
                return [];
            }

            // Map snake_case from Supabase to camelCase for frontend
            const mapped = data?.map((item: any) => ({
                id: item.id,
                date: item.date,
                time: item.time,
                doctorName: item.doctor_name,
                doctorSpecialty: item.doctor_specialty,
                reminderMinutes: item.reminder_minutes,
                notes: item.notes,
                status: item.status,
                created_at: item.created_at
            })) || [];

            console.log(`✅ Fetched ${mapped.length} appointments`);
            return mapped;
        } catch (error: any) {
            console.error('❌ Error fetching appointments:', error);
            return [];
        }
    },

    /**
     * Add new appointment
     */
    async addAppointment(appointment: Appointment): Promise<Appointment | null> {
        try {
            console.log('📝 Adding appointment...');

            // Map camelCase to snake_case for Supabase
            const supabaseData = {
                date: appointment.date,
                time: appointment.time,
                doctor_name: appointment.doctorName,
                doctor_specialty: appointment.doctorSpecialty,
                reminder_minutes: appointment.reminderMinutes,
                notes: appointment.notes || '',
                status: appointment.status || 'upcoming'
            };

            console.log('📤 Sending to Supabase:', supabaseData);

            const { data, error } = await supabase
                .from('appointments')
                .insert([supabaseData])
                .select();

            if (error) {
                console.error('❌ Supabase Error:', {
                    message: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint
                });

                // Check for specific errors
                if (error.message.includes('new row violates row-level security policy')) {
                    throw new Error('❌ RLS Policy Error: Permission denied. Make sure RLS policy is enabled to allow INSERT.');
                }
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    throw new Error('❌ Table Error: "appointments" table not found in Supabase. Please run the SQL migration.');
                }
                if (error.message.includes('permission denied')) {
                    throw new Error('❌ Permission Error: Check Supabase API key permissions.');
                }

                throw new Error(error.message || 'Unknown error adding appointment');
            }

            console.log('✅ Appointment added successfully:', data);

            // Map response back to camelCase
            const mapped = data?.[0] ? {
                id: data[0].id,
                date: data[0].date,
                time: data[0].time,
                doctorName: data[0].doctor_name,
                doctorSpecialty: data[0].doctor_specialty,
                reminderMinutes: data[0].reminder_minutes,
                notes: data[0].notes,
                status: data[0].status,
                created_at: data[0].created_at
            } : null;

            return mapped;
        } catch (error: any) {
            console.error('❌ Error adding appointment:', error.message);
            throw error;
        }
    },

    /**
     * Delete appointment
     */
    async deleteAppointment(id: string): Promise<boolean> {
        try {
            console.log('🗑️ Deleting appointment...');

            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('❌ Error deleting appointment:', error.message);
                return false;
            }

            console.log('✅ Appointment deleted successfully');
            return true;
        } catch (error: any) {
            console.error('❌ Error deleting appointment:', error);
            return false;
        }
    },

    /**
     * Update appointment status
     */
    async updateAppointmentStatus(id: string, status: 'upcoming' | 'completed' | 'cancelled'): Promise<Appointment | null> {
        try {
            console.log('🔄 Updating appointment status...');

            const { data, error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', id)
                .select();

            if (error) {
                console.error('❌ Error updating appointment:', error.message);
                return null;
            }

            // Map response back to camelCase
            const mapped = data?.[0] ? {
                id: data[0].id,
                date: data[0].date,
                time: data[0].time,
                doctorName: data[0].doctor_name,
                doctorSpecialty: data[0].doctor_specialty,
                reminderMinutes: data[0].reminder_minutes,
                notes: data[0].notes,
                status: data[0].status,
                created_at: data[0].created_at
            } : null;

            console.log('✅ Appointment updated successfully');
            return mapped;
        } catch (error: any) {
            console.error('❌ Error updating appointment:', error);
            return null;
        }
    },

    /**
     * Get upcoming appointments
     */
    async getUpcomingAppointments(): Promise<Appointment[]> {
        try {
            const today = new Date().toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .gte('date', today)
                .eq('status', 'upcoming')
                .order('date', { ascending: true });

            if (error) {
                console.error('❌ Error fetching upcoming appointments:', error.message);
                return [];
            }

            // Map snake_case from Supabase to camelCase for frontend
            const mapped = data?.map((item: any) => ({
                id: item.id,
                date: item.date,
                time: item.time,
                doctorName: item.doctor_name,
                doctorSpecialty: item.doctor_specialty,
                reminderMinutes: item.reminder_minutes,
                notes: item.notes,
                status: item.status,
                created_at: item.created_at
            })) || [];

            return mapped;
        } catch (error: any) {
            console.error('❌ Error fetching upcoming appointments:', error);
            return [];
        }
    }

};
