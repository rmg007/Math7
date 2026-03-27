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
import { Loader2 } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { SubjectFormData } from './schema';
import type { Subject } from '../../hooks/use-subjects';

interface SubjectModalsProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  deleteConfirmation: { type: 'single' | 'bulk'; id?: string } | null;
  setDeleteConfirmation: (val: { type: 'single' | 'bulk'; id?: string } | null) => void;
  editingSubject: Subject | null;
  form: UseFormReturn<SubjectFormData>;
  onSubmit: (data: SubjectFormData) => Promise<void>;
  isPending: boolean;
  selectedCount: number;
  confirmBulkDelete: () => Promise<void>;
  confirmSingleDelete: () => Promise<void>;
}

export function SubjectModals({
  isDialogOpen,
  setIsDialogOpen,
  deleteConfirmation,
  setDeleteConfirmation,
  editingSubject,
  form,
  onSubmit,
  isPending,
  selectedCount,
  confirmBulkDelete,
  confirmSingleDelete,
}: SubjectModalsProps) {
  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-lg max-w-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="px-6 pt-6 pb-4 space-y-4">
                <div>
                  <DialogTitle className="text-base font-semibold text-gray-900">
                    {editingSubject ? 'Edit' : 'Create'} Subject
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-500 mt-0.5">
                    {editingSubject
                      ? 'Update the subject details below.'
                      : 'Fill in the details to create a new subject.'}
                  </DialogDescription>
                </div>

                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-gray-700">Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Mathematics"
                            {...field}
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
                    name="slug"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-gray-700">Slug</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. mathematics_g12"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                              )
                            }
                            className="h-9 rounded border border-gray-300 bg-white text-gray-700 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none font-mono text-xs"
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="color_hex"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">Color</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                placeholder="#0D9488"
                                {...field}
                                className="h-9 rounded border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm font-mono"
                              />
                            </FormControl>
                            <div
                              className="w-9 h-9 rounded border border-gray-200 shrink-0"
                              style={{ backgroundColor: field.value || '#0D9488' }}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="display_order"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-medium text-gray-700">Order</FormLabel>
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
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-medium text-gray-700">Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-9 rounded border border-gray-300 bg-white text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-600/20 focus-visible:outline-none text-sm">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-lg border border-gray-200 shadow-md">
                            <SelectItem value="draft" className="text-sm">
                              Draft
                            </SelectItem>
                            <SelectItem value="published" className="text-sm">
                              Published
                            </SelectItem>
                            <SelectItem value="live" className="text-sm">
                              Live
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-9 px-4 rounded bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
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
                ? `This will permanently delete ${selectedCount} subjects. This action cannot be undone.`
                : 'This will permanently delete this subject and its associated metadata. This action cannot be undone.'}
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
