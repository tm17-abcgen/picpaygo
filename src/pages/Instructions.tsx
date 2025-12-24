import { Layout } from '@/components/layout/Layout';
import { SEO } from '@/components/seo/SEO';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Upload, Palette, Sparkles, Download, Camera, Sun, User, Circle } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload your photo',
    description: 'Choose a clear photo of yourself. JPG, PNG, or WebP formats work best.',
  },
  {
    icon: Palette,
    title: 'Choose a style',
    description: 'Select from Portraits, Editorial, or Documentary styles for your transformation.',
  },
  {
    icon: Sparkles,
    title: 'Generate',
    description: 'Our AI creates your professional portrait in seconds. Each generation costs 1 credit.',
  },
  {
    icon: Download,
    title: 'Download',
    description: 'Login to download your high-quality portrait. Use it anywhere you need a professional image.',
  },
];

const tips = [
  {
    icon: Camera,
    title: 'Good lighting',
    description: 'Natural daylight or even indoor lighting works best. Avoid harsh shadows on your face.',
  },
  {
    icon: Sun,
    title: 'Neutral background',
    description: 'A simple, uncluttered background helps the AI focus on you.',
  },
  {
    icon: User,
    title: 'Face the camera',
    description: 'Look directly at the camera with your face clearly visible. Slight angles are fine.',
  },
  {
    icon: Circle,
    title: 'Remove accessories',
    description: 'Take off hats, sunglasses, or anything that covers your face for best results.',
  },
];

export default function Instructions() {
  return (
    <Layout fullPage>
      <SEO
        title="How It Works - AI Portrait Instructions"
        description="Learn how to get the best results from our AI portrait generator with these simple tips and instructions."
      />
      
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            How It Works
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Create stunning professional portraits in four simple steps.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-16">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="flex gap-4 p-4 rounded-lg bg-secondary/50"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <step.icon className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tips section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">
            Tips for Best Results
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {tips.map((tip) => (
              <div
                key={tip.title}
                className="p-4 rounded-lg border border-border"
              >
                <div className="flex items-center gap-2 mb-2">
                  <tip.icon className="h-4 w-4 text-accent" />
                  <h3 className="font-medium text-foreground">{tip.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/generate">
            <Button size="lg">
              <Sparkles className="h-4 w-4 mr-2" />
              Start Generating
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
