'use client';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Moon,
  Dumbbell,
  Users,
  Briefcase,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
} from 'lucide-react';

export type MoodContext = {
  sleepQuality?: 'poor' | 'fair' | 'good' | 'great';
  exercise?: boolean;
  socialInteraction?: 'none' | 'some' | 'lots';
  workload?: 'light' | 'normal' | 'heavy';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
};

interface MoodContextSelectorProps {
  context: MoodContext;
  onChange: (context: MoodContext) => void;
}

function PillButton({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted',
        className
      )}
    >
      {children}
    </button>
  );
}

export function MoodContextSelector({
  context,
  onChange,
}: MoodContextSelectorProps) {
  return (
    <div className="space-y-4">
      {/* Sleep Quality */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Moon className="h-3.5 w-3.5" />
          Sleep
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {(['poor', 'fair', 'good', 'great'] as const).map((quality) => (
            <PillButton
              key={quality}
              selected={context.sleepQuality === quality}
              onClick={() =>
                onChange({
                  ...context,
                  sleepQuality:
                    context.sleepQuality === quality ? undefined : quality,
                })
              }
            >
              {quality.charAt(0).toUpperCase() + quality.slice(1)}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Exercise */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Dumbbell className="h-3.5 w-3.5" />
          Exercise
        </Label>
        <div className="flex flex-wrap gap-1.5">
          <PillButton
            selected={context.exercise === true}
            onClick={() =>
              onChange({
                ...context,
                exercise: context.exercise === true ? undefined : true,
              })
            }
          >
            Yes
          </PillButton>
          <PillButton
            selected={context.exercise === false}
            onClick={() =>
              onChange({
                ...context,
                exercise: context.exercise === false ? undefined : false,
              })
            }
          >
            No
          </PillButton>
        </div>
      </div>

      {/* Social Interaction */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Social
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {(['none', 'some', 'lots'] as const).map((level) => (
            <PillButton
              key={level}
              selected={context.socialInteraction === level}
              onClick={() =>
                onChange({
                  ...context,
                  socialInteraction:
                    context.socialInteraction === level ? undefined : level,
                })
              }
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Workload */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          Workload
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {(['light', 'normal', 'heavy'] as const).map((load) => (
            <PillButton
              key={load}
              selected={context.workload === load}
              onClick={() =>
                onChange({
                  ...context,
                  workload: context.workload === load ? undefined : load,
                })
              }
            >
              {load.charAt(0).toUpperCase() + load.slice(1)}
            </PillButton>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-1.5">
          <Cloud className="h-3.5 w-3.5" />
          Weather
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: 'sunny' as const, icon: Sun, label: 'Sunny' },
            { value: 'cloudy' as const, icon: Cloud, label: 'Cloudy' },
            { value: 'rainy' as const, icon: CloudRain, label: 'Rainy' },
            { value: 'snowy' as const, icon: Snowflake, label: 'Snowy' },
          ].map(({ value, icon: Icon, label }) => (
            <PillButton
              key={value}
              selected={context.weather === value}
              onClick={() =>
                onChange({
                  ...context,
                  weather: context.weather === value ? undefined : value,
                })
              }
            >
              <Icon className="h-3 w-3" />
              {label}
            </PillButton>
          ))}
        </div>
      </div>
    </div>
  );
}
