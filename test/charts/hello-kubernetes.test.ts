import { App } from 'cdk8s';
import {
    HelloKubernetes,
    HelloKubernetesConfig,
    parseInputs,
} from '../../src/charts/hello-kubernetes.chart';

const chart = 'hello-kubernetes';

describe(chart, () => {
    test('Snapshot test', () => {
        const app = new App();

        const manifest = new HelloKubernetes(app, chart);

        expect(manifest.toJson()).toMatchSnapshot();
    });
});

describe('Unit tests', () => {
    test('parseInputs function default values', () => {
        const response = parseInputs({});
        expect(response.containerPort).toStrictEqual(8080);
        expect(response.image).toStrictEqual('paulbouwer/hello-kubernetes:1.10.1');
        expect(response.host).toStrictEqual('test.h6020-001.devops-at-ho.me');
    });

    test('parseInputs function with inputs', () => {
        const inputs: HelloKubernetesConfig = {
            containerPort: 8081,
            image: 'some image',
            host: 'some host',
        };

        const response = parseInputs(inputs);
        expect(response.containerPort).toStrictEqual(inputs.containerPort);
        expect(response.image).toStrictEqual(inputs.image);
        expect(response.host).toStrictEqual(inputs.host);
    });
});
