import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { submitContactForm } from '@/services/api';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Missing fields', { description: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);
    try {
      await submitContactForm({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      });
      setSubmitted(true);
      toast.success('Message sent', { description: 'We\'ll get back to you as soon as possible.' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again later.';
      toast.error('Failed to send', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <SEO title="Contact Us" description="Get in touch with us" />
        <div className="max-w-md mx-auto py-12 px-4 text-center">
          <div className="p-8 rounded-2xl border border-border/60 bg-background/80">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Message Sent!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for reaching out. We'll get back to you as soon as possible.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline">
              Send Another Message
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO title="Contact Us" description="Get in touch with us" />

      <div className="max-w-md mx-auto py-8 px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 text-center">
          Contact Us
        </h1>
        <p className="text-muted-foreground text-center mb-8">
          Have a question or feedback? We'd love to hear from you.
        </p>

        <div className="p-6 rounded-2xl border border-border/60 bg-background/80">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-foreground mb-1 block">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground mb-1 block">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="subject" className="text-sm font-medium text-foreground mb-1 block">
                Subject
              </label>
              <Input
                id="subject"
                type="text"
                placeholder="What is this about?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-medium text-foreground mb-1 block">
                Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="message"
                placeholder="Your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                required
                rows={5}
                className="resize-none"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
