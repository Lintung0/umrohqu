"use client"

import { Check } from "lucide-react"

interface Step {
  id: string
  label: string
  icon?: React.ElementType
}

interface ProgressStepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export default function ProgressStepper({ steps, currentStep, className = "" }: ProgressStepperProps) {
  return (
    <div className={`flex items-center w-full ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                isCompleted
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : isActive
                    ? "bg-primary text-white ring-4 ring-primary/20 shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground"
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : <span>{index + 1}</span>}
              </div>
              <span className={`text-[10px] font-medium mt-1.5 whitespace-nowrap ${
                isActive ? "text-primary" : isCompleted ? "text-primary/70" : "text-muted-foreground"
              }`}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all duration-500 ${
                index < currentStep ? "bg-primary" : "bg-border"
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
