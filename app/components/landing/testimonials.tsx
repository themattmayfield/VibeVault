import { Card, CardContent } from '@/components/ui/card';
import { QuoteIcon } from 'lucide-react';
import { APP_INFO } from '@/constants/app-info';
export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="w-full py-12 md:py-24 lg:py-32 bg-muted"
    >
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">
              Testimonials
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Trusted by Leading Institutions
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Hear from schools and healthcare facilities that have transformed
              their approach to emotional wellbeing.
            </p>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          <Card>
            <CardContent className="p-6">
              <QuoteIcon className="h-8 w-8 text-muted-foreground/50 mb-4" />
              <p className="mb-6">
                "{APP_INFO.name} has transformed how we support student mental
                health. We can now identify trends and provide targeted support
                where it's needed most."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="/placeholder.svg?height=60&width=60"
                  width={60}
                  height={60}
                  alt="Principal"
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">Dr. Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">
                    Principal, Westlake High School
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <QuoteIcon className="h-8 w-8 text-muted-foreground/50 mb-4" />
              <p className="mb-6">
                "The analytics provided by {APP_INFO.name} have been invaluable
                in measuring the effectiveness of our patient care initiatives
                and improving outcomes."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="/placeholder.svg?height=60&width=60"
                  width={60}
                  height={60}
                  alt="Director"
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">Dr. Michael Chen</p>
                  <p className="text-sm text-muted-foreground">
                    Director of Patient Experience, Memorial Hospital
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <QuoteIcon className="h-8 w-8 text-muted-foreground/50 mb-4" />
              <p className="mb-6">
                "Our therapists now have real-time insights into client
                wellbeing between sessions, allowing for more effective
                interventions and better outcomes."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="/placeholder.svg?height=60&width=60"
                  width={60}
                  height={60}
                  alt="Clinical Director"
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">Dr. Alicia Rodriguez</p>
                  <p className="text-sm text-muted-foreground">
                    Clinical Director, Centerpoint Mental Health
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <QuoteIcon className="h-8 w-8 text-muted-foreground/50 mb-4" />
              <p className="mb-6">
                "The implementation was seamless, and the support team has been
                exceptional. {APP_INFO.name} has become an essential tool for
                our school counseling program."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="/placeholder.svg?height=60&width=60"
                  width={60}
                  height={60}
                  alt="Counselor"
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">James Wilson</p>
                  <p className="text-sm text-muted-foreground">
                    Lead Counselor, Riverdale School District
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <QuoteIcon className="h-8 w-8 text-muted-foreground/50 mb-4" />
              <p className="mb-6">
                "{APP_INFO.name}'s group analytics have helped us identify
                departments with high stress levels, allowing us to implement
                targeted wellbeing programs."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="/placeholder.svg?height=60&width=60"
                  width={60}
                  height={60}
                  alt="HR Director"
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">Emily Patel</p>
                  <p className="text-sm text-muted-foreground">
                    HR Director, City General Hospital
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <QuoteIcon className="h-8 w-8 text-muted-foreground/50 mb-4" />
              <p className="mb-6">
                "The ROI on {APP_INFO.name} has been clear - reduced
                absenteeism, improved staff retention, and better overall
                wellbeing across our institution."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="/placeholder.svg?height=60&width=60"
                  width={60}
                  height={60}
                  alt="Superintendent"
                  className="rounded-full"
                />
                <div>
                  <p className="font-medium">Dr. Robert Thompson</p>
                  <p className="text-sm text-muted-foreground">
                    Superintendent, Oakridge Public Schools
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
