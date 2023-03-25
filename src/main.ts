import { App } from 'cdk8s';
import { HelloKubernetes } from './charts/hello-kubernetes.chart';

const app = new App();

new HelloKubernetes(app, 'HelloKubernetes');

app.synth();
