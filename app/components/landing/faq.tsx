import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { APP_INFO } from '@/constants/app-info';

export function FAQ() {
  return (
    <section id="faq" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              FAQ
            </div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Common questions about implementing {APP_INFO.name} at your
              institution.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl mt-12">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                How long does implementation typically take?
              </AccordionTrigger>
              <AccordionContent>
                Implementation time varies based on institution size and
                complexity. Small institutions can be up and running in 2-4
                weeks, while larger organizations typically take 4-8 weeks. Our
                implementation team will work with you to create a customized
                timeline and ensure a smooth rollout.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>
                Is {APP_INFO.name} compliant with privacy regulations?
              </AccordionTrigger>
              <AccordionContent>
                Yes, {APP_INFO.name} is fully compliant with HIPAA, FERPA, and
                GDPR regulations. We implement robust security measures
                including end-to-end encryption, role-based access controls, and
                regular security audits. We provide all necessary documentation
                for your compliance records.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>
                Can {APP_INFO.name} integrate with our existing systems?
              </AccordionTrigger>
              <AccordionContent>
                {APP_INFO.name} offers integration capabilities with most major
                Learning Management Systems (LMS), Electronic Health Record
                (EHR) systems, and Single Sign-On (SSO) providers. Our API
                allows for custom integrations, and our team can work with your
                IT department to ensure seamless connectivity.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>
                What kind of training and support do you provide?
              </AccordionTrigger>
              <AccordionContent>
                All plans include comprehensive training for administrators and
                end users. We offer live virtual training sessions, on-demand
                video tutorials, and detailed documentation. Our support team is
                available via email for all plans, with phone and priority
                support for higher tiers. Enterprise plans include on-site
                training and a dedicated account manager.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>
                How do you ensure user adoption?
              </AccordionTrigger>
              <AccordionContent>
                We've designed {APP_INFO.name} with user experience as a
                priority, making it intuitive and engaging. Our implementation
                process includes adoption strategies tailored to your
                institution, such as launch campaigns, incentive programs, and
                regular engagement activities. We also provide adoption
                analytics to help you track and improve usage over time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>
                Can we customize the platform for our specific needs?
              </AccordionTrigger>
              <AccordionContent>
                Yes, {APP_INFO.name} offers various customization options. You
                can configure mood tracking parameters, create custom groups and
                hierarchies, design tailored dashboards, and set up
                institution-specific reporting. Enterprise plans include more
                extensive customization capabilities and custom development
                options.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>
                What ROI can we expect from implementing {APP_INFO.name}?
              </AccordionTrigger>
              <AccordionContent>
                Institutions typically see ROI in several areas: reduced
                absenteeism, improved retention rates, enhanced intervention
                effectiveness, and better resource allocation. Our analytics
                tools help you measure these improvements. On average, clients
                report a 15-20% improvement in early intervention rates and a
                10-15% reduction in absenteeism related to mental health issues.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}
