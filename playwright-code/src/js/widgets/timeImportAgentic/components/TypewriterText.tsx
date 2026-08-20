import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

const CursorSpan = styled.span`
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: currentColor;
  margin-left: 1px;
  animation: ${blink} 0.7s step-end infinite;
  vertical-align: text-bottom;
`;

export interface TypewriterTextProps {
  /** Full text to reveal character by character */
  text: string;
  /** Delay between characters in ms. Default 30. */
  speed?: number;
  /** Delay before starting in ms. Default 0. */
  delay?: number;
  /** Optional callback when typing completes */
  onComplete?: () => void;
  /** Component to wrap the visible text (e.g. span, B2). Default: span */
  as?: React.ElementType;
  /** Props passed to the wrapper (e.g. style, className) */
  wrapperProps?: Record<string, any>;
  /** Show blinking cursor at end while typing. Default true. */
  cursor?: boolean;
}

/**
 * Reveals text with a typewriter effect. Used for chat-style UI.
 */
const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 30,
  delay = 0,
  onComplete,
  as: Wrapper = 'span',
  wrapperProps = {},
  cursor = true,
}) => {
  const [visibleLength, setVisibleLength] = useState(0);
  const [hasStarted, setHasStarted] = useState(delay <= 0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setVisibleLength(0);
    setHasStarted(delay <= 0);
  }, [text, delay]);

  useEffect(() => {
    if (!hasStarted) {
      const t = setTimeout(() => setHasStarted(true), delay);
      return () => clearTimeout(t);
    }
    if (visibleLength >= text.length) {
      onCompleteRef.current?.();
      return undefined;
    }
    const timer = setTimeout(() => {
      setVisibleLength((n) => Math.min(n + 1, text.length));
    }, speed);
    return () => clearTimeout(timer);
  }, [hasStarted, visibleLength, text.length, speed, delay]);

  const visible = text.slice(0, visibleLength);
  const isComplete = visibleLength >= text.length;

  return (
    <Wrapper {...wrapperProps}>
      {visible}
      {cursor && !isComplete && <CursorSpan aria-hidden />}
    </Wrapper>
  );
};

export default TypewriterText;
