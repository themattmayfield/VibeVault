import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [institutionType, setInstitutionType] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success('Message sent!', {
        description: 'A member of our team will contact you shortly.',
      });

      // Reset form
      setName('');
      setEmail('');
      setInstitution('');
      setInstitutionType('');
      setMessage('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-background p-6 rounded-lg border"
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@institution.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="institution">Institution Name</Label>
          <Input
            id="institution"
            placeholder="Your institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="institution-type">Institution Type</Label>
          <Select
            value={institutionType}
            onValueChange={setInstitutionType}
            required
          >
            <SelectTrigger id="institution-type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="k12">K-12 School</SelectItem>
              <SelectItem value="higher-ed">Higher Education</SelectItem>
              <SelectItem value="hospital">Hospital</SelectItem>
              <SelectItem value="clinic">Mental Health Clinic</SelectItem>
              <SelectItem value="healthcare">Healthcare System</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          placeholder="Tell us about your institution's needs..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[120px]"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Request Information'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By submitting this form, you agree to our privacy policy and terms of
        service.
      </p>
    </form>
  );
}
