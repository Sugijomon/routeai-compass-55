import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
  tooltip?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isLoading = false,
  tooltip,
  trend,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          <span className="flex-1">{title}</span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-9 w-16 mb-1" />
            {subtitle && <Skeleton className="h-4 w-24" />}
          </>
        ) : (
          <>
            <span className={cn("text-3xl font-bold", valueClassName)}>
              {value}
            </span>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && (
              <p
                className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  trend.value >= 0 ? "text-success" : "text-destructive"
                )}
              >
                <span>{trend.value >= 0 ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground">{trend.label}</span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
