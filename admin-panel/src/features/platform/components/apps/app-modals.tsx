import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { AlertTriangle, Loader2, Power } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { AppFormData } from './schema';
import type { CompiledApp } from '../../hooks/use-apps';

interface AppModalsProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  deleteConfirmation: { type: 'single' | 'bulk'; id?: string } | null;
  setDeleteConfirmation: (val: { type: 'single' | 'bulk'; id?: string } | null) => void;
  editingApp: CompiledApp | null;
  subjects?: { subject_id: string; title: string }[];
  form: UseFormReturn<AppFormData>;
  onSubmit: (data: AppFormData) => Promise<void>;
  isPending: boolean;
  selectedCount: number;
  confirmBulkDelete: () => Promise<void>;
  confirmSingleDelete: () => Promise<void>;
}

export function AppModals({
  isDialogOpen,
  setIsDialogOpen,
  deleteConfirmation,
  setDeleteConfirmation,
  editingApp,
  subjects,
  form,
  onSubmit,
  isPending,
  selectedCount,
  confirmBulkDelete,
  confirmSingleDelete,
}: AppModalsProps) {
  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-md">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="px-6 pt-6 pb-4 space-y-4">
                <div>
                  <DialogTitle className="text-base font-semibold text-gray-900">
                    {editingApp ? 'Edit' : 'Create'} Application
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 mt-0.5">
                    {editingApp
                      ? 'Update the application details below.'
                      : 'Fill in the details to create a new application.'}
                  </DialogDescription>
                </div>

                {/* DNS Notice */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-semibold">DNS required:</span> Map{' '}
                    <code className="font-mono bg-amber-100 px-1 rounded text-[11px]">
                      {form.watch('subdomain') || '...'}.questerix.com
                    </code>{' '}
                    to{' '}
                    <code className="font-mono bg-amber-100 px-1 rounded text-[11px]">
                      questerix-student.pages.dev
                    </code>{' '}
                    and add the subdomain as a Custom Domain in Cloudflare Pages.
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Display Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Mathematics G12"
                              {...field}
                              data-testid="app-display-name"
                              className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subdomain"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Subdomain
                          </FormLabel>
                          <div className="flex">
                            <FormControl>
                              <Input
                                placeholder="e.g. math-academy"
                                {...field}
                                disabled={Boolean(editingApp)}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .toLowerCase()
                                      .replace(/[^a-z0-9-]/g, '')
                                      .slice(0, 63)
                                  )
                                }
                                data-testid="app-subdomain"
                                className="h-9 rounded-l rounded-r-none border border-r-0 border-gray-300 bg-white text-gray-700 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none font-mono text-xs disabled:opacity-50 disabled:bg-gray-50"
                                required
                                pattern="[a-z0-9-]+"
                                title="Lowercase letters, numbers, and dashes only"
                              />
                            </FormControl>
                            <span className="h-9 px-2 flex items-center bg-gray-50 border border-gray-300 rounded-r text-[11px] text-gray-500">
                              .questerix.com
                            </span>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject_id"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-gray-700">Subject</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 rounded border border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-lg border border-gray-200 shadow-md">
                            {subjects?.map((s) => (
                              <SelectItem
                                key={s.subject_id}
                                value={s.subject_id}
                                className="text-sm"
                              >
                                {s.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="grade_level"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Grade Level
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Grade 12"
                              {...field}
                              data-testid="app-grade-level"
                              className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grade_number"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">
                            Grade Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 rounded bg-gray-50 border border-gray-200 space-y-0">
                        <div className="flex items-center gap-3">
                          <Power
                            className={cn(
                              'w-4 h-4',
                              field.value ? 'text-teal-600' : 'text-gray-300'
                            )}
                          />
                          <div>
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Active
                            </FormLabel>
                            <p className="text-[11px] text-gray-500 mt-0">
                              Make this app publicly available
                            </p>
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-teal-600"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-9 px-4 rounded text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Abort Changes
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  data-testid="app-submit-btn"
                  className="h-9 px-4 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingApp ? 'UPDATE CLUSTER' : 'AUTHORIZE DEPLOYMENT'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteConfirmation)}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
      >
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {deleteConfirmation?.type === 'bulk'
                ? `This will permanently delete ${selectedCount} applications. This will also delete their associated landing pages. This action cannot be undone.`
                : 'This will permanently delete this application and its associated landing page. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-9 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={
                deleteConfirmation?.type === 'bulk' ? confirmBulkDelete : confirmSingleDelete
              }
              className="h-9 text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
