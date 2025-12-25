'use client';

import { useState } from 'react';
import { Camera, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';

interface PostDailyReadDialogProps {
  groupId: string;
  onPosted?: () => void;
}

export function PostDailyReadDialog({ groupId, onPosted }: PostDailyReadDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    caption: '',
    pagesRead: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('You must be logged in to post');
        setLoading(false);
        return;
      }

      if (!imageFile) {
        setError('Please select an image');
        setLoading(false);
        return;
      }

      // Upload image first
      const uploadFormData = new FormData();
      uploadFormData.append('file', imageFile);

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { imageUrl } = await uploadResponse.json();

      // Create daily read
      const response = await fetch('/api/daily-reads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          groupId,
          imageUrl,
          caption: formData.caption || null,
          pagesRead: formData.pagesRead ? parseInt(formData.pagesRead) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to post');
        setLoading(false);
        return;
      }

      // Success!
      setFormData({ caption: '', pagesRead: '' });
      setImageFile(null);
      setImagePreview('');
      setOpen(false);
      
      if (onPosted) {
        onPosted();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Camera size={20} className="mr-2" />
          Post Today's Read
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Reading</DialogTitle>
          <DialogDescription>
            Post a photo of what you're reading today
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">Photo *</Label>
            {imagePreview ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="mx-auto mb-2 text-muted-foreground" size={32} />
                <label htmlFor="image" className="cursor-pointer">
                  <span className="text-sm text-primary hover:underline">
                    Click to upload
                  </span>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption (optional)</Label>
            <Textarea
              id="caption"
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="What are you reading today?"
              rows={2}
            />
          </div>

          {/* Pages Read */}
          <div className="space-y-2">
            <Label htmlFor="pagesRead">Pages Read (optional)</Label>
            <Input
              id="pagesRead"
              type="number"
              min="1"
              value={formData.pagesRead}
              onChange={(e) => setFormData({ ...formData, pagesRead: e.target.value })}
              placeholder="25"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}