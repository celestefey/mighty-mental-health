'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Calendar, 
  Video, 
  Phone, 
  Lock, 
  ShieldCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { MMHService } from '@/lib/types';

// Zod Validation Schema
const bookingSchema = z.object({
  clientName: z.string().min(2, 'Full name must be at least 2 characters'),
  clientEmail: z.string().email('Please enter a valid email address'),
  clientPhone: z.string().min(8, 'Please enter a valid Australian phone number'),
  clientNotes: z.string().optional(),
  // Hidden metadata tracking fields for Antigravity automated workflows
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  client_ref_id: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface ValidatedBookingFormProps {
  selectedService: MMHService;
  selectedDate: string;
  selectedTime: string;
  selectedModality: 'video' | 'phone';
  selectedTimezone: string;
  onSuccess: (bookingData: any) => void;
  onCancel: () => void;
}

export function ValidatedBookingForm({
  selectedService,
  selectedDate,
  selectedTime,
  selectedModality,
  selectedTimezone,
  onSuccess,
  onCancel,
}: ValidatedBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientNotes: '',
      utm_source: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') || 'website' : 'website',
      utm_medium: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_medium') || 'booking_grid' : 'booking_grid',
      utm_campaign: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_campaign') || 'mmh_telehealth' : 'mmh_telehealth',
      client_ref_id: 'ref_' + Math.random().toString(36).substring(2, 9),
    },
  });

  const onSubmit = async (values: BookingFormValues) => {
    setIsSubmitting(true);
    const roomId = 'mmh-' + Math.random().toString(36).substring(2, 9);
    const scheduledDateTime = new Date(`${selectedDate} ${selectedTime}`).toISOString();

    // 1. Store in Supabase
    const { data, error } = await supabase
      .from('mmh_appointments')
      .insert({
        client_name: values.clientName,
        client_email: values.clientEmail,
        client_phone: values.clientPhone,
        service_id: selectedService.id,
        scheduled_at: scheduledDateTime,
        duration_minutes: selectedService.duration_minutes,
        modality: selectedModality,
        status: 'confirmed',
        telehealth_room_id: roomId,
        notes: values.clientNotes,
      })
      .select()
      .single();

    // 2. Fire Antigravity marketing automation webhook with metadata tracking
    try {
      await fetch('/api/webhooks/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment_id: data?.id || 'demo-' + roomId,
          client_name: values.clientName,
          client_email: values.clientEmail,
          service_title: selectedService.title,
          scheduled_at: scheduledDateTime,
          modality: selectedModality,
          telehealth_room_id: roomId,
          metadata: {
            utm_source: values.utm_source,
            utm_medium: values.utm_medium,
            utm_campaign: values.utm_campaign,
            client_ref_id: values.client_ref_id,
            workflow_id: 'agy_telehealth_onboarding_v1',
          },
        }),
      });
    } catch (err) {
      // Non-blocking webhook logging
      console.warn('Webhook logging note:', err);
    }

    setIsSubmitting(false);
    onSuccess(data || {
      id: 'mmh-demo-app',
      client_name: values.clientName,
      client_email: values.clientEmail,
      scheduled_at: scheduledDateTime,
      telehealth_room_id: roomId,
      modality: selectedModality,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h3 className="font-extrabold text-xl text-[#130C76]">Client Details</h3>
          <p className="text-xs text-gray-500">
            {selectedService.title} • {selectedDate} @ {selectedTime}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer"
        >
          &times;
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="default">{selectedService.duration_minutes} Mins</Badge>
        <Badge variant="navy">{selectedModality === 'video' ? 'Telehealth Video' : 'Phone'}</Badge>
        <Badge variant="outline">{selectedTimezone.split('/')[1]}</Badge>
      </div>

      {/* Hidden Antigravity Metadata Fields */}
      <input type="hidden" {...register('utm_source')} />
      <input type="hidden" {...register('utm_medium')} />
      <input type="hidden" {...register('utm_campaign')} />
      <input type="hidden" {...register('client_ref_id')} />

      {/* Full Name */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
          Full Name *
        </label>
        <Input
          {...register('clientName')}
          placeholder="e.g. Alex Morgan"
        />
        {errors.clientName && (
          <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.clientName.message}</p>
        )}
      </div>

      {/* Email Address */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
          Email Address *
        </label>
        <Input
          type="email"
          {...register('clientEmail')}
          placeholder="alex@example.com"
        />
        {errors.clientEmail && (
          <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.clientEmail.message}</p>
        )}
        <p className="text-[11px] text-gray-400 mt-1">
          Booking confirmation, invoice, and encrypted video link will be sent here.
        </p>
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
          Australian Contact Number *
        </label>
        <Input
          type="tel"
          {...register('clientPhone')}
          placeholder="0400 000 000"
        />
        {errors.clientPhone && (
          <p className="text-[11px] text-red-600 font-semibold mt-1">{errors.clientPhone.message}</p>
        )}
      </div>

      {/* Client Notes */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
          Focus Areas or Notes for Luke (Optional)
        </label>
        <textarea
          rows={3}
          {...register('clientNotes')}
          placeholder="Share your goals, somatic symptoms, or specific questions..."
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-hidden focus:border-[#F96100]"
        ></textarea>
      </div>

      {/* Summary Box */}
      <div className="bg-gray-50 p-4 rounded-2xl text-xs text-gray-600 border border-gray-200 space-y-1">
        <div className="flex justify-between font-bold text-gray-800">
          <span>Consultation Fee:</span>
          <span>${(selectedService.price_cents / 100).toFixed(2)} AUD</span>
        </div>
        <p className="text-[11px] text-gray-400 flex items-center gap-1">
          <Lock className="w-3 h-3 text-green-600" /> No charge today. Invoiced upon session completion via Stripe.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        variant="default"
        size="lg"
        className="w-full"
      >
        {isSubmitting ? 'Securing Timeslot...' : 'Complete Reservation'}
      </Button>
    </form>
  );
}
