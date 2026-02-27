import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Bell, Trash2, Plus } from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

interface Appointment {
    id: string;
    date: string;
    time: string;
    doctorName: string;
    doctorSpecialty: string;
    reminderMinutes: number;
    notes?: string;
    status: 'upcoming' | 'completed' | 'cancelled';
}

const Calendar: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 28)); // Feb 28, 2026
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [upcomingReminders, setUpcomingReminders] = useState<Appointment[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        time: '10:00',
        doctorName: '',
        doctorSpecialty: 'General Checkup',
        reminderMinutes: 30,
        notes: ''
    });

    // Fetch appointments on mount
    useEffect(() => {
        fetchAppointments();
        const interval = setInterval(checkReminders, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    // Check for upcoming reminders
    const checkReminders = () => {
        const now = new Date();
        const upcoming = appointments.filter(apt => {
            const aptDateTime = new Date(`${apt.date}T${apt.time}`);
            const timeUntilApt = aptDateTime.getTime() - now.getTime();
            const reminderTime = apt.reminderMinutes * 60 * 1000;
            return timeUntilApt > 0 && timeUntilApt <= reminderTime && apt.status === 'upcoming';
        });
        setUpcomingReminders(upcoming);
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            console.log('📅 Fetching appointments from Supabase...');
            const data = await supabaseService.getAppointments();
            console.log('✅ Appointments loaded:', data);
            setAppointments(data || []);
        } catch (error) {
            console.error('❌ Error fetching appointments:', error);
            alert('Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDate || !formData.doctorName) {
            alert('Please fill all required fields');
            return;
        }

        try {
            const newAppointment = {
                date: selectedDate,
                time: formData.time,
                doctorName: formData.doctorName,
                doctorSpecialty: formData.doctorSpecialty,
                reminderMinutes: formData.reminderMinutes,
                notes: formData.notes,
                status: 'upcoming' as const
            };

            console.log('📤 Sending appointment to Supabase:', newAppointment);
            const result = await supabaseService.addAppointment(newAppointment);

            if (!result) {
                console.error('❌ Failed to save appointment - result is null');
                alert('❌ Failed to add appointment. Check browser console for details.');
                return;
            }

            console.log('✅ Appointment saved:', result);
            await fetchAppointments();

            setShowForm(false);
            setFormData({
                time: '10:00',
                doctorName: '',
                doctorSpecialty: 'General Checkup',
                reminderMinutes: 30,
                notes: ''
            });
            setSelectedDate(null);

            // Show success message
            alert('✅ Appointment added successfully!');
        } catch (error: any) {
            console.error('❌ ERROR:', error.message);
            alert(`❌ Error: ${error.message}`);
        }
    };

    const handleDeleteAppointment = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this appointment?')) {
            return;
        }

        try {
            console.log('🗑️ Deleting appointment:', id);
            const success = await supabaseService.deleteAppointment(id);

            if (!success) {
                alert('Failed to delete appointment');
                return;
            }

            console.log('✅ Appointment deleted');
            await fetchAppointments();
        } catch (error) {
            console.error('❌ Error deleting appointment:', error);
            alert('Failed to delete appointment');
        }
    };

    const getAppointmentsForDate = (date: string) => {
        return appointments.filter(apt => apt.date === date && apt.status === 'upcoming');
    };

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="bg-gray-50"></div>);
        }

        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `2026-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayAppointments = getAppointmentsForDate(dateStr);
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            days.push(
                <div
                    key={day}
                    onClick={() => {
                        setSelectedDate(dateStr);
                        setShowForm(true);
                    }}
                    className={`
            p-3 cursor-pointer border rounded-lg min-h-24 transition-all
            ${isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}
            ${isToday ? 'ring-2 ring-green-400' : ''}
          `}
                >
                    <div className="font-bold text-sm mb-1">{day}</div>
                    <div className="space-y-1">
                        {dayAppointments.map(apt => (
                            <div key={apt.id} className="text-xs bg-blue-50 p-1 rounded text-blue-700 truncate">
                                {apt.time} - {apt.doctorName}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr + 'T00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">🏥 Medical Appointments</h1>
                <p className="text-gray-600">Schedule and manage your doctor checkups</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Section */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                    {/* Month Navigation */}
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={prevMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h2>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center font-bold text-gray-600 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {renderCalendar()}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Upcoming Reminders */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center mb-4">
                            <Bell size={20} className="text-red-500 mr-2" />
                            <h3 className="text-lg font-bold text-gray-800">Upcoming Reminders</h3>
                        </div>
                        {upcomingReminders.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingReminders.map(reminder => (
                                    <div key={reminder.id} className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                                        <p className="font-semibold text-red-900">{reminder.doctorName}</p>
                                        <p className="text-sm text-red-700">
                                            {formatDate(reminder.date)} at {reminder.time}
                                        </p>
                                        <p className="text-xs text-red-600 mt-1">
                                            ⏰ In {reminder.reminderMinutes} minutes
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No upcoming reminders</p>
                        )}
                    </div>

                    {/* Quick Next Appointment */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Next Appointment</h3>
                        {appointments.length > 0 ? (
                            <div className="bg-green-50 p-4 rounded-lg">
                                {appointments
                                    .filter(apt => apt.status === 'upcoming')
                                    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
                                    .slice(0, 1)
                                    .map(apt => (
                                        <div key={apt.id}>
                                            <p className="font-semibold text-green-900">{apt.doctorName}</p>
                                            <p className="text-sm text-green-700">{apt.doctorSpecialty}</p>
                                            <p className="text-sm text-green-600 mt-2">{formatDate(apt.date)}</p>
                                            <p className="text-sm text-green-600 font-semibold">{apt.time}</p>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No upcoming appointments</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Appointment Form Modal */}
            {showForm && selectedDate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                            Add Appointment
                        </h2>
                        <p className="text-gray-600 mb-6">{formatDate(selectedDate)}</p>

                        <form onSubmit={handleAddAppointment} className="space-y-4">
                            {/* Time */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Clock size={16} className="inline mr-2" />
                                    Appointment Time
                                </label>
                                <input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Doctor Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Doctor Name *
                                </label>
                                <input
                                    type="text"
                                    placeholder="Dr. Smith"
                                    value={formData.doctorName}
                                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            {/* Specialty */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Specialty
                                </label>
                                <select
                                    value={formData.doctorSpecialty}
                                    onChange={(e) => setFormData({ ...formData, doctorSpecialty: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option>General Checkup</option>
                                    <option>Cardiology</option>
                                    <option>Dermatology</option>
                                    <option>Neurology</option>
                                    <option>Orthopedics</option>
                                    <option>Dentistry</option>
                                    <option>Other</option>
                                </select>
                            </div>

                            {/* Reminder */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    <Bell size={16} className="inline mr-2" />
                                    Remind me (minutes before)
                                </label>
                                <select
                                    value={formData.reminderMinutes}
                                    onChange={(e) => setFormData({ ...formData, reminderMinutes: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value={15}>15 minutes</option>
                                    <option value={30}>30 minutes</option>
                                    <option value={60}>1 hour</option>
                                    <option value={120}>2 hours</option>
                                    <option value={1440}>1 day</option>
                                </select>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notes (optional)
                                </label>
                                <textarea
                                    placeholder="Add any notes about the appointment..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
                                >
                                    Save Appointment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Appointments List */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-800">All Appointments</h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {appointments.length} total
                    </span>
                </div>

                {loading ? (
                    <p className="text-gray-500">Loading appointments...</p>
                ) : appointments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Doctor</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Specialty</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Date & Time</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Reminder</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map(apt => (
                                    <tr key={apt.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-semibold text-gray-800">{apt.doctorName}</td>
                                        <td className="py-3 px-4 text-gray-600">{apt.doctorSpecialty}</td>
                                        <td className="py-3 px-4 text-gray-600">
                                            {formatDate(apt.date)} at {apt.time}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600">{apt.reminderMinutes} min</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${apt.status === 'upcoming' ? 'bg-green-100 text-green-800' :
                                                apt.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {apt.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                onClick={() => handleDeleteAppointment(apt.id)}
                                                className="text-red-500 hover:text-red-700 transition"
                                                title="Delete appointment"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No appointments scheduled yet</p>
                )}
            </div>
        </div>
    );
};

export default Calendar;
