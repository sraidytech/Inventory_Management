"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { passwordChangeSchema } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/components/language/language-provider";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

type FormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function PasswordForm() {
  const [loading, setLoading] = useState(false);
  const { language, isRTL } = useLanguage();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(language === "ar" ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
        form.reset();
      } else {
        const data = await response.json();
        toast.error(language === "ar" ? data.error || "فشل تغيير كلمة المرور" : data.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(language === "ar" ? "حدث خطأ أثناء تغيير كلمة المرور" : "An error occurred while changing password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {language === "ar" ? "تغيير كلمة المرور" : "Change Password"}
        </CardTitle>
        <CardDescription>
          {language === "ar" ? "قم بتغيير كلمة المرور الخاصة بك" : "Update your password"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "ar" ? "كلمة المرور الحالية" : "Current Password"}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder={language === "ar" ? "أدخل كلمة المرور الحالية" : "Enter current password"}
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-500`}
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "ar" ? "كلمة المرور الجديدة" : "New Password"}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder={language === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-500`}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FormDescription>
                    {language === "ar" ? "يجب أن تكون كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={language === "ar" ? "أدخل كلمة المرور مرة أخرى" : "Confirm your password"}
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-500`}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className={`flex ${isRTL ? 'justify-start' : 'justify-end'} px-0`}>
              <Button type="submit" disabled={loading}>
                {loading 
                  ? (language === "ar" ? "جاري التغيير..." : "Changing...") 
                  : (language === "ar" ? "تغيير كلمة المرور" : "Change Password")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
