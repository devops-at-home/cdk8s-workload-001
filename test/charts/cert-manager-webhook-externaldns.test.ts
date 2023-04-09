import { App } from 'cdk8s';
import {
    CertManagerWebhookExternalDns,
    CertManagerWebhookExternalDnsConfig,
    parseInputs,
} from '../../src/charts/cert-manager-webhook-externaldns.chart';

const chart = 'cert-manager-webhook-external-dns';

describe(chart, () => {
    test('Snapshot test', () => {
        const app = new App();

        const manifest = new CertManagerWebhookExternalDns(app, chart, {
            namespace: 'cert-manager',
            labels: {
                chart: 'externaldns-webhook',
            },
        });

        expect(manifest.toJson()).toMatchSnapshot();
    });
});

describe('Unit tests', () => {
    test('parseInputs function default values', () => {
        const response = parseInputs({});
        expect(response.domain).toStrictEqual('example.com');
    });

    test('parseInputs function with inputs', () => {
        const inputs: CertManagerWebhookExternalDnsConfig = {
            domain: 'domain.com',
        };

        const response = parseInputs(inputs);
        expect(response.domain).toStrictEqual(inputs.domain);
    });
});
