import { App } from 'cdk8s';
import { CertManagerWebhookExternalDns } from '../../src/charts/cert-manager-webhook-externaldns.chart';

describe('Snapshot tests', () => {
    test('CertManagerWebhookExternalDns', () => {
        const app = new App();

        const chart = new CertManagerWebhookExternalDns(app, 'CertManagerWebhookExternalDns', {
            namespace: 'cert-manager',
        });

        expect(chart).toMatchSnapshot();
    });
});
