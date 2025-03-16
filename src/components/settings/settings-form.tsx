"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { userSettingsFormSchema } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme/theme-provider";
import { useLanguage } from "@/components/language/language-provider";
import { TranslatedText } from "@/components/language/translated-text";
import { toast } from "sonner";

type FormValues = {
  language: "en" | "ar";
  theme: "light" | "dark";
};

export function SettingsForm() {
  const [loading, setLoading] = useState(false);
  const { theme, setTheme: setGlobalTheme } = useTheme();
  const { language, setLanguage: setGlobalLanguage } = useLanguage();

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(userSettingsFormSchema),
    defaultValues: {
      language: "en",
      theme: "light",
    },
  });

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user-settings");
        const data = await response.json();
        
        if (data) {
          // Use the global states as defaults if available
          form.reset({
            language: data.language || language,
            theme: data.theme || theme,
          });
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    };

    fetchSettings();
  }, [form, theme, language]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/user-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast.success(language === "ar" ? "تم تحديث الإعدادات بنجاح" : "Settings updated successfully");
        
        // Update global states if they changed
        if (values.theme !== theme) {
          setGlobalTheme(values.theme);
        }
        
        if (values.language !== language) {
          setGlobalLanguage(values.language);
        }
      } else {
        toast.error(language === "ar" ? "فشل تحديث الإعدادات" : "Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(language === "ar" ? "حدث خطأ أثناء تحديث الإعدادات" : "An error occurred while updating settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle><TranslatedText namespace="settings" id="title" /></CardTitle>
        <CardDescription>
          {language === "ar" ? "إدارة إعدادات التطبيق والتفضيلات الشخصية" : "Manage application settings and personal preferences"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel><TranslatedText namespace="common" id="language" /></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                      <SelectValue placeholder={<TranslatedText namespace="settings" id="language" />} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en"><TranslatedText namespace="common" id="english" /></SelectItem>
                      <SelectItem value="ar"><TranslatedText namespace="common" id="arabic" /></SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <TranslatedText namespace="settings" id="languageDescription" />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel><TranslatedText namespace="common" id="theme" /></FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                      <SelectValue placeholder={<TranslatedText namespace="common" id="theme" />} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light"><TranslatedText namespace="common" id="light" /></SelectItem>
                      <SelectItem value="dark"><TranslatedText namespace="common" id="dark" /></SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    <TranslatedText namespace="settings" id="themeDescription" />
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


            <CardFooter className="flex justify-end px-0">
              <Button type="submit" disabled={loading}>
                {loading ? <TranslatedText namespace="settings" id="savingChanges" /> : <TranslatedText namespace="settings" id="saveChanges" />}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
