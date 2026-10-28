import { z } from "zod";
export declare const reviewImagesSchema: z.ZodOptional<z.ZodArray<z.ZodString>>;
export declare const reviewCreateSchema: z.ZodObject<{
    productId: z.ZodNumber;
    rating: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const reviewUpdateSchema: z.ZodObject<{
    rating: z.ZodOptional<z.ZodNumber>;
    comment: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const reviewSchema: z.ZodObject<{
    id: z.ZodNumber;
    userId: z.ZodNumber;
    productId: z.ZodNumber;
    rating: z.ZodNumber;
    comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    images: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
export type ReviewOutput = z.infer<typeof reviewSchema>;
