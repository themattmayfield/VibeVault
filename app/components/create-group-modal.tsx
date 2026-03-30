'use client';

import type React from 'react';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
}

export function CreateGroupModal({
  isOpen,
  onClose,
  organizationId,
}: CreateGroupModalProps) {
  const createGroup = useMutation(api.groups.createGroup);
  const generateUploadUrl = useMutation(api.groups.generateUploadUrl);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrivacy('private');
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Group name required');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload image to Convex storage if provided
      let imageStorageId: any;
      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': imageFile.type },
          body: imageFile,
        });
        const { storageId } = await result.json();
        imageStorageId = storageId;
      }

      await createGroup({
        name,
        description,
        isPrivate: privacy === 'private',
        image: imageStorageId,
        organizationId,
      });
      onClose();

      toast.success(`Your group "${name}" has been created successfully.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create group'
      );
    } finally {
      resetForm();
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a group to share and track moods with others. You'll be the
              group owner.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="group-image" className="text-center">
                Group Image
              </Label>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Group"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <Input
                    id="group-image"
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Click to upload an image
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Group Name*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter group name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group about?"
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Privacy</Label>
              <RadioGroup
                value={privacy}
                onValueChange={setPrivacy}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private" className="font-normal">
                    Private - Only invited members can join and see content
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public" className="font-normal">
                    Public - Anyone can find and join this group
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
