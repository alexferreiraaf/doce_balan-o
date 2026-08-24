'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input, PhoneInput } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/app/lib/hooks/use-settings';
import Loading from '@/app/(admin)/loading-component';
import { Textarea } from '../ui/textarea';
import type { DayOfWeek } from '@/app/lib/types';
import { Switch } from '../ui/switch';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { useUser } from '@/firebase';
import Image from 'next/image';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const openingHoursSchema = z.object({
  enabled: z.boolean(),
  open: z.string(),
  close: z.string(),
});

const settingsFormSchema = z.object({
  pixKey: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  coverImageUrl: z.string().optional(),
  coverImageFile: z.any().optional(),
  logoUrl: z.string().optional(),
  logoFile: z.any().optional(),
  openingHours: z.object({
    sunday: openingHoursSchema,
    monday: openingHoursSchema,
    tuesday: openingHoursSchema,
    wednesday: openingHoursSchema,
    thursday: openingHoursSchema,
    friday: openingHoursSchema,
    saturday: openingHoursSchema,
  }).optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const weekDays: { key: DayOfWeek, label: string }[] = [
    { key: 'sunday', label: 'Domingo' },
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
];

export function SettingsClient() {
  const { user } = useUser();
  const storage = getStorage();
  const { settings, loading, updateSettings, isUpdating } = useSettings();
  const { toast } = useToast();
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    values: {
      pixKey: settings?.pixKey || '',
      address: settings?.address || '',
      phone: settings?.phone || '',
      coverImageUrl: settings?.coverImageUrl || '',
      logoUrl: settings?.logoUrl || '',
      openingHours: settings?.openingHours || {
        sunday: { enabled: true, open: '09:00', close: '18:00' },
        monday: { enabled: true, open: '09:00', close: '18:00' },
        tuesday: { enabled: true, open: '09:00', close: '18:00' },
        wednesday: { enabled: true, open: '09:00', close: '18:00' },
        thursday: { enabled: true, open: '09:00', close: '18:00' },
        friday: { enabled: true, open: '09:00', close: '18:00' },
        saturday: { enabled: true, open: '10:00', close: '20:00' },
      }
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    form.setValue('coverImageFile', file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };
  
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    form.setValue('logoFile', file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    } else {
      setLogoPreview(null);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    form.setValue('coverImageFile', null);
    form.setValue('coverImageUrl', '');
    const fileInput = document.getElementById('cover-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const clearLogo = () => {
    setLogoPreview(null);
    form.setValue('logoFile', null);
    form.setValue('logoUrl', '');
    const fileInput = document.getElementById('logo-file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const onSubmit = async (data: SettingsFormValues) => {
    let finalCoverUrl = data.coverImageUrl;
    let finalLogoUrl = data.logoUrl;
    
    if ((data.coverImageFile || data.logoFile) && user) {
      setIsUploading(true);
      try {
        if (data.coverImageFile) {
            const file = data.coverImageFile as File;
            const base64 = await fileToBase64(file);
            const imageStorageRef = storageRef(storage, `settings/${user.uid}/cover_${Date.now()}_${file.name}`);
            await uploadString(imageStorageRef, base64, 'data_url');
            finalCoverUrl = await getDownloadURL(imageStorageRef);
        }
        if (data.logoFile) {
            const file = data.logoFile as File;
            const base64 = await fileToBase64(file);
            const imageStorageRef = storageRef(storage, `settings/${user.uid}/logo_${Date.now()}_${file.name}`);
            await uploadString(imageStorageRef, base64, 'data_url');
            finalLogoUrl = await getDownloadURL(imageStorageRef);
        }
      } catch (err) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao fazer upload da imagem.' });
        setIsUploading(false);
        return;
      }
    }

    const { coverImageFile, logoFile, ...cleanData } = data;
    await updateSettings({ ...cleanData, coverImageUrl: finalCoverUrl, logoUrl: finalLogoUrl });
    setIsUploading(false);
    toast({
      title: 'Configurações salvas!',
      description: 'Suas alterações foram salvas com sucesso.',
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-3">
        <Settings className="w-8 h-8" />
        Configurações da Loja
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Loja</CardTitle>
              <CardDescription>
                Gerencie as informações públicas e de pagamento da sua loja.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="pixKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave PIX</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite sua chave PIX (celular, e-mail, CPF/CNPJ ou aleatória)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone / WhatsApp</FormLabel>
                    <FormControl>
                      <PhoneInput
                        placeholder="(XX) 9XXXX-XXXX"
                        {...field}
                        onValueChange={(value) => field.onChange(value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço da Loja</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Seu endereço completo para retirada de produtos"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoFile"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Logomarca da Loja (Quadrada)</FormLabel>
                    <FormControl>
                      <Input 
                        id="logo-file-upload"
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleLogoChange}
                        {...rest} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {(logoPreview || form.watch('logoUrl')) && (
                <div className="mt-2 relative w-32 h-32 md:w-40 md:h-40">
                    <Image 
                      src={logoPreview || form.watch('logoUrl') || ''} 
                      alt="Pré-visualização da Logomarca" 
                      fill
                      style={{ objectFit: 'contain' }}
                      className="rounded-md bg-white border" 
                    />
                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={clearLogo}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
              )}

              <FormField
                control={form.control}
                name="coverImageFile"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>Imagem de Capa da Loja</FormLabel>
                    <FormControl>
                      <Input 
                        id="cover-file-upload"
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleFileChange}
                        {...rest} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {(imagePreview || form.watch('coverImageUrl')) && (
                <div className="mt-4 relative w-full h-32 md:h-48">
                    <Image 
                      src={imagePreview || form.watch('coverImageUrl') || ''} 
                      alt="Pré-visualização da Capa" 
                      fill
                      style={{ objectFit: 'cover' }}
                      className="rounded-md" 
                    />
                    <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={clearImage}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>
                Defina os dias e horários em que sua loja aceita pedidos online.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weekDays.map(day => {
                const isDayEnabled = form.watch(`openingHours.${day.key}.enabled`);
                return (
                  <div key={day.key} className="grid grid-cols-3 items-center gap-4 p-3 rounded-md bg-muted/50">
                    <FormField
                      control={form.control}
                      name={`openingHours.${day.key}.enabled`}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-4 col-span-3 sm:col-span-1">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className={!isDayEnabled ? 'text-muted-foreground' : ''}>{day.label}</FormLabel>
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center gap-2 col-span-3 sm:col-span-2">
                       <FormField
                          control={form.control}
                          name={`openingHours.${day.key}.open`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input type="time" {...field} disabled={!isDayEnabled} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                         <span className={!isDayEnabled ? 'text-muted-foreground' : ''}>até</span>
                        <FormField
                          control={form.control}
                          name={`openingHours.${day.key}.close`}
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormControl>
                                <Input type="time" {...field} disabled={!isDayEnabled} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
