import { z } from 'zod';

export const waitlistSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  type: z.enum(['member', 'owner']),
  interests: z.array(z.string()).min(1, 'Please select at least one interest'),
});

export type WaitlistInput = z.infer<typeof waitlistSchema>;


export const signUpSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }),
  lastName: z.string().min(1, { message: "Last name is required." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
  agree: z.boolean().refine(val => val === true, { message: "You must agree to the terms." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
export type SignUpInput = z.infer<typeof signUpSchema>;


export const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(1, { message: "Password is required." }),
});
export type SignInInput = z.infer<typeof signInSchema>;


export interface PricingCardData {
  title: string;
  subtitle: string;
  price: string;
  priceDescription: string;
  features: string[];
  gradient: string;
  subtitleColor: string;
}
