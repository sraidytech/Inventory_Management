"use client";

import { SettingsForm } from "@/components/settings/settings-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Bell, Lock, Shield } from "lucide-react";
import { TranslatedText } from "@/components/language/translated-text";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <TranslatedText namespace="settings" id="title" />
        </h1>
        <p className="text-muted-foreground mt-2">
          <TranslatedText namespace="settings" id="description" />
        </p>
      </div>

      <Tabs value="general" onValueChange={(value) => console.log(`Tab changed to ${value}`)} className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            <span><TranslatedText namespace="settings" id="account" /></span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span><TranslatedText namespace="settings" id="notifications" /></span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span><TranslatedText namespace="settings" id="security" /></span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span><TranslatedText namespace="settings" id="about" /></span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <SettingsForm />
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle><TranslatedText namespace="settings" id="notifications" /></CardTitle>
              <CardDescription>
                <TranslatedText namespace="settings" id="notificationsDescription" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <TranslatedText namespace="settings" id="notificationsDescription" />
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle><TranslatedText namespace="settings" id="security" /></CardTitle>
              <CardDescription>
                <TranslatedText namespace="settings" id="security" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <TranslatedText namespace="settings" id="security" />
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle><TranslatedText namespace="settings" id="about" /></CardTitle>
              <CardDescription>
                <TranslatedText namespace="settings" id="about" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <TranslatedText namespace="settings" id="about" />
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
