import { App } from 'cdk8s';
import { HelloKubernetes } from './charts/hello-kubernetes.chart';
import { CloudflareCertificateIssuer } from './charts/cloudflare-certificate-issuer.chart';
import { MetalLbConfig } from './charts/metallb-config.chart';

export const appFactory = (app: App) => {
    let chart = 'metal-lb-config';
    let namespace = 'kube-system';

    new MetalLbConfig(app, chart, {
        namespace,
        labels: {
            chart,
        },
        addresses: [process.env.ADDRESS!],
    });

    chart = 'certificate-issuer';
    namespace = 'cert-manager';

    const { clusterIssuer } = new CloudflareCertificateIssuer(app, chart, {
        namespace,
        labels: {
            chart,
        },
        cloudflare: {
            apiTokenSecretRef: {
                name: 'cloudflare',
                key: 'cloudflare_api_token',
            },
        },
        environment: 'staging',
    });

    chart = 'hello-kubernetes';
    namespace = 'default';

    /* istanbul ignore next */
    const host = process.env.DOMAIN ? `test.${process.env.DOMAIN}` : undefined;

    new HelloKubernetes(app, chart, {
        namespace,
        labels: {
            chart,
        },
        clusterIssuer,
        host,
    });
};

const app = new App();

appFactory(app);

app.synth();
