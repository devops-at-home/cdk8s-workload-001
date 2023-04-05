import { App } from 'cdk8s';
import { HelloKubernetes } from './charts/hello-kubernetes.chart';
import { CertManagerWebhookExternalDns } from './charts/cert-manager-webhook-externaldns.chart';

const app = new App();

new HelloKubernetes(app, 'Chart-HelloKubernetes');

new CertManagerWebhookExternalDns(app, 'chart-CertManagerWebhookExternalDns', {
    namespace: 'cert-manager',
    domain: process.env.DOMAIN,
});

app.synth();
