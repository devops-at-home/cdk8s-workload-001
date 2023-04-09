import { App } from 'cdk8s';
import { DnsEntry } from '../../src/charts/dns-entry.chart';

const chart = 'dns-entry';

describe(chart, () => {
    test('Snapshot test', () => {
        const app = new App();

        const manifest = new DnsEntry(app, chart, {
            namespace: 'default',
        });

        expect(manifest.toJson()).toMatchSnapshot();
    });
});
