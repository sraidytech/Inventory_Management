"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
// Import toast from a UI library that's available in the project
// or create a simple toast function
const toast = {
  success: (message: string) => {
    console.log('Success:', message);
    // You can replace this with a proper toast implementation
    alert(message);
  },
  error: (message: string) => {
    console.error('Error:', message);
    // You can replace this with a proper toast implementation
    alert(message);
  }
};

// Define the form schema
const formSchema = z.object({
  language: z.enum(["en", "ar"]),
  theme: z.enum(["light", "dark"]),
  notifications: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsForm() {
  const [loading, setLoading] = useState(false);

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: "en",
      theme: "light",
      notifications: true,
    },
  });

  // Fetch user settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/user-settings");
        const data = await response.json();
        
        if (data) {
          form.reset({
            language: data.language || "en",
            theme: data.theme || "light",
            notifications: data.notifications !== undefined ? data.notifications : true,
          });
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    };

    fetchSettings();
  }, [form]);

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
        toast.success("Settings updated successfully");
        
        // Update theme in localStorage and document if it changed
        const currentTheme = localStorage.getItem("theme");
        if (currentTheme !== values.theme) {
          localStorage.setItem("theme", values.theme);
          document.documentElement.classList.toggle("dark", values.theme === "dark");
        }
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("An error occurred while updating settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>User Settings</CardTitle>
        <CardDescription>
          Manage your account settings and preferences.
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
                  <FormLabel>Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This will change the language of the application.
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
                  <FormLabel>Theme</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose between light and dark mode.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Notifications</FormLabel>
                    <FormDescription>
                      Receive notifications about stock alerts, payments, and system updates.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <CardFooter className="flex justify-end px-0">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
