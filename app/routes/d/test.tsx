import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/d/test')({
  beforeLoad: async () => {
    console.log('I RANA HER');
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/d/test"!</div>;
}
