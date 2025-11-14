import { z } from 'zod';

export const formSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100),
    description: z.string().min(20, "Description must be at least 20 characters").max(500),
    category: z.string().min(3, "Category must be at least 3 characters").max(20),
    link: z.string().url("Please provide a valid URL"),
    pitch: z.string().min(10, "Pitch must be at least 10 characters")
});