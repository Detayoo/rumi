'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Box, type BoxProps } from './Box';

export { useReducedMotion };

/**
 * MotionBox — Box with motion's animation props. the styling story is unchanged
 * (tokens + Box props); motion only adds initial/animate/variants/gestures.
 * client-only: motion's createMotionComponent cannot run on the server.
 */
export const MotionBox = motion(Box);

export type MotionBoxProps = BoxProps & React.ComponentProps<typeof MotionBox>;
