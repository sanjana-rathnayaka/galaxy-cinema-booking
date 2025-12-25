import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface StepIndicatorProps {
  currentStep: number;
  steps: string[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="relative flex justify-between w-full max-w-2xl mx-auto mb-12">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 -z-10" />
      <div 
        className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 -z-10 transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      />
      
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
            <motion.div
              initial={false}
              animate={{
                scale: isActive ? 1.1 : 1,
                backgroundColor: isActive || isCompleted ? '#2563EB' : '#FFFFFF',
                borderColor: isActive || isCompleted ? '#2563EB' : '#E5E7EB',
                color: isActive || isCompleted ? '#FFFFFF' : '#9CA3AF',
              }}
              className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-colors duration-300",
                isActive && "ring-4 ring-blue-100"
              )}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
            </motion.div>
            <span className={cn(
              "text-xs font-medium absolute top-12 whitespace-nowrap",
              isActive ? "text-blue-600" : "text-gray-500"
            )}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}