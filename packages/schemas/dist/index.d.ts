import { z } from "zod";
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodOptional<z.ZodEnum<{
        pembeli: "pembeli";
        penjual: "penjual";
    }>>;
}, z.core.$strip>;
export declare const clientRegistrationSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phoneNumber: z.ZodString;
    password: z.ZodString;
    passwordConfirm: z.ZodString;
    termsAccepted: z.ZodBoolean;
    honeypot: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    startedAt: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const clientRegistrationVerifySchema: z.ZodObject<{
    verificationId: z.ZodString;
    otpCode: z.ZodString;
}, z.core.$strip>;
export declare const clientRegistrationResendSchema: z.ZodObject<{
    verificationId: z.ZodString;
}, z.core.$strip>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    honeypot: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    startedAt: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    passwordConfirm: z.ZodString;
    honeypot: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    startedAt: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const adminStaffSignupSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phoneNumber: z.ZodString;
    password: z.ZodString;
    passwordConfirm: z.ZodString;
    honeypot: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    startedAt: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const adminResendVerificationSchema: z.ZodObject<{
    email: z.ZodString;
    honeypot: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    startedAt: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const adminForgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    honeypot: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    startedAt: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const adminResetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    passwordConfirm: z.ZodString;
    honeypot: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    startedAt: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const loginAdminSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const forgotPasswordAdminSchema: z.ZodObject<{
    email: z.ZodString;
}, z.core.$strip>;
export declare const resetPasswordAdminSchema: z.ZodObject<{
    password: z.ZodString;
    token: z.ZodString;
}, z.core.$strip>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
    description: z.ZodString;
    stock: z.ZodNumber;
    categoryId: z.ZodNumber;
    images: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const createOrderItemSchema: z.ZodObject<{
    productId: z.ZodNumber;
    qty: z.ZodNumber;
}, z.core.$strip>;
export declare const createOrderSchema: z.ZodObject<{
    customer: z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodString;
        address: z.ZodString;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    paymentMethod: z.ZodEnum<{
        COD: "COD";
        STRIPE: "STRIPE";
    }>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodNumber;
        qty: z.ZodNumber;
    }, z.core.$strip>>;
    couponCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ClientRegistrationInput = z.infer<typeof clientRegistrationSchema>;
export type ClientRegistrationVerifyInput = z.infer<typeof clientRegistrationVerifySchema>;
export type ClientRegistrationResendInput = z.infer<typeof clientRegistrationResendSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type AdminStaffSignupInput = z.infer<typeof adminStaffSignupSchema>;
export type AdminResendVerificationInput = z.infer<typeof adminResendVerificationSchema>;
export type AdminForgotPasswordInput = z.infer<typeof adminForgotPasswordSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
export type LoginAdminInput = z.infer<typeof loginAdminSchema>;
export type ForgotPasswordAdminInput = z.infer<typeof forgotPasswordAdminSchema>;
export type ResetPasswordAdminInput = z.infer<typeof resetPasswordAdminSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export * from "./reviews.js";
