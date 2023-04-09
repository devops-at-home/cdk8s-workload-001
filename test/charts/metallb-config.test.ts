import { App } from 'cdk8s';
import { MetalLbConfig } from '../../src/charts/metallb-config.chart';

const chart = 'metallb-config';

describe(chart, () => {
    test('Snapshot test', () => {
        const app = new App();

        const manifest = new MetalLbConfig(app, chart, {
            namespace: 'kube-system',
            addresses: ['127.0.0.1/8'],
        });

        expect(manifest.toJson()).toMatchSnapshot();
    });
});
