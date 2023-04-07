import { Chart, ChartProps } from 'cdk8s';
import { Construct } from 'constructs';
import { DnsEndpoint } from '../imports/externaldns.k8s.io';

export class CertManagerWebhookExternalDns extends Chart {
    constructor(scope: Construct, id: string, props: ChartProps) {
        super(scope, id, props);

        new DnsEndpoint(this, 'DnsEndpoint', {
            spec: {
                endpoints: [
                    {
                        dnsName: 'test.tld',
                        recordType: 'A',
                        targets: ['127.0.0.1'],
                    },
                ],
            },
        });
    }
}
