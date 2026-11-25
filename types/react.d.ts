import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { JudoMotion, JudoMotionAttributes } from './index.js';
export * from './index.js';

type Props = DetailedHTMLProps<HTMLAttributes<JudoMotion>, JudoMotion> & JudoMotionAttributes;
declare module 'react' { namespace JSX { interface IntrinsicElements { 'judo-motion': Props } } }
