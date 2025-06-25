"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SnsLinksForm } from "./SnsLinksForm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ja } from "date-fns/locale";
import { DateSelect } from "@/components/ui/date-select";
import { Label } from "@/components/ui/label";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "名前を入力してください"),
  lastName: z.string().min(1, "苗字を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  gender: z.enum(["male", "female", "other"]).optional(),
  dateOfBirth: z.date().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

type SnsLinks = {
  facebook: string;
  instagram: string;
  linkedin: string;
};

interface ProfileFormProps {
  clerkId: string;
}

export function ProfileForm({ clerkId }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [snsLinks, setSnsLinks] = useState<SnsLinks>({
    facebook: "",
    instagram: "",
    linkedin: "",
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      gender: undefined,
      dateOfBirth: undefined,
    },
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch(`/api/users/${clerkId}/profile`);
        if (!response.ok) {
          throw new Error("プロフィールの取得に失敗しました");
        }
        const data = await response.json();
        
        form.reset({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          gender: data.gender || undefined,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        });

        if (data.snsLinks) {
          setSnsLinks({
            facebook: data.snsLinks.facebook || "",
            linkedin: data.snsLinks.linkedin || "",
            instagram: data.snsLinks.instagram || "",
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("プロフィールの読み込みに失敗しました");
      }
    }

    fetchProfile();
  }, [clerkId, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users/${clerkId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          snsLinks,
        }),
      });

      if (!response.ok) {
        throw new Error("プロフィールの更新に失敗しました");
      }

      toast.success("プロフィールを更新しました");
    } catch (error) {
      console.error(error);
      toast.error("プロフィールの更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>苗字</FormLabel>
                  <FormControl>
                    <Input placeholder="山田" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名前</FormLabel>
                  <FormControl>
                    <Input placeholder="太郎" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>メールアドレス</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="example@example.com" {...field} disabled />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>性別</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="性別を選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">男性</SelectItem>
                      <SelectItem value="female">女性</SelectItem>
                      <SelectItem value="other">選択しない</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>生年月日</FormLabel>
                  <FormControl>
                    <DateSelect
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-6">
          <SnsLinksForm snsLinks={snsLinks} setSnsLinks={setSnsLinks} />
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "更新中..." : "更新する"}
        </Button>
      </form>
    </Form>
  );
} 