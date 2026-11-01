import React, { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  StyleProp,
  Text,
  TextStyle,
} from "react-native";

interface AnimatedKpiValueProps {
  value: number | null;
  loading?: boolean;
  placeholder?: string;
  style: StyleProp<TextStyle>;
}

export default function AnimatedKpiValue({
  value,
  loading = value === null,
  placeholder = "…",
  style,
}: AnimatedKpiValueProps) {
  const [displayedValue, setDisplayedValue] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const displayedValueRef = useRef(0);
  const previousTargetRef = useRef<number | null>(null);
  const isLoading = loading || value === null;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        // Keep the default motion setting if the platform cannot report it.
      });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (isLoading || value === null) {
      const previousTarget = previousTargetRef.current;
      if (loading && previousTarget !== null) {
        displayedValueRef.current = previousTarget;
        setDisplayedValue(previousTarget);
      }
      return;
    }

    const previousTarget = previousTargetRef.current;
    const changed = previousTarget !== value;
    previousTargetRef.current = value;
    if (!changed) {
      if (reduceMotion && displayedValueRef.current !== value) {
        displayedValueRef.current = value;
        setDisplayedValue(value);
      }
      return;
    }

    const startValue = previousTarget === null ? 0 : displayedValueRef.current;
    if (reduceMotion || value === 0 || startValue === value) {
      displayedValueRef.current = value;
      setDisplayedValue(value);
      return;
    }

    let frame = 0;
    const startedAt = Date.now();
    const duration = 300;
    const animate = () => {
      const progress = Math.min((Date.now() - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = Math.round(
        startValue + (value - startValue) * easedProgress,
      );
      displayedValueRef.current = nextValue;
      setDisplayedValue(nextValue);
      if (progress < 1) frame = requestAnimationFrame(animate);
      else {
        displayedValueRef.current = value;
        setDisplayedValue(value);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isLoading, loading, reduceMotion, value]);

  return (
    <Text
      style={style}
      accessible={!isLoading && value !== null}
      accessibilityLabel={value === null ? placeholder : String(value)}
      accessibilityLiveRegion="none"
    >
      {isLoading || value === null ? placeholder : String(displayedValue)}
    </Text>
  );
}
