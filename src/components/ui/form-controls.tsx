import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface Option {
  value: string
  label: string
  description?: string
}

interface FieldProps {
  label: string
  description?: string
  children: ReactNode
}

export function Field({ label, description, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-semibold text-stone-800">{label}</span>
      {description && <span className="block text-xs text-stone-500">{description}</span>}
      {children}
    </label>
  )
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'app-input h-10 px-3',
        className,
      )}
      {...props}
    />
  )
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'app-input min-h-32 resize-y px-3 py-2',
        className,
      )}
      {...props}
    />
  )
}

interface SelectInputProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
}

export function SelectInput({ value, onChange, options, placeholder = 'Select an option' }: SelectInputProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="app-input h-10 px-3"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

interface ChipGroupProps {
  options: Option[]
  value: string[]
  onChange: (value: string[]) => void
  single?: boolean
}

export function ChipGroup({ options, value, onChange, single }: ChipGroupProps) {
  const toggle = (next: string) => {
    if (single) {
      onChange(value.includes(next) ? [] : [next])
      return
    }

    onChange(value.includes(next) ? value.filter((item) => item !== next) : [...value, next])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              selected
                ? 'border-stone-800 bg-stone-800 text-white'
                : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-900',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

interface CardChoiceGroupProps {
  options: Option[]
  value: string | null
  onChange: (value: string) => void
  columns?: 'one' | 'two' | 'three'
}

const columnsClass = {
  one: 'grid-cols-1',
  two: 'sm:grid-cols-2',
  three: 'sm:grid-cols-3',
}

export function CardChoiceGroup({ options, value, onChange, columns = 'two' }: CardChoiceGroupProps) {
  return (
    <div className={cn('grid gap-3', columnsClass[columns])}>
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'app-card p-4 text-left transition-colors',
              selected ? 'border-stone-800 bg-stone-50 text-stone-900' : 'text-stone-500 hover:bg-stone-50',
            )}
          >
            <span className="block text-sm font-semibold text-stone-800">{option.label}</span>
            {option.description && <span className="mt-1 block text-xs leading-relaxed text-stone-500">{option.description}</span>}
          </button>
        )
      })}
    </div>
  )
}

interface RangeInputProps {
  value: number
  onChange: (value: number) => void
  leftLabel: string
  rightLabel: string
  min?: number
  max?: number
}

export function RangeInput({ value, onChange, leftLabel, rightLabel, min = 1, max = 5 }: RangeInputProps) {
  return (
    <div className="space-y-2">
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-stone-100
          [&::-webkit-slider-thumb]:size-5
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-stone-800"
      />
      <div className="flex justify-between text-xs text-stone-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}
