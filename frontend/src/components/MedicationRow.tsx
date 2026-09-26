import { useState } from 'react'
import type { DoseEvent, Medication } from '../types'
import Badge from './Badge'
import { speakReminder, speakMedicationCard } from '../utils/speech'

export function TimelineRow({
  event,
  med,
  onMark,
  onShowAdvice,
}: {
  event: DoseEvent
  med: Medication
  onMark: (status: DoseEvent['status']) => void
  onShowAdvice?: (doseId: string, medName: string) => void
}) {
  const isTaken = event.status === 'Taken'
  const isMissed = event.status === 'Missed'

  return (
    <div className="flex items-center justify-between py-4 border-b border-line last:border-b-0 hover:bg-teal-50/40 transition-colors px-3 rounded-xl">
      <div className="w-[90px] text-base font-bold text-teal-900 flex items-center gap-2">
        <span>{event.time}</span>
        <button
          className="text-base hover:scale-110 transition-transform p-1 rounded-full hover:bg-teal-100 text-teal-800"
          title="Listen in Hindi"
          onClick={() => speakReminder(med.name, event.time, med.food, 'hi')}
        >
          🔊
        </button>
      </div>

      <div className="flex-1 ml-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-lg font-bold text-teal-950">{med.name}</span>
          <span className="text-sm font-semibold px-2.5 py-0.5 rounded-md bg-gray-100 text-slate-800">
            {med.strength}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
            {med.food}
          </span>
        </div>
        <div className="text-sm text-slate-600 mt-0.5">
          {med.dose} · {med.doctor || 'Doctor Prescribed'}
        </div>
      </div>

      <Badge status={event.status} />

      <div className="flex gap-2 ml-4">
        <button
          className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
            isTaken
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
          onClick={() => onMark('Taken')}
        >
          {isTaken ? 'Taken' : 'Mark taken'}
        </button>
        <button
          className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
            isMissed
              ? 'border-amber-500 bg-amber-100 text-amber-950 shadow-sm'
              : 'border-gray-300 hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => {
            onMark('Missed')
            if (onShowAdvice) {
              onShowAdvice(event.id, med.name)
            }
          }}
        >
          {isMissed ? 'Missed (Advice)' : 'Missed'}
        </button>
      </div>
    </div>
  )
}

export function MedicationCard({
  med,
  onEdit,
  onPause,
  onDiscontinue,
  onAdjustDose,
  onRemove,
}: {
  med: Medication
  onEdit: () => void
  onPause: () => void
  onDiscontinue: () => void
  onAdjustDose?: () => void
  onRemove?: () => void
}) {
  const [showClinicalDetails, setShowClinicalDetails] = useState(false)
  const isPaused = med.status === 'Paused'
  const isDiscontinued = med.status === 'Discontinued'

  const handleAskAssistant = () => {
    window.dispatchEvent(
      new CustomEvent('open-ai-assistant', {
        detail: {
          query: `Tell me about ${med.name} (${med.strength}). What is its use case, recommended food timing, and what side effects should I watch for?`,
        },
      })
    )
  }

  return (
    <div
      className={`border-2 rounded-3xl p-6 mb-5 transition-all shadow-sm ${
        isPaused
          ? 'bg-amber-50/40 border-amber-300'
          : isDiscontinued
          ? 'bg-gray-50 border-gray-300 opacity-80'
          : 'bg-white border-teal-200 hover:border-teal-400 hover:shadow-md'
      }`}
    >
      {/* Top Bar: Category, Food Timing, Voice Button, and Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-teal-100 text-teal-800">
            {med.type || 'Prescription'}
          </span>
          {med.food && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
              {med.food}
            </span>
          )}
          {med.doctor && (
            <span className="text-xs font-medium text-gray-500">
              Prescribed by {med.doctor}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Senior Voice Reading Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-sm transition-all shadow-sm"
            onClick={() => speakMedicationCard(med, 'hi')}
            title="Listen to medicine details in Hindi"
          >
            <span>🔊</span>
            <span>Suniye (Listen)</span>
          </button>

          {/* Status Badge */}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
              med.status === 'Active'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : med.status === 'Paused'
                ? 'bg-amber-200 text-amber-950 border border-amber-400'
                : 'bg-slate-200 text-slate-700 border border-slate-300'
            }`}
          >
            {med.status}
          </span>
        </div>
      </div>

      {/* Main Details Section: Large Typography for Senior Readability */}
      <div className="mt-4 flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-950 tracking-tight">
              {med.name}
            </h3>
            <span className="text-xl font-bold text-teal-700 px-3 py-0.5 rounded-lg bg-teal-50 border border-teal-200">
              {med.strength}
            </span>
          </div>

          <div className="text-base sm:text-lg text-slate-800 font-medium mt-2 flex flex-wrap items-center gap-3">
            <span className="font-bold text-teal-900">Time: {med.timing}</span>
            <span>·</span>
            <span>{med.dose}</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">{med.frequency}</span>
          </div>

          {/* Paused or Discontinued Reason Banner */}
          {isPaused && (
            <div className="mt-3 p-3 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-950 text-sm font-semibold">
              Temporarily Paused{med.pauseReason ? `: ${med.pauseReason}` : '. Caregiver alerted.'}
            </div>
          )}

          {isDiscontinued && (
            <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-sm font-semibold">
              Discontinued{med.discontinueReason ? `: ${med.discontinueReason}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* Visual Pill & Packet Identification */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-gray-100">
        <div className="p-3.5 rounded-2xl bg-teal-50/50 border border-teal-200/80">
          <div className="text-xs font-bold text-teal-900 uppercase tracking-wide">
            Pill Appearance (Pehchan)
          </div>
          <div className="text-sm font-semibold text-slate-800 mt-1">
            {med.pillAppearance || 'Standard round white tablet'}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Packet / Strip Packaging
          </div>
          <div className="text-sm font-semibold text-slate-800 mt-1">
            {med.packetAppearance || 'Standard blister pack'}
          </div>
        </div>
      </div>

      {/* KNOWN CLINICAL DETAILS: Use Case, Food Tips & Side Effects */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-sm font-bold text-teal-800 hover:text-teal-950 flex items-center gap-1.5"
            onClick={() => setShowClinicalDetails(!showClinicalDetails)}
          >
            <span>{showClinicalDetails ? 'Hide' : 'Show'} Side Effects, Food Tips & Use Case</span>
            <span className="text-xs">{showClinicalDetails ? '▲' : '▼'}</span>
          </button>

          <button
            type="button"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 transition-colors"
            onClick={handleAskAssistant}
          >
            Ask AI Assistant About This
          </button>
        </div>

        {showClinicalDetails && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-sm">
            <div>
              <strong className="text-slate-900 font-bold block">Why It Was Prescribed:</strong>
              <span className="text-slate-700">
                {med.useCase || 'Chronic therapy prescribed by physician for disease management.'}
              </span>
            </div>

            <div>
              <strong className="text-slate-900 font-bold block">Food & Nutrition Guidance:</strong>
              <span className="text-slate-700">
                {med.foodTips || (med.food ? `Take ${med.food.toLowerCase()} with a full glass of water.` : 'Take as directed with water.')}
              </span>
            </div>

            <div>
              <strong className="text-slate-900 font-bold block">Known Common Side-Effects:</strong>
              <span className="text-slate-700">
                {med.sideEffects || 'Usually well-tolerated. Contact doctor if unusual symptoms occur.'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 font-medium">
          Started: {med.start || '2026-01-10'} {med.end ? `· Ends: ${med.end}` : ''}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onAdjustDose && (
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl text-sm font-bold bg-teal-50 hover:bg-teal-100 border border-teal-300 text-teal-900 transition-colors"
              onClick={onAdjustDose}
            >
              Adjust Dose
            </button>
          )}

          <button
            type="button"
            className="px-3.5 py-2 rounded-xl text-sm font-bold bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 transition-colors"
            onClick={onEdit}
          >
            Edit
          </button>

          <button
            type="button"
            className={`px-3.5 py-2 rounded-xl text-sm font-bold border transition-colors ${
              isPaused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
            }`}
            onClick={onPause}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          {!isDiscontinued && (
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl text-sm font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
              onClick={onDiscontinue}
            >
              Discontinue
            </button>
          )}

          {onRemove && (
            <button
              type="button"
              className="px-3 py-2 rounded-xl text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 border border-gray-200 transition-colors"
              onClick={onRemove}
              title="Remove medication"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
