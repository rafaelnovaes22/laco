import { z } from 'zod';

const optionalText = z.string().trim().max(500).optional().transform((value) => value || undefined);

export const celebrationInputSchema = z.object({
  recipient: z.string().trim().min(1).max(80),
  relationship: z.string().trim().min(1).max(80),
  occasion: z.string().trim().min(1).max(100),
  celebrationDate: z.string().trim().max(10).optional().transform((value) => value || undefined),
  prompt: z.string().trim().min(30).max(4000),
  tone: z.string().trim().min(1).max(60),
  signature: z.string().trim().min(1).max(100),
  visualStyle: z.enum(['automatico', 'editorial', 'solar', 'jardim', 'oceano', 'noite']),
  musicLink: optionalText.refine((value) => !value || URL.canParse(value), 'Link da música inválido.'),
  coverPhotoIndex: z.coerce.number().int().min(0).default(0),
  consent: z.literal('on'),
});

export const themeSchema = z.enum(['editorial', 'solar', 'jardim', 'oceano', 'noite']);

export const celebrationCopySchema = z.object({
  kicker: z.string().min(1).max(100),
  headline: z.string().min(1).max(140),
  opening: z.string().min(1).max(320),
  messageTitle: z.string().min(1).max(120),
  paragraphs: z.array(z.string().min(1).max(900)).length(3),
  declaration: z.string().min(1).max(180),
  closing: z.string().min(1).max(240),
  theme: themeSchema,
});

export type CelebrationInput = z.infer<typeof celebrationInputSchema>;
export type CelebrationCopy = z.infer<typeof celebrationCopySchema>;

export interface StoredCelebration {
  id: string;
  slug: string;
  createdAt: string;
  recipient: string;
  relationship: string;
  occasion: string;
  celebrationDate?: string;
  signature: string;
  tone: string;
  copy: CelebrationCopy;
  photos: string[];
  audio?: string;
  musicLink?: string;
}
