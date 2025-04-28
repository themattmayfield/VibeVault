import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APP_INFO } from '@/constants/app-info';

export function UseCaseSection() {
  return (
    <section id="use-cases" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-background px-3 py-1 text-sm">
              Use Cases
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              How Institutions Use {APP_INFO.name}
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              See how schools, hospitals, and healthcare facilities are
              improving mental health support with {APP_INFO.name}.
            </p>
          </div>
        </div>

        <div className="mt-12">
          <Tabs defaultValue="schools" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="schools">Schools</TabsTrigger>
                <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
                <TabsTrigger value="clinics">Mental Health Clinics</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="schools" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">
                    Supporting Student Wellbeing
                  </h3>
                  <p className="text-muted-foreground">
                    Schools use {APP_INFO.name} to monitor student emotional
                    health, identify trends, and provide timely support to those
                    who need it most.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>
                        <span className="font-medium">
                          Classroom Mood Tracking:
                        </span>{' '}
                        Teachers monitor class emotional climate to adjust
                        teaching approaches.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>
                        <span className="font-medium">
                          Counselor Dashboard:
                        </span>{' '}
                        School counselors identify students who may need
                        additional support.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>
                        <span className="font-medium">
                          Program Effectiveness:
                        </span>{' '}
                        Administrators measure the impact of wellbeing
                        initiatives and interventions.
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur-xl" />
                  <div className="relative bg-background rounded-lg border overflow-hidden shadow-lg">
                    <img
                      src="/placeholder.svg?height=400&width=600&text=School+Dashboard"
                      width={600}
                      height={400}
                      alt="School Dashboard Example"
                      className="w-full aspect-[3/2] object-cover"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="hospitals" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Enhancing Patient Care</h3>
                  <p className="text-muted-foreground">
                    Hospitals implement {APP_INFO.name} to track patient
                    emotional wellbeing during treatment, improving care quality
                    and patient outcomes.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>
                        <span className="font-medium">Patient Monitoring:</span>{' '}
                        Track emotional wellbeing throughout treatment and
                        recovery.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>
                        <span className="font-medium">Staff Wellbeing:</span>{' '}
                        Monitor healthcare worker burnout and stress levels.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>
                        <span className="font-medium">
                          Department Analytics:
                        </span>{' '}
                        Compare emotional wellbeing across hospital units to
                        optimize care.
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur-xl" />
                  <div className="relative bg-background rounded-lg border overflow-hidden shadow-lg">
                    <img
                      src="/placeholder.svg?height=400&width=600&text=Hospital+Dashboard"
                      width={600}
                      height={400}
                      alt="Hospital Dashboard Example"
                      className="w-full aspect-[3/2] object-cover"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="clinics" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">
                    Improving Treatment Outcomes
                  </h3>
                  <p className="text-muted-foreground">
                    Mental health clinics use {APP_INFO.name} to track client
                    progress, adjust treatment plans, and demonstrate
                    effectiveness.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>
                        <span className="font-medium">Treatment Tracking:</span>{' '}
                        Monitor client progress between sessions to inform care.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>
                        <span className="font-medium">Crisis Prevention:</span>{' '}
                        Identify concerning patterns early to enable timely
                        intervention.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="rounded-full bg-primary/10 p-1 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </div>
                      <span>
                        <span className="font-medium">Outcome Reporting:</span>{' '}
                        Generate reports for insurance and quality improvement
                        initiatives.
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg blur-xl" />
                  <div className="relative bg-background rounded-lg border overflow-hidden shadow-lg">
                    <img
                      src="/placeholder.svg?height=400&width=600&text=Clinic+Dashboard"
                      width={600}
                      height={400}
                      alt="Clinic Dashboard Example"
                      className="w-full aspect-[3/2] object-cover"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
