import { App } from 'cdk8s';
import { HelloKubernetes } from '../src/main';

describe('Snapshot tests', () => {
    test('Hello Kubernetes', () => {
        const app = new App();

        const chart = new HelloKubernetes(app, 'HelloKubernetes');

        expect(chart).toMatchSnapshot();
    });
});
