import { App } from 'cdk8s';
import {
    HelloKubernetes,
    HelloKubernetesConfig,
    parseInputs,
} from '../../src/charts/hello-kubernetes.chart';

describe('Snapshot tests', () => {
    test('Hello Kubernetes', () => {
        const app = new App();

        const chart = new HelloKubernetes(app, 'HelloKubernetes');

        expect(chart).toMatchSnapshot();
    });
});

describe('Unit tests', () => {
    test('parseInputs function default values', () => {
        const response = parseInputs({});
        expect(response.containerPort).toStrictEqual(8080);
        expect(response.image).toStrictEqual('paulbouwer/hello-kubernetes:1.10.1');
        expect(response.name).toStrictEqual('hello-kubernetes');
        expect(response.sslRedirect).toStrictEqual(false);
        expect(response.host).toStrictEqual('test.h6020-001.devops-at-ho.me');
    });

    test('parseInputs function with inputs', () => {
        const inputs: HelloKubernetesConfig = {
            containerPort: 8081,
            image: 'some image',
            name: 'some name',
            sslRedirect: true,
            host: 'some host',
        };

        const response = parseInputs(inputs);
        expect(response.containerPort).toStrictEqual(inputs.containerPort);
        expect(response.image).toStrictEqual(inputs.image);
        expect(response.name).toStrictEqual(inputs.name);
        expect(response.sslRedirect).toStrictEqual(inputs.sslRedirect);
        expect(response.host).toStrictEqual(inputs.host);
    });
});
