import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BarChart3, Shield, Users, LineChart, Clock, Zap } from 'lucide-react';
import { APP_INFO } from '@/constants/app-info';
export function FeatureSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              Features
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Comprehensive Tools for Institutional Wellbeing
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              {APP_INFO.name} provides powerful features designed specifically
              for schools, hospitals, and healthcare facilities.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          <Card>
            <CardHeader className="pb-2">
              <BarChart3 className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Advanced Analytics</CardTitle>
              <CardDescription>
                Gain insights into emotional wellbeing trends across your entire
                institution or specific departments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Customizable dashboards</li>
                <li>Trend analysis and reporting</li>
                <li>Export data for research</li>
                <li>Comparative benchmarking</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Privacy & Compliance</CardTitle>
              <CardDescription>
                Built with institutional requirements in mind, ensuring data
                security and regulatory compliance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>HIPAA & FERPA compliant</li>
                <li>Role-based access controls</li>
                <li>Anonymized reporting options</li>
                <li>Secure data encryption</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Users className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Group Management</CardTitle>
              <CardDescription>
                Organize users into departments, classrooms, or care units for
                targeted monitoring and support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Hierarchical group structure</li>
                <li>Bulk user management</li>
                <li>Custom permission settings</li>
                <li>Group-specific analytics</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <LineChart className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Early Intervention</CardTitle>
              <CardDescription>
                Identify concerning patterns early with customizable alerts and
                intervention workflows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Custom alert thresholds</li>
                <li>Notification system</li>
                <li>Intervention tracking</li>
                <li>Follow-up reminders</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Clock className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Longitudinal Tracking</CardTitle>
              <CardDescription>
                Monitor emotional wellbeing over time to measure the
                effectiveness of programs and interventions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>Historical data analysis</li>
                <li>Progress reporting</li>
                <li>Outcome measurement</li>
                <li>Program effectiveness metrics</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Zap className="h-6 w-6 text-primary mb-2" />
              <CardTitle>Integration Capabilities</CardTitle>
              <CardDescription>
                Seamlessly connect with your existing systems for a unified
                institutional approach.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>SSO authentication</li>
                <li>API access</li>
                <li>LMS/EHR integration</li>
                <li>Custom data connectors</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
