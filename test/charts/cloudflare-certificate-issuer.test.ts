import { App } from 'cdk8s';
import { CloudflareCertificateIssuer } from '../../src/charts/cloudflare-certificate-issuer.chart';

const chart = 'cloudflare-certificate-issuer';

describe(chart, () => {
    test('Snapshot test', () => {
        const app = new App();

        const manifest = new CloudflareCertificateIssuer(app, chart, {
            namespace: 'cert-manager',
            labels: {
                chart,
            },
            environment: 'staging',
            cloudflare: {
                apiTokenSecretRef: {
                    name: 'apiTokenSecretRefName',
                    key: 'apiTokenSecretRefKey',
                },
                email: 'email',
            },
        });

        expect(manifest.toJson()).toMatchSnapshot();
    });
});
