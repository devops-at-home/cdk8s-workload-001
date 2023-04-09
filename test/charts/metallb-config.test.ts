import { App } from 'cdk8s';
import {
    MetalLbConfig,
    MetalLbConfigParams,
    parseInputs,
} from '../../src/charts/metallb-config.chart';

const chart = 'metallb-config';

describe(chart, () => {
    test('Snapshot test', () => {
        const app = new App();

        const manifest = new MetalLbConfig(app, chart, {
            namespace: 'kube-system',
        });

        expect(manifest.toJson()).toMatchSnapshot();
    });
});

describe('Unit tests', () => {
    test('parseInputs function default values', () => {
        const response = parseInputs({});
        expect(response.addresses).toStrictEqual(['127.0.0.1/8']);
    });

    test('parseInputs function with inputs', () => {
        const inputs: MetalLbConfigParams = {
            addresses: ['192.168.1.1/32'],
        };

        const response = parseInputs(inputs);
        expect(response.addresses).toStrictEqual(inputs.addresses);
    });
});
