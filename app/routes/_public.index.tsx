import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { PricingTable } from '@/components/landing/pricing-table';
import { Testimonials } from '@/components/landing/testimonials';
import { FAQ } from '@/components/landing/faq';
import { FeatureSection } from '@/components/landing/feature-section';
import { UseCaseSection } from '@/components/landing/use-case-section';
import { ContactForm } from '@/components/landing/contact-form';
import { APP_INFO } from '@/constants/app-info';

export const Route = createFileRoute('/_public/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-background fixed w-full z-50">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              MB
            </div>
            <span className="font-bold text-xl">{APP_INFO.name}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              hash="features"
              hashScrollIntoView={{
                behavior: 'smooth',
              }}
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Features
            </Link>
            <Link
              to="/"
              hash="use-cases"
              hashScrollIntoView={{
                behavior: 'smooth',
              }}
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Use Cases
            </Link>
            <Link
              to="/"
              hash="pricing"
              hashScrollIntoView={{
                behavior: 'smooth',
              }}
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Pricing
            </Link>
            <Link
              to="/"
              hash="testimonials"
              hashScrollIntoView={{
                behavior: 'smooth',
              }}
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              Testimonials
            </Link>
            <Link
              to="/"
              hash="faq"
              hashScrollIntoView={{
                behavior: 'smooth',
              }}
              className="text-sm font-medium text-muted-foreground hover:text-primary"
            >
              FAQ
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              hash="contact"
              hashScrollIntoView={{
                behavior: 'smooth',
              }}
            >
              <Button variant="outline">Request Demo</Button>
            </Link>
            <Link
              to="/join"
              hashScrollIntoView={{
                behavior: 'smooth',
              }}
            >
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                    Transform Emotional Wellbeing in Your Institution
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    {APP_INFO.name} helps schools and healthcare facilities
                    monitor, analyze, and improve mental health with real-time
                    mood tracking and powerful analytics.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link
                    to="/join"
                    hashScrollIntoView={{
                      behavior: 'smooth',
                    }}
                  >
                    <Button size="lg" className="px-8">
                      Get Started
                    </Button>
                  </Link>
                  <Link
                    to="/"
                    hash="contact"
                    hashScrollIntoView={{
                      behavior: 'smooth',
                    }}
                  >
                    <Button size="lg" variant="outline" className="px-8">
                      Request Demo
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>HIPAA Compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>FERPA Compliant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>GDPR Ready</span>
                  </div>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-xl" />
                <div className="relative bg-background rounded-lg border overflow-hidden shadow-xl">
                  <img
                    src="/placeholder.svg?height=600&width=800"
                    width={800}
                    height={600}
                    alt={`${APP_INFO.name} Dashboard`}
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="w-full py-12 md:py-16 lg:py-20 border-y bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
                  Trusted by Leading Institutions
                </h2>
                <p className="max-w-[700px] text-muted-foreground md:text-lg">
                  Join hundreds of schools, hospitals, and healthcare providers
                  using {APP_INFO.name} to support mental health.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="flex items-center justify-center">
                    <img
                      src={`/placeholder.svg?height=60&width=120&text=Logo ${i}`}
                      width={120}
                      height={60}
                      alt={`Partner ${i}`}
                      className="opacity-70 hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <FeatureSection />

        {/* Use Cases Section */}
        <UseCaseSection />

        {/* Pricing Section */}
        <PricingTable />

        {/* Testimonials Section */}
        <Testimonials />

        {/* FAQ Section */}
        <FAQ />

        {/* Contact Section */}
        <section
          id="contact"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted"
        >
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                    Ready to Get Started?
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Contact our sales team to schedule a personalized demo and
                    discuss how {APP_INFO.name} can benefit your institution.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Custom implementation support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Integration with existing systems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Dedicated account manager</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Staff training and onboarding</span>
                  </div>
                </div>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container flex flex-col gap-6 py-8 md:py-12 px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  {APP_INFO.name.charAt(0)}
                </div>
                <span className="font-bold text-xl">{APP_INFO.name}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Transforming emotional wellbeing monitoring for institutions.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Product</h3>
              <Link
                to="/"
                hash="features"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Features
              </Link>
              <Link
                to="/"
                hash="use-cases"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Use Cases
              </Link>
              <Link
                to="/"
                hash="pricing"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Resources</h3>
              <Link
                to="/"
                hash="documentation"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Documentation
              </Link>
              <Link
                to="/"
                hash="guides"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Guides
              </Link>
              <Link
                to="/"
                hash="support"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Support
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Company</h3>
              <Link
                to="/"
                hash="about"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                About
              </Link>
              <Link
                to="/"
                hash="blog"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Blog
              </Link>
              <Link
                to="/"
                hash="careers"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Careers
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Legal</h3>
              <Link
                to="/"
                hash="privacy"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                to="/"
                hash="terms"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                to="/"
                hash="compliance"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Compliance
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t pt-8">
            <p className="text-sm text-muted-foreground">
              © 2023 {APP_INFO.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                hash="linkedin"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link
                to="/"
                hash="facebook"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </Link>
              <Link
                to="/"
                hash="twitter"
                hashScrollIntoView={{
                  behavior: 'smooth',
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
              <Link
                to="/"
                className="text-muted-foreground hover:text-foreground"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
