/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: 'mood-board',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'us-east-1',
          profile: 'agape-media-dev',
        },
        cloudflare: '6.1.1',
      },
    };
  },
  async run() {
    new sst.aws.TanStackStart('MyWeb');
  },
});
