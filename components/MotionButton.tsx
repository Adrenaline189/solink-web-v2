// components/MotionButton.tsx
"use client";

import * as React from "react";
import { motion, type MotionProps } from "framer-motion";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & MotionProps;

export default function MotionButton({
  children,
  ...rest
}: Props) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
